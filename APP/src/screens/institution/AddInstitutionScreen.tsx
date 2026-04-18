import React, { useState } from 'react';
import {
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { CreateInstitutionRequest } from 'moveplus-shared';
import { Color } from '@src/styles/colors';
import { FontFamily, FontSize } from '@src/styles/fonts';
import { Spacing, spacingStyles } from '@src/styles/spacings';
import { VStack } from '@components/CoreComponents';
import { PrimaryButton } from '@components/ButtonComponents';
import { FormTextInput } from '@components/forms/FormTextInput';
import { useErrorHandler } from '@src/hooks/useErrorHandler';
import { useTranslation } from 'react-i18next';
import { institutionApi } from '@api/endpoints/institution';

type AddInstitutionScreenProps = NativeStackScreenProps<any, 'AddInstitution'>;

interface InstitutionForm {
  name: string;
  nickname: string;
  address: string;
  phone: string;
  email: string;
  website: string;
}

const AddInstitutionScreen: React.FC<AddInstitutionScreenProps> = ({ navigation }) => {
  const { t } = useTranslation();
  const [loading, setLoading] = useState(false);
  const { handleError, handleSuccess, handleValidationError } = useErrorHandler();
  const insets = useSafeAreaInsets();

  const [form, setForm] = useState<InstitutionForm>({
    name: '',
    nickname: '',
    address: '',
    phone: '',
    email: '',
    website: '',
  });

  const handleInputChange = (field: keyof InstitutionForm, value: string) => {
    setForm(prev => ({ ...prev, [field]: value }));
  };

  const validateForm = (): boolean => {
    if (!form.name.trim()) {
      handleValidationError(t('institution.nameRequired'));
      return false;
    }
    if (form.email && !form.email.match(/^[^\s@]+@[^\s@]+\.[^\s@]+$/)) {
      handleValidationError(t('institution.invalidEmail'));
      return false;
    }
    if (form.website && !form.website.match(/^https?:\/\/.+/)) {
      handleValidationError(t('institution.invalidWebsite'));
      return false;
    }
    return true;
  };

  const handleSubmit = async () => {
    if (!validateForm()) return;

    setLoading(true);
    try {
      const institutionData: CreateInstitutionRequest = {
        name: form.name.trim(),
        nickname: form.nickname.trim() || undefined,
        address: form.address.trim() || undefined,
        phone: form.phone.trim() || undefined,
        email: form.email.trim() || undefined,
        website: form.website.trim() || undefined,
      };

      await institutionApi.createInstitution(institutionData);
      handleSuccess(t('institution.institutionCreatedSuccessfully'));
      navigation.goBack();
    } catch (error) {
      console.error('Error creating institution:', error);
      handleError(error, t('institution.failedToCreateInstitution'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScrollView
      style={styles.scrollView}
      showsVerticalScrollIndicator={false}
      contentContainerStyle={[
        styles.scrollContent,
        { paddingBottom: Math.max(insets.bottom, 60) + 20 }
      ]}
      keyboardShouldPersistTaps="handled"
    >
      <VStack spacing={Spacing.lg_24} style={styles.content}>
        <VStack spacing={Spacing.md_16} style={styles.form}>
          <FormTextInput
            title={t('institution.name')}
            placeholder={t('institution.enterInstitutionName')}
            value={form.name}
            onChangeText={(value) => handleInputChange('name', value)}
            required
          />

          <FormTextInput
            title={t('institution.nickname')}
            placeholder={t('institution.enterInstitutionNickname')}
            value={form.nickname}
            onChangeText={(value) => handleInputChange('nickname', value)}
          />

          <FormTextInput
            title={t('institution.address')}
            placeholder={t('institution.enterAddress')}
            value={form.address}
            onChangeText={(value) => handleInputChange('address', value)}
            multiline
            numberOfLines={3}
          />

          <FormTextInput
            title={t('institution.phone')}
            placeholder={t('institution.enterPhone')}
            value={form.phone}
            onChangeText={(value) => handleInputChange('phone', value)}
            keyboardType="phone-pad"
          />

          <FormTextInput
            title={t('institution.email')}
            placeholder={t('institution.enterEmail')}
            value={form.email}
            onChangeText={(value) => handleInputChange('email', value)}
            keyboardType="email-address"
            autoCapitalize="none"
          />

          <FormTextInput
            title={t('institution.website')}
            placeholder={t('institution.enterWebsite')}
            value={form.website}
            onChangeText={(value) => handleInputChange('website', value)}
            keyboardType="url"
            autoCapitalize="none"
          />
        </VStack>

        <VStack spacing={Spacing.md_16} style={styles.buttonContainer}>
          <PrimaryButton
            title={t('institution.createInstitution')}
            onPress={handleSubmit}
            loading={loading}
          />
          <TouchableOpacity onPress={() => navigation.goBack()}>
            <Text style={styles.cancelButton}>{t('common.cancel')}</Text>
          </TouchableOpacity>
        </VStack>
      </VStack>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  scrollView: {
    flex: 1,
    backgroundColor: Color.Background.subtle,
  },
  scrollContent: {
    flexGrow: 1,
    ...spacingStyles.screenScrollContainer,
  },
  content: {
  },
  form: {
    width: '100%',
  },
  buttonContainer: {
    width: '100%',
    marginTop: Spacing.lg_24,
  },
  cancelButton: {
    fontSize: FontSize.bodymedium_16,
    fontFamily: FontFamily.medium,
    color: Color.Gray.v500,
    textAlign: 'center',
  },
});

export default AddInstitutionScreen;
