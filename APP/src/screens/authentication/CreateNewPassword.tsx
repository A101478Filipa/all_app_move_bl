import React, { useState } from 'react';
import {
  StyleSheet,
  SafeAreaView,
  Text,
  ScrollView,
  View,
  TouchableOpacity,
  Keyboard,
  TouchableWithoutFeedback,
} from 'react-native';
import { useTranslation } from '@src/localization/hooks/useTranslation';
import { VStack, Spaced, HStack } from '@components/CoreComponents';
import { Color } from '@src/styles/colors';
import { CustomBackButton } from '@components/CustomBackButton';
import { Spacing } from '@src/styles/spacings';
import { FontFamily, FontSize } from '@src/styles/fonts';
import { PrimaryButton } from '@components/ButtonComponents';
import { FloatingLabelInput } from '@components/FloatingLabelInput';
import { MaterialIcons } from '@expo/vector-icons';
import { authApi } from '@src/api/endpoints/auth';

const CreateNewPasswordScreen = ({ navigation, route }) => {
  const { t } = useTranslation();
  const { email } = route.params || {};

  const [otp, setOtp] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [success, setSuccess] = useState(false);

  const handleReset = async () => {
    setErrorMessage('');

    if (!otp.trim()) {
      setErrorMessage(t('authentication.resetCodeRequired'));
      return;
    }

    if (!newPassword.trim()) {
      setErrorMessage(t('authentication.passwordRequired'));
      return;
    }

    if (newPassword.length < 6) {
      setErrorMessage(t('authentication.passwordTooShort'));
      return;
    }

    if (newPassword !== confirmPassword) {
      setErrorMessage(t('authentication.passwordsDoNotMatch'));
      return;
    }

    setLoading(true);

    try {
      await authApi.resetPassword({ email, otp: otp.trim(), newPassword });
      setSuccess(true);
    } catch (error: any) {
      console.error('Reset password error:', error);
      const serverMessage = error.response?.data?.message;
      if (serverMessage) {
        setErrorMessage(serverMessage);
      } else {
        setErrorMessage(t('authentication.connectionError'));
      }
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <VStack style={styles.content} align="center" spacing={Spacing.lg_24}>
          <MaterialIcons name="check-circle" size={72} color={Color.primary} />
          <Text style={styles.successTitle}>{t('authentication.passwordResetSuccess')}</Text>
          <Text style={styles.successSubtitle}>{t('authentication.passwordResetSuccessSubtitle')}</Text>
          <Spaced height={Spacing.xl_32} />
          <PrimaryButton
            title={t('authentication.loginButton')}
            onPress={() => navigation.navigate('Login')}
          />
        </VStack>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <VStack style={styles.content} align="flex-start" spacing={Spacing.lg_24}>
        <CustomBackButton navigation={navigation} />

        <ScrollView style={{ flex: 1, alignSelf: 'stretch' }}>
          <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
            <VStack style={{ flex: 1, alignSelf: 'stretch' }}>
              <Text style={styles.title}>{t('authentication.createNewPasswordTitle')}</Text>

              <Spaced height={Spacing.sm_8} />

              <Text style={styles.subtitle}>{t('authentication.createNewPasswordSubtitle')}</Text>

              <Spaced height={Spacing.xl_32} />

              <FloatingLabelInput
                label={t('authentication.resetCode')}
                value={otp}
                onChangeText={(text) => {
                  setOtp(text);
                  if (errorMessage) setErrorMessage('');
                }}
                keyboardType="number-pad"
                autoCapitalize="none"
                hasError={!!errorMessage}
                editable={!loading}
              />

              <Spaced height={Spacing.md_16} />

              <View style={styles.passwordContainer}>
                <FloatingLabelInput
                  label={t('authentication.password')}
                  value={newPassword}
                  secureTextEntry={!showPassword}
                  onChangeText={(text) => {
                    setNewPassword(text);
                    if (errorMessage) setErrorMessage('');
                  }}
                  hasError={!!errorMessage}
                  editable={!loading}
                />
                <TouchableOpacity style={styles.showPasswordIcon} onPress={() => setShowPassword(!showPassword)}>
                  <MaterialIcons
                    name={showPassword ? 'visibility' : 'visibility-off'}
                    size={24}
                    color={Color.Gray.v400}
                  />
                </TouchableOpacity>
              </View>

              <Spaced height={Spacing.md_16} />

              <View style={styles.passwordContainer}>
                <FloatingLabelInput
                  label={t('authentication.confirmPassword')}
                  value={confirmPassword}
                  secureTextEntry={!showConfirmPassword}
                  onChangeText={(text) => {
                    setConfirmPassword(text);
                    if (errorMessage) setErrorMessage('');
                  }}
                  hasError={!!errorMessage}
                  editable={!loading}
                />
                <TouchableOpacity style={styles.showPasswordIcon} onPress={() => setShowConfirmPassword(!showConfirmPassword)}>
                  <MaterialIcons
                    name={showConfirmPassword ? 'visibility' : 'visibility-off'}
                    size={24}
                    color={Color.Gray.v400}
                  />
                </TouchableOpacity>
              </View>

              {errorMessage ? (
                <>
                  <Spaced height={Spacing.sm_8} />
                  <HStack spacing={Spacing.xs_6} style={styles.errorContainer}>
                    <MaterialIcons name="info-outline" size={16} color={Color.Error.default} />
                    <Text style={styles.errorText}>{errorMessage}</Text>
                  </HStack>
                </>
              ) : null}

              <Spaced height={Spacing.xl_32} />

              <PrimaryButton
                title={loading ? t('authentication.resettingPassword') : t('authentication.resetPasswordButton')}
                loading={loading}
                onPress={handleReset}
              />
            </VStack>
          </TouchableWithoutFeedback>
        </ScrollView>
      </VStack>
    </SafeAreaView>
  );
};

export default CreateNewPasswordScreen;

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: Color.Background.subtle,
    alignSelf: 'stretch',
  },
  content: {
    flex: 1,
    paddingHorizontal: Spacing.lg_24,
    top: Spacing.lg_24,
    alignSelf: 'stretch',
  },
  title: {
    fontFamily: FontFamily.bold,
    fontSize: FontSize.heading1_32,
    color: Color.dark,
    flexShrink: 1,
  },
  subtitle: {
    fontFamily: FontFamily.regular,
    fontSize: FontSize.bodymedium_16,
    color: Color.gray1,
  },
  passwordContainer: {
    position: 'relative',
    alignSelf: 'stretch',
  },
  showPasswordIcon: {
    position: 'absolute',
    right: Spacing.md_16,
    top: '50%',
    transform: [{ translateY: -12 }],
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
  successTitle: {
    fontFamily: FontFamily.bold,
    fontSize: FontSize.heading2_28,
    color: Color.dark,
    textAlign: 'center',
  },
  successSubtitle: {
    fontFamily: FontFamily.regular,
    fontSize: FontSize.bodymedium_16,
    color: Color.gray1,
    textAlign: 'center',
  },
});
