import { useEffect, useRef, useState } from 'react';
import { ActivityIndicator, StyleSheet, Text, TextInput, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { isPlacesApiConfigured, searchPlaces, getPlaceDetails, type PlaceSuggestion } from '@/lib/places';
import type { Location } from '@/lib/types';
import { Card, PressableCard, palette } from './ui';

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
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    if (!isPlacesApiConfigured || query.trim().length < 2) {
      setSuggestions([]);
      return;
    }
    debounceRef.current = setTimeout(async () => {
      setLoading(true);
      setError(null);
      try {
        const results = await searchPlaces(query);
        setSuggestions(results);
      } catch {
        setError('検索に失敗しました。しばらくしてから再度お試しください。');
      } finally {
        setLoading(false);
      }
    }, 300);
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [query]);

  const handleSelectSuggestion = async (s: PlaceSuggestion) => {
    setLoading(true);
    setError(null);
    try {
      const location = await getPlaceDetails(s.placeId);
      onChange(location);
      setQuery('');
      setSuggestions([]);
    } catch {
      setError('場所の詳細を取得できませんでした。');
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
          <Ionicons name="location" size={16} color={palette.gold} />
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
          placeholder={isPlacesApiConfigured ? '店名・住所で検索' : '場所の名前を入力'}
          placeholderTextColor={palette.textFaint}
          onSubmitEditing={!isPlacesApiConfigured ? handleManualSubmit : undefined}
          returnKeyType={isPlacesApiConfigured ? 'search' : 'done'}
        />
        {loading && <ActivityIndicator size="small" color={palette.gold} />}
      </View>

      {!isPlacesApiConfigured && (
        <Text style={styles.hint}>
          ※ Google Places APIキー未設定のため、現在は手入力のみです（Enterで確定）。設定後は住所検索に切り替わります。
        </Text>
      )}
      {error && <Text style={styles.error}>{error}</Text>}

      {suggestions.length > 0 && (
        <View style={styles.suggestionList}>
          {suggestions.map((s) => (
            <PressableCard key={s.placeId} style={styles.suggestionCard} onPress={() => handleSelectSuggestion(s)}>
              <Text style={styles.suggestionMain}>{s.mainText}</Text>
              {!!s.secondaryText && <Text style={styles.suggestionSecondary}>{s.secondaryText}</Text>}
            </PressableCard>
          ))}
        </View>
      )}

      {suggestions.length === 0 && savedLocations.length > 0 && (
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
    </View>
  );
}

const styles = StyleSheet.create({
  container: { gap: 10 },
  selectedCard: { flexDirection: 'row', alignItems: 'center', gap: 10, borderColor: palette.gold, borderWidth: 1.5 },
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
  savedChipSelected: { borderColor: palette.gold, borderWidth: 1.5 },
  savedChipText: { color: palette.text, fontSize: 12, fontWeight: '600' },
});
