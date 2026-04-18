import React, { useState } from 'react';
import {
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { InstitutionMembersNavigationStackParamList } from '../../navigation/InstitutionMembersNavigationStack';
import { FormTextInput } from '@components/forms/FormTextInput';
import { PrimaryButton } from '@components/ButtonComponents';
import { VStack } from '@components/CoreComponents';
import { Color } from '@src/styles/colors';
import { FontFamily, FontSize } from '@src/styles/fonts';
import { Spacing, spacingStyles } from '@src/styles/spacings';
import { Border } from '@src/styles/borders';
import { shadowStyles } from '@src/styles/shadow';
import { useElderlyDetailsStore } from '@src/stores';
import { UpdateElderlyRequest } from 'moveplus-shared';
import { useErrorHandler } from '@src/hooks/useErrorHandler';
import { useTranslation } from '@src/localization/hooks/useTranslation';

type Props = NativeStackScreenProps<InstitutionMembersNavigationStackParamList, 'EditElderly'>;

const EditElderlyScreen: React.FC<Props> = ({ route, navigation }) => {
  const { elderlyId } = route.params;
  const { elderly, updateElderly } = useElderlyDetailsStore();
  const { handleError, handleSuccess, handleValidationError } = useErrorHandler();
  const { t } = useTranslation();

  const [floor, setFloor] = useState<string>(
    elderly?.floor != null ? String(elderly.floor) : ''
  );
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    if (!elderly) return;

    if (floor !== '' && (isNaN(Number(floor)) || Number(floor) < 0 || !Number.isInteger(Number(floor)))) {
      handleValidationError(t('elderly.floorInvalid'));
      return;
    }

    setLoading(true);
    try {
      const data: UpdateElderlyRequest = {
        name: elderly.name,
        phone: elderly.phone ?? undefined,
        gender: elderly.gender,
        address: elderly.address ?? undefined,
        floor: floor === '' ? null : Number(floor),
      };

      await updateElderly(elderlyId, data);
      handleSuccess(t('elderly.updateSuccess'));
      navigation.goBack();
    } catch (error) {
      handleError(error, t('elderly.updateFailed'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.contentContainer}
      showsVerticalScrollIndicator={false}
      keyboardShouldPersistTaps="handled"
      keyboardDismissMode="on-drag"
    >
      <VStack align="flex-start" spacing={Spacing.md_16}>
        {/* Read-only info */}
        <View style={styles.readOnlySection}>
          <Text style={styles.readOnlyLabel}>{t('elderly.elderlyInfo')}</Text>
          <Text style={styles.readOnlyText}>{elderly?.name}</Text>
        </View>

        <FormTextInput
          title={t('elderly.floor')}
          placeholder={t('elderly.floorPlaceholder')}
          value={floor}
          onChangeText={setFloor}
          keyboardType="number-pad"
          maxLength={3}
        />

        <PrimaryButton
          title={loading ? t('elderly.saving') : t('elderly.saveChanges')}
          onPress={handleSubmit}
          style={styles.submitButton}
        />
      </VStack>
    </ScrollView>
  );
};

export default EditElderlyScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Color.Background.subtle,
  },
  contentContainer: {
    ...spacingStyles.screenScrollContainer,
  },
  readOnlySection: {
    backgroundColor: Color.Background.white,
    borderRadius: Border.sm_8,
    padding: Spacing.md_16,
    alignSelf: 'stretch',
    ...shadowStyles.cardShadow,
  },
  readOnlyLabel: {
    fontSize: FontSize.bodymedium_16,
    fontFamily: FontFamily.semi_bold,
    color: Color.dark,
    marginBottom: Spacing.xs_4,
  },
  readOnlyText: {
    fontSize: FontSize.bodylarge_18,
    fontFamily: FontFamily.bold,
    color: Color.Gray.v500,
  },
  submitButton: {
    alignSelf: 'stretch',
  },
});
