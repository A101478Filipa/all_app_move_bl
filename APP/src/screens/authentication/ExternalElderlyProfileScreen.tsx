import React, { useState } from 'react';
import {
  View, Text, ScrollView, StyleSheet, TouchableOpacity,
  TextInput, Modal, Alert, ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { MaterialIcons } from '@expo/vector-icons';
import { MeasurementType, MeasurementUnit } from 'moveplus-shared';
import { LoginStackParamList } from '@src/navigation/LoginNavigator';
import { Color } from '@src/styles/colors';
import { FontFamily, FontSize } from '@src/styles/fonts';
import { Spacing, spacingStyles } from '@src/styles/spacings';
import { Border } from '@src/styles/borders';
import { calculateAge, formatDateLong } from '@src/utils/Date';
import { HStack, VStack } from '@components/CoreComponents';
import { ExpandableRow } from '@components/ProfileComponents';
import { useTranslation } from '@src/localization/hooks/useTranslation';
import { getGenderTitle } from '@src/utils/genderHelper';
import { getDefaultMeasurementUnit } from '@src/utils/measurementHelper';
import {
  externalAccessApi,
  ExternalElderlyMeasurement,
  ExternalElderlyMedication,
  ExternalElderlyPathology,
  ExternalElderlyFall,
  ExternalProfileResponse,
} from '@src/api/endpoints/externalAccess';

type Props = NativeStackScreenProps<LoginStackParamList, 'ExternalElderlyProfile'>;

type ActiveSection =
  | 'measurements' | 'medications' | 'pathologies' | 'falls'
  | 'sos' | 'calendar' | 'wounds'
  | null;

type AddModal = 'measurement' | 'medication' | 'pathology' | 'fall' | null;

// ── CategoryCard ────────────────────────────────────────────────────────────
type CategoryCardProps = {
  iconName: string;
  iconColor: string;
  title: string;
  count?: number;
  onPress: () => void;
  onAdd?: () => void;
  active?: boolean;
  fullWidth?: boolean;
};

const CategoryCard = ({
  iconName, iconColor, title, count, onPress, onAdd, active, fullWidth,
}: CategoryCardProps) => (
  <TouchableOpacity
    style={[styles.categoryCard, fullWidth && styles.categoryCardFull, active && styles.categoryCardActive]}
    onPress={onPress}
    activeOpacity={0.75}
  >
    <View style={styles.categoryIconContainer}>
      <View style={[styles.categoryIconWrap, { backgroundColor: iconColor + '18' }]}>
        <MaterialIcons name={iconName as any} size={28} color={iconColor} />
      </View>
    </View>
    <Text style={styles.categoryTitle} numberOfLines={2}>{title}</Text>
    {count !== undefined && (
      <View style={[styles.categoryBadge, { backgroundColor: iconColor }]}>
        <Text style={styles.categoryBadgeText}>{count}</Text>
      </View>
    )}
    {onAdd && (
      <TouchableOpacity
        style={[styles.categoryAddBtn, { backgroundColor: iconColor }]}
        onPress={e => { e.stopPropagation?.(); onAdd(); }}
        hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
      >
        <MaterialIcons name="add" size={14} color="#fff" />
      </TouchableOpacity>
    )}
    <MaterialIcons
      name={active ? 'expand-less' : 'chevron-right'}
      size={18}
      color={active ? iconColor : Color.Gray.v300}
      style={styles.categoryChevron}
    />
  </TouchableOpacity>
);

// ── Main Screen ──────────────────────────────────────────────────────────────
const ExternalElderlyProfileScreen: React.FC<Props> = ({ route, navigation }) => {
  const { profile, token } = route.params;
  const { elderly: initialElderly, event } = profile;
  const { t } = useTranslation();

  const [activeSection, setActiveSection] = useState<ActiveSection>(null);
  const [addModal, setAddModal] = useState<AddModal>(null);
  const [submitting, setSubmitting] = useState(false);

  // Local data state (updated after adds)
  const [measurements, setMeasurements] = useState<ExternalElderlyMeasurement[]>(initialElderly.measurements ?? []);
  const [medications, setMedications] = useState<ExternalElderlyMedication[]>(initialElderly.medications ?? []);
  const [pathologies, setPathologies] = useState<ExternalElderlyPathology[]>(initialElderly.pathologies ?? []);
  const [falls, setFalls] = useState<ExternalElderlyFall[]>(initialElderly.recentFalls ?? []);

  // ── Form fields ──
  // Measurement
  const [mType, setMType] = useState<MeasurementType>(MeasurementType.HEART_RATE);
  const [mValue, setMValue] = useState('');
  const [mUnit, setMUnit] = useState<MeasurementUnit>(MeasurementUnit.BPM);
  const [mNotes, setMNotes] = useState('');

  // Medication
  const [medName, setMedName] = useState('');
  const [medDosage, setMedDosage] = useState('');
  const [medFrequency, setMedFrequency] = useState('');
  const [medAdmin, setMedAdmin] = useState('');

  // Pathology
  const [pathName, setPathName] = useState('');
  const [pathNotes, setPathNotes] = useState('');

  // Fall
  const [fallDate, setFallDate] = useState(new Date().toISOString().slice(0, 10));
  const [fallDesc, setFallDesc] = useState('');
  const [fallInjured, setFallInjured] = useState(false);
  const [fallInjuryDesc, setFallInjuryDesc] = useState('');

  const elderly = initialElderly;
  const genderLabel = getGenderTitle(elderly.gender as any, t);

  const toggleSection = (section: ActiveSection) =>
    setActiveSection(prev => (prev === section ? null : section));

  const openAdd = (modal: AddModal) => {
    // Reset forms
    setMValue(''); setMNotes('');
    setMedName(''); setMedDosage(''); setMedFrequency(''); setMedAdmin('');
    setPathName(''); setPathNotes('');
    setFallDate(new Date().toISOString().slice(0, 10)); setFallDesc('');
    setFallInjured(false); setFallInjuryDesc('');
    setAddModal(modal);
  };

  // ── Submit handlers ──────────────────────────────────────────────────────
  const submitMeasurement = async () => {
    const num = parseFloat(mValue);
    if (!mValue || isNaN(num)) {
      Alert.alert('Erro', 'Introduza um valor numérico válido.');
      return;
    }
    setSubmitting(true);
    try {
      const res = await externalAccessApi.addMeasurement(token, {
        type: mType,
        value: num,
        unit: mUnit,
        notes: mNotes || null,
      });
      if (res.data) {
        setMeasurements(prev => [res.data!, ...prev]);
        setActiveSection('measurements');
      }
      setAddModal(null);
    } catch {
      Alert.alert('Erro', 'Não foi possível registar a medição.');
    } finally {
      setSubmitting(false);
    }
  };

  const submitMedication = async () => {
    if (!medName.trim()) {
      Alert.alert('Erro', 'O nome da medicação é obrigatório.');
      return;
    }
    setSubmitting(true);
    try {
      const res = await externalAccessApi.addMedication(token, {
        name: medName.trim(),
        dosage: medDosage || undefined,
        frequency: medFrequency || undefined,
        administration: medAdmin || undefined,
      });
      if (res.data) {
        setMedications(prev => [res.data!, ...prev]);
        setActiveSection('medications');
      }
      setAddModal(null);
    } catch {
      Alert.alert('Erro', 'Não foi possível registar a medicação.');
    } finally {
      setSubmitting(false);
    }
  };

  const submitPathology = async () => {
    if (!pathName.trim()) {
      Alert.alert('Erro', 'O nome da patologia é obrigatório.');
      return;
    }
    setSubmitting(true);
    try {
      const res = await externalAccessApi.addPathology(token, {
        name: pathName.trim(),
        notes: pathNotes || null,
      });
      if (res.data) {
        setPathologies(prev => [res.data!, ...prev]);
        setActiveSection('pathologies');
      }
      setAddModal(null);
    } catch {
      Alert.alert('Erro', 'Não foi possível registar a patologia.');
    } finally {
      setSubmitting(false);
    }
  };

  const submitFall = async () => {
    setSubmitting(true);
    try {
      const res = await externalAccessApi.addFall(token, {
        date: new Date(fallDate).toISOString(),
        description: fallDesc || undefined,
        injured: fallInjured,
        injuryDescription: fallInjured ? (fallInjuryDesc || undefined) : undefined,
      });
      if (res.data) {
        setFalls(prev => [res.data!, ...prev]);
        setActiveSection('falls');
      }
      setAddModal(null);
    } catch {
      Alert.alert('Erro', 'Não foi possível registar a queda.');
    } finally {
      setSubmitting(false);
    }
  };

  // ── Measurement type picker (inline row list) ─────────────────────────────
  const MEASUREMENT_TYPES: MeasurementType[] = Object.values(MeasurementType);
  const MEASUREMENT_LABELS: Record<MeasurementType, string> = {
    [MeasurementType.BLOOD_PRESSURE_SYSTOLIC]: 'Pressão Arterial Sistólica',
    [MeasurementType.BLOOD_PRESSURE_DIASTOLIC]: 'Pressão Arterial Diastólica',
    [MeasurementType.HEART_RATE]: 'Frequência Cardíaca',
    [MeasurementType.WEIGHT]: 'Peso',
    [MeasurementType.HEIGHT]: 'Altura',
    [MeasurementType.BODY_TEMPERATURE]: 'Temperatura Corporal',
    [MeasurementType.BLOOD_GLUCOSE]: 'Glicemia',
    [MeasurementType.OXYGEN_SATURATION]: 'Saturação de Oxigénio',
    [MeasurementType.BALANCE_SCORE]: 'Equilíbrio',
    [MeasurementType.MOBILITY_SCORE]: 'Mobilidade',
    [MeasurementType.COGNITIVE_SCORE]: 'Cognitivo',
  };

  // ── Modals ────────────────────────────────────────────────────────────────
  const renderModal = () => {
    if (!addModal) return null;

    let title = '';
    let content: React.ReactNode = null;
    let onSubmit = () => {};

    if (addModal === 'measurement') {
      title = 'Nova Medição';
      onSubmit = submitMeasurement;
      content = (
        <VStack align="flex-start" spacing={Spacing.sm_12}>
          <Text style={styles.formLabel}>Tipo de medição</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.chipScroll}>
            <HStack spacing={Spacing.xs_4}>
              {MEASUREMENT_TYPES.map(type => (
                <TouchableOpacity
                  key={type}
                  style={[styles.chip, mType === type && styles.chipActive]}
                  onPress={() => {
                    setMType(type);
                    setMUnit(getDefaultMeasurementUnit(type));
                  }}
                >
                  <Text style={[styles.chipText, mType === type && styles.chipTextActive]}>
                    {MEASUREMENT_LABELS[type]}
                  </Text>
                </TouchableOpacity>
              ))}
            </HStack>
          </ScrollView>
          <Text style={styles.formLabel}>Valor</Text>
          <TextInput
            style={styles.formInput}
            value={mValue}
            onChangeText={setMValue}
            keyboardType="decimal-pad"
            placeholder="Ex: 120"
          />
          <Text style={styles.formLabel}>Notas (opcional)</Text>
          <TextInput
            style={[styles.formInput, { height: 72 }]}
            value={mNotes}
            onChangeText={setMNotes}
            multiline
            placeholder="Observações adicionais"
          />
        </VStack>
      );
    }

    if (addModal === 'medication') {
      title = 'Nova Medicação';
      onSubmit = submitMedication;
      content = (
        <VStack align="flex-start" spacing={Spacing.sm_12}>
          <Text style={styles.formLabel}>Nome *</Text>
          <TextInput style={styles.formInput} value={medName} onChangeText={setMedName} placeholder="Ex: Paracetamol" />
          <Text style={styles.formLabel}>Dosagem</Text>
          <TextInput style={styles.formInput} value={medDosage} onChangeText={setMedDosage} placeholder="Ex: 500mg" />
          <Text style={styles.formLabel}>Frequência</Text>
          <TextInput style={styles.formInput} value={medFrequency} onChangeText={setMedFrequency} placeholder="Ex: 3x por dia" />
          <Text style={styles.formLabel}>Via de administração</Text>
          <TextInput style={styles.formInput} value={medAdmin} onChangeText={setMedAdmin} placeholder="Ex: Oral" />
        </VStack>
      );
    }

    if (addModal === 'pathology') {
      title = 'Nova Patologia';
      onSubmit = submitPathology;
      content = (
        <VStack align="flex-start" spacing={Spacing.sm_12}>
          <Text style={styles.formLabel}>Nome *</Text>
          <TextInput style={styles.formInput} value={pathName} onChangeText={setPathName} placeholder="Ex: Diabetes tipo 2" />
          <Text style={styles.formLabel}>Notas</Text>
          <TextInput
            style={[styles.formInput, { height: 72 }]}
            value={pathNotes}
            onChangeText={setPathNotes}
            multiline
            placeholder="Observações sobre a patologia"
          />
        </VStack>
      );
    }

    if (addModal === 'fall') {
      title = 'Registar Queda';
      onSubmit = submitFall;
      content = (
        <VStack align="flex-start" spacing={Spacing.sm_12}>
          <Text style={styles.formLabel}>Data (AAAA-MM-DD) *</Text>
          <TextInput
            style={styles.formInput}
            value={fallDate}
            onChangeText={setFallDate}
            placeholder="2026-06-01"
            keyboardType="numbers-and-punctuation"
          />
          <Text style={styles.formLabel}>Descrição</Text>
          <TextInput
            style={[styles.formInput, { height: 72 }]}
            value={fallDesc}
            onChangeText={setFallDesc}
            multiline
            placeholder="Descreva as circunstâncias da queda"
          />
          <TouchableOpacity
            style={[styles.toggleBtn, fallInjured && styles.toggleBtnActive]}
            onPress={() => setFallInjured(p => !p)}
          >
            <MaterialIcons
              name={fallInjured ? 'check-box' : 'check-box-outline-blank'}
              size={20}
              color={fallInjured ? Color.Error.default : Color.Gray.v400}
            />
            <Text style={[styles.toggleText, fallInjured && { color: Color.Error.default }]}>Ocorreu lesão</Text>
          </TouchableOpacity>
          {fallInjured && (
            <>
              <Text style={styles.formLabel}>Descrição da lesão</Text>
              <TextInput
                style={styles.formInput}
                value={fallInjuryDesc}
                onChangeText={setFallInjuryDesc}
                placeholder="Ex: Escoriação no cotovelo direito"
              />
            </>
          )}
        </VStack>
      );
    }

    return (
      <Modal visible transparent animationType="slide" onRequestClose={() => setAddModal(null)}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalSheet}>
            <HStack style={styles.modalHeader}>
              <Text style={styles.modalTitle}>{title}</Text>
              <TouchableOpacity onPress={() => setAddModal(null)}>
                <MaterialIcons name="close" size={22} color={Color.Gray.v500} />
              </TouchableOpacity>
            </HStack>
            <ScrollView showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
              <View style={{ padding: Spacing.md_16, paddingTop: 0 }}>
                {content}
                <TouchableOpacity
                  style={[styles.submitBtn, submitting && { opacity: 0.6 }]}
                  onPress={onSubmit}
                  disabled={submitting}
                >
                  {submitting
                    ? <ActivityIndicator color="#fff" size="small" />
                    : <Text style={styles.submitBtnText}>Guardar</Text>}
                </TouchableOpacity>
              </View>
            </ScrollView>
          </View>
        </View>
      </Modal>
    );
  };

  // ── Render ──────────────────────────────────────────────────────────────
  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      <View style={styles.headerBar}>
        <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()} activeOpacity={0.7}>
          <MaterialIcons name="arrow-back" size={22} color={Color.Background.white} />
        </TouchableOpacity>
        <Text style={styles.headerTitle} numberOfLines={1}>{elderly.name}</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView contentContainerStyle={styles.scrollContainer} showsVerticalScrollIndicator={false}>
        <VStack align="flex-start" spacing={Spacing.lg_24}>

          {/* ── Profile header ── */}
          <HStack spacing={Spacing.lg_24} style={styles.header}>
            <View style={styles.avatarCircle}>
              <MaterialIcons name="person" size={48} color={Color.primary} />
            </View>
            <VStack align="flex-start" spacing={Spacing.xs_4}>
              <Text style={styles.name}>{elderly.name}</Text>
              <Text style={styles.institution}>{event.title}</Text>
            </VStack>
          </HStack>

          {/* ── Personal info ── */}
          <ExpandableRow
            title={t('elderly.elderlyInfo')}
            description={`${t('common.age')}: ${calculateAge(elderly.birthDate)}, ${genderLabel}`}
            paddingHorizontal={0}
            paddingBottom={0}
          >
            <VStack align="flex-start" spacing={Spacing.sm_8} style={styles.infoCardContainer}>
              <VStack style={styles.infoCard}>
                <HStack align="center" spacing={Spacing.sm_8} style={styles.infoCardRow}>
                  <View style={[styles.iconContainer, { backgroundColor: Color.Semantic.measurements + '15' }]}>
                    <MaterialIcons name="cake" size={20} color={Color.Semantic.measurements} />
                  </View>
                  <VStack align="flex-start" style={styles.infoTextContainer}>
                    <Text style={styles.infoLabel}>{t('common.age')}</Text>
                    <Text style={styles.infoValue}>{calculateAge(elderly.birthDate)} {t('elderly.years')}</Text>
                    <Text style={styles.infoSubtext}>{formatDateLong(elderly.birthDate)}</Text>
                  </VStack>
                </HStack>
                <View style={styles.infoDivider} />
                <HStack align="center" spacing={Spacing.sm_8} style={styles.infoCardRow}>
                  <View style={[styles.iconContainer, { backgroundColor: Color.Semantic.medication + '15' }]}>
                    <MaterialIcons name="wc" size={20} color={Color.Semantic.medication} />
                  </View>
                  <VStack align="flex-start" style={styles.infoTextContainer}>
                    <Text style={styles.infoLabel}>{t('elderly.gender')}</Text>
                    <Text style={styles.infoValue}>{genderLabel}</Text>
                  </VStack>
                </HStack>
              </VStack>

              {(elderly.phone || elderly.emergencyContact) && (
                <VStack style={styles.infoCard}>
                  {elderly.phone && (
                    <>
                      <HStack align="center" spacing={Spacing.sm_8} style={styles.infoCardRow}>
                        <View style={[styles.iconContainer, { backgroundColor: Color.Cyan.v300 + '15' }]}>
                          <MaterialIcons name="phone" size={20} color={Color.Cyan.v300} />
                        </View>
                        <VStack align="flex-start" style={styles.infoTextContainer}>
                          <Text style={styles.infoLabel}>{t('elderly.phone')}</Text>
                          <Text style={styles.infoValue}>{elderly.phone}</Text>
                        </VStack>
                      </HStack>
                      {elderly.emergencyContact && <View style={styles.infoDivider} />}
                    </>
                  )}
                  {elderly.emergencyContact && (
                    <HStack align="center" spacing={Spacing.sm_8} style={styles.infoCardRow}>
                      <View style={[styles.iconContainer, { backgroundColor: Color.Error.default + '15' }]}>
                        <MaterialIcons name="emergency" size={20} color={Color.Error.default} />
                      </View>
                      <VStack align="flex-start" style={styles.infoTextContainer}>
                        <Text style={[styles.infoLabel, { color: Color.Error.default }]}>{t('elderly.emergencyContact')}</Text>
                        <Text style={styles.infoValue}>{elderly.emergencyContact}</Text>
                      </VStack>
                    </HStack>
                  )}
                </VStack>
              )}
            </VStack>
          </ExpandableRow>

          {/* ── Category grid ── */}
          <VStack align="flex-start" spacing={Spacing.sm_12} style={styles.gridContainer}>

            {/* Row 1: Medições + Medicação */}
            <HStack spacing={Spacing.sm_12} style={styles.gridRow}>
              <CategoryCard
                iconName="favorite"
                iconColor={Color.Semantic.measurements}
                title={t('elderly.measurements')}
                count={measurements.length}
                active={activeSection === 'measurements'}
                onPress={() => toggleSection('measurements')}
                onAdd={() => openAdd('measurement')}
              />
              <CategoryCard
                iconName="medication"
                iconColor={Color.Semantic.medication}
                title={t('elderly.medications')}
                count={medications.length}
                active={activeSection === 'medications'}
                onPress={() => toggleSection('medications')}
                onAdd={() => openAdd('medication')}
              />
            </HStack>

            {activeSection === 'measurements' && (
              <VStack style={styles.inlineSection}>
                {measurements.length === 0
                  ? <Text style={styles.emptyText}>Sem registos</Text>
                  : measurements.map((m, i) => (
                    <View key={m.id}>
                      {i > 0 && <View style={styles.infoDivider} />}
                      <HStack align="center" spacing={Spacing.sm_8} style={styles.infoCardRow}>
                        <View style={[styles.iconContainer, { backgroundColor: Color.Semantic.measurements + '15' }]}>
                          <MaterialIcons name="favorite" size={18} color={Color.Semantic.measurements} />
                        </View>
                        <VStack align="flex-start" style={styles.infoTextContainer}>
                          <Text style={styles.infoLabel}>{MEASUREMENT_LABELS[m.type as MeasurementType] ?? m.type}</Text>
                          <Text style={styles.infoValue}>{m.value} {m.unit}</Text>
                          <Text style={styles.infoSubtext}>{formatDateLong(m.createdAt)}</Text>
                        </VStack>
                      </HStack>
                    </View>
                  ))}
              </VStack>
            )}

            {activeSection === 'medications' && (
              <VStack style={styles.inlineSection}>
                {medications.length === 0
                  ? <Text style={styles.emptyText}>Sem registos</Text>
                  : medications.map((m, i) => (
                    <View key={m.id}>
                      {i > 0 && <View style={styles.infoDivider} />}
                      <HStack align="flex-start" spacing={Spacing.sm_8} style={styles.infoCardRow}>
                        <View style={[styles.iconContainer, { backgroundColor: Color.Semantic.medication + '15' }]}>
                          <MaterialIcons name="medication" size={18} color={Color.Semantic.medication} />
                        </View>
                        <VStack align="flex-start" style={styles.infoTextContainer}>
                          <Text style={styles.infoValue}>{m.name}</Text>
                          {m.dosage && (
                            <Text style={styles.infoSubtext}>
                              {m.dosage}{m.frequency ? ` · ${m.frequency}` : ''}
                            </Text>
                          )}
                          {m.administration && <Text style={styles.infoSubtext}>{m.administration}</Text>}
                        </VStack>
                      </HStack>
                    </View>
                  ))}
              </VStack>
            )}

            {/* Row 2: Patologias + Quedas */}
            <HStack spacing={Spacing.sm_12} style={styles.gridRow}>
              <CategoryCard
                iconName="healing"
                iconColor={Color.Semantic.pathology}
                title={t('elderly.pathologies')}
                count={pathologies.length}
                active={activeSection === 'pathologies'}
                onPress={() => toggleSection('pathologies')}
                onAdd={() => openAdd('pathology')}
              />
              <CategoryCard
                iconName="warning"
                iconColor="#7B1FA2"
                title={t('elderly.fallOccurrences')}
                count={falls.length}
                active={activeSection === 'falls'}
                onPress={() => toggleSection('falls')}
                onAdd={() => openAdd('fall')}
              />
            </HStack>

            {activeSection === 'pathologies' && (
              <VStack style={styles.inlineSection}>
                {pathologies.length === 0
                  ? <Text style={styles.emptyText}>Sem registos</Text>
                  : pathologies.map((p, i) => (
                    <View key={p.id}>
                      {i > 0 && <View style={styles.infoDivider} />}
                      <HStack align="flex-start" spacing={Spacing.sm_8} style={styles.infoCardRow}>
                        <View style={[styles.iconContainer, { backgroundColor: Color.Semantic.pathology + '15' }]}>
                          <MaterialIcons name="healing" size={18} color={Color.Semantic.pathology} />
                        </View>
                        <VStack align="flex-start" style={styles.infoTextContainer}>
                          <Text style={styles.infoValue}>{p.name}</Text>
                          {p.status && <Text style={styles.infoSubtext}>{p.status}</Text>}
                          {p.diagnosisDate && (
                            <Text style={styles.infoSubtext}>Diagnóstico: {formatDateLong(p.diagnosisDate)}</Text>
                          )}
                          {p.notes && <Text style={styles.infoSubtext}>{p.notes}</Text>}
                        </VStack>
                      </HStack>
                    </View>
                  ))}
              </VStack>
            )}

            {activeSection === 'falls' && (
              <VStack style={styles.inlineSection}>
                {falls.length === 0
                  ? <Text style={styles.emptyText}>Sem registos</Text>
                  : falls.map((f, i) => (
                    <View key={f.id}>
                      {i > 0 && <View style={styles.infoDivider} />}
                      <HStack align="flex-start" spacing={Spacing.sm_8} style={styles.infoCardRow}>
                        <View style={[styles.iconContainer, { backgroundColor: '#7B1FA215' }]}>
                          <MaterialIcons name="warning" size={18} color="#7B1FA2" />
                        </View>
                        <VStack align="flex-start" style={styles.infoTextContainer}>
                          <Text style={styles.infoValue}>{formatDateLong(f.date)}</Text>
                          {f.injured && (
                            <Text style={[styles.infoSubtext, { color: Color.Error.default }]}>Com lesão</Text>
                          )}
                          {f.injuryDescription && <Text style={styles.infoSubtext}>{f.injuryDescription}</Text>}
                          {f.description && <Text style={styles.infoSubtext}>{f.description}</Text>}
                        </VStack>
                      </HStack>
                    </View>
                  ))}
              </VStack>
            )}

            {/* Row 3: SOS + Calendário */}
            <HStack spacing={Spacing.sm_12} style={styles.gridRow}>
              <CategoryCard
                iconName="sos"
                iconColor={Color.Warning.amber}
                title={t('sosOccurrence.title')}
                active={activeSection === 'sos'}
                onPress={() => toggleSection('sos')}
              />
              <CategoryCard
                iconName="calendar-month"
                iconColor={Color.primary}
                title={t('navigation.calendar')}
                active={activeSection === 'calendar'}
                onPress={() => toggleSection('calendar')}
              />
            </HStack>

            {activeSection === 'sos' && (
              <VStack style={styles.inlineSection}>
                <Text style={styles.emptyText}>Sem registos</Text>
              </VStack>
            )}
            {activeSection === 'calendar' && (
              <VStack style={styles.inlineSection}>
                <Text style={styles.emptyText}>Sem registos</Text>
              </VStack>
            )}

            {/* Row 4: Rastreio de Feridas (full width) */}
            <HStack spacing={Spacing.sm_12} style={styles.gridRow}>
              <CategoryCard
                iconName="healing"
                iconColor={Color.Error.default}
                title={t('woundTracking.title')}
                fullWidth
                active={activeSection === 'wounds'}
                onPress={() => toggleSection('wounds')}
              />
            </HStack>

            {activeSection === 'wounds' && (
              <VStack style={styles.inlineSection}>
                <Text style={styles.emptyText}>Sem registos</Text>
              </VStack>
            )}

          </VStack>
        </VStack>
      </ScrollView>

      {renderModal()}
    </SafeAreaView>
  );
};

