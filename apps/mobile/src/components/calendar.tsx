import { useEffect, useRef, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View, type NativeSyntheticEvent, type NativeScrollEvent } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { palette } from './ui';

const WEEKDAYS = ['日', '月', '火', '水', '木', '金', '土'];

function startOfDay(d: Date): Date {
  const x = new Date(d);
  x.setHours(0, 0, 0, 0);
  return x;
}

export function isSameDay(a: Date, b: Date): boolean {
  return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();
}

export function CalendarPicker({
  selectedDate,
  onSelectDate,
  minDate,
}: {
  selectedDate: Date | null;
  onSelectDate: (date: Date) => void;
  minDate?: Date;
}) {
  const min = startOfDay(minDate ?? new Date());
  const baseMonth = selectedDate ?? new Date();

  return (
    <MonthGrid
      key={`${baseMonth.getFullYear()}-${baseMonth.getMonth()}`}
      initialYear={baseMonth.getFullYear()}
      initialMonth={baseMonth.getMonth()}
      min={min}
      selectedDate={selectedDate}
      onSelectDate={onSelectDate}
    />
  );
}

function MonthGrid({
  initialYear,
  initialMonth,
  min,
  selectedDate,
  onSelectDate,
}: {
  initialYear: number;
  initialMonth: number;
  min: Date;
  selectedDate: Date | null;
  onSelectDate: (date: Date) => void;
}) {
  const [year, setYear] = useState(initialYear);
  const [month, setMonth] = useState(initialMonth);

  const firstDay = new Date(year, month, 1);
  const startWeekday = firstDay.getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  const cells: (Date | null)[] = [];
  for (let i = 0; i < startWeekday; i++) cells.push(null);
  for (let d = 1; d <= daysInMonth; d++) cells.push(new Date(year, month, d));

  const canGoPrevMonth = new Date(year, month, 1) > new Date(min.getFullYear(), min.getMonth(), 1);

  const goPrev = () => {
    if (!canGoPrevMonth) return;
    if (month === 0) {
      setYear(year - 1);
      setMonth(11);
    } else {
      setMonth(month - 1);
    }
  };
  const goNext = () => {
    if (month === 11) {
      setYear(year + 1);
      setMonth(0);
    } else {
      setMonth(month + 1);
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Pressable
          onPress={goPrev}
          disabled={!canGoPrevMonth}
          style={[styles.navButton, !canGoPrevMonth && styles.navButtonDisabled]}
        >
          <Text style={styles.navLabel}>‹</Text>
        </Pressable>
        <Text style={styles.monthLabel}>
          {year}年{month + 1}月
        </Text>
        <Pressable onPress={goNext} style={styles.navButton}>
          <Text style={styles.navLabel}>›</Text>
        </Pressable>
      </View>

      <View style={styles.weekdayRow}>
        {WEEKDAYS.map((w) => (
          <Text key={w} style={styles.weekdayLabel}>
            {w}
          </Text>
        ))}
      </View>

      <View style={styles.grid}>
        {cells.map((date, i) => {
          if (!date) return <View key={i} style={styles.cell} />;
          const disabled = date < min;
          const selected = selectedDate ? isSameDay(date, selectedDate) : false;
          return (
            <Pressable key={i} disabled={disabled} onPress={() => onSelectDate(date)} style={styles.cell}>
              <View style={[styles.dayCircle, selected && styles.dayCircleSelected]}>
                <Text style={[styles.dayLabel, disabled && styles.dayLabelDisabled, selected && styles.dayLabelSelected]}>
                  {date.getDate()}
                </Text>
              </View>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

const HOURS = [12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23];
const MINUTES = [0, 15, 30, 45];

const WHEEL_ITEM_HEIGHT = 40;
const WHEEL_VISIBLE_ITEMS = 5;
const WHEEL_HEIGHT = WHEEL_ITEM_HEIGHT * WHEEL_VISIBLE_ITEMS;
const WHEEL_PADDING = WHEEL_ITEM_HEIGHT * Math.floor(WHEEL_VISIBLE_ITEMS / 2);

// 最初にその日で選択可能な最も早い時刻(hour, 0分)を返す。今日の場合は現在時刻より
// 後の枠のみ、それ以外の日は先頭の営業開始時刻を返す。
export function firstAvailableHour(date: Date): number {
  const now = new Date();
  if (!isSameDay(date, now)) return HOURS[0];
  const next = HOURS.find((h) => h > now.getHours());
  return next ?? HOURS[0];
}

function WheelColumn({
  values,
  selectedIndex,
  disabledSet,
  onSelect,
  formatLabel,
}: {
  values: number[];
  selectedIndex: number;
  disabledSet?: Set<number>;
  onSelect: (index: number) => void;
  formatLabel: (value: number) => string;
}) {
  const scrollRef = useRef<ScrollView>(null);
  const settleTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    scrollRef.current?.scrollTo({ y: selectedIndex * WHEEL_ITEM_HEIGHT, animated: false });
    // 初回マウント時のみ選択中の値へスクロール位置を合わせる。
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    return () => {
      if (settleTimer.current) clearTimeout(settleTimer.current);
    };
  }, []);

  const scrollToIndex = (index: number, animated = true) => {
    scrollRef.current?.scrollTo({ y: index * WHEEL_ITEM_HEIGHT, animated });
  };

  const nearestEnabledIndex = (index: number): number => {
    if (!disabledSet || !disabledSet.has(values[index])) return index;
    for (let offset = 1; offset < values.length; offset++) {
      const forward = index + offset;
      if (forward < values.length && !disabledSet.has(values[forward])) return forward;
      const backward = index - offset;
      if (backward >= 0 && !disabledSet.has(values[backward])) return backward;
    }
    return index;
  };

  const commitOffset = (offsetY: number) => {
    const rawIndex = Math.round(offsetY / WHEEL_ITEM_HEIGHT);
    const clamped = Math.max(0, Math.min(values.length - 1, rawIndex));
    const index = nearestEnabledIndex(clamped);
    onSelect(index);
    if (index !== clamped) scrollToIndex(index);
  };

  const handleMomentumEnd = (e: NativeSyntheticEvent<NativeScrollEvent>) => {
    if (settleTimer.current) clearTimeout(settleTimer.current);
    commitOffset(e.nativeEvent.contentOffset.y);
  };

  // react-native-webはマウスホイール/トラックパッド操作からの
  // onMomentumScrollEnd発火が不安定なため、onScrollの間隔が一定時間
  // (120ms)途切れたら「止まった」とみなす独自のフォールバックを併用する
  // (ネイティブのタッチスクロールではonMomentumScrollEnd側が先に発火し、
  // このタイマーはクリアされるだけなので二重実行はしない)。
  const handleScroll = (e: NativeSyntheticEvent<NativeScrollEvent>) => {
    const offsetY = e.nativeEvent.contentOffset.y;
    if (settleTimer.current) clearTimeout(settleTimer.current);
    settleTimer.current = setTimeout(() => commitOffset(offsetY), 120);
  };

  return (
    <View style={styles.wheelColumn}>
      <ScrollView
        ref={scrollRef}
        showsVerticalScrollIndicator={false}
        snapToInterval={WHEEL_ITEM_HEIGHT}
        decelerationRate="fast"
        onMomentumScrollEnd={handleMomentumEnd}
        onScroll={handleScroll}
        scrollEventThrottle={16}
        contentContainerStyle={{ paddingVertical: WHEEL_PADDING }}
      >
        {values.map((value, index) => {
          const disabled = disabledSet?.has(value) ?? false;
          const selected = index === selectedIndex;
          return (
            <Pressable
              key={value}
              disabled={disabled}
              onPress={() => {
                onSelect(index);
                scrollToIndex(index);
              }}
              style={styles.wheelItem}
            >
              <Text
                style={[
                  styles.wheelItemText,
                  selected && styles.wheelItemTextSelected,
                  disabled && styles.wheelItemTextDisabled,
                ]}
              >
                {formatLabel(value)}
              </Text>
            </Pressable>
          );
        })}
      </ScrollView>
      <View pointerEvents="none" style={styles.wheelHighlight} />
      <LinearGradient
        pointerEvents="none"
        colors={[palette.card, 'transparent']}
        style={styles.wheelFadeTop}
      />
      <LinearGradient
        pointerEvents="none"
        colors={['transparent', palette.card]}
        style={styles.wheelFadeBottom}
      />
    </View>
  );
}

// 主要な予約系サービスでよく使われる、時・分を別々にスクロールして選ぶ
// ホイールピッカー形式。選択中の値は中央のハイライト帯に来る。
export function TimeWheelPicker({
  date,
  hour,
  minute,
  onChange,
}: {
  date: Date;
  hour: number;
  minute: number;
  onChange: (hour: number, minute: number) => void;
}) {
  const now = new Date();
  const isToday = isSameDay(date, now);
  const disabledHours = isToday ? new Set(HOURS.filter((h) => h <= now.getHours())) : undefined;

  const hourIndex = Math.max(0, HOURS.indexOf(hour));
  const minuteIndex = Math.max(0, MINUTES.indexOf(minute));

  return (
    <View style={styles.wheelRow}>
      <WheelColumn
        values={HOURS}
        selectedIndex={hourIndex}
        disabledSet={disabledHours}
        onSelect={(index) => onChange(HOURS[index], minute)}
        formatLabel={(h) => `${h}時`}
      />
      <Text style={styles.wheelSeparator}>:</Text>
      <WheelColumn
        values={MINUTES}
        selectedIndex={minuteIndex}
        onSelect={(index) => onChange(hour, MINUTES[index])}
        formatLabel={(m) => `${String(m).padStart(2, '0')}分`}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    borderWidth: 1,
    borderColor: palette.cardBorder,
    borderRadius: 14,
    backgroundColor: palette.card,
    padding: 12,
    gap: 10,
  },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  navButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: palette.cardBorder,
    alignItems: 'center',
    justifyContent: 'center',
  },
  navButtonDisabled: { opacity: 0.25 },
  navLabel: { color: palette.silver, fontSize: 16, fontWeight: '700' },
  monthLabel: { color: palette.text, fontSize: 14, fontWeight: '700' },
  weekdayRow: { flexDirection: 'row' },
  weekdayLabel: { flex: 1, textAlign: 'center', color: palette.textFaint, fontSize: 11, fontWeight: '600' },
  grid: { flexDirection: 'row', flexWrap: 'wrap' },
  cell: { width: `${100 / 7}%`, aspectRatio: 1, alignItems: 'center', justifyContent: 'center' },
  dayCircle: { width: 30, height: 30, borderRadius: 15, alignItems: 'center', justifyContent: 'center' },
  dayCircleSelected: { backgroundColor: palette.silver },
  dayLabel: { color: palette.text, fontSize: 13, fontWeight: '600' },
  dayLabelDisabled: { color: palette.textFaint, opacity: 0.4 },
  dayLabelSelected: { color: palette.onSilver, fontWeight: '800' },
  wheelRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 12 },
  wheelColumn: {
    width: 96,
    height: WHEEL_HEIGHT,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: palette.cardBorder,
    backgroundColor: palette.card,
    overflow: 'hidden',
  },
  wheelItem: { height: WHEEL_ITEM_HEIGHT, alignItems: 'center', justifyContent: 'center' },
  wheelItemText: { fontSize: 16, color: palette.textMuted, fontWeight: '600' },
  wheelItemTextSelected: { fontSize: 19, color: palette.text, fontWeight: '800' },
  wheelItemTextDisabled: { color: palette.textFaint, opacity: 0.4 },
  wheelHighlight: {
    position: 'absolute',
    top: WHEEL_PADDING,
    left: 0,
    right: 0,
    height: WHEEL_ITEM_HEIGHT,
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: palette.silver,
    backgroundColor: 'rgba(224, 224, 224, 0.08)',
  },
  wheelFadeTop: { position: 'absolute', top: 0, left: 0, right: 0, height: WHEEL_ITEM_HEIGHT * 1.5 },
  wheelFadeBottom: { position: 'absolute', bottom: 0, left: 0, right: 0, height: WHEEL_ITEM_HEIGHT * 1.5 },
  wheelSeparator: { fontSize: 20, fontWeight: '800', color: palette.text, marginBottom: 2 },
});
