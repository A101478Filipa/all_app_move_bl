import React, { useEffect, useState, useLayoutEffect } from 'react';
import { View, Text, ScrollView, StyleSheet, RefreshControl } from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { Measurement, MeasurementType, UserRole } from 'moveplus-shared';
import { MeasurementOverviewComponent } from '@components/MeasurementOverviewComponent';
import { useElderlyDetailsStore } from '@src/stores/elderlyDetailsStore';
import { groupMeasurements } from '@src/utils/chartsHelper';
import { Color } from '@src/styles/colors';
import { FontFamily, FontSize } from '@src/styles/fonts';
import { Spacing, spacingStyles } from '@src/styles/spacings';
import { Border } from '@src/styles/borders';
import { useTranslation } from '@src/localization/hooks/useTranslation';
import ScreenState from '@src/constants/screenState';
import { elderlyApi } from '@api/endpoints/elderly'; // Importa a API
import { useAuthStore } from "@stores/authStore";

type Props = NativeStackScreenProps<any, 'ElderlyMeasurementsList'>;

const ElderlyMeasurementsListScreen: React.FC<Props> = ({ route, navigation }) => {
  const params = route.params as { elderlyId?: number; initialData?: any; isExternalToken?: boolean };
  const { elderlyId, initialData, isExternalToken } = route.params as any;
  const { t } = useTranslation();
  const { user } = useAuthStore();
  const userRole = user?.user?.role;
  const isExternal = isExternalToken === true; 
  
  // Estado local para armazenar as medições buscadas manualmente
  const [localMeasurements, setLocalMeasurements] = useState<Measurement[]>(initialData || []);
  const [loading, setLoading] = useState(false);
  
  const { elderly, state, refreshElderly } = useElderlyDetailsStore();

  useEffect(() => {
    // 1. Caso Externo (com dados pré-carregados)
    if (initialData && initialData.length > 0) {
      setLocalMeasurements(initialData);
      setLoading(false);
      return;
    }

    // 2. Caso Interno (buscar na API)
    if (elderlyId) {
      const fetchAllMeasurements = async () => {
        setLoading(true);
        try {
          // Filtramos apenas os tipos que realmente existem no teu Enum
          const allTypes = Object.values(MeasurementType);
          
          const results = await Promise.all(
            allTypes.map(type => 
              elderlyApi.getMeasurementsByType(elderlyId, type)
                .then(res => res.data || [])
                .catch(() => [])
            )
          );
          
          const flatResults = results.flat();
          setLocalMeasurements(flatResults);
        } catch (error) {
          console.error("Erro ao buscar medições:", error);
        } finally {
          setLoading(false);
        }
      };

      fetchAllMeasurements();
    } else {
      // Caso de segurança: se não houver elderlyId, limpamos
      setLocalMeasurements([]);
      setLoading(false);
    }
  }, [elderlyId, initialData]); 

  // Se tem initialData, usa as locais, senão usa o store
  const displayMeasurements = localMeasurements;
  const grouped = groupMeasurements(displayMeasurements); 
  const allPossibleTypes = Object.values(MeasurementType);

  const latestHeightCm = grouped[MeasurementType.HEIGHT]?.length
    ? [...grouped[MeasurementType.HEIGHT]!].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())[0].value
    : undefined;


  useLayoutEffect(() => {
    const title = t(`navigation.${route.name}`);
    navigation.setOptions({ title, headerTitle: title });
  }, [navigation, route.name, t]);

  return (
    <View style={styles.container}>
      <ScrollView
        contentContainerStyle={styles.content}
        refreshControl={
          !isExternal ? (
            <RefreshControl refreshing={state === ScreenState.REFRESHING} onRefresh={() => refreshElderly(elderlyId ?? 0)} />
          ) : undefined
        }
      >
        {allPossibleTypes
          .filter(type => grouped[type as keyof typeof grouped] && grouped[type as keyof typeof grouped]!.length > 0)
          .map(type => (
            <MeasurementOverviewComponent
              key={type}
              elderlyId={elderlyId ?? 0}
              measurementType={type as MeasurementType}
              measurements={grouped[type as keyof typeof grouped] ?? []}
              navigation={isExternal ? undefined : navigation} 
              isExternal={isExternal}
              latestHeightCm={type === MeasurementType.WEIGHT ? latestHeightCm : undefined}
            />
          ))}
      </ScrollView>
    </View>
  );
};

export default ElderlyMeasurementsListScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Color.Background.subtle,
  },
  content: {
    ...spacingStyles.screenScrollContainer,
    gap: Spacing.sm_8,
  },
  emptyState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: Spacing.xl_32,
    gap: Spacing.sm_8,
  },
  emptyText: {
    fontSize: FontSize.bodymedium_16,
    fontFamily: FontFamily.medium,
    color: Color.Gray.v400,
    textAlign: 'center',
  },
  headerButton: {
    width: 36,
    height: 36,
    borderRadius: Border.sm_8,
    backgroundColor: Color.Orange.v300,
    justifyContent: 'center',
    alignItems: 'center',
  },
});
