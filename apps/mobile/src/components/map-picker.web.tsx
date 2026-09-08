import { useEffect, useRef, useState } from 'react';
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';
import type { Location } from '@/lib/types';
import { palette } from './ui';

const API_KEY = process.env.EXPO_PUBLIC_GOOGLE_PLACES_API_KEY;

export const isMapConfigured = Boolean(API_KEY);

// 山梨県甲府市（対応エリアの中心）を初期表示位置にする。
const DEFAULT_CENTER = { lat: 35.6642, lng: 138.5686 };

let mapsLoadPromise: Promise<void> | null = null;
function loadGoogleMaps(): Promise<void> {
  if (mapsLoadPromise) return mapsLoadPromise;
  mapsLoadPromise = new Promise((resolve, reject) => {
    if (window.google?.maps) {
      resolve();
      return;
    }
    // 「loading=async」を付けると、onload発火時点でMarker/Geocoderなど一部の
    // サブライブラリがまだ読み込み中で、直後にnew google.maps.Marker(...)等を
    // 呼ぶと稀に失敗する（本来はimportLibrary()で個別に待つのが正しい使い方）。
    // このコードは従来のコンストラクタ呼び出しに依存しているため、あえて
    // async指定を外し、onload時点で全APIが揃う従来方式のまま読み込む。
    const script = document.createElement('script');
    script.src = `https://maps.googleapis.com/maps/api/js?key=${API_KEY}&language=ja&region=JP`;
    script.async = true;
    script.onload = () => resolve();
    script.onerror = () => reject(new Error('Google Maps script failed to load'));
    document.head.appendChild(script);
  });
  return mapsLoadPromise;
}

export function MapPicker({
  location,
  onChange,
}: {
  location: Location | null;
  onChange: (location: Location) => void;
}) {
  // View の ref はWebでは実DOM要素（div）を指す。react-native-web独自の挙動で、
  // ネイティブ版はこのファイルごと使われない（map-picker.tsx が代わりに読み込まれる）。
  const containerRef = useRef<View>(null);
  const mapRef = useRef<google.maps.Map | null>(null);
  const markerRef = useRef<google.maps.Marker | null>(null);
  const [status, setStatus] = useState<'loading' | 'ready' | 'error'>('loading');
  const [resolving, setResolving] = useState(false);

  useEffect(() => {
    let cancelled = false;

    loadGoogleMaps()
      .then(() => {
        if (cancelled) return;
        const node = containerRef.current as unknown as HTMLElement | null;
        if (!node) return;

        const center =
          location && (location.lat !== 0 || location.lng !== 0)
            ? { lat: location.lat, lng: location.lng }
            : DEFAULT_CENTER;

        const map = new google.maps.Map(node, {
          center,
          zoom: 15,
          disableDefaultUI: true,
          zoomControl: true,
          clickableIcons: false,
        });
        const marker = new google.maps.Marker({ position: center, map, draggable: true });
        const geocoder = new google.maps.Geocoder();
        mapRef.current = map;
        markerRef.current = marker;

        const resolvePosition = (lat: number, lng: number) => {
          setResolving(true);
          geocoder.geocode({ location: { lat, lng }, language: 'ja' }, (results, geoStatus) => {
            setResolving(false);
            if (geoStatus === 'OK' && results && results[0]) {
              const result = results[0];
              onChange({
                placeId: result.place_id,
                name: result.formatted_address.split(/[、,]/)[0] ?? result.formatted_address,
                address: result.formatted_address,
                lat,
                lng,
              });
            } else {
              onChange({ placeId: `pin-${Date.now()}`, name: '地図で選択した場所', address: '', lat, lng });
            }
          });
        };

        marker.addListener('dragend', () => {
          const position = marker.getPosition();
          if (position) resolvePosition(position.lat(), position.lng());
        });
        map.addListener('click', (event: google.maps.MapMouseEvent) => {
          if (!event.latLng) return;
          marker.setPosition(event.latLng);
          resolvePosition(event.latLng.lat(), event.latLng.lng());
        });

        setStatus('ready');
      })
      .catch(() => {
        if (!cancelled) setStatus('error');
      });

    return () => {
      cancelled = true;
    };
    // 初回マウント時のみ地図を初期化する（毎回の再生成を避けるため依存配列は空のまま）。
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // キーワード検索などで外部からlocationが変わった場合、地図上のピンと中心を
  // 追従させる（ユーザーが地図を直接操作した結果としてlocationが変わった場合は
  // 同じ位置への再設定になるだけなので実質no-op）。
  useEffect(() => {
    if (!mapRef.current || !markerRef.current) return;
    if (!location || (location.lat === 0 && location.lng === 0)) return;
    const position = { lat: location.lat, lng: location.lng };
    markerRef.current.setPosition(position);
    mapRef.current.panTo(position);
  }, [location]);

  return (
    <View style={styles.wrapper}>
      <View ref={containerRef} style={styles.map} />
      {status === 'loading' && (
        <View style={styles.overlay}>
          <ActivityIndicator color={palette.silver} />
        </View>
      )}
      {status === 'error' && (
        <View style={styles.overlay}>
          <Text style={styles.errorText}>地図の読み込みに失敗しました</Text>
        </View>
      )}
      {resolving && (
        <View style={styles.resolvingBadge}>
          <ActivityIndicator size="small" color={palette.onSilver} />
        </View>
      )}
      <Text style={styles.hint}>地図をタップ、またはピンをドラッグして場所を選択できます</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: { gap: 8 },
  map: {
    height: 220,
    borderRadius: 12,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: palette.cardBorder,
  },
  overlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: palette.card,
  },
  errorText: { color: palette.danger, fontSize: 12 },
  resolvingBadge: {
    position: 'absolute',
    top: 8,
    right: 8,
    backgroundColor: palette.silver,
    borderRadius: 999,
    padding: 6,
  },
  hint: { color: palette.textFaint, fontSize: 11, lineHeight: 16 },
});
