import { useState } from "react";
import { StyleSheet, SafeAreaView, Text, ScrollView } from "react-native";
import { VStack, HStack } from "@components/CoreComponents";
import { Color } from "@src/styles/colors";
import { Spacing } from "@src/styles/spacings";
import { FontFamily, FontSize } from "@src/styles/fonts";
import { PrimaryButton } from "@components/ButtonComponents";
import { MaterialIcons } from '@expo/vector-icons';
import { useTranslation } from '@src/localization/hooks/useTranslation';
import { FloatingLabelInput } from '@components/FloatingLabelInput';
import { GenderDropdown } from '@components/GenderDropdown';
import { DatePickerInput } from '@components/DatePickerInput';
import { authApi } from '@src/api/endpoints/auth';
import { useAuthStore } from '@src/stores/authStore';
import { UserRole } from 'moveplus-shared';

interface CompleteProfileScreenProps {
  navigation: any;
  route: {
    params: {
      userId: number;
      role: UserRole;
      institutionId?: number;
      email: string;
      username: string;
      password: string;
    };
  };
}

const CompleteProfileScreen = ({ navigation, route }: CompleteProfileScreenProps) => {
  const { userId, role, institutionId, email, username, password } = route.params;
  const { t } = useTranslation();
  const { login } = useAuthStore();

  const [name, setName] = useState('');
  const [birthDate, setBirthDate] = useState<Date>(new Date(2000, 0, 1));
  const [gender, setGender] = useState<'MALE' | 'FEMALE' | 'OTHER' | ''>('');
  const [medicalId, setMedicalId] = useState('');
  const [phone, setPhone] = useState('');
  const [address, setAddress] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [loading, setLoading] = useState(false);

  const genderOptions = [
    { label: t('authentication.male'), value: 'MALE' as const },
    { label: t('authentication.female'), value: 'FEMALE' as const },
    { label: t('gender.other'), value: 'OTHER' as const },
  ];

  const handleGenderChange = (value: 'MALE' | 'FEMALE' | 'OTHER') => {
    setGender(value);
  };

  const handleComplete = async () => {
    setErrorMessage('');

    if (!name.trim()) {
      setErrorMessage(t('authentication.nameRequired'));
      return;
    }

    if (!gender) {
      setErrorMessage(t('authentication.genderRequired'));
      return;
    }

    if (role === UserRole.ELDERLY && !medicalId.trim()) {
      setErrorMessage(t('authentication.medicalIdRequired'));
      return;
    }

    setLoading(true);

    try {
      const profileData: any = {
        userId,
        institutionId,
        name: name.trim(),
        birthDate: birthDate.toISOString(),
        gender,
        email,
      };

      if (role === UserRole.ELDERLY) {
        profileData.medicalId = parseInt(medicalId);
        profileData.phone = phone.trim() || undefined;
        profileData.address = address.trim() || undefined;
      } else if (role === UserRole.CAREGIVER) {
        profileData.phone = phone.trim() || undefined;
      } else if (role === UserRole.INSTITUTION_ADMIN) {
        profileData.phoneNumber = phone.trim() || undefined;
      } else if (role === UserRole.CLINICIAN) {
        profileData.phone = phone.trim() || undefined;
      }

      await authApi.completeProfile({
        role,
        profileData,
      });

      // Use email for login since it is always stored lowercase,
      // avoiding any username-case mismatch issues
      const loginResult = await login({ username: email, password });
      if (!loginResult.success) {
        // Profile incomplete state after just completing — something went wrong
        throw new Error('Login after profile completion failed');
      }

    } catch (error: any) {
      console.error('Complete profile error:', error);

      if (error.response?.data?.message) {
        setErrorMessage(error.response.data.message);
      } else if (error.message?.includes('network') || error.message?.includes('Network')) {
        setErrorMessage(t('authentication.connectionError'));
      } else {
        setErrorMessage(t('authentication.profileCompletionFailed'));
      }
    } finally {
      setLoading(false);
    }
  };

  const getRoleTitle = () => {
    switch (role) {
      case UserRole.ELDERLY:
        return t('authentication.completeElderlyProfile');
      case UserRole.CAREGIVER:
        return t('authentication.completeCaregiverProfile');
      case UserRole.INSTITUTION_ADMIN:
        return t('authentication.completeAdminProfile');
      case UserRole.CLINICIAN:
        return t('authentication.completeClinicianProfile');
      default:
        return t('authentication.completeProfile');
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <VStack style={styles.content} align='flex-start' spacing={Spacing.lg_24}>
        <ScrollView style={{ flex: 1, alignSelf: 'stretch' }} showsVerticalScrollIndicator={false}>
          <VStack spacing={Spacing.md_16} style={{ alignSelf: 'stretch', paddingBottom: Spacing.xl_32 }}>
            <Text style={styles.title}>{getRoleTitle()}</Text>
            <Text style={styles.description}>{t('authentication.completeProfileDescription')}</Text>

            <FloatingLabelInput
              label={t('authentication.fullName')}
              value={name}
              onChangeText={setName}
              autoCapitalize="words"
              hasError={!!errorMessage}
            />

            {/* Birth Date Picker */}
            <DatePickerInput
              label={t('authentication.birthDate')}
              value={birthDate}
              onChange={setBirthDate}
              hasError={!!errorMessage}
              maximumDate={new Date()}
              minimumDate={new Date(1900, 0, 1)}
            />

            {/* Gender Selection */}
            <GenderDropdown
              label={t('authentication.gender')}
              value={gender}
              onValueChange={handleGenderChange}
              options={genderOptions}
              hasError={!!errorMessage && !gender}
            />

            {/* Role-specific fields */}
            {role === UserRole.ELDERLY && (
              <>
                <FloatingLabelInput
                  label={t('authentication.medicalId')}
                  value={medicalId}
                  onChangeText={setMedicalId}
                  keyboardType="numeric"
                  hasError={!!errorMessage}
                />
                <FloatingLabelInput
                  label={t('authentication.phoneOptional')}
                  value={phone}
                  onChangeText={setPhone}
                  keyboardType="phone-pad"
                />
                <FloatingLabelInput
                  label={t('authentication.addressOptional')}
                  value={address}
                  onChangeText={setAddress}
                  autoCapitalize="words"
                  multiline
                  numberOfLines={3}
                />
              </>
            )}

            {(role === UserRole.CAREGIVER || role === UserRole.INSTITUTION_ADMIN || role === UserRole.CLINICIAN) && (
              <FloatingLabelInput
                label={t('authentication.phoneOptional')}
                value={phone}
                onChangeText={setPhone}
                keyboardType="phone-pad"
              />
            )}

            {errorMessage ? (
              <HStack spacing={Spacing.xs_4} style={styles.errorContainer}>
                <MaterialIcons name="info-outline" size={16} color={Color.Error.default} />
                <Text style={styles.errorText}>{errorMessage}</Text>
              </HStack>
            ) : null}

            <PrimaryButton
              title={t('authentication.completeRegistration')}
              onPress={handleComplete}
              disabled={loading}
              loading={loading}
              style={styles.button}
            />
          </VStack>
        </ScrollView>
      </VStack>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Color.white,
  },
  content: {
    paddingHorizontal: Spacing.lg_24,
    flex: 1,
    alignSelf: 'stretch',
  },
  title: {
    fontFamily: FontFamily.extraBold,
    fontSize: FontSize.heading3_24,
    color: Color.black,
    marginTop: Spacing.lg_24,
  },
  description: {
    fontFamily: FontFamily.regular,
    fontSize: FontSize.bodymedium_16,
    color: Color.Gray.v400,
    marginBottom: Spacing.sm_8,
  },
  errorContainer: {
    alignItems: 'center',
    paddingLeft: Spacing.sm_8,
  },
  errorText: {
    color: Color.Error.default,
    fontFamily: FontFamily.medium,
    fontSize: FontSize.bodysmall_14,
    flex: 1,
  },
  button: {
    marginTop: Spacing.sm_8,
  },
});

export { CompleteProfileScreen };
