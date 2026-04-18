import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, ScrollView, SafeAreaView, Animated } from 'react-native';
import { Color } from '@src/styles/colors';
import { FontFamily, FontSize } from '@src/styles/fonts';
import { Spacing, spacingStyles } from '@src/styles/spacings';
import { Border } from '@src/styles/borders';
import { shadowStyles } from '@src/styles/shadow';
import { MaterialIcons } from '@expo/vector-icons';
import { VStack } from '@components/CoreComponents';
import { elderlyApi } from '@src/api/endpoints/elderly';
import { SearchElderlyResponse } from 'moveplus-shared';
import { ActivityIndicatorOverlay } from '@components/ActivityIndicatorOverlay';
import { PatientResultCard } from '../../components/PatientResultCard';
import { useDebounce } from '@src/hooks/useDebounce';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useTranslation } from '@src/localization/hooks/useTranslation';

const SearchElderlyScreen = () => {
  const { t } = useTranslation();
  const navigation = useNavigation<NativeStackNavigationProp<any>>();
  const [medicalId, setMedicalId] = useState('');
  const [searchResult, setSearchResult] = useState<SearchElderlyResponse | null>(null);
  const [isSearching, setIsSearching] = useState(false);
  const [fadeAnim] = useState(new Animated.Value(0));

  const debouncedMedicalId = useDebounce(medicalId, 500);

  const handleSearch = async (id: string) => {
    if (!id.trim()) {
      setSearchResult(null);
      return;
    }

    const medicalIdNumber = parseInt(id.trim(), 10);
    if (isNaN(medicalIdNumber)) {
      setSearchResult(null);
      return;
    }

    setIsSearching(true);
    fadeAnim.setValue(0);

    try {
      const response = await elderlyApi.searchByMedicalId(medicalIdNumber);
      setSearchResult(response.data);

      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 400,
        useNativeDriver: true,
      }).start();
    } catch (error) {
      setSearchResult(null);
    } finally {
      setIsSearching(false);
    }
  };

  useEffect(() => {
    handleSearch(debouncedMedicalId);
  }, [debouncedMedicalId]);

  const handleAccessRequested = () => {
    handleSearch(medicalId);
  };

  const handlePatientPress = () => {
    if (searchResult) {
      navigation.navigate('ElderlyDetails', { elderlyId: searchResult.id });
    }
  };

  const handleClear = () => {
    setMedicalId('');
    setSearchResult(null);
  };

  return (
    <SafeAreaView style={{ flex: 1 }}>
      <ScrollView style={styles.container} contentContainerStyle={styles.contentContainer}>
        <VStack spacing={Spacing.xl_32} style={{ alignSelf: 'stretch' }}>
          {/* Search Input Section */}
          <View style={[
            styles.searchInputContainer,
            medicalId.length > 0 && styles.searchInputContainerFocused
          ]}>
            <TextInput
              style={styles.searchInput}
              placeholder={t('searchElderly.medicalIdPlaceholder')}
              placeholderTextColor={Color.Gray.v300}
              value={medicalId}
              onChangeText={setMedicalId}
              keyboardType="number-pad"
              returnKeyType="done"
            />
            {medicalId.length > 0 && (
              <TouchableOpacity onPress={handleClear} style={styles.clearButton}>
                <MaterialIcons name="close" size={20} color={Color.Gray.v400} />
              </TouchableOpacity>
            )}
          </View>

          {/* Search Result */}
          {searchResult && (
            <PatientResultCard
              patient={searchResult}
              fadeAnim={fadeAnim}
              onAccessRequested={handleAccessRequested}
              onPatientPress={handlePatientPress}
            />
          )}

          {/* No Result Message */}
          {medicalId && !searchResult && !isSearching && (
            <Animated.View style={{ opacity: fadeAnim }}>
              <View style={styles.noResultContainer}>
                <View style={styles.noResultIconContainer}>
                  <MaterialIcons name="person-search" size={80} color={Color.Gray.v200} />
                </View>
                <Text style={styles.noResultText}>{t('searchElderly.noPatientFound')}</Text>
                <Text style={styles.noResultSubtext}>
                  {t('searchElderly.noPatientFoundMessage', { medicalId: debouncedMedicalId })}
                </Text>
                <Text style={styles.noResultHint}>
                  {t('searchElderly.verifyIdHint')}
                </Text>
              </View>
            </Animated.View>
          )}

          {/* Empty State */}
          {!medicalId && !searchResult && (
            <View style={styles.emptyStateContainer}>
              <View style={styles.emptyStateIconContainer}>
                <MaterialIcons name="search" size={100} color={Color.Gray.v100} />
              </View>
              <Text style={styles.emptyStateText}>{t('searchElderly.startSearch')}</Text>
              <Text style={styles.emptyStateSubtext}>
                {t('searchElderly.startSearchMessage')}
              </Text>
            </View>
          )}
        </VStack>

        {isSearching && <ActivityIndicatorOverlay />}
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Color.Background.subtle,
  },
  contentContainer: {
    ...spacingStyles.screenScrollContainer,
  },
  searchInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Color.white,
    borderRadius: Border.lg_16,
    borderWidth: 2,
    borderColor: Color.Gray.v200,
    ...shadowStyles.cardShadow,
  },
  searchInputContainerFocused: {
    borderColor: Color.primary,
    borderWidth: 2,
  },
  searchInput: {
    flex: 1,
    fontSize: FontSize.bodylarge_18,
    fontFamily: FontFamily.medium,
    color: Color.dark,
    paddingHorizontal: Spacing.lg_24,
    paddingVertical: Spacing.md_16,
  },
  clearButton: {
    padding: Spacing.xs_4,
    borderRadius: Border.sm_8,
    backgroundColor: Color.Gray.v100,
    marginEnd: Spacing.sm_8,
  },
  noResultContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: Spacing.xl3_48,
    paddingHorizontal: Spacing.lg_24,
  },
  noResultIconContainer: {
    marginBottom: Spacing.lg_24,
  },
  noResultText: {
    fontSize: FontSize.xl_20,
    fontFamily: FontFamily.bold,
    color: Color.Gray.v500,
    marginBottom: Spacing.sm_8,
  },
  noResultSubtext: {
    fontSize: FontSize.bodymedium_16,
    fontFamily: FontFamily.regular,
    color: Color.Gray.v400,
    textAlign: 'center',
    marginBottom: Spacing.xs_4,
  },
  noResultHint: {
    fontSize: FontSize.small,
    fontFamily: FontFamily.regular,
    color: Color.Gray.v300,
    textAlign: 'center',
  },
  emptyStateContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: Spacing.xl5_64,
    paddingHorizontal: Spacing.lg_24,
  },
  emptyStateIconContainer: {
    marginBottom: Spacing.lg_24,
    opacity: 0.5,
  },
  emptyStateText: {
    fontSize: FontSize.xl_20,
    fontFamily: FontFamily.bold,
    color: Color.Gray.v400,
    marginBottom: Spacing.sm_8,
  },
  emptyStateSubtext: {
    fontSize: FontSize.bodymedium_16,
    fontFamily: FontFamily.regular,
    color: Color.Gray.v300,
    textAlign: 'center',
  },
});

export default SearchElderlyScreen;
