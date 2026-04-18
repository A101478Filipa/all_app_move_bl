import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { TimelineActivity, TimelineActivityType } from 'moveplus-shared';
import { Color } from '@src/styles/colors';
import { Spacing } from '@src/styles/spacings';
import { Border } from '@src/styles/borders';
import { FontFamily, FontSize } from '@src/styles/fonts';
import { shadowStyles } from '@src/styles/shadow';
import { VStack, HStack } from '@components/CoreComponents';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import { useTranslation } from 'react-i18next';
import { getTimelineActivityContent } from '@src/utils/timelineActivityHelper';
import { getMeasurementTypeLabel } from '@src/utils/measurementHelper';

interface TimelineActivityCardProps {
  item: TimelineActivity;
  onPress?: (item: TimelineActivity) => void;
}

const getActivityIcon = (type: TimelineActivityType, item?: TimelineActivity) => {
  const iconSize = 22;

  switch (type) {
    case TimelineActivityType.FALL_OCCURRENCE:
      if (item?.metadata?.isHandled) {
        return <MaterialIcons name="check-circle" size={iconSize} color={Color.Cyan.v500} />;
      }
      return <MaterialIcons name="warning" size={iconSize} color={Color.Error.default} />;
    case TimelineActivityType.MEASUREMENT_ADDED:
      return <MaterialCommunityIcons name="heart-pulse" size={iconSize} color={Color.Blue.v500} />;
    case TimelineActivityType.MEDICATION_ADDED:
      return <MaterialCommunityIcons name="pill" size={iconSize} color={Color.Warning.amber} />;
    case TimelineActivityType.MEDICATION_UPDATED:
      return <MaterialCommunityIcons name="pill" size={iconSize} color={Color.Orange.v400} />;
    case TimelineActivityType.PATHOLOGY_ADDED:
      return <MaterialIcons name="local-hospital" size={iconSize} color={Color.Error.dark} />;
    case TimelineActivityType.USER_ADDED:
      return <MaterialIcons name="person-add" size={iconSize} color={Color.Cyan.v500} />;
    case TimelineActivityType.USER_UPDATED:
      return <MaterialIcons name="person" size={iconSize} color={Color.Cyan.v400} />;
    case TimelineActivityType.SOS_OCCURRENCE:
      if (item?.metadata?.isHandled) {
        return <MaterialIcons name="check-circle" size={iconSize} color={Color.Cyan.v500} />;
      }
      return <MaterialIcons name="sos" size={iconSize} color={Color.Warning.amber} />;
    case TimelineActivityType.CALENDAR_EVENT_ADDED:
      return <MaterialIcons name="event" size={iconSize} color={Color.primary} />;
    default:
      return <MaterialIcons name="info" size={iconSize} color={Color.Gray.v400} />;
  }
};

const getActivityColor = (type: TimelineActivityType, item?: TimelineActivity) => {
  switch (type) {
    case TimelineActivityType.FALL_OCCURRENCE:
      if (item?.metadata?.isHandled) {
        return Color.Cyan.v500;
      }
      return Color.Error.default;
    case TimelineActivityType.MEASUREMENT_ADDED:
      return Color.Blue.v500;
    case TimelineActivityType.MEDICATION_ADDED:
      return Color.Warning.amber;
    case TimelineActivityType.MEDICATION_UPDATED:
      return Color.Orange.v400;
    case TimelineActivityType.PATHOLOGY_ADDED:
      return Color.Error.dark;
    case TimelineActivityType.USER_ADDED:
    case TimelineActivityType.USER_UPDATED:
      return Color.Cyan.v500;
    case TimelineActivityType.SOS_OCCURRENCE:
      if (item?.metadata?.isHandled) return Color.Cyan.v500;
      return Color.Warning.amber;
    case TimelineActivityType.CALENDAR_EVENT_ADDED:
      return Color.primary;
    default:
      return Color.Gray.v400;
  }
};

