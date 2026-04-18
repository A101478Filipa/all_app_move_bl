import React from 'react';
import { Text, TouchableOpacity, Image, StyleSheet } from 'react-native';
import { FallOccurrence } from 'moveplus-shared';
import { buildAvatarUrl } from '@src/services/ApiService';
import { formatFriendlyDate } from '@src/utils/Date';
import { Color } from '@src/styles/colors';
import { Spacing } from '@src/styles/spacings';
import { Border } from '@src/styles/borders';
import { FontFamily, FontSize } from '@src/styles/fonts';
import { HStack, Spacer, VStack } from '@components/CoreComponents';
import { MaterialIcons } from '@expo/vector-icons';
import { shadowStyles } from '@styles/shadow';
import { useTranslation } from '@src/localization/hooks/useTranslation';

type Props = {
  item: FallOccurrence;
  onPress: (item: FallOccurrence, handled: boolean) => void;
};

const FallOccurrenceCard: React.FC<Props> = ({ item, onPress }) => {
  const { t } = useTranslation();
  const handled = item.handlerUserId != undefined || item.handler != null;
  const handledString = handled ? (item.handler ? `${t('fallOccurrence.handledBy')} ${item.handler.name}` : t('fallOccurrence.handled')) : t('fallOccurrence.unhandled');

  return (
    <TouchableOpacity
      style={{
        ...styles.card,
        borderWidth: 1,
        borderColor: item.isFalseAlarm ? Color.Warning.amber : (handled ? Color.Gray.v100 : Color.Error.default),
      }}
      onPress={() => onPress(item, handled)}
    >
      <HStack spacing={Spacing.md_16}>
        <Image source={{ uri: buildAvatarUrl(item.elderly.user.avatarUrl) }} style={styles.avatar} />

        <VStack align="flex-start" spacing={Spacing.xs_4} style={styles.textContainer}>
          <Text style={styles.name} numberOfLines={1} ellipsizeMode="tail">{item.elderly.name}</Text>
          <Text style={styles.details} numberOfLines={1} ellipsizeMode="tail">{t('fallOccurrence.fallDetectedAt')} {formatFriendlyDate(item.date, t)}</Text>

          {item.isFalseAlarm ? (
            <HStack
              spacing={Spacing.xs_4}
              style={{
                backgroundColor: Color.Warning.amber,
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
                {t('fallOccurrence.falseAlarm')}
              </Text>
            </HStack>
          ) : (
            <HStack
              spacing={Spacing.xs_4}
              style={{
                backgroundColor: handled ? Color.white : Color.Error.default,
                paddingHorizontal: handled ? 0 : Spacing.sm_8,
                paddingVertical: handled ? 0 : Spacing.xs_4,
                borderRadius: handled ? 0 : Border.sm_8,
              }}
            >
              {!handled && <MaterialIcons name="warning" size={24} color={Color.white} />}
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

        <MaterialIcons name="chevron-right" size={24} color={item.isFalseAlarm ? Color.Warning.amber : (handled ? Color.Gray.v300 : Color.Error.default)} />
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
  textContainer: {
    flex: 1,
  },
  avatar: {
    width: 76,
    height: 76,
    borderRadius: Border.full,
  },
  name: {
    fontSize: FontSize.bodylarge_18,
    fontFamily: FontFamily.bold,
    color: Color.Gray.v500,
  },
  details: {
    fontSize: 13,
    fontFamily: FontFamily.regular,
    color: Color.Gray.v400,
  },
});

export default React.memo(FallOccurrenceCard);