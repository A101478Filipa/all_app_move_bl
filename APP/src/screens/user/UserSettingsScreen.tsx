import React, { useCallback, useEffect, useState } from 'react';
import {
  ScrollView,
  StyleSheet,
  Image,
  Text,
  TouchableOpacity,
  View,
  ActivityIndicator,
  SafeAreaView,
  Alert,
  Platform
} from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { VStack, HStack } from '@components/CoreComponents';
import { useAuthStore } from '@src/stores/authStore';
import { buildAvatarUrl } from '@src/services/ApiService';
import { Color } from '@src/styles/colors';
import { FontFamily, Typography } from '@src/styles/fonts';
import { Spacing, spacingStyles } from '@src/styles/spacings';
import { Border } from '@src/styles/borders';
import { InstitutionMember } from 'moveplus-shared';
import { FormTextInput } from '@components/forms/FormTextInput';
import { FormDateInput } from '@components/forms/FormDateInput';
import { FormDropdown } from '@components/forms/FormDropdown';
import { PrimaryButton } from '@components/ButtonComponents';
import { Gender, UserRole } from 'moveplus-shared';
import { useUserSettingsStore } from '@src/stores/userSettingsStore';
import ScreenState from '@src/constants/screenState';
import { UserMenuStackParamList } from '@navigation/UserMenuNavigationStack';
import { useErrorHandler } from '@src/hooks/useErrorHandler';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import { useTranslation } from '@src/localization/hooks/useTranslation';
import UnsavedChangesModal from '@components/UnsavedChangesModal';
import { useFocusEffect } from '@react-navigation/native';
import { settingsApi } from '@src/api/endpoints/settings';


type Props = NativeStackScreenProps<UserMenuStackParamList, 'UserSettings'>;

const getGenderOptions = (t: (key: string) => string) => [
  { label: t('gender.male'), value: Gender.MALE },
  { label: t('gender.female'), value: Gender.FEMALE },
  { label: t('gender.other'), value: Gender.OTHER },
];

