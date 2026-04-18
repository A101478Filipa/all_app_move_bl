import { useState } from "react";
import { StyleSheet, SafeAreaView, Text, ScrollView, TouchableOpacity, View, Keyboard, TouchableWithoutFeedback } from "react-native";
import { useAuthStore } from "@src/stores/authStore";
import { VStack, Spaced, HStack } from "@components/CoreComponents";
import { Color } from "@src/styles/colors";
import { CustomBackButton } from "@components/CustomBackButton";
import { Spacing } from "@src/styles/spacings";
import { FontFamily, FontSize } from "@src/styles/fonts";
import { PrimaryButton } from "@components/ButtonComponents";
import { MaterialIcons } from '@expo/vector-icons';
import { useTranslation } from '@src/localization/hooks/useTranslation';
import { FloatingLabelInput } from '@components/FloatingLabelInput';
import { AxiosError } from "axios";

const LoginScreen = ({ navigation }) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('1234567a.');
  const [showPassword, setShowPassword] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const { login, loading, error } = useAuthStore();
  const { t } = useTranslation();

  const onLogin = async () => {
    setErrorMessage('');

    const normalizedInput = username.trim().toLowerCase();

    if (!normalizedInput) {
      setErrorMessage(t('authentication.emailOrUsernameRequired'));
      return;
    }

    if (!password.trim()) {
      setErrorMessage(t('authentication.passwordRequired'));
      return;
    }

    try {
      const result = await login({ username: normalizedInput, password });

      if (!result.success) {
        navigation.navigate('CompleteProfile', {
          userId: (result as any).profileData.userId,
          role: (result as any).profileData.role,
          institutionId: (result as any).profileData.institutionId,
          email: (result as any).profileData.email,
          username: (result as any).profileData.username,
          password: password,
        });
        return;
      }
    } catch (error: any) {
      console.error('Login failed:', error);
      setErrorMessage(t('authentication.loginFailed'));
    }
  };

  // TODO: Implement
  const onForgotPassword = () => {}

  const onRegisterNow = () => {
    navigation.replace('Register')
  }

  const toggleShowPassword = () => {
    setShowPassword(!showPassword)
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <VStack style={styles.content} align='flex-start' spacing={Spacing.lg_24}>
        <CustomBackButton navigation={navigation}/>

        <ScrollView style={{flex: 1, alignSelf: 'stretch' }}>
          <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
            <VStack style={{flex: 1, alignSelf: 'stretch' }}>
            <Text style={styles.title}>
              {t('authentication.loginToAccount')}
            </Text>

            <Spaced height={Spacing.xl_32}/>

            <FloatingLabelInput
              label={t('authentication.emailOrUsername')}
              value={username}
              onChangeText={(text) => {
                setUsername(text);
                if (errorMessage) setErrorMessage('');
              }}
              autoCapitalize="none"
              hasError={!!errorMessage}
            />

            <Spaced height={Spacing.md_16}/>

            <View style={styles.passwordContainer}>
              <FloatingLabelInput
                label={t('authentication.password')}
                secureTextEntry={!showPassword}
                value={password}
                onChangeText={(text) => {
                  setPassword(text);
                  if (errorMessage) setErrorMessage('');
                }}
                hasError={!!errorMessage}
              />

              <TouchableOpacity style={styles.showPassword} onPress={toggleShowPassword}>
                {showPassword ? <MaterialIcons
                  name="visibility"
                  size={24}
                  color={Color.Gray.v400}
                /> : <MaterialIcons
                  name="visibility-off"
                  size={24}
                  color={Color.Gray.v400}
                />}
              </TouchableOpacity>
            </View>

            {errorMessage ? (
              <>
                <Spaced height={Spacing.sm_8}/>
                <HStack spacing={Spacing.xs_6} style={styles.errorContainer}>
                  <MaterialIcons name="info-outline" size={16} color={Color.Error.default} />
                  <Text style={styles.errorText}>{errorMessage}</Text>
                </HStack>
              </>
            ) : null}

            <Spaced height={Spacing.xl_32}/>

            <PrimaryButton
              title={loading ? t('authentication.loggingIn') : t('authentication.loginButton')}
              loading={loading}
              onPress={onLogin}
            />

            <Spaced height={Spacing.lg_24}/>

            <TouchableOpacity style={styles.forgotPasswordContainer} onPress={onForgotPassword}>
              <Text style={styles.forgotPassword}>{t('authentication.forgotPassword')}</Text>
            </TouchableOpacity>

            <Spaced height={Spacing.xl_32}/>

            <HStack spacing={Spacing.md_16} style={styles.dividerContainer}>
              <View style={styles.divider} />
              <Text style={styles.dividerText}>{t('common.or')}</Text>
              <View style={styles.divider} />
            </HStack>

            <Spaced height={Spacing.xl_32}/>

            <View style={styles.registerTextContainer}>
              <Text style={styles.registerText}>Don't have an account?</Text>

              <TouchableOpacity onPress={onRegisterNow}>
                <Text style={styles.registerNowText}> Register Now </Text>
              </TouchableOpacity>
            </View>
          </VStack>
          </TouchableWithoutFeedback>
        </ScrollView>
      </VStack>
    </SafeAreaView>
  );
};

export default LoginScreen;

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: Color.Background.subtle,
    alignSelf: 'stretch'
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
    marginRight: Spacing.xl2_40,
    alignSelf: 'flex-start',
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
  passwordContainer: {
    position: 'relative',
    justifyContent: 'center',
    alignSelf: 'stretch',
  },
  showPassword: {
    position: 'absolute',
    alignSelf: 'flex-end',
    paddingRight: Spacing.md_16
  },
  forgotPasswordContainer: {
    alignSelf: 'center',
  },
  forgotPassword: {
    fontFamily: FontFamily.semi_bold,
    fontSize: FontSize.bodysmall_14,
    color: Color.Gray.v400
  },
  dividerContainer: {
    alignItems: 'center',
  },
  divider: {
    flex: 1,
    height: 1,
    backgroundColor: Color.Gray.v300,
  },
  dividerText: {
    fontFamily: FontFamily.semi_bold,
    fontSize: FontSize.bodysmall_14,
    color: Color.Gray.v400,
  },
  registerTextContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    justifyContent: 'center',
  },
  registerText: {
    fontSize: FontSize.bodymedium_16,
    fontFamily: FontFamily.regular,
    lineHeight: FontSize.bodymedium_16,
    textAlign: 'center'
  },
  registerNowText: {
    fontSize: FontSize.bodymedium_16,
    fontFamily: FontFamily.bold,
    lineHeight: FontSize.bodymedium_16,
    color: Color.primary,
    textAlign: 'center'
  }
});