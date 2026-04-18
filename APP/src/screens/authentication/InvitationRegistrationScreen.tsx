import { useState } from "react";
import { StyleSheet, SafeAreaView, Text, ScrollView, View, Keyboard, TouchableWithoutFeedback, TouchableOpacity } from "react-native";
import { VStack, Spaced, HStack } from "@components/CoreComponents";
import { Color } from "@src/styles/colors";
import { CustomBackButton } from "@components/CustomBackButton";
import { Spacing } from "@src/styles/spacings";
import { FontFamily, FontSize } from "@src/styles/fonts";
import { PrimaryButton } from "@components/ButtonComponents";
import { MaterialIcons } from '@expo/vector-icons';
import { useTranslation } from '@src/localization/hooks/useTranslation';
import { FloatingLabelInput } from '@components/FloatingLabelInput';
import { invitationsApi } from '@src/api/endpoints/invitations';
import { authApi } from '@src/api/endpoints/auth';

interface InvitationData {
  email: string;
  role: string;
  institutionName?: string;
  invitationId: string;
}

const InvitationRegistrationScreen = ({ navigation }) => {
  const [invitationCode, setInvitationCode] = useState('');
  const [validating, setValidating] = useState(false);
  const [invitationData, setInvitationData] = useState<InvitationData | null>(null);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const { t } = useTranslation();

  const validateInvitation = async () => {
    setErrorMessage('');

    if (!invitationCode.trim()) {
      setErrorMessage(t('authentication.invitationCode'));
      return;
    }

    setValidating(true);

    try {
      const response = await invitationsApi.validateInvitation(invitationCode);

      setInvitationData({
        email: response.data.email,
        role: response.data.role,
        institutionName: response.data.institutionName,
        invitationId: response.data.id
      });
    } catch (error: any) {
      console.error('Invitation validation error:', error);

      if (error.response?.status === 404) {
        setErrorMessage(t('authentication.invalidInvitationCode'));
      } else if (error.response?.data?.message?.includes('expired')) {
        setErrorMessage(t('authentication.invitationExpired'));
      } else if (error.response?.data?.message?.includes('already been used')) {
        setErrorMessage(t('authentication.invitationAlreadyUsed'));
      } else {
        setErrorMessage(t('authentication.connectionError'));
      }
    } finally {
      setValidating(false);
    }
  };

  const handleRegister = async () => {
    if (!invitationData) return;

    const normalizedUsername = username.trim().toLowerCase();

    if (!normalizedUsername) {
      setErrorMessage(t('authentication.usernameRequired'));
      return;
    }

    if (normalizedUsername.length < 3) {
      setErrorMessage(t('authentication.usernameTooShort'));
      return;
    }

    if (!password.trim()) {
      setErrorMessage(t('authentication.passwordRequired'));
      return;
      return;
    }

    if (password.length < 6) {
      setErrorMessage(t('authentication.passwordTooShort'));
      return;
    }

    if (password !== confirmPassword) {
      setErrorMessage(t('authentication.passwordsDoNotMatch'));
      return;
    }

    setLoading(true);
    setErrorMessage('');

    try {
      const usernameCheckResponse = await authApi.checkUsername(normalizedUsername);

      if (!usernameCheckResponse.data.available) {
        setErrorMessage(t('authentication.usernameAlreadyTaken'));
        setLoading(false);
        return;
      }

      const response = await invitationsApi.acceptInvitation(invitationCode, {
        username: normalizedUsername,
        password
      });

      navigation.navigate('CompleteProfile', {
        userId: response.data.user.id,
        role: response.data.user.role,
        institutionId: response.data.institutionId,
        email: response.data.email,
        username: normalizedUsername,
        password,
      });

    } catch (error: any) {
      console.error('Registration error:', error);

      if (error.response?.data?.message) {
        setErrorMessage(error.response.data.message);
      } else if (error.message?.includes('network') || error.message?.includes('Network')) {
        setErrorMessage(t('authentication.connectionError'));
      } else {
        setErrorMessage(t('authentication.registrationFailed'));
      }
    } finally {
      setLoading(false);
    }
  };

  const renderInvitationForm = () => (
    <VStack spacing={Spacing.md_16} style={{ alignSelf: 'stretch' }}>
      <Text style={styles.title}>{t('authentication.haveInvitationCode')}</Text>
      <Text style={styles.description}>{t('authentication.invitationCodeDescription')}</Text>

      <FloatingLabelInput
        label={t('authentication.invitationCode')}
        value={invitationCode}
        onChangeText={setInvitationCode}
        autoCapitalize="characters"
        hasError={!!errorMessage}
      />

      {errorMessage ? (
        <HStack spacing={Spacing.xs_4} style={styles.errorContainer}>
          <MaterialIcons name="info-outline" size={16} color={Color.Error.default} />
          <Text style={styles.errorText}>{errorMessage}</Text>
        </HStack>
      ) : null}

      <PrimaryButton
        title={t('authentication.validateInvitation')}
        onPress={validateInvitation}
        disabled={validating}
        loading={validating}
        style={styles.button}
      />
    </VStack>
  );

  const renderRegistrationForm = () => (
    <VStack spacing={Spacing.md_16} style={{ alignSelf: 'stretch' }}>
      <Text style={styles.title}>{t('authentication.completeInvitation')}</Text>

      {/* Read-only invitation details */}
      <VStack spacing={Spacing.sm_8} style={{ alignSelf: 'stretch' }}>
        <View style={styles.infoCard}>
          <Text style={styles.infoLabel}>{t('authentication.email')}</Text>
          <Text style={styles.infoValue}>{invitationData?.email}</Text>
        </View>

        {invitationData?.institutionName && (
          <View style={styles.infoCard}>
            <Text style={styles.infoLabel}>{t('authentication.institutionName')}</Text>
            <Text style={styles.infoValue}>{invitationData.institutionName}</Text>
          </View>
        )}
      </VStack>

      <Text style={styles.sectionTitle}>{t('authentication.setYourPassword')}</Text>

      <FloatingLabelInput
        label={t('authentication.username')}
        value={username}
        onChangeText={(text) => setUsername(text)}
        autoCapitalize="none"
        hasError={!!errorMessage}
      />

      <View style={styles.passwordContainer}>
        <FloatingLabelInput
          label={t('authentication.password')}
          value={password}
          onChangeText={setPassword}
          secureTextEntry={!showPassword}
          autoCapitalize="none"
          hasError={!!errorMessage}
        />
        <TouchableOpacity style={styles.showPassword} onPress={() => setShowPassword(!showPassword)}>
          <MaterialIcons
            name={showPassword ? 'visibility' : 'visibility-off'}
            size={24}
            color={Color.Gray.v400}
          />
        </TouchableOpacity>
      </View>

      <View style={styles.passwordContainer}>
        <FloatingLabelInput
          label={t('authentication.confirmPassword')}
          value={confirmPassword}
          onChangeText={setConfirmPassword}
          secureTextEntry={!showConfirmPassword}
          autoCapitalize="none"
          hasError={!!errorMessage}
        />
        <TouchableOpacity style={styles.showPassword} onPress={() => setShowConfirmPassword(!showConfirmPassword)}>
          <MaterialIcons
            name={showConfirmPassword ? 'visibility' : 'visibility-off'}
            size={24}
            color={Color.Gray.v400}
          />
        </TouchableOpacity>
      </View>

      {errorMessage ? (
        <HStack spacing={Spacing.xs_4} style={styles.errorContainer}>
          <MaterialIcons name="info-outline" size={16} color={Color.Error.default} />
          <Text style={styles.errorText}>{errorMessage}</Text>
        </HStack>
      ) : null}

      <PrimaryButton
        title={t('authentication.registerButton')}
        onPress={handleRegister}
        disabled={loading}
        loading={loading}
        style={styles.button}
      />
    </VStack>
  );

  return (
    <SafeAreaView style={styles.container}>
      <VStack style={styles.content} align='flex-start' spacing={Spacing.lg_24}>
        <CustomBackButton navigation={navigation} />
        <ScrollView
          style={{flex: 1, alignSelf: 'stretch' }}
          contentContainerStyle={{ flex: 1 }}
          keyboardDismissMode='interactive'
          automaticallyAdjustKeyboardInsets={true}
          showsVerticalScrollIndicator={false}
        >
          <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
            <VStack style={{flex: 1, alignSelf: 'stretch' }}>
              {invitationData ? renderRegistrationForm() : renderInvitationForm()}
            </VStack>
          </TouchableWithoutFeedback>
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
    marginBottom: Spacing.xs_4,
  },
  description: {
    fontFamily: FontFamily.regular,
    fontSize: FontSize.bodymedium_16,
    color: Color.Gray.v400,
    marginBottom: Spacing.md_16,
  },
  sectionTitle: {
    fontFamily: FontFamily.semi_bold,
    fontSize: FontSize.subtitle_20,
    color: Color.black,
    marginTop: Spacing.sm_8,
  },
  infoCard: {
    backgroundColor: Color.Background.muted,
    padding: Spacing.md_16,
    borderRadius: Spacing.sm_8,
    borderWidth: 1,
    borderColor: Color.Gray.v200,
    alignSelf: 'stretch',
  },
  infoLabel: {
    fontFamily: FontFamily.medium,
    fontSize: FontSize.bodysmall_14,
    color: Color.Gray.v400,
    marginBottom: Spacing.xs_4,
  },
  infoValue: {
    fontFamily: FontFamily.semi_bold,
    fontSize: FontSize.bodymedium_16,
    color: Color.black,
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

export { InvitationRegistrationScreen };
