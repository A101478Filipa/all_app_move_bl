import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { CalendarEvent, CalendarEventType } from 'moveplus-shared';
import { Color } from '@src/styles/colors';
import { FontFamily, FontSize } from '@src/styles/fonts';
import { Spacing } from '@src/styles/spacings';
import { Border } from '@src/styles/borders';
import { useTranslation } from '@src/localization/hooks/useTranslation';

type CalendarEventTypeConfig = {
  icon: keyof typeof MaterialIcons.glyphMap;
  color: string;
};

export const EVENT_TYPE_CONFIG: Record<CalendarEventType, CalendarEventTypeConfig> = {
  [CalendarEventType.APPOINTMENT]:   { icon: 'local-hospital', color: '#7B1FA2' },
  [CalendarEventType.PHYSIOTHERAPY]: { icon: 'fitness-center',  color: '#1E88E5' },
  [CalendarEventType.NURSING_CARE]:  { icon: 'healing',         color: '#00897B' },
  [CalendarEventType.BATH]:          { icon: 'shower',          color: '#0288D1' },
  [CalendarEventType.MEAL]:          { icon: 'restaurant',      color: '#43A047' },
  [CalendarEventType.ACTIVITY]:      { icon: 'directions-walk', color: '#7CB342' },
  [CalendarEventType.OTHER]:         { icon: 'event-note',      color: Color.Gray.v400 },
};

const formatTime = (date: Date | string) => {
  const d = new Date(date);
  return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
};

interface CalendarEventCardProps {
  event: CalendarEvent;
  onPress?: (event: CalendarEvent) => void;
  onLongPress?: (event: CalendarEvent) => void;
}

export const CalendarEventCard: React.FC<CalendarEventCardProps> = ({ event, onPress, onLongPress }) => {
  const { t } = useTranslation();
  const config = EVENT_TYPE_CONFIG[event.type] ?? EVENT_TYPE_CONFIG[CalendarEventType.OTHER];

  return (
    <TouchableOpacity
      style={[styles.card, { borderLeftColor: config.color }]}
      onPress={() => onPress?.(event)}
      onLongPress={() => onLongPress?.(event)}
      activeOpacity={0.75}
    >
      <View style={[styles.iconWrap, { backgroundColor: config.color + '15' }]}>
        <MaterialIcons name={config.icon} size={20} color={config.color} />
      </View>

      <View style={styles.content}>
        <Text style={styles.title} numberOfLines={1}>{event.title}</Text>
        <Text style={styles.typeLabel}>{t(`calendar.types.${event.type}` as any)}</Text>
        {event.allDay ? (
          <Text style={styles.time}>{t('calendar.allDay')}</Text>
        ) : (
          <Text style={styles.time}>
            {formatTime(event.startDate)}
            {event.endDate ? ` – ${formatTime(event.endDate)}` : ''}
          </Text>
        )}
        {event.location ? (
          <View style={styles.locationRow}>
            <MaterialIcons name="location-on" size={12} color={Color.Gray.v400} />
            <Text style={styles.location} numberOfLines={1}>{event.location}</Text>
          </View>
        ) : null}
        {(event.assignedTo || event.externalProfessionalName) ? (
          <View style={styles.createdByRow}>
            <MaterialIcons
              name={event.assignedTo?.role === 'CLINICIAN' ? 'medical-services' : 'person-outline'}
              size={12}
              color={Color.Gray.v400}
            />
            <Text style={styles.createdByText} numberOfLines={1}>
              {event.assignedTo ? event.assignedTo.name : event.externalProfessionalName}
            </Text>
          </View>
        ) : event.createdBy ? (
          <View style={styles.createdByRow}>
            <MaterialIcons name="person-outline" size={12} color={Color.Gray.v400} />
            <Text style={styles.createdByText} numberOfLines={1}>{event.createdBy.name}</Text>
          </View>
        ) : null}
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Color.Background.white,
    borderRadius: Border.md_12,
    borderLeftWidth: 4,
    padding: Spacing.md_16,
    gap: Spacing.sm_12,
    shadowColor: Color.dark,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 2,
    elevation: 1,
    borderWidth: 1,
    borderColor: Color.Gray.v200,
  },
  iconWrap: {
    width: 40,
    height: 40,
    borderRadius: Border.sm_8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  content: {
    flex: 1,
    gap: 2,
  },
  title: {
    fontSize: FontSize.bodymedium_16,
    fontFamily: FontFamily.semi_bold,
    color: Color.dark,
  },
  typeLabel: {
    fontSize: FontSize.caption_12,
    fontFamily: FontFamily.medium,
    color: Color.Gray.v400,
  },
  time: {
    fontSize: FontSize.bodysmall_14,
    fontFamily: FontFamily.regular,
    color: Color.Gray.v400,
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
    marginTop: 2,
  },
  location: {
    fontSize: FontSize.caption_12,
    fontFamily: FontFamily.regular,
    color: Color.Gray.v400,
    flex: 1,
  },
  createdByRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
    marginTop: 2,
  },
  createdByText: {
    fontSize: FontSize.caption_12,
    fontFamily: FontFamily.regular,
    color: Color.Gray.v400,
    flex: 1,
  },
});
