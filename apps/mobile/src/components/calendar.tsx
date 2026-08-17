import { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { palette } from './ui';

const WEEKDAYS = ['日', '月', '火', '水', '木', '金', '土'];

function startOfDay(d: Date): Date {
  const x = new Date(d);
  x.setHours(0, 0, 0, 0);
  return x;
}

function isSameDay(a: Date, b: Date): boolean {
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

export function TimeSlotPicker({
  date,
  selectedHour,
  onSelectHour,
}: {
  date: Date;
  selectedHour: number | null;
  onSelectHour: (hour: number) => void;
}) {
  const now = new Date();
  const isToday = isSameDay(date, now);

  return (
    <View style={styles.timeGrid}>
      {HOURS.map((hour) => {
        const disabled = isToday && hour <= now.getHours();
        const selected = selectedHour === hour;
        return (
          <Pressable
            key={hour}
            disabled={disabled}
            onPress={() => onSelectHour(hour)}
            style={[styles.timeCell, selected && styles.timeCellSelected, disabled && styles.timeCellDisabled]}
          >
            <Text style={[styles.timeLabel, selected && styles.timeLabelSelected, disabled && styles.timeLabelDisabled]}>
              {hour}:00
            </Text>
          </Pressable>
        );
      })}
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
  navLabel: { color: palette.gold, fontSize: 16, fontWeight: '700' },
  monthLabel: { color: palette.text, fontSize: 14, fontWeight: '700' },
  weekdayRow: { flexDirection: 'row' },
  weekdayLabel: { flex: 1, textAlign: 'center', color: palette.textFaint, fontSize: 11, fontWeight: '600' },
  grid: { flexDirection: 'row', flexWrap: 'wrap' },
  cell: { width: `${100 / 7}%`, aspectRatio: 1, alignItems: 'center', justifyContent: 'center' },
  dayCircle: { width: 30, height: 30, borderRadius: 15, alignItems: 'center', justifyContent: 'center' },
  dayCircleSelected: { backgroundColor: palette.gold },
  dayLabel: { color: palette.text, fontSize: 13, fontWeight: '600' },
  dayLabelDisabled: { color: palette.textFaint, opacity: 0.4 },
  dayLabelSelected: { color: palette.onGold, fontWeight: '800' },
  timeGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  timeCell: {
    borderWidth: 1,
    borderColor: palette.cardBorder,
    borderRadius: 10,
    paddingVertical: 8,
    paddingHorizontal: 12,
    backgroundColor: palette.card,
  },
  timeCellSelected: { borderColor: palette.gold, backgroundColor: palette.gold },
  timeCellDisabled: { opacity: 0.3 },
  timeLabel: { color: palette.text, fontSize: 12, fontWeight: '600' },
  timeLabelSelected: { color: palette.onGold, fontWeight: '800' },
  timeLabelDisabled: { color: palette.textFaint },
});
