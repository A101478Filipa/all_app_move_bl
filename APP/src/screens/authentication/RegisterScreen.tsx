import { StyleSheet, SafeAreaView, Text, ScrollView, TouchableOpacity, View, Keyboard, TouchableWithoutFeedback } from "react-native";
import { VStack, Spaced, HStack } from "@components/CoreComponents";
import { Color } from "@src/styles/colors";
import { CustomBackButton } from "@components/CustomBackButton";
import { Spacing } from "@src/styles/spacings";
import { FontFamily, FontSize } from "@src/styles/fonts";
import { MaterialIcons } from '@expo/vector-icons';
import { useTranslation } from '@src/localization/hooks/useTranslation';

const RegisterScreen = ({ navigation }) => {
  const { t } = useTranslation();

  const onLoginNow = () => {
    navigation.replace('Login');
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <VStack style={styles.content} align='flex-start' spacing={Spacing.lg_24}>
        <CustomBackButton navigation={navigation}/>

        <ScrollView style={{flex: 1, alignSelf: 'stretch' }}>
          <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
            <VStack style={{flex: 1, alignSelf: 'stretch' }}>
              <Text style={styles.title}>
                {t('authentication.createAccount') || 'Create Account'}
              </Text>

              <Spaced height={Spacing.xl_32}/>

              {/* Role Selection */}

              <VStack spacing={Spacing.md_16} style={{ alignSelf: 'stretch' }}>
                <TouchableOpacity
                  style={styles.roleCard}
                  activeOpacity={0.7}
                  onPress={() => navigation.navigate('ClinicianRegistration')}
                >
                  <HStack spacing={Spacing.md_16} style={styles.roleCardContent}>
                    <View style={styles.roleIconContainer}>
                      <MaterialIcons name="medical-services" size={32} color={Color.primary} />
                    </View>
                    <VStack align="flex-start" spacing={Spacing.xs_4} style={styles.roleTextContainer}>
                      <Text style={styles.roleTitle}>{t('authentication.clinician') || 'Clinician'}</Text>
                      <Text style={styles.roleDescription}>
                        {t('authentication.clinicianDescription')}
                      </Text>
                    </VStack>
                  </HStack>
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.roleCard}
                  activeOpacity={0.7}
                  onPress={() => navigation.navigate('InvitationRegistration')}
                >
                  <HStack spacing={Spacing.md_16} style={styles.roleCardContent}>
                    <View style={styles.roleIconContainer}>
                      <MaterialIcons name="business" size={32} color={Color.secondary} />
                    </View>
                    <VStack align="flex-start" spacing={Spacing.xs_4} style={styles.roleTextContainer}>
                      <Text style={styles.roleTitle}>{t('authentication.haveInvitationCode')}</Text>
                      <Text style={styles.roleDescription}>
                        {t('authentication.invitationCodeDescription')}
                      </Text>
                    </VStack>
                  </HStack>
                </TouchableOpacity>
              </VStack>

              <Spaced height={Spacing.xl2_40}/>

              <View style={styles.loginTextContainer}>
                <Text style={styles.loginText}>{t('authentication.alreadyHaveAccount') || 'Already have an account?'}</Text>

                <TouchableOpacity onPress={onLoginNow}>
                  <Text style={styles.loginNowText}> {t('authentication.loginNow') || 'Login Now'} </Text>
                </TouchableOpacity>
              </View>
            </VStack>
          </TouchableWithoutFeedback>
        </ScrollView>
      </VStack>
    </SafeAreaView>
  );
};

export default RegisterScreen;

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
  sectionTitle: {
    fontFamily: FontFamily.semi_bold,
    fontSize: FontSize.subtitle_20,
    color: Color.black,
    alignSelf: 'flex-start',
  },
  roleCard: {
    backgroundColor: Color.white,
    borderRadius: Spacing.md_16,
    borderWidth: 2,
    borderColor: Color.Gray.v200,
    padding: Spacing.md_16,
    alignSelf: 'stretch',
  },
  roleCardContent: {
    alignItems: 'center',
  },
  roleIconContainer: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: Color.Background.muted,
    alignItems: 'center',
    justifyContent: 'center',
  },
  roleTextContainer: {
    flex: 1,
  },
  roleTitle: {
    fontFamily: FontFamily.semi_bold,
    fontSize: FontSize.bodylarge_18,
    color: Color.black,
  },
  roleDescription: {
    fontFamily: FontFamily.regular,
    fontSize: FontSize.bodysmall_14,
    color: Color.Gray.v400,
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