// ── Styles ────────────────────────────────────────────────────────────────────
const MEASUREMENT_LABELS: Record<MeasurementType, string> = {
  [MeasurementType.BLOOD_PRESSURE_SYSTOLIC]: 'Pressão Arterial Sistólica',
  [MeasurementType.BLOOD_PRESSURE_DIASTOLIC]: 'Pressão Arterial Diastólica',
  [MeasurementType.HEART_RATE]: 'Frequência Cardíaca',
  [MeasurementType.WEIGHT]: 'Peso',
  [MeasurementType.HEIGHT]: 'Altura',
  [MeasurementType.BODY_TEMPERATURE]: 'Temperatura Corporal',
  [MeasurementType.BLOOD_GLUCOSE]: 'Glicemia',
  [MeasurementType.OXYGEN_SATURATION]: 'Saturação de Oxigénio',
  [MeasurementType.BALANCE_SCORE]: 'Equilíbrio',
  [MeasurementType.MOBILITY_SCORE]: 'Mobilidade',
  [MeasurementType.COGNITIVE_SCORE]: 'Cognitivo',
};

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: Color.white },
  headerBar: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: Color.primary,
    paddingHorizontal: Spacing.md_16, paddingVertical: Spacing.sm_12,
    gap: Spacing.sm_8,
  },
  backBtn: { width: 40, height: 40, alignItems: 'center', justifyContent: 'center' },
  headerTitle: {
    flex: 1, fontFamily: FontFamily.semi_bold, fontSize: FontSize.bodylarge_18,
    color: Color.Background.white, textAlign: 'center',
  },
  scrollContainer: { flexGrow: 1, ...spacingStyles.screenScrollContainer },
  // Header
  header: { alignItems: 'center' },
  avatarCircle: {
    width: 100, height: 100, borderRadius: Border.full,
    backgroundColor: Color.primary + '18', alignItems: 'center', justifyContent: 'center',
  },
  name: { fontSize: FontSize.large, fontFamily: FontFamily.bold },
  institution: { fontSize: 16, color: 'gray' },
  // Info cards
  infoCardContainer: { alignSelf: 'stretch' },
  infoCard: {
    backgroundColor: Color.Background.white, borderRadius: Border.md_12,
    padding: Spacing.md_16,
    shadowColor: Color.dark, shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05, shadowRadius: 2, elevation: 1,
    borderWidth: 1, borderColor: Color.Gray.v200,
  },
  infoCardRow: { alignItems: 'center', minHeight: 44 },
  infoDivider: {
    height: 1, backgroundColor: Color.Gray.v200,
    marginVertical: Spacing.sm_8, marginHorizontal: Spacing.xs_4,
  },
  iconContainer: {
    width: 36, height: 36, borderRadius: Border.sm_8,
    alignItems: 'center', justifyContent: 'center',
  },
  infoTextContainer: { flex: 1 },
  infoLabel: { fontSize: FontSize.bodysmall_14, fontFamily: FontFamily.medium, color: Color.Gray.v400, marginBottom: 2 },
  infoValue: { fontSize: FontSize.bodymedium_16, fontFamily: FontFamily.semi_bold, color: Color.dark },
  infoSubtext: { fontSize: FontSize.bodysmall_14, fontFamily: FontFamily.regular, color: Color.Gray.v400, marginTop: 2 },
  // Category grid
  gridContainer: { alignSelf: 'stretch' },
  gridRow: { alignSelf: 'stretch' },
  categoryCard: {
    flex: 1, backgroundColor: Color.Background.white, borderRadius: Border.md_12,
    padding: Spacing.md_16, minHeight: 100,
    borderWidth: 1, borderColor: Color.Gray.v200,
    shadowColor: Color.dark, shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06, shadowRadius: 3, elevation: 2,
    alignItems: 'flex-start', justifyContent: 'space-between', position: 'relative',
  },
  categoryCardFull: {
    flex: undefined, flexDirection: 'row', alignItems: 'center',
    minHeight: 72, paddingVertical: Spacing.sm_12, gap: Spacing.sm_12,
  },
  categoryCardActive: {
    borderColor: Color.primary + '60', borderWidth: 1.5, backgroundColor: Color.primary + '06',
  },
  categoryIconContainer: { position: 'relative' },
  categoryIconWrap: {
    width: 52, height: 52, borderRadius: Border.sm_8, justifyContent: 'center', alignItems: 'center',
  },
  categoryTitle: {
    marginTop: Spacing.sm_8, fontSize: FontSize.bodysmall_14, fontFamily: FontFamily.semi_bold,
    color: Color.dark, flex: 1,
  },
  categoryBadge: {
    position: 'absolute', top: Spacing.sm_8, right: Spacing.sm_8 + 28,
    minWidth: 24, height: 24, borderRadius: Border.full,
    paddingHorizontal: Spacing.xs_4, justifyContent: 'center', alignItems: 'center',
  },
  categoryBadgeText: { fontSize: FontSize.caption_12, fontFamily: FontFamily.bold, color: Color.white },
  categoryAddBtn: {
    position: 'absolute', top: Spacing.sm_8, right: Spacing.sm_8,
    width: 22, height: 22, borderRadius: Border.full,
    justifyContent: 'center', alignItems: 'center',
  },
  categoryChevron: { position: 'absolute', bottom: Spacing.sm_8, right: Spacing.sm_8 },
  // Inline section
  inlineSection: {
    alignSelf: 'stretch', backgroundColor: Color.Background.white,
    borderRadius: Border.md_12, padding: Spacing.md_16,
    borderWidth: 1, borderColor: Color.Gray.v200,
    shadowColor: Color.dark, shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05, shadowRadius: 2, elevation: 1,
  },
  emptyText: {
    fontFamily: FontFamily.medium, fontSize: FontSize.bodymedium_16,
    color: Color.Gray.v500, paddingVertical: Spacing.sm_8,
  },
  // Modal
  modalOverlay: {
    flex: 1, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'flex-end',
  },
  modalSheet: {
    backgroundColor: Color.Background.white,
    borderTopLeftRadius: Border.lg_16, borderTopRightRadius: Border.lg_16,
    maxHeight: '85%',
  },
  modalHeader: {
    padding: Spacing.md_16,
    borderBottomWidth: 1, borderBottomColor: Color.Gray.v200,
    justifyContent: 'space-between', alignItems: 'center',
  },
  modalTitle: { fontSize: FontSize.bodylarge_18, fontFamily: FontFamily.semi_bold, color: Color.dark },
  // Forms
  formLabel: {
    fontSize: FontSize.bodysmall_14, fontFamily: FontFamily.medium,
    color: Color.Gray.v500, marginBottom: 2,
  },
  formInput: {
    alignSelf: 'stretch', borderWidth: 1, borderColor: Color.Gray.v300,
    borderRadius: Border.sm_8, paddingHorizontal: Spacing.sm_12,
    paddingVertical: Spacing.sm_8, fontSize: FontSize.bodymedium_16,
    fontFamily: FontFamily.regular, color: Color.dark,
    backgroundColor: Color.Background.white,
  },
  chipScroll: { maxHeight: 44 },
  chip: {
    paddingHorizontal: Spacing.sm_12, paddingVertical: Spacing.xs_6,
    borderRadius: Border.full, borderWidth: 1, borderColor: Color.Gray.v300,
    backgroundColor: Color.Background.white, marginRight: Spacing.xs_4,
  },
  chipActive: { backgroundColor: Color.primary, borderColor: Color.primary },
  chipText: { fontSize: FontSize.bodysmall_14, fontFamily: FontFamily.medium, color: Color.Gray.v500 },
  chipTextActive: { color: Color.white },
  toggleBtn: {
    flexDirection: 'row', alignItems: 'center', gap: Spacing.xs_6,
    paddingVertical: Spacing.xs_6,
  },
  toggleBtnActive: {},
  toggleText: { fontSize: FontSize.bodymedium_16, fontFamily: FontFamily.medium, color: Color.Gray.v500 },
  submitBtn: {
    marginTop: Spacing.md_16, backgroundColor: Color.primary,
    borderRadius: Border.md_12, paddingVertical: Spacing.sm_12,
    alignItems: 'center', justifyContent: 'center',
  },
  submitBtnText: { color: Color.white, fontFamily: FontFamily.semi_bold, fontSize: FontSize.bodymedium_16 },
});

export default ExternalElderlyProfileScreen;
