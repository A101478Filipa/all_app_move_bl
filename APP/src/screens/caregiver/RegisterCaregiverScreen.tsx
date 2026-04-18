import React, { useState, useCallback } from 'react';
import {
  StyleSheet,
  SafeAreaView,
  ScrollView,
  Text,
} from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { InstitutionMembersNavigationStackParamList } from '../../navigation/InstitutionMembersNavigationStack';
import { FormTextInput } from '@components/forms/FormTextInput';
import { FormDateInput } from '@components/forms/FormDateInput';
import { FormDropdown, DropdownOption } from '@components/forms/FormDropdown';
import { PrimaryButton, SecondaryButton } from '@components/ButtonComponents';
import { VStack } from '@components/CoreComponents';
import { Color } from '@src/styles/colors';
import { FontFamily, FontSize } from '@src/styles/fonts';
import { Spacing, spacingStyles } from '@src/styles/spacings';
import { Gender, RegisterCaregiverRequest } from 'moveplus-shared';
import { authApi } from '@src/api/endpoints/auth';
import { useErrorHandler } from '@src/hooks/useErrorHandler';
import { useTranslation } from '@src/localization/hooks/useTranslation';

type Props = NativeStackScreenProps<InstitutionMembersNavigationStackParamList, 'RegisterCaregiver'>;

interface CaregiverFormData {
  name: string;
  birthDate: string;
  gender: Gender | '';
  phone: string;
  email: string;
  username: string;
  password: string;
  confirmPassword: string;
}

