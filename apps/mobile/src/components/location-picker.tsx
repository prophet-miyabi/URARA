import { useEffect, useRef, useState } from 'react';
import { ActivityIndicator, StyleSheet, Text, TextInput, View } from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';
import { isPlacesApiConfigured, searchPlaces, getPlaceDetails, type PlaceSuggestion } from '@/lib/places';
import type { Location } from '@/lib/types';
import { Card, PressableCard, palette } from './ui';
import { MapPicker, isMapConfigured } from './map-picker';

export function LocationPicker({
  value,
  onChange,
  savedLocations,
}: {
  value: Location | null;
  onChange: (location: Location) => void;
  savedLocations: Location[];
}) {
  const [query, setQuery] = useState('');
  const [suggestions, setSuggestions] = useState<PlaceSuggestion[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  // APIキー自体は設定されていても、請求設定などサーバー側の事情で検索が
  // 実行時に失敗することがある。その場合も手入力に切り替えられないと
  // 予約自体が完全に止まってしまうため、キー未設定時と同じ扱いにする。
  const [searchFailed, setSearchFailed] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const manualModeActive = !isPlacesApiConfigured || searchFailed;
  const queryTooShort = manualModeActive || query.trim().length < 2;
  const visibleSuggestions = queryTooShort ? [] : suggestions;

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    if (queryTooShort) return;
    debounceRef.current = setTimeout(async () => {
      setLoading(true);
      setError(null);
      try {
        const results = await searchPlaces(query);
        setSuggestions(results);
      } catch {
        setError('場所の検索が利用できないため、店名・住所を直接入力してEnterで確定してください。');
        setSearchFailed(true);
      } finally {
        setLoading(false);
      }
    }, 300);
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [query, queryTooShort]);

  const handleSelectSuggestion = async (s: PlaceSuggestion) => {
    setLoading(true);
    setError(null);
    try {
      const location = await getPlaceDetails(s.placeId);
      onChange(location);
      setQuery('');
      setSuggestions([]);
    } catch {
      setError('場所の詳細を取得できなかったため、店名・住所を直接入力してEnterで確定してください。');
      setSearchFailed(true);
    } finally {
      setLoading(false);
    }
  };

  const handleManualSubmit = () => {
    if (!query.trim()) return;
    onChange({
      placeId: `manual-${Date.now()}`,
      name: query.trim(),
      address: '',
      lat: 0,
      lng: 0,
    });
    setQuery('');
  };

  return (
    <View style={styles.container}>
      {value && (
        <Card style={styles.selectedCard}>
          <Ionicons name="location" size={16} color={palette.silver} />
          <View style={{ flex: 1 }}>
            <Text style={styles.selectedName}>{value.name}</Text>
            {!!value.address && <Text style={styles.selectedAddress}>{value.address}</Text>}
          </View>
        </Card>
      )}

      <View style={styles.searchRow}>
        <Ionicons name="search" size={16} color={palette.textFaint} style={styles.searchIcon} />
        <TextInput
          style={styles.input}
          value={query}
          onChangeText={setQuery}
          placeholder={manualModeActive ? '場所の名前を入力' : '店名・住所で検索'}
          placeholderTextColor={palette.textFaint}
          onSubmitEditing={manualModeActive ? handleManualSubmit : undefined}
          returnKeyType={manualModeActive ? 'done' : 'search'}
        />
        {loading && <ActivityIndicator size="small" color={palette.silver} />}
      </View>

      {manualModeActive && (
        <Text style={styles.hint}>
          ※ 現在は手入力のみです（Enterで確定）。
        </Text>
      )}
      {error && <Text style={styles.error}>{error}</Text>}

      {visibleSuggestions.length > 0 && (
        <View style={styles.suggestionList}>
          {visibleSuggestions.map((s) => (
            <PressableCard key={s.placeId} style={styles.suggestionCard} onPress={() => handleSelectSuggestion(s)}>
              <Text style={styles.suggestionMain}>{s.mainText}</Text>
              {!!s.secondaryText && <Text style={styles.suggestionSecondary}>{s.secondaryText}</Text>}
            </PressableCard>
          ))}
        </View>
      )}

      {visibleSuggestions.length === 0 && savedLocations.length > 0 && (
        <View style={styles.savedSection}>
          <Text style={styles.savedLabel}>最近使った場所</Text>
          <View style={styles.savedGrid}>
            {savedLocations.map((loc) => (
              <PressableCard
                key={loc.placeId}
                style={[styles.savedChip, value?.placeId === loc.placeId && styles.savedChipSelected]}
                onPress={() => onChange(loc)}
              >
                <Text style={styles.savedChipText}>{loc.name}</Text>
              </PressableCard>
            ))}
          </View>
        </View>
      )}

      {/* 検索が実行時に失敗する状態(searchFailed)は、Google Maps Platform側の
          請求設定などマップにも波及する問題であることが多い。地図だけ表示して
          Google純正の「For development purposes only」ダイアログをお客様に
          見せてしまうより、非表示にした方が混乱が少ない。 */}
      {isMapConfigured && !searchFailed && <MapPicker location={value} onChange={onChange} />}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { gap: 10 },
  selectedCard: { flexDirection: 'row', alignItems: 'center', gap: 10, borderColor: palette.silver, borderWidth: 1.5 },
  selectedName: { color: palette.text, fontSize: 14, fontWeight: '700' },
  selectedAddress: { color: palette.textMuted, fontSize: 11, marginTop: 2 },
  searchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    borderWidth: 1,
    borderColor: palette.cardBorder,
    borderRadius: 10,
    paddingHorizontal: 12,
    backgroundColor: palette.card,
  },
  searchIcon: { marginRight: 2 },
  input: { flex: 1, color: palette.text, fontSize: 14, paddingVertical: 10 },
  hint: { color: palette.textFaint, fontSize: 11, lineHeight: 16 },
  error: { color: palette.danger, fontSize: 12 },
  suggestionList: { gap: 8 },
  suggestionCard: { paddingVertical: 10 },
  suggestionMain: { color: palette.text, fontSize: 13, fontWeight: '600' },
  suggestionSecondary: { color: palette.textMuted, fontSize: 11, marginTop: 2 },
  savedSection: { gap: 8 },
  savedLabel: { color: palette.textMuted, fontSize: 12, fontWeight: '700' },
  savedGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  savedChip: { paddingVertical: 8, paddingHorizontal: 12 },
  savedChipSelected: { borderColor: palette.silver, borderWidth: 1.5 },
  savedChipText: { color: palette.text, fontSize: 12, fontWeight: '600' },
});