const getActivityBackgroundColor = (type: TimelineActivityType, item?: TimelineActivity) => {
  switch (type) {
    case TimelineActivityType.FALL_OCCURRENCE:
      if (item?.metadata?.isHandled) {
        return `${Color.Cyan.v500}15`;
      }
      return `${Color.Error.default}15`;
    case TimelineActivityType.MEASUREMENT_ADDED:
      return `${Color.Blue.v500}15`;
    case TimelineActivityType.MEDICATION_ADDED:
      return `${Color.Warning.amber}15`;
    case TimelineActivityType.MEDICATION_UPDATED:
      return `${Color.Orange.v400}15`;
    case TimelineActivityType.PATHOLOGY_ADDED:
      return `${Color.Error.dark}15`;
    case TimelineActivityType.USER_ADDED:
    case TimelineActivityType.USER_UPDATED:
      return `${Color.Cyan.v500}15`;
    case TimelineActivityType.SOS_OCCURRENCE:
      if (item?.metadata?.isHandled) return `${Color.Cyan.v500}15`;
      return `${Color.Warning.amber}15`;
    case TimelineActivityType.CALENDAR_EVENT_ADDED:
      return `${Color.primary}15`;
    default:
      return `${Color.Gray.v400}15`;
  }
};

const getDisplayValueAndUnit = (value: number, unit: string) => {
  switch (unit) {
    case 'KILOGRAMS':
      return {
        value: value.toString(),
        unit: 'kg'
      };
    case 'CENTIMETERS':
      return {
        value: value.toString(),
        unit: 'cm'
      };
    case 'SECONDS':
      return {
        value: value.toString(),
        unit: 's'
      };
    case 'POINTS':
      return {
        value: value.toString(),
        unit: ''
      };
    default:
      return {
        value: value.toString(),
        unit: unit || ''
      };
  }
};

const getMetadataDisplay = (item: TimelineActivity, t: any) => {
  if (!item.metadata) return null;

  switch (item.type) {
    case TimelineActivityType.MEASUREMENT_ADDED:
      const measurementTypeRaw = item.metadata.measurementType;
      const measurementType = measurementTypeRaw
        ? getMeasurementTypeLabel(measurementTypeRaw, t)
        : t('timeline.measurement');
      if (item.metadata.value && item.metadata.unit) {
        const { value: displayValue, unit: displayUnit } = getDisplayValueAndUnit(
          item.metadata.value,
          item.metadata.unit
        );
        return `${measurementType}: ${displayValue}${displayUnit ? ` ${displayUnit}` : ''}`;
      }
      return `${measurementType}: ${item.metadata.value || t('timeline.notApplicable')} ${item.metadata.unit || ''}`;
    case TimelineActivityType.MEDICATION_ADDED:
    case TimelineActivityType.MEDICATION_UPDATED:
      return `${item.metadata.medicationName || t('timeline.medication')} - ${item.metadata.dosage || t('timeline.noDosage')}`;
    case TimelineActivityType.PATHOLOGY_ADDED:
      return item.metadata.pathologyName || t('timeline.newConditionDiagnosed');
    case TimelineActivityType.SOS_OCCURRENCE:
      return item.metadata?.notes ? item.metadata.notes : null;
    case TimelineActivityType.CALENDAR_EVENT_ADDED:
      return item.metadata?.eventTitle ? item.metadata.eventTitle : null;
    default:
      return null;
  }
};

