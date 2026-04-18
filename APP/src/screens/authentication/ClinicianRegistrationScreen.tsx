import { useState } from "react";
import { StyleSheet, SafeAreaView, Text, ScrollView, TouchableOpacity, View, Keyboard, TouchableWithoutFeedback } from "react-native";
import { VStack, Spaced, HStack } from "@components/CoreComponents";
import { Color } from "@src/styles/colors";
import { CustomBackButton } from "@components/CustomBackButton";
import { Spacing } from "@src/styles/spacings";
import { FontFamily, FontSize } from "@src/styles/fonts";
import { PrimaryButton } from "@components/ButtonComponents";
import { MaterialIcons } from '@expo/vector-icons';
import { useTranslation } from '@src/localization/hooks/useTranslation';
import { FloatingLabelInput } from '@components/FloatingLabelInput';
import { authApi } from '@src/api/endpoints/auth';
import { UserRole } from 'moveplus-shared';

const ClinicianRegistrationScreen = ({ navigation }) => {
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const { t } = useTranslation();

  const handleRegister = async () => {
    setErrorMessage('');

    // Validation
    if (!username.trim()) {
      setErrorMessage(t('authentication.usernameRequired'));
      return;
    }

    if (!email.trim()) {
      setErrorMessage(t('authentication.emailRequired'));
      return;
    }

    if (!password.trim()) {
      setErrorMessage(t('authentication.passwordRequired'));
      return;
    }

    if (!confirmPassword.trim()) {
      setErrorMessage(t('authentication.confirmPasswordRequired'));
      return;
    }

    if (password !== confirmPassword) {
      setErrorMessage(t('authentication.passwordsMismatch'));
      return;
    }

    setLoading(true);

    try {
      const isAvailable = await checkAvailability();

      if (!isAvailable) {
        setLoading(false);
        return;
      }

      const response = await authApi.registerClinicianSelf({ username, email, password });
      const userId = response.data.userId;

      navigation.navigate('CompleteProfile', {
        userId,
        role: UserRole.CLINICIAN,
        institutionId: undefined,
        email,
        username,
        password,
      });
    } catch (error) {
      console.error('Registration error:', error);
      setErrorMessage(t('authentication.registrationError'));
    } finally {
      setLoading(false);
    }
  };

  const checkAvailability = async (): Promise<boolean> => {
    try {
      const usernameResponse = await authApi.checkUsername(username);
      const emailResponse = await authApi.checkEmail(email);

      if (!usernameResponse.data.available) {
        setErrorMessage(t('authentication.usernameTaken'));
        return false;
      }

      if (!emailResponse.data.available) {
        setErrorMessage(t('authentication.emailTaken'));
        return false;
      }

      return true;
    } catch (error: any) {
      console.error('Availability check error:', error);

      if (error.response?.data?.message) {
        setErrorMessage(error.response.data.message);
      } else {
        setErrorMessage(t('authentication.connectionError'));
      }
      return false;
    }
  };

  const onLoginNow = () => {
    navigation.replace('Login');
  };

  const toggleShowPassword = () => {
    setShowPassword(!showPassword);
  };

  const toggleShowConfirmPassword = () => {
    setShowConfirmPassword(!showConfirmPassword);
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <VStack style={styles.content} align='flex-start' spacing={Spacing.lg_24}>
        <CustomBackButton navigation={navigation}/>

        <ScrollView style={{flex: 1, alignSelf: 'stretch' }}>
          <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
            <VStack style={{flex: 1, alignSelf: 'stretch' }}>
              <Text style={styles.title}>
                {t('authentication.createClinicianAccount')}
              </Text>

              <Spaced height={Spacing.xl_32}/>

              <FloatingLabelInput
                label={t('authentication.username')}
                value={username}
                onChangeText={(text) => {
                  setUsername(text);
                  if (errorMessage) setErrorMessage('');
                }}
                hasError={!!errorMessage}
                autoCapitalize="none"
              />

              <Spaced height={Spacing.md_16}/>

              <FloatingLabelInput
                label={t('authentication.email')}
                value={email}
                onChangeText={(text) => {
                  setEmail(text);
                  if (errorMessage) setErrorMessage('');
                }}
                hasError={!!errorMessage}
                keyboardType="email-address"
                autoCapitalize="none"
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

              <Spaced height={Spacing.md_16}/>

              <View style={styles.passwordContainer}>
                <FloatingLabelInput
                  label={t('authentication.confirmPassword')}
                  secureTextEntry={!showConfirmPassword}
                  value={confirmPassword}
                  onChangeText={(text) => {
                    setConfirmPassword(text);
                    if (errorMessage) setErrorMessage('');
                  }}
                  hasError={!!errorMessage}
                />

                <TouchableOpacity style={styles.showPassword} onPress={toggleShowConfirmPassword}>
                  {showConfirmPassword ? <MaterialIcons
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

              <Spaced height={Spacing.xl2_40}/>

              <PrimaryButton
                title={loading ? t('authentication.registering') : t('authentication.registerButton')}
                loading={loading}
                onPress={handleRegister}
              />

              <Spaced height={Spacing.xl_32}/>

              <View style={styles.loginTextContainer}>
                <Text style={styles.loginText}>{t('authentication.alreadyHaveAccount')}</Text>

                <TouchableOpacity onPress={onLoginNow}>
                  <Text style={styles.loginNowText}> {t('authentication.loginNow')} </Text>
                </TouchableOpacity>
              </View>
            </VStack>
          </TouchableWithoutFeedback>
        </ScrollView>
      </VStack>
    </SafeAreaView>
  );
};

export default ClinicianRegistrationScreen;

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
  loginTextContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    justifyContent: 'center',
  },
  loginText: {
    fontSize: FontSize.bodymedium_16,
    fontFamily: FontFamily.regular,
    lineHeight: FontSize.bodymedium_16,
    textAlign: 'center'
  },
  loginNowText: {
    fontSize: FontSize.bodymedium_16,
    fontFamily: FontFamily.bold,
    lineHeight: FontSize.bodymedium_16,
    color: Color.primary,
    textAlign: 'center'
  }
});
