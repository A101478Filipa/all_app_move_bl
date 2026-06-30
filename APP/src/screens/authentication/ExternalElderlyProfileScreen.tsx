import React, { useState, useCallback } from 'react'; 
import { View, Text, ScrollView, StyleSheet, TouchableOpacity, RefreshControl } from 'react-native'; // Adicionado RefreshControl
import { SafeAreaView } from 'react-native-safe-area-context';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { MaterialIcons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native'; 
import { LoginStackParamList } from '@src/navigation/LoginNavigator';
import { Color } from '@src/styles/colors';
import { FontFamily, FontSize } from '@src/styles/fonts';
import { Spacing } from '@src/styles/spacings';
import { Border } from '@src/styles/borders';
import { HStack, VStack } from '@components/CoreComponents';
import { useTranslation } from '@src/localization/hooks/useTranslation';
import { Measurement } from 'moveplus-shared';

type Props = NativeStackScreenProps<LoginStackParamList, 'ExternalElderlyProfile'>;
type AddModal = 'measurement' | 'medication' | 'pathology' | 'wound' | null;

const CategoryCard = ({ iconName, iconColor, title, count, onPress, onAdd, hideCount }: any) => (
  <TouchableOpacity style={[styles.categoryCard, { flex: 1 }]} onPress={onPress} activeOpacity={0.75}>
    <View style={styles.categoryIconContainer}>
      <View style={[styles.categoryIconWrap, { backgroundColor: iconColor + '18' }]}>
        <MaterialIcons name={iconName} size={28} color={iconColor} />
      </View>
    </View>
    <Text style={styles.categoryTitle}>{title}</Text>
    {!hideCount && count !== undefined && (
    <View style={styles.categoryBadge}><Text>{count}</Text></View>)}
    {onAdd && (
      <TouchableOpacity style={[styles.categoryAddBtn, { backgroundColor: iconColor }]} onPress={e => { e.stopPropagation(); onAdd(); }}>
        <MaterialIcons name="add" size={14} color="#fff" />
      </TouchableOpacity>
    )}
  </TouchableOpacity>
);

const ExternalElderlyProfileScreen: React.FC<Props> = ({ route, navigation }) => {
  const [profile, setProfile] = useState(route.params.profile); // Tornamos o profile um estado para ser atualizável
  const [refreshing, setRefreshing] = useState(false); // Estado para o Pull-to-Refresh
  const { elderly, event } = profile;
  const { t } = useTranslation();
  const [addModal, setAddModal] = useState<AddModal>(null);

  const handleNavigate = (screenName: string, allData: any[], type: AddModal) => {
    const safeData = allData ?? [];
    let filteredData = [...safeData];

    // Lógica de Filtro para o Externo
    if (type === 'wound') {
      // Filtra apenas feridas "em acompanhamento"
      filteredData = safeData.filter(w => w.status === 'IN_PROGRESS' || w.status === 'UNDER_TREATMENT');
    }
    // NOTA: Para medicação e patologia, deixamos o array completo 
    navigation.navigate(screenName as any, { 
      elderlyId: elderly.id, 
      initialData: filteredData, // Envia apenas o que foi permitido
      isExternalToken: true,
    });
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      <View style={styles.headerBar}>
        <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}><MaterialIcons name="arrow-back" size={22} color={Color.Background.white} /></TouchableOpacity>
        <Text style={styles.headerTitle}>{elderly.name}</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView 
        contentContainerStyle={styles.scrollContainer} 
        showsVerticalScrollIndicator={false}
      >
        <VStack align="flex-start" spacing={Spacing.lg_24}>
          <HStack spacing={Spacing.lg_24} style={styles.header}>
            <View style={styles.avatarCircle}><MaterialIcons name="person" size={48} color={Color.primary} /></View>
            <VStack align="flex-start" spacing={Spacing.xs_4}>
              <Text style={styles.name}>{elderly.name}</Text>
              <Text style={styles.institution}>{event.title}</Text>
            </VStack>
          </HStack>

          <VStack align="flex-start" spacing={Spacing.sm_12} style={styles.gridContainer}>
            <HStack spacing={Spacing.sm_12} style={styles.gridRow}>
              <CategoryCard iconName="favorite" iconColor={Color.Semantic.measurements} title={t('elderly.measurements')} count={(profile.elderly.measurements || []).length} hideCount={true} onPress={() => handleNavigate('ElderlyMeasurementsList', profile.elderly.measurements, 'measurement')} onAdd={() => setAddModal('measurement')} />
              <CategoryCard iconName="medication" iconColor={Color.Semantic.medication} title={t('elderly.medications')} count={(profile.elderly.medications || []).length} hideCount={true} onPress={() => handleNavigate('ElderlyMedicationsList', profile.elderly.medications, 'medication')} onAdd={() => setAddModal('medication')} />
            </HStack>
            
            <HStack spacing={Spacing.sm_12} style={styles.gridRow}>
              <CategoryCard iconName="healing" iconColor={Color.Semantic.pathology} title={t('elderly.pathologies')} count={(profile.elderly.pathologies || []).length} hideCount={true} onPress={() => handleNavigate('ElderlyPathologiesList', profile.elderly.pathologies, 'pathology')} onAdd={() => setAddModal('pathology')} />
              <CategoryCard iconName="healing" iconColor={Color.Error.default} title={t('woundTracking.title')} count={(profile.elderly.recentWounds || []).length} hideCount={true} onPress={() => handleNavigate('ElderlyWoundTrackingScreen', profile.elderly.recentWounds, 'wound')} />
            </HStack>

          </VStack>
        </VStack>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: Color.white },
  headerBar: { flexDirection: 'row', alignItems: 'center', backgroundColor: Color.primary, paddingHorizontal: Spacing.md_16, paddingVertical: Spacing.sm_12 },
  backBtn: { width: 40, height: 40, alignItems: 'center', justifyContent: 'center' },
  headerTitle: { flex: 1, fontFamily: FontFamily.semi_bold, fontSize: FontSize.bodylarge_18, color: Color.Background.white, textAlign: 'center' },
  scrollContainer: { flexGrow: 1, padding: Spacing.md_16 },
  header: { alignItems: 'center', marginBottom: Spacing.md_16 },
  avatarCircle: { width: 100, height: 100, borderRadius: Border.full, backgroundColor: Color.primary + '18', alignItems: 'center', justifyContent: 'center' },
  name: { fontSize: FontSize.large, fontFamily: FontFamily.bold },
  institution: { fontSize: 16, color: 'gray' },
  gridContainer: { alignSelf: 'stretch' },
  gridRow: { alignSelf: 'stretch', marginBottom: Spacing.sm_12, flexDirection: 'row', gap: Spacing.sm_12, alignItems: 'stretch'},
  categoryCard: { flex: 1, backgroundColor: Color.Background.white, borderRadius: Border.md_12, padding: Spacing.md_16, minHeight: 120, borderWidth: 1, borderColor: Color.Gray.v200, justifyContent: 'center', position: 'relative' },
  categoryIconWrap: { width: 52, height: 52, borderRadius: Border.sm_8, justifyContent: 'center', alignItems: 'center' },
  categoryTitle: { marginTop: Spacing.sm_8, fontSize: FontSize.bodysmall_14, fontFamily: FontFamily.semi_bold, color: Color.dark },
  categoryBadge: { position: 'absolute', top: Spacing.sm_8, right: Spacing.sm_8, minWidth: 24, height: 24, borderRadius: Border.full, justifyContent: 'center', alignItems: 'center' },
  categoryBadgeText: { fontSize: FontSize.caption_12, fontFamily: FontFamily.bold, color: Color.white },
  categoryAddBtn: { position: 'absolute', bottom: Spacing.sm_8, right: Spacing.sm_8, width: 22, height: 22, borderRadius: Border.full, justifyContent: 'center', alignItems: 'center' },
  categoryIconContainer: { position: 'relative' },
});

export default ExternalElderlyProfileScreen;