const getPriorityIndicator = (item: TimelineActivity) => {
  if (item.type === TimelineActivityType.FALL_OCCURRENCE && item.metadata) {
    const isHandled = item.metadata.isHandled;
    return isHandled ? 'normal' : 'urgent';
  }
  if (item.type === TimelineActivityType.SOS_OCCURRENCE && item.metadata) {
    return item.metadata.isHandled ? 'normal' : 'urgent';
  }
  return 'normal';
};
const TimelineActivityCard: React.FC<TimelineActivityCardProps> = ({ item, onPress }) => {
  const { t } = useTranslation();

  const formatTime = (date: Date | string) => {
    const dateObj = typeof date === 'string' ? new Date(date) : date;
    return dateObj.toLocaleTimeString([], {
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const handlePress = () => {
    if (onPress) {
      onPress(item);
    }
  };

  const priority = getPriorityIndicator(item);
  const metadataText = getMetadataDisplay(item, t);
  const { title, description } = getTimelineActivityContent(item, t);

  return (
    <TouchableOpacity
      style={[
        styles.card,
        priority === 'urgent' && styles.urgentCard
      ]}
      onPress={handlePress}
      disabled={!onPress}
      activeOpacity={onPress ? 0.7 : 1}
    >
      <HStack spacing={Spacing.md_16} align="flex-start">
        {/* Icon Container */}
        <View style={[
          styles.iconContainer,
          { backgroundColor: getActivityBackgroundColor(item.type, item) }
        ]}>
          {getActivityIcon(item.type, item)}
        </View>

        {/* Content */}
        <VStack align="flex-start" style={{ flex: 1 }}>
          {/* Header Row */}
          <HStack align="center" style={{ width: '100%', justifyContent: 'space-between' }}>
            <Text style={[styles.title, { color: getActivityColor(item.type, item) }]} numberOfLines={1} ellipsizeMode="tail">
              {title}
            </Text>
            <Text style={styles.time}>
              {formatTime(item.createdAt)}
            </Text>
          </HStack>

          {/* Patient Name - More Visible */}
          {item.elderly && (
            <Text style={styles.patientName} numberOfLines={1} ellipsizeMode="tail">
              {t('navigation.patient')}: {item.elderly.name}
            </Text>
          )}

          {/* Metadata Display */}
          {metadataText && (
            <Text style={styles.metadataText} numberOfLines={1} ellipsizeMode="tail">
              {metadataText}
            </Text>
          )}

          {/* Description */}
          {description && !metadataText && (
            <Text style={styles.description} numberOfLines={2} ellipsizeMode="tail">
              {description}
            </Text>
          )}

          {/* Footer Row */}
          {item.user && (
            <HStack spacing={Spacing.sm_8} style={{ marginTop: Spacing.xs_4 }}>
              <Text style={styles.metadata} numberOfLines={1} ellipsizeMode="tail">
                {t('timeline.by')}: {item.user.name}
              </Text>
            </HStack>
          )}
        </VStack>
      </HStack>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: Color.white,
    padding: Spacing.md_16,
    borderRadius: Border.lg_16,
    marginBottom: Spacing.md_16,
    ...shadowStyles.cardShadow,
  },
  urgentCard: {
    borderLeftWidth: 4,
    borderLeftColor: Color.Error.default,
  },
  iconContainer: {
    width: 44,
    height: 44,
    borderRadius: Border.md_12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  title: {
    fontFamily: FontFamily.bold,
    fontSize: FontSize.bodymedium_16,
    color: Color.dark,
    flex: 1,
    marginRight: Spacing.sm_8,
  },
  patientName: {
    fontFamily: FontFamily.semi_bold,
    fontSize: FontSize.bodysmall_14,
    color: Color.dark,
    marginTop: Spacing.xs_4,
  },
  time: {
    fontFamily: FontFamily.regular,
    fontSize: FontSize.caption_12,
    color: Color.Gray.v400,
  },
  metadataText: {
    fontFamily: FontFamily.medium,
    fontSize: FontSize.caption_12,
    color: Color.Gray.v500,
    marginTop: Spacing.xs_4,
  },
  description: {
    fontFamily: FontFamily.regular,
    fontSize: FontSize.bodysmall_14,
    color: Color.Gray.v500,
    lineHeight: 20,
    marginTop: Spacing.xs_4,
  },
  metadata: {
    fontFamily: FontFamily.regular,
    fontSize: FontSize.caption_12,
    color: Color.Gray.v400,
  },
});

export default TimelineActivityCard;