const RegisterCaregiverScreen: React.FC<Props> = ({ route, navigation }) => {
  const { institutionId } = route.params;
  const { handleError, handleSuccess, handleValidationError } = useErrorHandler();
  const { t } = useTranslation();

  const [formData, setFormData] = useState<CaregiverFormData>({
    name: '',
    birthDate: '',
    gender: '',
    phone: '',
    email: '',
    username: '',
    password: '',
    confirmPassword: '',
  });

  const [loading, setLoading] = useState(false);

  const genderOptions: DropdownOption<Gender>[] = [
    { label: t('gender.male'), value: Gender.MALE },
    { label: t('gender.female'), value: Gender.FEMALE },
    { label: t('gender.other'), value: Gender.OTHER },
  ];

  const handleInputChange = useCallback((field: keyof CaregiverFormData, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value,
    }));
  }, []);

  const handleGenderChange = useCallback((value: Gender) => {
    setFormData(prev => ({
      ...prev,
      gender: value,
    }));
  }, []);

  const validateForm = (): boolean => {
    const requiredFields = ['name', 'birthDate', 'gender', 'email', 'username', 'password'];

    for (const field of requiredFields) {
      if (!formData[field as keyof CaregiverFormData]) {
        handleValidationError(`Please fill in the ${field} field.`);
        return false;
      }
    }

    if (!/\S+@\S+\.\S+/.test(formData.email)) {
      handleValidationError('Please enter a valid email address.');
      return false;
    }

    if (formData.phone && !/^\d{9,15}$/.test(formData.phone.replace(/\s/g, ''))) {
      handleValidationError('Please enter a valid phone number.');
      return false;
    }

    if (formData.password.length < 6) {
      handleValidationError('Password must be at least 6 characters long.');
      return false;
    }

    if (formData.password !== formData.confirmPassword) {
      handleValidationError('Passwords do not match.');
      return false;
    }

    const birthDate = new Date(formData.birthDate);
    const today = new Date();
    const age = today.getFullYear() - birthDate.getFullYear();

    if (birthDate > today) {
      handleValidationError('Birth date cannot be in the future.');
      return false;
    }

    if (age < 18) {
      handleValidationError('Person must be at least 18 years old.');
      return false;
    }

    return true;
  };

  const handleSubmit = useCallback(async () => {
    if (!validateForm()) {
      return;
    }

    setLoading(true);

    try {
      const registrationData: RegisterCaregiverRequest = {
        username: formData.username,
        password: formData.password,
        name: formData.name,
        birthDate: formData.birthDate,
        gender: formData.gender as Gender,
        phone: formData.phone || undefined,
        email: formData.email,
        institutionId,
      };

      const response = await authApi.registerCaregiver(registrationData);

      handleSuccess(
        response.data.message || t('caregiver.registerCaregiver')
      );
      navigation.goBack();
    } catch (error: any) {
      console.error('Error registering caregiver:', error);
      handleError(error, t('errors.serverError'));
    } finally {
      setLoading(false);
    }
  }, [formData, institutionId, navigation, validateForm, handleSuccess, handleError]);

  const handleCancel = useCallback(() => {
    navigation.goBack();
  }, [navigation]);

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        automaticallyAdjustKeyboardInsets={true}
        keyboardDismissMode='on-drag'
      >
        <Text style={styles.title}>{t('caregiver.registerCaregiver')}</Text>
        <Text style={styles.subtitle}>
          {t('caregiver.registerCaregiver')}
        </Text>

        <VStack spacing={Spacing.lg_24} style={styles.form}>
          <Text style={styles.sectionTitle}>Personal Information</Text>

                    <FormTextInput
            title={t('settings.fullName')}
            placeholder={t('settings.fullName')}
            value={formData.name}
            onChangeText={(text) => handleInputChange('name', text)}
            required
          />

          <FormDateInput
            title={t('settings.dateOfBirth')}
            placeholder={t('settings.dateOfBirth')}
            value={formData.birthDate}
            onDateChange={(date) => handleInputChange('birthDate', date)}
            required
          />

          <FormDropdown
            title={t('settings.gender')}
            placeholder={t('settings.gender')}
            value={formData.gender}
            onValueChange={handleGenderChange}
            options={genderOptions}
            required
          />

          <FormTextInput
            title={t('settings.phoneNumber')}
            placeholder={t('settings.phoneNumber')}
            value={formData.phone}
            onChangeText={(value) => handleInputChange('phone', value)}
            keyboardType="phone-pad"
          />

          <FormTextInput
            title={t('settings.email')}
            placeholder={t('settings.email')}
            value={formData.email}
            onChangeText={(value) => handleInputChange('email', value)}
            keyboardType="email-address"
            autoCapitalize="none"
            required
          />

          <Text style={styles.sectionTitle}>Account Information</Text>

          <FormTextInput
            title={t('authentication.username')}
            placeholder={t('authentication.enterUsername')}
            value={formData.username}
            onChangeText={(value) => handleInputChange('username', value)}
            autoCapitalize="none"
            required
          />

          <FormTextInput
            title={t('authentication.password')}
            placeholder={t('authentication.enterPassword')}
            value={formData.password}
            onChangeText={(value) => handleInputChange('password', value)}
            secureTextEntry
            required
          />

          <FormTextInput
            title={t('authentication.confirmPassword')}
            placeholder={t('authentication.confirmPasswordPlaceholder')}
            value={formData.confirmPassword}
            onChangeText={(value) => handleInputChange('confirmPassword', value)}
            secureTextEntry
            required
          />
        </VStack>

        <VStack spacing={Spacing.md_16} style={styles.buttonContainer}>
          <PrimaryButton
            title={t('caregiver.registerCaregiver')}
            onPress={handleSubmit}
            loading={loading}
          />

          <SecondaryButton
            title={t('common.cancel')}
            onPress={handleCancel}
          />
        </VStack>
      </ScrollView>
    </SafeAreaView>
  );
};

export default RegisterCaregiverScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Color.Background.subtle,
  },
  keyboardAvoidingView: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
    paddingBottom: Spacing.xl5_64,
  },
  scrollContent: {
    flexGrow: 1,
    ...spacingStyles.screenScrollContainer,
  },
  title: {
    fontSize: FontSize.heading3_24,
    fontFamily: FontFamily.extraBold,
    color: Color.dark,
    textAlign: 'center',
    marginBottom: Spacing.sm_8,
  },
  subtitle: {
    fontSize: FontSize.bodylarge_18,
    fontFamily: FontFamily.regular,
    color: Color.Gray.v500,
    textAlign: 'center',
    marginBottom: Spacing.xl2_40,
  },
  sectionTitle: {
    fontSize: FontSize.subtitle_20,
    fontFamily: FontFamily.semi_bold,
    color: Color.dark,
    marginBottom: -Spacing.md_16,
  },
  form: {
    flex: 1,
  },
  buttonContainer: {
    marginTop: Spacing.xl_32,
  },
});