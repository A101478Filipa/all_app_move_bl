import React from 'react';
import { Text, TouchableOpacity, Image, StyleSheet } from 'react-native';
import { SosOccurrence } from 'moveplus-shared';
import { buildAvatarUrl } from '@src/services/ApiService';
import { formatFriendlyDate } from '@src/utils/Date';
import { Color } from '@src/styles/colors';
import { Spacing } from '@src/styles/spacings';
import { Border } from '@src/styles/borders';
import { FontFamily, FontSize } from '@src/styles/fonts';
import { HStack, VStack } from '@components/CoreComponents';
import { MaterialIcons } from '@expo/vector-icons';
import { shadowStyles } from '@styles/shadow';
import { useTranslation } from '@src/localization/hooks/useTranslation';

const SOS_COLOR = Color.Warning.amber;

type Props = {
  item: SosOccurrence;
  onPress: (item: SosOccurrence) => void;
};

const SosOccurrenceCard: React.FC<Props> = ({ item, onPress }) => {
  const { t } = useTranslation();
  const handled = item.handlerUserId != null || item.handler != null;
  const handledString = handled
    ? item.handler
      ? `${t('sosOccurrence.handledBy')} ${item.handler.name}`
      : t('sosOccurrence.handled')
    : t('sosOccurrence.unhandled');

  return (
    <TouchableOpacity
      style={[
        styles.card,
        {
          borderWidth: 1,
          borderColor: item.isFalseAlarm
            ? Color.Gray.v300
            : handled
            ? Color.Gray.v100
            : SOS_COLOR,
        },
      ]}
      onPress={() => onPress(item)}
    >
      <HStack spacing={Spacing.md_16}>
        <Image
          source={{ uri: buildAvatarUrl(item.elderly.user.avatarUrl) }}
          style={styles.avatar}
        />

        <VStack align="flex-start" spacing={Spacing.xs_4} style={styles.textContainer}>
          <Text style={styles.name} numberOfLines={1} ellipsizeMode="tail">
            {item.elderly.name}
          </Text>
          <Text style={styles.details} numberOfLines={1} ellipsizeMode="tail">
            {t('sosOccurrence.sosAlertAt')} {formatFriendlyDate(item.date, t)}
          </Text>

          {item.isFalseAlarm ? (
            <HStack
              spacing={Spacing.xs_4}
              style={{
                backgroundColor: Color.Gray.v300,
                paddingHorizontal: Spacing.sm_8,
                paddingVertical: Spacing.xs_4,
                borderRadius: Border.sm_8,
              }}
            >
              <MaterialIcons name="info" size={20} color={Color.white} />
              <Text
                style={{
                  fontFamily: FontFamily.bold,
                  fontSize: FontSize.bodysmall_14,
                  color: Color.white,
                }}
              >
                {t('sosOccurrence.falseAlarm')}
              </Text>
            </HStack>
          ) : (
            <HStack
              spacing={Spacing.xs_4}
              style={{
                backgroundColor: handled ? Color.white : SOS_COLOR,
                paddingHorizontal: handled ? 0 : Spacing.sm_8,
                paddingVertical: handled ? 0 : Spacing.xs_4,
                borderRadius: handled ? 0 : Border.sm_8,
              }}
            >
              {!handled && (
                <MaterialIcons name="sos" size={24} color={Color.white} />
              )}
              <Text
                style={{
                  fontFamily: handled ? FontFamily.regular : FontFamily.bold,
                  fontSize: FontSize.bodysmall_14,
                  color: handled ? Color.Gray.v400 : Color.white,
                }}
              >
                {handledString}
              </Text>
            </HStack>
          )}
        </VStack>

        <MaterialIcons
          name="chevron-right"
          size={24}
          color={
            item.isFalseAlarm
              ? Color.Gray.v300
              : handled
              ? Color.Gray.v300
              : SOS_COLOR
          }
        />
      </HStack>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  card: {
    flex: 1,
    backgroundColor: Color.white,
    padding: Spacing.sm_8,
    borderRadius: Border.lg_16,
    alignSelf: 'stretch',
    ...shadowStyles.cardShadow,
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: Border.full,
  },
  textContainer: {
    flex: 1,
  },
  name: {
    fontFamily: FontFamily.bold,
    fontSize: FontSize.bodymedium_16,
    color: Color.Gray.v500,
  },
  details: {
    fontFamily: FontFamily.regular,
    fontSize: 13,
    color: Color.Gray.v400,
  },
});

export default SosOccurrenceCard;
