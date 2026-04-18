import React, { useState } from 'react';
import {
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  Share,
  Clipboard,
  SafeAreaView,
  Keyboard,
  TouchableWithoutFeedback,
} from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { CreateInvitationRequest, UserRole } from 'moveplus-shared';
import { Color } from '@src/styles/colors';
import { FontFamily, FontSize } from '@src/styles/fonts';
import { Spacing, spacingStyles } from '@src/styles/spacings';
import { VStack, HStack, Spaced } from '@components/CoreComponents';
import { PrimaryButton } from '@components/ButtonComponents';
import { FloatingLabelInput } from '@components/FloatingLabelInput';
import { useTranslation } from 'react-i18next';
import { invitationsApi } from '@api/endpoints/invitations';
import { useAuthStore } from '@src/stores';
import { Border } from '@src/styles/borders';
import { shadowStyles } from '@src/styles/shadow';
import { MaterialIcons } from '@expo/vector-icons';
import { useToast } from '@src/providers/ToastProvider';

type GenerateInvitationScreenProps = NativeStackScreenProps<any, 'GenerateInvitation'>;

const GenerateInvitationScreen: React.FC<GenerateInvitationScreenProps> = ({ navigation, route }) => {
  const { institutionId, institutionName, invitedRole } = route.params;
  const { t } = useTranslation();
  const [loading, setLoading] = useState(false);
  const [email, setEmail] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [generatedInvitation, setGeneratedInvitation] = useState<{
    token: string;
    email: string;
    expiresAt: string;
  } | null>(null);
  const { user } = useAuthStore();
  const { showSuccess } = useToast();

  const getDescriptionKey = (): string => {
    switch (invitedRole) {
      case UserRole.ELDERLY:
        return 'invitation.generateDescription';
      case UserRole.CAREGIVER:
        return 'invitation.generateCaregiverDescription';
      case UserRole.CLINICIAN:
        return 'invitation.generateClinicianDescription';
      case UserRole.INSTITUTION_ADMIN:
        return 'invitation.adminInvitationInfo';
      default:
        return 'invitation.generateDescription';
    }
  };

  const validateEmail = (email: string): boolean => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const handleGenerate = async () => {
    setErrorMessage('');

    if (!email.trim()) {
      setErrorMessage(t('authentication.emailRequired'));
      return;
    }

    if (!validateEmail(email)) {
      setErrorMessage(t('authentication.invalidEmail'));
      return;
    }

    if (!user?.user?.id) {
      setErrorMessage(t('errors.unauthorized'));
      return;
    }

    setLoading(true);

    try {
      const invitationData: CreateInvitationRequest = {
        email: email.toLowerCase().trim(),
        role: invitedRole,
        institutionId: institutionId,
        invitedById: user.user.id,
        expiresInDays: 7,
      };

      const response = await invitationsApi.createInvitation(invitationData);

      setGeneratedInvitation({
        token: response.data.token,
        email: response.data.email,
        expiresAt: response.data.expiresAt,
      });

      setEmail('');
    } catch (error: any) {
      console.error('Generate invitation error:', error);

      if (error.response?.data?.message) {
        setErrorMessage(error.response.data.message);
      } else if (error.message?.includes('network') || error.message?.includes('Network')) {
        setErrorMessage(t('authentication.connectionError'));
      } else {
        setErrorMessage(t('errors.genericError'));
      }
    } finally {
      setLoading(false);
    }
  };

  const handleCopyToken = async () => {
    if (generatedInvitation) {
      Clipboard.setString(generatedInvitation.token);
      showSuccess(t('invitation.codeCopied'));
    }
  };

  const handleShare = async () => {
    if (generatedInvitation) {
      try {
        const expiresDate = new Date(generatedInvitation.expiresAt).toLocaleDateString();
        let message = `${t('invitation.shareMessage')}:\n\n${generatedInvitation.token}\n\n${t('invitation.expiresOn')}: ${expiresDate}\n\n${t('invitation.sentTo')}: ${generatedInvitation.email}`;

        if (institutionName) {
          message = `${t('invitation.shareMessage', { institutionName, token: generatedInvitation.token })}\n\n${t('invitation.expiresOn')}: ${expiresDate}\n\n${t('invitation.sentTo')}: ${generatedInvitation.email}`;
        }

        await Share.share({
          message,
        });
      } catch (error) {
        console.error('Share error:', error);
      }
    }
  };

  const formatExpirationDate = (dateString: string): string => {
    const date = new Date(dateString);
    return date.toLocaleDateString(undefined, {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        style={styles.content}
      >
        <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
          <VStack style={{ flex: 1, alignSelf: 'stretch' }}>
            <Text style={styles.description}>
              {t(getDescriptionKey())}
            </Text>

            <Spaced height={Spacing.xl_32} />

            {!generatedInvitation ? (
              <>
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
                  editable={!loading}
                />

                <Spaced height={Spacing.sm_8} />

                <Text style={styles.helperText}>
                  {t('invitation.emailHelper')}
                </Text>

                {errorMessage ? (
                  <>
                    <Spaced height={Spacing.md_16} />
                    <HStack spacing={Spacing.xs_6} style={styles.errorContainer}>
                      <MaterialIcons name="info-outline" size={16} color={Color.Error.default} />
                      <Text style={styles.errorText}>{errorMessage}</Text>
                    </HStack>
                  </>
                ) : null}

                <Spaced height={Spacing.xl2_40} />

                <PrimaryButton
                  title={loading ? t('common.generating') : t('invitation.generateCode')}
                  loading={loading}
                  onPress={handleGenerate}
                />
              </>
            ) : (
              <>
                <View style={styles.successCard}>
                  <View style={styles.successIconContainer}>
                    <MaterialIcons name="check-circle" size={48} color={Color.Cyan.v400} />
                  </View>

                  <Spaced height={Spacing.md_16} />

                  <Text style={styles.successTitle}>
                    {t('invitation.codeGenerated')}
                  </Text>

                  <Spaced height={Spacing.sm_8} />

                  <Text style={styles.successSubtitle}>
                    {t('invitation.sentTo')}: {generatedInvitation.email}
                  </Text>

                  <Spaced height={Spacing.lg_24} />

                  <View style={styles.codeContainer}>
                    <Text style={styles.codeLabel}>
                      {t('invitation.invitationCode')}
                    </Text>
                    <Text style={styles.code}>{generatedInvitation.token}</Text>
                  </View>

                  <Spaced height={Spacing.md_16} />

                  <HStack spacing={Spacing.xs_6} style={styles.expirationContainer}>
                    <MaterialIcons name="schedule" size={16} color={Color.Gray.v400} />
                    <Text style={styles.expirationText}>
                      {t('invitation.expiresOn')}: {formatExpirationDate(generatedInvitation.expiresAt)}
                    </Text>
                  </HStack>

                  <Spaced height={Spacing.xl_32} />

                  <HStack spacing={Spacing.md_16} style={{ alignSelf: 'stretch' }}>
                    <TouchableOpacity style={styles.actionButton} onPress={handleCopyToken}>
                      <MaterialIcons name="content-copy" size={20} color={Color.primary} />
                      <Text style={styles.actionButtonText}>
                        {t('common.copy')}
                      </Text>
                    </TouchableOpacity>

                    <TouchableOpacity style={styles.actionButton} onPress={handleShare}>
                      <MaterialIcons name="share" size={20} color={Color.primary} />
                      <Text style={styles.actionButtonText}>
                        {t('common.share')}
                      </Text>
                    </TouchableOpacity>
                  </HStack>
                </View>
              </>
            )}
          </VStack>
        </TouchableWithoutFeedback>
      </ScrollView>
    </SafeAreaView>
  );
};

export default GenerateInvitationScreen;

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: Color.Background.subtle,
    alignSelf: 'stretch',
  },
  content: {
    flex: 1,
    ...spacingStyles.screenScrollContainer,
    alignSelf: 'stretch',
  },
  description: {
    fontFamily: FontFamily.regular,
    fontSize: FontSize.bodymedium_16,
    color: Color.Gray.v400,
    lineHeight: 24,
  },
  helperText: {
    fontFamily: FontFamily.regular,
    fontSize: FontSize.bodysmall_14,
    color: Color.Gray.v400,
    paddingLeft: Spacing.sm_8,
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
  successCard: {
    backgroundColor: Color.white,
    borderRadius: Border.lg_16,
    padding: Spacing.lg_24,
    alignItems: 'center',
    ...shadowStyles.cardShadow,
  },
  successIconContainer: {
    width: 80,
    height: 80,
    borderRadius: Border.full,
    alignItems: 'center',
    justifyContent: 'center',
  },
  successTitle: {
    fontFamily: FontFamily.bold,
    fontSize: FontSize.subtitle_20,
    color: Color.dark,
    textAlign: 'center',
  },
  successSubtitle: {
    fontFamily: FontFamily.regular,
    fontSize: FontSize.bodymedium_16,
    color: Color.Gray.v400,
    textAlign: 'center',
  },
  codeContainer: {
    backgroundColor: Color.Background.subtle,
    borderRadius: Border.md_12,
    borderWidth: 2,
    borderColor: Color.primary,
    borderStyle: 'dashed',
    padding: Spacing.md_16,
    alignSelf: 'stretch',
    alignItems: 'center',
  },
  codeLabel: {
    fontFamily: FontFamily.semi_bold,
    fontSize: FontSize.bodysmall_14,
    color: Color.Gray.v400,
    textTransform: 'uppercase',
    marginBottom: Spacing.xs_4,
  },
  code: {
    fontFamily: FontFamily.bold,
    fontSize: FontSize.bodylarge_18,
    color: Color.primary,
    letterSpacing: 2,
  },
  expirationContainer: {
    alignItems: 'center',
  },
  expirationText: {
    fontFamily: FontFamily.regular,
    fontSize: FontSize.bodysmall_14,
    color: Color.Gray.v400,
  },
  actionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Color.Background.white,
    borderWidth: 1.5,
    borderColor: Color.primary,
    borderRadius: Border.md_12,
    paddingVertical: Spacing.md_16,
    paddingHorizontal: Spacing.md_16,
    gap: Spacing.xs_6,
  },
  actionButtonText: {
    fontFamily: FontFamily.semi_bold,
    fontSize: FontSize.bodymedium_16,
    color: Color.primary,
  },
});
