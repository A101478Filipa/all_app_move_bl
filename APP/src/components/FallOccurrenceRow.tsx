import React from 'react';
import { Text, TouchableOpacity, StyleSheet, View } from 'react-native';
import { FallOccurrence } from 'moveplus-shared';
import { formatDateLong } from '@src/utils/Date';
import { Color } from '@src/styles/colors';
import { Spacing } from '@src/styles/spacings';
import { FontFamily, FontSize } from '@src/styles/fonts';
import { HStack, VStack, Spacer } from '@components/CoreComponents';
import { MaterialIcons } from '@expo/vector-icons';
import { shadowStyles } from '@styles/shadow';
import { Border } from '@styles/borders';
import { useTranslation } from '@src/localization/hooks/useTranslation';

type Props = {
  fall: FallOccurrence;
  onPress: (fall: FallOccurrence) => void;
};

const FallOccurrenceRow: React.FC<Props> = ({ fall, onPress }) => {
  const { t } = useTranslation();
  const handled = Boolean(fall.handlerUserId);
  const handledString = handled
    ? fall.handler
      ? `${t('fallOccurrence.handledBy')} ${fall.handler.name}`
      : t('fallOccurrence.handled')
    : t('fallOccurrence.unhandled');

  const getStatusBadgeStyle = (handled: boolean) => ({
    ...styles.statusBadge,
    backgroundColor: handled ? Color.Cyan.v500 : Color.Error.default,
  });

  return (
    <TouchableOpacity
      onPress={() => onPress(fall)}
      style={styles.container}
    >
      <HStack align="center" style={styles.content}>
        <HStack align="center" spacing={Spacing.sm_8}>
          <View style={[styles.iconContainer, { backgroundColor: (handled ? Color.Cyan.v500 : Color.Error.default) + '15' }]}>
            <MaterialIcons
              name="warning"
              size={20}
              color={handled ? Color.Cyan.v500 : Color.Error.default}
            />
          </View>

          <VStack align="flex-start" spacing={Spacing.xxs_2} style={styles.textContainer}>
            <HStack align="center" spacing={Spacing.xs_4}>
              <Text style={styles.fallDate}>
                {formatDateLong(fall.date)}
              </Text>
              <View style={getStatusBadgeStyle(handled)}>
                <Text style={styles.statusText}>
                  {handled ? t('fallOccurrence.handled') : t('fallOccurrence.unhandled')}
                </Text>
              </View>
            </HStack>

            {fall.description && (
              <Text style={styles.fallDescription} numberOfLines={1} ellipsizeMode="tail">
                {fall.description}
              </Text>
            )}

            {handled && fall.handler && (
              <Text style={styles.handlerText}>
                {t('fallOccurrence.handledBy')} {fall.handler.name}
              </Text>
            )}
          </VStack>
        </HStack>

        <Spacer />

        <MaterialIcons name="chevron-right" size={20} color={Color.Gray.v400} />
      </HStack>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    alignSelf: 'stretch',
    ...shadowStyles.cardShadow,
    backgroundColor: Color.Background.white,
    borderRadius: Border.sm_8,
  },
  content: {
    paddingVertical: Spacing.sm_8,
    paddingHorizontal: Spacing.md_16,
    marginVertical: Spacing.xxs_2,
  },
  iconContainer: {
    width: 36,
    height: 36,
    borderRadius: Border.sm_8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  fallDate: {
    fontFamily: FontFamily.semi_bold,
    fontSize: FontSize.bodymedium_16,
    color: Color.dark,
  },
  textContainer: {
    flexShrink: 1,
    alignSelf: 'flex-start',
  },
  fallDescription: {
    fontFamily: FontFamily.regular,
    fontSize: FontSize.bodysmall_14,
    color: Color.Gray.v400,
    lineHeight: 18,
  },
  handlerText: {
    fontFamily: FontFamily.medium,
    fontSize: FontSize.caption_12,
    color: Color.Gray.v500,
    fontStyle: 'italic',
  },
  statusBadge: {
    borderRadius: Border.xs_4,
    paddingHorizontal: Spacing.xs_4,
    paddingVertical: 2,
  },
  statusText: {
    fontFamily: FontFamily.bold,
    fontSize: 10,
    color: Color.white,
    textTransform: 'uppercase',
  },
});

export default FallOccurrenceRow;