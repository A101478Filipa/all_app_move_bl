import React from 'react';
import { View, Text, ScrollView, StyleSheet, RefreshControl, TouchableOpacity } from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { SosOccurrence } from 'moveplus-shared';
import { useElderlyDetailsStore } from '@src/stores/elderlyDetailsStore';
import { Color } from '@src/styles/colors';
import { FontFamily, FontSize } from '@src/styles/fonts';
import { Spacing, spacingStyles } from '@src/styles/spacings';
import { Border } from '@src/styles/borders';
import { MaterialIcons } from '@expo/vector-icons';
import { useTranslation } from '@src/localization/hooks/useTranslation';
import ScreenState from '@src/constants/screenState';
import { HStack, VStack } from '@components/CoreComponents';
import { shadowStyles } from '@styles/shadow';
import { formatDateLong } from '@src/utils/Date';

const SOS_COLOR = Color.Warning.amber;

type Props = NativeStackScreenProps<any, 'ElderlySOSList'>;

const ElderlySOSListScreen: React.FC<Props> = ({ route, navigation }) => {
  const { elderlyId } = route.params;
  const { t } = useTranslation();
  const { elderly, state, refreshElderly } = useElderlyDetailsStore();

  const occurrences: SosOccurrence[] = (elderly as any)?.sosOccurrences ?? [];

  const handleOccurrencePress = (item: SosOccurrence) => {
    navigation.push('SosOccurrenceScreen', { occurrenceId: item.id });
  };

  return (
    <View style={styles.container}>
      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={state === ScreenState.REFRESHING}
            onRefresh={() => refreshElderly(elderlyId)}
          />
        }
      >
        {occurrences.length === 0 ? (
          <View style={styles.emptyState}>
            <MaterialIcons name="notifications-off" size={48} color={Color.Gray.v300} />
            <Text style={styles.emptyText}>{t('elderly.noSosOccurrences')}</Text>
          </View>
        ) : (
          occurrences.map(item => {
            const handled = item.handlerUserId != null;
            const statusColor = item.isFalseAlarm
              ? Color.Gray.v400
              : handled
              ? Color.Cyan.v500
              : SOS_COLOR;

            return (
              <TouchableOpacity
                key={item.id}
                style={styles.card}
                onPress={() => handleOccurrencePress(item)}
                activeOpacity={0.75}
              >
                <HStack align="center" spacing={Spacing.sm_12}>
                  <View style={[styles.iconWrap, { backgroundColor: statusColor + '18' }]}>
                    <MaterialIcons name="sos" size={22} color={statusColor} />
                  </View>
                  <VStack align="flex-start" spacing={Spacing.xxs_2} style={styles.textWrap}>
                    <Text style={styles.date}>{formatDateLong(item.date)}</Text>
                    <Text style={[styles.status, { color: statusColor }]}>
                      {item.isFalseAlarm
                        ? t('sosOccurrence.falseAlarm')
                        : handled
                        ? t('sosOccurrence.handled')
                        : t('sosOccurrence.unhandled')}
                    </Text>
                    {item.notes ? (
                      <Text style={styles.notes} numberOfLines={2}>{item.notes}</Text>
                    ) : null}
                  </VStack>
                  <MaterialIcons name="chevron-right" size={20} color={Color.Gray.v300} />
                </HStack>
              </TouchableOpacity>
            );
          })
        )}
      </ScrollView>
    </View>
  );
};

export default ElderlySOSListScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Color.Background.subtle,
  },
  content: {
    ...spacingStyles.screenScrollContainer,
    gap: Spacing.md_16,
  },
  emptyState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: Spacing.xl_32,
    gap: Spacing.sm_8,
  },
  emptyText: {
    fontSize: FontSize.bodymedium_16,
    fontFamily: FontFamily.medium,
    color: Color.Gray.v400,
    textAlign: 'center',
  },
  card: {
    backgroundColor: Color.Background.white,
    borderRadius: Border.md_12,
    padding: Spacing.md_16,
    borderWidth: 1,
    borderColor: Color.Gray.v200,
    ...shadowStyles.cardShadow,
  },
  iconWrap: {
    width: 44,
    height: 44,
    borderRadius: Border.sm_8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  textWrap: {
    flex: 1,
  },
  date: {
    fontSize: FontSize.bodymedium_16,
    fontFamily: FontFamily.semi_bold,
    color: Color.dark,
  },
  status: {
    fontSize: FontSize.bodysmall_14,
    fontFamily: FontFamily.medium,
  },
  notes: {
    fontSize: FontSize.bodysmall_14,
    fontFamily: FontFamily.regular,
    color: Color.Gray.v400,
  },
});
