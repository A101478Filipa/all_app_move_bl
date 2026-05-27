import React, { useState } from 'react';
import {
  StyleSheet,
  SafeAreaView,
  Text,
  ScrollView,
  View,
  Keyboard,
  TouchableWithoutFeedback,
} from 'react-native';
import { useTranslation } from '@src/localization/hooks/useTranslation';
import { VStack, Spaced } from '@components/CoreComponents';
import { Color } from '@src/styles/colors';
import { CustomBackButton } from '@components/CustomBackButton';
import { Spacing } from '@src/styles/spacings';
import { FontFamily, FontSize } from '@src/styles/fonts';
import { PrimaryButton } from '@components/ButtonComponents';
import { FloatingLabelInput } from '@components/FloatingLabelInput';
import { MaterialIcons } from '@expo/vector-icons';
import { HStack } from '@components/CoreComponents';
import { authApi } from '@src/api/endpoints/auth';

const ForgotPasswordScreen = ({ navigation }) => {
  const { t } = useTranslation();
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  const handleSendCode = async () => {
    setErrorMessage('');
    const trimmedEmail = email.trim().toLowerCase();

    if (!trimmedEmail) {
      setErrorMessage(t('authentication.emailRequired'));
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(trimmedEmail)) {
      setErrorMessage(t('authentication.invalidEmail'));
      return;
    }

    setLoading(true);

    try {
      await authApi.forgotPassword({ email: trimmedEmail });
      navigation.navigate('CreateNewPassword', { email: trimmedEmail });
    } catch (error: any) {
      console.error('Forgot password error:', error);
      setErrorMessage(t('authentication.connectionError'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <VStack style={styles.content} align="flex-start" spacing={Spacing.lg_24}>
        <CustomBackButton navigation={navigation} />

        <ScrollView style={{ flex: 1, alignSelf: 'stretch' }}>
          <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
            <VStack style={{ flex: 1, alignSelf: 'stretch' }}>
              <Text style={styles.title}>{t('authentication.forgotPasswordTitle')}</Text>

              <Spaced height={Spacing.sm_8} />

              <Text style={styles.subtitle}>{t('authentication.forgotPasswordSubtitle')}</Text>

              <Spaced height={Spacing.xl_32} />

              <FloatingLabelInput
                label={t('authentication.email')}
                value={email}
                onChangeText={(text) => {
                  setEmail(text);
                  if (errorMessage) setErrorMessage('');
                }}
                keyboardType="email-address"
                autoCapitalize="none"
                hasError={!!errorMessage}
                editable={!loading}
              />

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
                title={loading ? t('authentication.sendingCode') : t('authentication.sendCode')}
                loading={loading}
                onPress={handleSendCode}
              />
            </VStack>
          </TouchableWithoutFeedback>
        </ScrollView>
      </VStack>
    </SafeAreaView>
  );
};

export default ForgotPasswordScreen;

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
});
