import React, { useEffect, useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity, Image,
} from 'react-native';
import { Elderly } from 'moveplus-shared';
import { institutionApi } from '@src/api/endpoints/institution';
import { buildAvatarUrl } from '@src/services/ApiService';
import { Color } from '@src/styles/colors';
import { Spacing } from '@src/styles/spacings';
import { Border } from '@src/styles/borders';
import { FontFamily, FontSize } from '@src/styles/fonts';
import { shadowStyles } from '@src/styles/shadow';
import { useTranslation } from '@src/localization/hooks/useTranslation';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import { HStack, VStack } from './CoreComponents';

interface BirthdayEntry {
  elderly: Elderly;
  daysUntil: number;
  turningAge: number;
  birthdayDate: Date;
}

function getUpcomingBirthdays(elderlyList: Elderly[], limit = 10): BirthdayEntry[] {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const entries: BirthdayEntry[] = [];

  for (const elderly of elderlyList) {
    if (!elderly.birthDate) continue;
    const birth = new Date(elderly.birthDate);
    const thisYear = new Date(today.getFullYear(), birth.getMonth(), birth.getDate());
    const nextYear = new Date(today.getFullYear() + 1, birth.getMonth(), birth.getDate());

    const nextBirthday = thisYear >= today ? thisYear : nextYear;
    const daysUntil = Math.round((nextBirthday.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
    const turningAge = nextBirthday.getFullYear() - birth.getFullYear();
    entries.push({ elderly, daysUntil, turningAge, birthdayDate: nextBirthday });
  }

  return entries.sort((a, b) => a.daysUntil - b.daysUntil).slice(0, limit);
}

function getDayLabel(days: number, t: (k: string) => string): string {
  if (days === 0) return t('dashboard.birthdayToday');
  if (days === 1) return t('dashboard.birthdayTomorrow');
  return t('dashboard.birthdayInDays').replace('{{days}}', String(days));
}

const BIRTHDAY_COLOR = Color.Cyan.v300; // consistent teal for all birthday cards

function getAvatarColor(_name: string): string {
  return BIRTHDAY_COLOR;
}

interface UpcomingBirthdaysWidgetProps {
  onElderlyPress?: (elderly: Elderly) => void;
  limit?: number;
}

export const UpcomingBirthdaysWidget: React.FC<UpcomingBirthdaysWidgetProps> = ({
  onElderlyPress,
  limit = 10,
}) => {
  const { t } = useTranslation();
  const [entries, setEntries] = useState<BirthdayEntry[]>([]);

  useEffect(() => {
    institutionApi.getInstitutionUsers()
      .then(res => {
        const birthdays = getUpcomingBirthdays(res.data?.elderly ?? [], limit);
        setEntries(birthdays);
      })
      .catch(() => { /* silently ignore */ });
  }, [limit]);

  if (entries.length === 0) return null;

  return (
    <VStack spacing={Spacing.sm_12} style={styles.container}>
      <HStack spacing={Spacing.sm_8} align="center">
        <MaterialIcons name="cake" size={20} color={Color.Orange.v300} />
        <Text style={styles.sectionTitle}>{t('dashboard.upcomingBirthdays')}</Text>
      </HStack>

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {entries.map(({ elderly, daysUntil, turningAge, birthdayDate }) => {
          const color = getAvatarColor(elderly.name);
          const isToday = daysUntil === 0;
          const isTomorrow = daysUntil === 1;
          const dayLabel = getDayLabel(daysUntil, t);
          const monthDay = birthdayDate.toLocaleDateString('pt-PT', { day: 'numeric', month: 'short' });

          return (
            <TouchableOpacity
              key={elderly.id}
              style={[styles.card, isToday && { borderColor: color, borderWidth: 2 }]}
              onPress={() => onElderlyPress?.(elderly)}
              activeOpacity={onElderlyPress ? 0.75 : 1}
            >
              {/* Decorative top band */}
              <View style={[styles.cardBand, { backgroundColor: color + '30' }]}>
                {isToday && (
                  <View style={[styles.todayBadge, { backgroundColor: color }]}>
                    <Text style={styles.todayBadgeText}>🎂</Text>
                  </View>
                )}
              </View>

              {/* Avatar */}
              <View style={styles.avatarContainer}>
                {elderly.user?.avatarUrl ? (
                  <Image
                    source={{ uri: buildAvatarUrl(elderly.user.avatarUrl) }}
                    style={styles.avatar}
                  />
                ) : (
                  <View style={[styles.avatarFallback, { backgroundColor: color + '30' }]}>
                    <Text style={[styles.avatarInitial, { color }]}>
                      {elderly.name.charAt(0).toUpperCase()}
                    </Text>
                  </View>
                )}
              </View>

              {/* Content */}
              <View style={styles.cardContent}>
                <Text style={styles.name} numberOfLines={1}>{elderly.name.split(' ')[0]}</Text>
                <Text style={[styles.age, { color }]}>{t('dashboard.birthdayAge').replace('{{age}}', String(turningAge))}</Text>
                <View style={styles.dateRow}>
                  <MaterialIcons name="event" size={12} color={Color.Gray.v400} />
                  <Text style={styles.date}>{monthDay}</Text>
                </View>
                <View style={[
                  styles.dayPill,
                  isToday ? { backgroundColor: color } : isTomorrow ? { backgroundColor: Color.Orange.v300 } : { backgroundColor: Color.Gray.v200 },
                ]}>
                  <Text style={[
                    styles.dayPillText,
                    (isToday || isTomorrow) ? { color: '#fff' } : { color: Color.Gray.v500 },
                  ]}>
                    {dayLabel}
                  </Text>
                </View>
              </View>
            </TouchableOpacity>
          );
        })}
      </ScrollView>
    </VStack>
  );
};

const styles = StyleSheet.create({
  container: {
    alignSelf: 'stretch',
    marginBottom: Spacing.xl_32,
  },
  sectionTitle: {
    fontFamily: FontFamily.bold,
    fontSize: FontSize.bodylarge_18,
    color: Color.Gray.v500,
  },
  scrollContent: {
    gap: Spacing.sm_12,
    paddingRight: Spacing.md_16,
  },
  card: {
    width: 130,
    backgroundColor: Color.white,
    borderRadius: Border.lg_16,
    overflow: 'hidden',
    ...shadowStyles.cardShadow,
  },
  cardBand: {
    height: 36,
    alignItems: 'center',
    justifyContent: 'flex-end',
    paddingBottom: 0,
  },
  todayBadge: {
    position: 'absolute',
    top: 6,
    right: 6,
    width: 26,
    height: 26,
    borderRadius: 13,
    alignItems: 'center',
    justifyContent: 'center',
  },
  todayBadgeText: {
    fontSize: 14,
  },
  avatarContainer: {
    alignItems: 'center',
    marginTop: -24,
    marginBottom: 6,
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    borderWidth: 2,
    borderColor: Color.white,
  },
  avatarFallback: {
    width: 48,
    height: 48,
    borderRadius: 24,
    borderWidth: 2,
    borderColor: Color.white,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarInitial: {
    fontFamily: FontFamily.bold,
    fontSize: FontSize.bodylarge_18,
  },
  cardContent: {
    paddingHorizontal: Spacing.sm_10,
    paddingBottom: Spacing.sm_12,
    alignItems: 'center',
    gap: 4,
  },
  name: {
    fontFamily: FontFamily.bold,
    fontSize: FontSize.bodysmall_14,
    color: Color.dark,
    textAlign: 'center',
  },
  age: {
    fontFamily: FontFamily.semi_bold,
    fontSize: FontSize.caption_12,
    textAlign: 'center',
  },
  dateRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
  },
  date: {
    fontFamily: FontFamily.regular,
    fontSize: FontSize.caption_12,
    color: Color.Gray.v400,
  },
  dayPill: {
    paddingHorizontal: Spacing.sm_8,
    paddingVertical: 3,
    borderRadius: 10,
    marginTop: 2,
  },
  dayPillText: {
    fontFamily: FontFamily.semi_bold,
    fontSize: 10,
    textAlign: 'center',
  },
});