const UserSettingsScreen: React.FC<Props> = ({ navigation }) => {
  const { user, refreshUser, config } = useAuthStore();
  const { handleError, handleSuccess, showWarning } = useErrorHandler();
  const { t } = useTranslation();

  const getRoleTranslation = (role: string) => {
    switch (role) {
      case UserRole.ELDERLY: return t('userRole.elderly');
      case UserRole.CAREGIVER: return t('userRole.caregiver');
      case UserRole.INSTITUTION_ADMIN: return t('userRole.admin');
      case UserRole.CLINICIAN: return t('userRole.clinician');
      case UserRole.PROGRAMMER: return t('userRole.programmer');
      default: return t('userRole.unknown');
    }
  };

  const {
    form,
    state,
    avatarUploading,
    error,
    initializeForm,
    updateFormField,
    saveSettings,
    pickAndUploadAvatar,
    takePhotoAndUploadAvatar,
    resetForm,
    clearError,
    hasUnsavedChanges,
  } = useUserSettingsStore();

  useEffect(() => {
    if (user) {
      initializeForm(user);
    }

    return () => {
      resetForm();
    };
  }, [user, initializeForm, resetForm]);

  useFocusEffect(
    useCallback(() => {
      const unsubscribe = navigation.addListener('beforeRemove', (e) => {
        if (!hasUnsavedChanges()) {
          return;
        }

        e.preventDefault();

        setPendingNavigation(() => () => navigation.dispatch(e.data.action));
        setShowUnsavedModal(true);
      });

      return unsubscribe;
    }, [navigation, hasUnsavedChanges])
  );

  const handleInputChange = (field: keyof typeof form, value: string | Gender | null) => {
    updateFormField(field, value);
  };

  const [isPickingImage, setIsPickingImage] = useState(false);
  const [showUnsavedModal, setShowUnsavedModal] = useState(false);
  const [pendingNavigation, setPendingNavigation] = useState<(() => void) | null>(null);

  const showAvatarOptions = () => {
    Alert.alert(
      t('settings.changeAvatar'),
      t('settings.chooseAvatarSource'),
      [
        {
          text: t('settings.takePhoto'),
          onPress: takePhoto,
        },
        {
          text: t('settings.chooseFromGallery'),
          onPress: pickImage,
        },
        {
          text: t('common.cancel'),
          style: 'cancel',
        },
      ],
      { cancelable: true }
    );
  };

  const pickImage = async () => {
    if (!user) return;

    try {
      setIsPickingImage(true);
      const success = await pickAndUploadAvatar(user);
      if (success) {
        console.log(config);
        await refreshUser({
          id: user.id,
          role: user.user.role,
          baseUrl: config.baseUrl
        });
        handleSuccess(t('settings.avatarUpdated'));
      }
    } catch (err) {
      handleError(err, t('settings.failedToUpdateAvatar'));
    } finally {
      setIsPickingImage(false);
    }
  };

  const takePhoto = async () => {
    if (!user) return;

    try {
      setIsPickingImage(true);
      const success = await takePhotoAndUploadAvatar(user);
      if (success) {
        await refreshUser({
          id: user.id,
          role: user.user.role,
          baseUrl: config.baseUrl
        });
        handleSuccess(t('settings.avatarUpdated'));
      }
    } catch (err) {
      handleError(err, t('settings.failedToUpdateAvatar'));
    } finally {
      setIsPickingImage(false);
    }
  };

  const handleSave = async () => {
    if (!user) return;

    const success = await saveSettings(user);
    if (success) {
      await refreshUser({
        id: user.id,
        role: user.user.role,
        baseUrl: config.baseUrl
      });

      handleSuccess(t('settings.profileUpdated'));
      navigation.goBack();
    } else if (error) {
      handleError(error);
    }
  };

  const handleLeaveWithoutSaving = () => {
    setShowUnsavedModal(false);
    if (pendingNavigation) {
      pendingNavigation();
    }
  };

  const handleCancelModal = () => {
    setShowUnsavedModal(false);
    setPendingNavigation(null);
  };

  const renderHeader = () => {
    const institution = (user as InstitutionMember)?.institution;

    return (
      <VStack style={styles.headerSection}>
        <HStack spacing={Spacing.md_16} align='center' style={styles.avatarInfoRow}>
          <TouchableOpacity
            style={styles.avatarContainer}
            onPress={showAvatarOptions}
            disabled={avatarUploading || isPickingImage}
            activeOpacity={0.8}
          >
            <Image
              source={{ uri: buildAvatarUrl(user?.user.avatarUrl || '') }}
              style={styles.avatar}
            />

            <View style={styles.uploadPhotoButton}>
              <MaterialIcons
                name="add-a-photo"
                size={16}
                color={Color.white}
              />
            </View>

            {(avatarUploading || isPickingImage) && (
              <View style={styles.avatarOverlay}>
                <ActivityIndicator size='small' color={Color.white} />
              </View>
            )}
          </TouchableOpacity>

          <VStack align="flex-start" spacing={Spacing.xs_4} style={styles.userInfo}>
            <Text
              style={styles.userName}
              numberOfLines={2}
              ellipsizeMode="tail"
            >
              {user?.name}
            </Text>

            {user?.user?.role && (
              <Text style={styles.roleText}>
                {getRoleTranslation(user.user.role)}
              </Text>
            )}


            {institution && (
              <Text
                style={styles.institutionName}
                numberOfLines={1}
                ellipsizeMode="tail"
              >
                {institution.name}
              </Text>
            )}
          </VStack>
        </HStack>
      </VStack>
    );
  };

  if (!user) {
    return (
      <SafeAreaView style={styles.container}>
        <VStack style={styles.loadingContainer} align="center">
          <ActivityIndicator size="large" color={Color.primary} />
          <Text style={styles.loadingText}>{t('common.loading')}</Text>
        </VStack>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        <VStack spacing={Spacing.lg_24} style={styles.content}>
          {renderHeader()}

          <VStack spacing={Spacing.md_16} style={styles.form}>
            <Text style={styles.sectionTitle}>{t('settings.personalInformation')}</Text>

            <FormTextInput
              title={t('settings.fullName')}
              placeholder={t('settings.fullName')}
              value={form.name}
              onChangeText={(value) => handleInputChange('name', value)}
            />

            <FormTextInput
              title={t('settings.phoneNumber')}
              placeholder={t('settings.phoneNumberPlaceholder')}
              value={form.phone}
              onChangeText={(value) => handleInputChange('phone', value)}
              keyboardType="phone-pad"
            />

            <FormTextInput
              title={t('settings.email')}
              placeholder={t('settings.emailPlaceholder')}
              value={form.email}
              onChangeText={(value) => handleInputChange('email', value)}
              keyboardType="email-address"
              autoCapitalize="none"
              editable={false}
            />

            <FormDateInput
              title={t('settings.dateOfBirth')}
              placeholder={t('settings.dateOfBirth')}
              value={form.birthDate}
              onDateChange={(date) => handleInputChange('birthDate', date)}
            />

            <FormDropdown
              title={t('settings.gender')}
              placeholder={t('settings.gender')}
              value={form.gender}
              onValueChange={(value) => handleInputChange('gender', value as Gender)}
              options={getGenderOptions(t)}
            />

            <FormTextInput
            title="NIF"
            placeholder="Introduza o NIF"
            value={form.nif}
            onChangeText={(value) => handleInputChange('nif', value)}
            keyboardType="numeric"
            />

            <FormTextInput
            title="Morada"
            placeholder="Introduza a morada"
            value={form.address}
            onChangeText={(value) => handleInputChange('address', value)}
            />

          </VStack>

          <PrimaryButton
            title={state === ScreenState.LOADING ? t('settings.saving') : t('settings.saveChanges')}
            onPress={handleSave}
            loading={state === ScreenState.LOADING}
            disabled={!hasUnsavedChanges()}
            style={styles.saveButton}
          />


        </VStack>
      </ScrollView>

      <UnsavedChangesModal
        visible={showUnsavedModal}
        onLeaveWithoutSaving={handleLeaveWithoutSaving}
        onCancel={handleCancelModal}
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Color.Background.subtle,
  },
  scrollView: {
    flex: 1,
  },
  content: {
    ...spacingStyles.screenScrollContainer,
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: Spacing.sm_8,
    ...Typography.bodymedium,
    color: Color.Gray.v500,
  },
  headerSection: {
    alignSelf: 'stretch',
  },
  uploadPhotoButton: {
    position: 'absolute',
    bottom: -2,
    right: -2,
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: Color.primary,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: Color.white,
    zIndex: 1,
  },
  avatarInfoRow: {
    alignSelf: 'stretch',
  },
  userInfo: {
    flex: 1,
    justifyContent: 'center',
    minWidth: 0,
  },
  userName: {
    ...Typography.heading3,
    fontFamily: FontFamily.bold,
    color: Color.Gray.v500,
  },
  roleText: {
    fontSize: 14,
    fontFamily: FontFamily.medium,
    color: Color.primary,
  },
  institutionName: {
    ...Typography.bodymedium,
    color: Color.Gray.v400,
    fontFamily: FontFamily.medium,
  },
  avatarContainer: {
    position: 'relative',
  },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    borderWidth: 3,
    borderColor: Color.primary,
  },
  avatarOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    borderRadius: 40,
    backgroundColor: Color.black,
    opacity: 0.5,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 2,
  },
  sectionTitle: {
    ...Typography.subtitle,
    fontFamily: FontFamily.semi_bold,
    marginBottom: Spacing.sm_8,
  },
  form: {
    flex: 1,
    alignSelf: 'stretch',
  },
  saveButton: {
  },
});

export default UserSettingsScreen;
