import React, { useEffect, useState, useLayoutEffect } from 'react';
import { View, Text, ScrollView, StyleSheet, RefreshControl } from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { Measurement, MeasurementType } from 'moveplus-shared';
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

type Props = NativeStackScreenProps<any, 'ElderlyMeasurementsList'>;

const ElderlyMeasurementsListScreen: React.FC<Props> = ({ route, navigation }) => {
  const params = route.params as { elderlyId?: number; initialData?: any };
  const { elderlyId, initialData } = params;
  const { t } = useTranslation();
  
  // Estado local para armazenar as medições buscadas manualmente
  const [localMeasurements, setLocalMeasurements] = useState<Measurement[]>(initialData || []);
  const [loading, setLoading] = useState(false);
  
  const { elderly, state, refreshElderly } = useElderlyDetailsStore();

  useEffect(() => {
    if (initialData && initialData.length > 0) {
      setLocalMeasurements(initialData);
      return;
    }
    // Se não temos initialData (caso do externo), buscamos tudo na API
    if (!initialData && elderlyId) {
      const fetchAllMeasurements = async () => {
        setLoading(true);
        try {
          const allTypes = Object.values(MeasurementType);
          console.log("Tipos a buscar na API:", allTypes); // VEJA O QUE APARECE AQUI NO TERMINAL

          const promises = allTypes.map(type => 
            elderlyApi.getMeasurementsByType(elderlyId, type)
              .then(res => {
                console.log(`Tipo ${type} retornou:`, res.data?.length || 0); // VEJA SE ALGUM RETORNA 0
                return res.data || [];
              })
              .catch(() => [])
          );
          
          const results = await Promise.all(promises);
          const flatResults = results.flat();
          setLocalMeasurements(flatResults);
        } catch (error) {
          console.error("Erro:", error);
        } finally {
          setLoading(false);
        }
      };
      fetchAllMeasurements();
    } else if (initialData) {
      // Se passámos dados iniciais, usamos esses
      setLocalMeasurements(initialData);
    }
  }, [elderlyId, initialData]);

  // Se tem initialData, usa as locais, senão usa o store
  const displayMeasurements = localMeasurements;
  const grouped = groupMeasurements(displayMeasurements); 
  const allPossibleTypes = Object.values(MeasurementType);

  console.log("Medições totais no estado local:", displayMeasurements.length);
  console.log("Grupos formados:", Object.keys(grouped));

  const latestHeightCm = grouped[MeasurementType.HEIGHT]?.length
    ? [...grouped[MeasurementType.HEIGHT]!].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())[0].value
    : undefined;
  
  const isExternal = !initialData;

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
