import React from 'react';
import { View, Text, ScrollView, StyleSheet, RefreshControl } from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { FallOccurrence } from 'moveplus-shared';
import FallOccurrenceRow from '@components/FallOccurrenceRow';
import { useElderlyDetailsStore } from '@src/stores/elderlyDetailsStore';
import { Color } from '@src/styles/colors';
import { FontFamily, FontSize } from '@src/styles/fonts';
import { Spacing, spacingStyles } from '@src/styles/spacings';
import { MaterialIcons } from '@expo/vector-icons';
import { useTranslation } from '@src/localization/hooks/useTranslation';
import ScreenState from '@src/constants/screenState';

type Props = NativeStackScreenProps<any, 'ElderlyFallsList'>;

const ElderlyFallsListScreen: React.FC<Props> = ({ route, navigation }) => {
  const { elderlyId } = route.params;
  const { t } = useTranslation();
  const { elderly, state, refreshElderly } = useElderlyDetailsStore();

  const falls: FallOccurrence[] = elderly?.fallOccurrences ?? [];

  const handleFallPress = (fall: FallOccurrence) => {
    navigation.push('FallOccurrenceScreen', { occurrenceId: fall.id });
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
        {falls.length === 0 ? (
          <View style={styles.emptyState}>
            <MaterialIcons name="person-off" size={48} color={Color.Gray.v300} />
            <Text style={styles.emptyText}>{t('elderly.noFalls')}</Text>
          </View>
        ) : (
          falls.map(fall => (
            <FallOccurrenceRow
              key={fall.id}
              fall={fall}
              onPress={handleFallPress}
            />
          ))
        )}
      </ScrollView>
    </View>
  );
};

export default ElderlyFallsListScreen;

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
});
