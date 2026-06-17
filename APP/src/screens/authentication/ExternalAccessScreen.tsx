import React, { useState } from 'react';
import {
  View, Text, ScrollView, StyleSheet, TouchableOpacity,
  KeyboardAvoidingView, Platform,
} from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { MaterialIcons } from '@expo/vector-icons';
import { LoginStackParamList } from '@src/navigation/LoginNavigator';
import {
  externalAccessApi,
  ExternalProfileResponse,
} from '@src/api/endpoints/externalAccess';
import { FloatingLabelInput } from '@components/FloatingLabelInput';
import { Color } from '@src/styles/colors';
import { FontFamily, FontSize } from '@src/styles/fonts';
import { Spacing } from '@src/styles/spacings';
import { PrimaryButton } from '@components/ButtonComponents';
import { asyncStorageService } from '@services/AsyncStorageService';

type Props = NativeStackScreenProps<LoginStackParamList, 'ExternalAccess'>;

type Step = 'enter_code' | 'view_profile';

const ExternalAccessScreen: React.FC<Props> = ({ navigation }) => {
  const [step, setStep] = useState<Step>('enter_code');
  const [code, setCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [profile, setProfile] = useState<ExternalProfileResponse | null>(null);

  const handleVerifyCode = async () => {
    if (!code.trim()) {
      setError('Por favor insira o código de acesso.');
      return;
    }
    setError(null);
    setLoading(true);
    try {
      const res = await externalAccessApi.getProfileByToken(code.trim().toLowerCase());
      await asyncStorageService.storeExternalToken(code.trim().toLowerCase());
      setProfile(res.data);
      setStep('view_profile');
    } catch (err: any) {
      const msg = err?.response?.data?.message;
      if (msg === 'Código expirado') {
        setError('Este código já expirou. Solicite um novo ao responsável.');
      } else if (msg === 'Código inválido') {
        setError('Código inválido. Verifique e tente novamente.');
      } else {
        setError('Não foi possível validar o código. Tente novamente.');
      }
    } finally {
      setLoading(false);
    }
  };

  const calcAge = (birthDate: string) => {
    const birth = new Date(birthDate);
    const now = new Date();
    let age = now.getFullYear() - birth.getFullYear();
    const m = now.getMonth() - birth.getMonth();
    if (m < 0 || (m === 0 && now.getDate() < birth.getDate())) age--;
    return age;
  };

  const formatDate = (iso: string) =>
    new Date(iso).toLocaleDateString('pt-PT', { day: 'numeric', month: 'long', year: 'numeric' });

  // ── Step: Enter Code ─────────────────────────────────────────────────────
  const renderEnterCode = () => (
    <KeyboardAvoidingView
      style={styles.centerContainer}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <View style={styles.iconCircle}>
        <MaterialIcons name="vpn-key" size={36} color={Color.primary} />
      </View>
      <Text style={styles.pageTitle}>Acesso Externo</Text>
      <Text style={styles.pageSubtitle}>
        Insira o código de acesso que recebeu para consultar o perfil do utente e registar as suas observações.
      </Text>

      <FloatingLabelInput
        label="Código de acesso"
        value={code}
        onChangeText={v => { setCode(v); setError(null); }}
        autoCapitalize="characters"
        autoCorrect={false}
        hasError={!!error}
      />

      {error ? (
        <View style={styles.errorBox}>
          <MaterialIcons name="error-outline" size={16} color="#DC2626" />
          <Text style={styles.errorText}>{error}</Text>
        </View>
      ) : null}

      <PrimaryButton
        title="Verificar Código"
        onPress={handleVerifyCode}
        loading={loading}
        style={{ marginTop: Spacing.sm_10 }}
      />

      <TouchableOpacity style={styles.backLink} onPress={() => navigation.goBack()}>
        <Text style={styles.backLinkText}>Voltar ao início</Text>
      </TouchableOpacity>
    </KeyboardAvoidingView>
  );

  // ── Step: View Profile ────────────────────────────────────────────────────
  const renderViewProfile = () => {
    if (!profile) return null;
    const { elderly, event, professional } = profile;
    const age = calcAge(elderly.birthDate);
    const genderLabel = elderly.gender === 'MALE' ? 'Masculino' : elderly.gender === 'FEMALE' ? 'Feminino' : 'Outro';

    const goToProfile = () =>
      navigation.navigate('ExternalElderlyProfile', { profile, token: code.trim().toLowerCase() });

    return (
      <ScrollView style={styles.scrollContainer} contentContainerStyle={styles.scrollContent}>
        {/* Success banner */}
        <View style={styles.accessGrantedBanner}>
          <MaterialIcons name="check-circle" size={18} color="#16A34A" />
          <Text style={styles.accessGrantedText}>Acesso concedido</Text>
        </View>

        {/* Event info */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Consulta</Text>
          <View style={styles.infoRow}>
            <MaterialIcons name="event" size={16} color={Color.Gray.v500} />
            <Text style={styles.infoText}>{event.title}</Text>
          </View>
          <View style={styles.infoRow}>
            <MaterialIcons name="access-time" size={16} color={Color.Gray.v500} />
            <Text style={styles.infoText}>{formatDate(event.startDate)}</Text>
          </View>
          {professional && (
            <View style={styles.infoRow}>
              <MaterialIcons name="person-outline" size={16} color={Color.Gray.v500} />
              <Text style={styles.infoText}>{professional.name}{professional.specialty ? ` · ${professional.specialty}` : ''}</Text>
            </View>
          )}
        </View>

        {/* Tappable elderly card */}
        <Text style={styles.sectionLabel}>Utente</Text>
        <TouchableOpacity style={[styles.card, styles.elderlyCard]} onPress={goToProfile} activeOpacity={0.75}>
          <View style={styles.avatarCircle}>
            <MaterialIcons name="person" size={36} color={Color.primary} />
          </View>
          <View style={{ flex: 1, marginLeft: Spacing.sm_12 }}>
            <Text style={styles.elderlyName}>{elderly.name}</Text>
            <Text style={styles.elderlyMeta}>{age} anos · {genderLabel}</Text>
          </View>
          <MaterialIcons name="chevron-right" size={24} color={Color.Gray.v400} />
        </TouchableOpacity>

        <PrimaryButton
          title="Ver Perfil Completo"
          onPress={goToProfile}
          style={{ marginTop: Spacing.xs_4 }}
        />

        <TouchableOpacity style={styles.backLink} onPress={() => setStep('enter_code')}>
          <Text style={styles.backLinkText}>Usar outro código</Text>
        </TouchableOpacity>
      </ScrollView>
    );
  };

  return (
    <View style={styles.root}>
      {step === 'enter_code' && renderEnterCode()}
      {step === 'view_profile' && renderViewProfile()}
    </View>
  );
};

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: Color.white,
  },
  centerContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: Spacing.xl2_40,
  },
  scrollContainer: {
    flex: 1,
  },
  scrollContent: {
    padding: Spacing.md_16,
    paddingBottom: 40,
  },
  iconCircle: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: Color.primary + '18',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.md_16,
  },
  pageTitle: {
    fontFamily: FontFamily.bold,
    fontSize: FontSize.xl_20,
    color: Color.dark,
    textAlign: 'center',
    marginBottom: Spacing.xs_6,
  },
  pageSubtitle: {
    fontFamily: FontFamily.regular,
    fontSize: FontSize.bodysmall_14,
    color: Color.Gray.v500,
    textAlign: 'center',
    marginBottom: Spacing.lg_24,
  },
  codeInput: {
    width: '100%',
    borderWidth: 1.5,
    borderColor: Color.Gray.v300,
    borderRadius: 10,
    paddingHorizontal: Spacing.md_16,
    paddingVertical: 14,
    fontFamily: FontFamily.semi_bold,
    fontSize: 20,
    color: Color.dark,
    textAlign: 'center',
    letterSpacing: 4,
    marginBottom: Spacing.sm_10,
  },
  inputError: {
    borderColor: '#EF4444',
  },
  errorBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: Spacing.sm_10,
  },
  errorText: {
    fontFamily: FontFamily.regular,
    fontSize: FontSize.bodysmall_14,
    color: '#DC2626',
    flex: 1,
  },
  backLink: {
    marginTop: Spacing.md_16,
    alignItems: 'center',
  },
  backLinkText: {
    fontFamily: FontFamily.regular,
    fontSize: FontSize.bodysmall_14,
    color: Color.primary,
  },
  profileHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Color.primary + '10',
    borderRadius: 12,
    padding: Spacing.md_16,
    marginBottom: Spacing.sm_10,
  },
  avatarCircle: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: Color.primary + '25',
    alignItems: 'center',
    justifyContent: 'center',
  },
  accessGrantedBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#DCFCE7',
    borderRadius: 8,
    paddingHorizontal: Spacing.sm_12,
    paddingVertical: Spacing.xs_6,
    marginBottom: Spacing.sm_12,
    alignSelf: 'flex-start',
  },
  accessGrantedText: {
    fontFamily: FontFamily.semi_bold,
    fontSize: FontSize.caption_12,
    color: '#16A34A',
  },
  sectionLabel: {
    fontFamily: FontFamily.semi_bold,
    fontSize: FontSize.caption_12,
    color: Color.Gray.v500,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 6,
    marginTop: Spacing.xs_4,
  },
  elderlyCard: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: Spacing.sm_12,
  },
  elderlyName: {
    fontFamily: FontFamily.bold,
    fontSize: FontSize.bodylarge_18,
    color: Color.dark,
  },
  elderlyMeta: {
    fontFamily: FontFamily.regular,
    fontSize: FontSize.bodysmall_14,
    color: Color.Gray.v500,
    marginTop: 2,
  },
  card: {
    backgroundColor: '#F9FAFB',
    borderRadius: 10,
    padding: Spacing.md_16,
    marginBottom: Spacing.sm_10,
    borderWidth: 1,
    borderColor: Color.Gray.v200,
  },
  noteCard: {
    backgroundColor: '#F0FDF4',
    borderColor: '#BBF7D0',
  },
  cardTitle: {
    fontFamily: FontFamily.semi_bold,
    fontSize: FontSize.caption_12,
    color: Color.Gray.v500,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 8,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 4,
  },
  infoText: {
    fontFamily: FontFamily.regular,
    fontSize: FontSize.bodysmall_14,
    color: Color.Gray.v500,
    flex: 1,
  },
  tagRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 4,
  },
  tag: {
    backgroundColor: Color.primary + '18',
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 3,
    marginRight: 6,
    marginBottom: 4,
  },
  tagText: {
    fontFamily: FontFamily.regular,
    fontSize: FontSize.caption_12,
    color: Color.primary,
  },
  medRow: {
    paddingVertical: 4,
    borderBottomWidth: 1,
    borderBottomColor: Color.Gray.v200,
  },
  medName: {
    fontFamily: FontFamily.semi_bold,
    fontSize: FontSize.bodysmall_14,
    color: Color.dark,
  },
  medDetail: {
    fontFamily: FontFamily.regular,
    fontSize: FontSize.caption_12,
    color: Color.Gray.v500,
    marginTop: 1,
  },
  fallRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 4,
  },
  fallText: {
    fontFamily: FontFamily.regular,
    fontSize: FontSize.bodysmall_14,
    color: Color.Gray.v500,
  },
  noteText: {
    fontFamily: FontFamily.regular,
    fontSize: FontSize.bodysmall_14,
    color: Color.Gray.v500,
    lineHeight: 20,
  },
  noteDate: {
    fontFamily: FontFamily.regular,
    fontSize: FontSize.caption_12,
    color: Color.Gray.v400,
    marginTop: 8,
  },
  inputLabel: {
    fontFamily: FontFamily.semi_bold,
    fontSize: FontSize.bodysmall_14,
    color: Color.Gray.v500,
    marginBottom: 6,
    marginTop: Spacing.sm_10,
  },
  textArea: {
    borderWidth: 1.5,
    borderColor: Color.Gray.v300,
    borderRadius: 10,
    padding: Spacing.sm_10,
    fontFamily: FontFamily.regular,
    fontSize: FontSize.bodysmall_14,
    color: Color.dark,
    minHeight: 120,
    textAlignVertical: 'top',
  },
});

export default ExternalAccessScreen;
