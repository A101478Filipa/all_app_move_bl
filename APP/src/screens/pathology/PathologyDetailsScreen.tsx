import React, { useState, useEffect, useLayoutEffect } from 'react';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { InstitutionDashboardNavigationStackParamList } from '@src/navigation/InstitutionDashboardNavigationStack';
import { PathologyDetailsComponent } from '@components/screens/PathologyDetailsComponent';
import { pathologyApi } from '@src/api/endpoints/pathologies';
import { Pathology, UserRole } from 'moveplus-shared';
import { ActivityIndicatorOverlay } from '@components/ActivityIndicatorOverlay';
import { useErrorHandler } from '@hooks/useErrorHandler';
import ScreenState from '@constants/screenState';
import { useTranslation } from 'react-i18next';
import { SafeAreaView, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { VStack } from '@components/CoreComponents';
import { MaterialIcons } from '@expo/vector-icons';
import { Color } from '@src/styles/colors';
import { FontFamily, FontSize } from '@src/styles/fonts';
import { Spacing } from '@src/styles/spacings';
import { useAuthStore } from '@stores/authStore';
import { useFocusEffect } from '@react-navigation/native';

type Props = NativeStackScreenProps<InstitutionDashboardNavigationStackParamList, 'PathologyDetails'>;

interface PathologyDetailsScreenRouteParams {
  pathologyId: number;
}

interface PathologyWithElderly extends Pathology {
  elderly?: {
    id: number;
    name: string;
    institutionId: number;
  };
}

const PathologyDetailsScreen: React.FC<Props> = ({ route, navigation }) => {
  const pathologyId = (route.params as any).pathologyId;
  const { t } = useTranslation();
  const { handleError } = useErrorHandler();
  const { user } = useAuthStore();

  const [pathology, setPathology] = useState<PathologyWithElderly | null>(null);
  const [state, setState] = useState<ScreenState>(ScreenState.LOADING);

  const fetchPathology = async () => {
    try {
      setState(ScreenState.LOADING);
      const response = await pathologyApi.getPathology(pathologyId);
      setPathology(response.data);
      setState(ScreenState.IDLE);
    } catch (error) {
      console.error('Failed to fetch pathology:', error);
      handleError(error, t('pathology.failedToLoadPathology'));
      setState(ScreenState.ERROR);
    }
  };

  useFocusEffect(
    React.useCallback(() => {
      fetchPathology();
    }, [pathologyId])
  );

  const canEditPathology = user && (
    user.user.role === UserRole.INSTITUTION_ADMIN ||
    user.user.role === UserRole.CLINICIAN ||
    user.user.role === UserRole.PROGRAMMER
  );

  const handleEditPress = () => {
    if (pathology?.elderlyId) {
      navigation.push('EditPathology', {
        pathology,
        elderlyId: pathology.elderlyId
      });
    }
  };

  useLayoutEffect(() => {
    navigation.setOptions({
      headerRight: () => {
        if (canEditPathology && pathology?.elderlyId) {
          return (
            <TouchableOpacity onPress={handleEditPress} style={styles.headerEditButton}>
              <MaterialIcons name="settings" size={24} color={Color.primary} />
            </TouchableOpacity>
          );
        }
        return null;
      },
    });
  }, [navigation, canEditPathology, pathology, handleEditPress]);

  if (state === ScreenState.LOADING) {
    return <ActivityIndicatorOverlay />;
  }

  if (state === ScreenState.ERROR || !pathology) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <VStack align="center" style={styles.errorContainer}>
          <MaterialIcons name="error-outline" size={48} color={Color.Error.default} />
          <Text style={styles.errorText}>{t('pathology.failedToLoadPathology')}</Text>
        </VStack>
      </SafeAreaView>
    );
  }

  return (
    <PathologyDetailsComponent
      pathologyName={pathology.name}
      description={pathology.description}
      diagnosisSite={pathology.diagnosisSite}
      status={pathology.status}
      notes={pathology.notes}
      createdAt={new Date(pathology.createdAt)}
      elderlyName={pathology.elderly?.name}
    />
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: Color.Background.subtle,
  },
  headerEditButton: {
    padding: Spacing.xs_4,
    marginRight: Spacing.xs_4,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: Spacing.lg_24,
  },
  errorText: {
    fontSize: FontSize.heading3_24,
    fontFamily: FontFamily.medium,
    color: Color.Error.default,
    textAlign: 'center',
    marginTop: Spacing.md_16,
  },
});

export default PathologyDetailsScreen;