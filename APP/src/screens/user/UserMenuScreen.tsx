import { HStack, Spacer, VStack } from '@components/CoreComponents';
import React, { useState, useCallback } from 'react';
import { ScrollView, StyleSheet, Image, Text, TouchableOpacity, RefreshControl, View } from 'react-native';
import { useAuthStore } from '@src/stores/authStore';
import { buildAvatarUrl, api } from '@src/services/ApiService';
import { Color } from '@src/styles/colors';
import { FontFamily, FontSize, Typography } from '@src/styles/fonts';
import { Spacing, spacingStyles } from '@src/styles/spacings';
import { MaterialIcons } from '@expo/vector-icons';
import { Border } from '@src/styles/borders';
import { AppUser, InstitutionMember, UserRole } from 'moveplus-shared';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { shadowStyles } from '@src/styles/shadow';
import { UserMenuStackParamList } from '@navigation/UserMenuNavigationStack';
import { useTranslation } from '@src/localization/hooks/useTranslation';
import { useNotifications } from '@src/providers/NotificationProvider';

type Props = NativeStackScreenProps<UserMenuStackParamList, 'UserMenu'>;

type HeaderComponentProps = {
  user: AppUser;
  onSettingsPress: () => void;
};

const HeaderComponent = ({ user, onSettingsPress }: HeaderComponentProps) => {
  const institution = (user as InstitutionMember).institution;

  const { t } = useTranslation();

  const getRoleTranslation = (role: string) => {
    switch (role) {
      case UserRole.ELDERLY: return t('userRole.elderly');
      case UserRole.CAREGIVER: return t('userRole.caregiver');
      case UserRole.INSTITUTION_ADMIN: return t('userRole.admin'); // Aqui usas a tua chave "admin"
      case UserRole.CLINICIAN: return t('userRole.clinician');
      case UserRole.PROGRAMMER: return t('userRole.programmer');
      default: return t('userRole.unknown');
    }
  };

  return (
    <TouchableOpacity style={styles.headerContainer} onPress={onSettingsPress}>
      <HStack spacing={Spacing.md_16}>
        <Image source={{ uri: buildAvatarUrl(user.user.avatarUrl) }} style={styles.avatar}/>

        <VStack spacing={Spacing.xs_4} align='flex-start' style={styles.userInfo}>
          <Text
            style={styles.name}
            numberOfLines={1}
            ellipsizeMode="tail"
          >
            {user.name}
          </Text>

          {user.user?.role && (
            <Text style={styles.roleText}>
              {getRoleTranslation(user.user.role)}
            </Text>
          )}

          {institution && (
            <Text
              style={styles.institution}
              numberOfLines={1}
              ellipsizeMode="tail"
            >
              {institution.name}
            </Text>
          )}
        </VStack>

        <MaterialIcons name="chevron-right" size={24} color={Color.Gray.v400} />
      </HStack>
    </TouchableOpacity>
  );
};

const MenuSection = ({ title, children }) => {
  return (
    <VStack spacing={Spacing.sm_8} style={{ alignSelf: 'stretch' }}>
      <Text style={styles.sectionTitle}>{title}</Text>
      <VStack style={styles.sectionCard} spacing={0}>
        {children}
      </VStack>
    </VStack>
  );
};

const MenuOption = ({ iconName, title, onPress, iconColor = Color.primary, hasNavigation = true, isLast = false, badge = null }) => {
  return (
    <TouchableOpacity
      style={[styles.menuOption, !isLast && styles.menuOptionBorder]}
      onPress={onPress}
    >
      <HStack spacing={Spacing.md_16} align="center">
        <MaterialIcons name={iconName} size={24} color={iconColor} />

        <Text style={styles.entryText}>{title}</Text>

        {badge !== null && badge > 0 && (
          <View style={styles.badge}>
            <Text style={styles.badgeText}>{badge > 99 ? '99+' : badge}</Text>
          </View>
        )}

        {hasNavigation && (
          <MaterialIcons name="chevron-right" size={20} color={Color.Gray.v400} />
        )}
      </HStack>
    </TouchableOpacity>
  );
};

const UserMenuScreen: React.FC<Props> = ({ navigation }) => {
  const { user, config, logout, refreshUser } = useAuthStore();
  const { t } = useTranslation();
  const { unreadCount, unregisterPushNotifications } = useNotifications();
  const [refreshing, setRefreshing] = useState(false);

  const onRefresh = useCallback(async () => {
    if (!user) return;

    setRefreshing(true);
    try {
      await refreshUser({
        id: user.id,
        role: user.user.role,
        baseUrl: config.baseUrl,
      });
    } catch (error) {
      console.error('Failed to refresh user:', error);
    } finally {
      setRefreshing(false);
    }
  }, [user, refreshUser]);

  const onLogout = async () => {
    await unregisterPushNotifications();
    await logout();
  }

  const onSettings = () => {
    navigation.navigate('UserSettings');
  }

  const onInstitutionTimeline = () => {
    navigation.navigate('InstitutionTimeline');
  }

  const onInstitutionDetails = () => {
    navigation.navigate('InstitutionDetails');
  }

  const onPendingAccessRequests = () => {
    navigation.navigate('DataAccessRequests', { filter: 'PENDING' });
  }

  const onApprovedAccessRequests = () => {
    navigation.navigate('DataAccessRequests', { filter: 'APPROVED' });
  }

  const onNotificationCenter = () => {
    navigation.navigate('NotificationCenter');
  }

  const onInstitutionInvitations = () => {
    const institutionId = (user as InstitutionMember)?.institution?.id;
    if (institutionId) {
      navigation.navigate('InstitutionInvitations', { institutionId });
    }
  }

  const isCaregiver = user?.user.role === UserRole.CAREGIVER;
  const isAdmin = user?.user.role === UserRole.INSTITUTION_ADMIN;
  const isElderly = user?.user.role === UserRole.ELDERLY;
  const isClinician = user?.user.role === UserRole.CLINICIAN;

  const shouldShowInstitutionTimeline = isCaregiver || isAdmin || isClinician;
  const shouldShowInstitutionDetails = isCaregiver || isAdmin || isElderly || isClinician;

  return (
    <ScrollView
      style={styles.scrollContainer}
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          onRefresh={onRefresh}
          tintColor={Color.primary}
          colors={[Color.primary]}
        />
      }
    >
      { user && (
        <VStack style={styles.contentContainer} spacing={Spacing.lg_24}>
          <HeaderComponent user={user} onSettingsPress={onSettings}/>

          {/* Institution Section */}
          {(shouldShowInstitutionTimeline || shouldShowInstitutionDetails) && (
            <MenuSection title={t('menu.institution')}>
              {shouldShowInstitutionDetails && (
                <MenuOption
                  iconName="business"
                  iconColor={Color.primary}
                  title={t('menu.institutionDetails')}
                  onPress={onInstitutionDetails}
                  hasNavigation={true}
                  isLast={!shouldShowInstitutionTimeline && !isAdmin}
                />
              )}
              {shouldShowInstitutionTimeline && (
                <MenuOption
                  iconName="timeline"
                  iconColor={Color.secondary}
                  title={t('menu.institutionTimeline')}
                  onPress={onInstitutionTimeline}
                  hasNavigation={true}
                  isLast={!isAdmin}
                />
              )}
              {isAdmin && (
                <MenuOption
                  iconName="mail-outline"
                  iconColor={Color.Cyan.v400}
                  title={t('invitation.viewInvitations')}
                  onPress={onInstitutionInvitations}
                  hasNavigation={true}
                  isLast={true}
                />
              )}
            </MenuSection>
          )}

          {/* Notifications Section */}
          <MenuSection title={t('notifications.sectionTitle')}>
            <MenuOption
              iconName="notifications"
              iconColor={Color.primary}
              title={t('notifications.title')}
              onPress={onNotificationCenter}
              hasNavigation={true}
              isLast={true}
              badge={unreadCount}
            />
          </MenuSection>

          {/* Account Settings Section */}
          <MenuSection title={t('menu.accountSettings')}>
            <MenuOption
              iconName="logout"
              iconColor={Color.Error.default}
              title={t('menu.logout')}
              onPress={onLogout}
              hasNavigation={false}
              isLast={true}
            />
          </MenuSection>
        </VStack>
      )}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  scrollContainer: {
    flex: 1,
    backgroundColor: Color.Background.subtle
  },
  contentContainer: {
    flex: 1,
    ...spacingStyles.screenScrollContainer,
  },
  avatar: {
    width: 75,
    height: 75,
    borderRadius: Border.full,
  },
  name: {
    fontSize: FontSize.large,
    fontFamily: FontFamily.bold
  },
  roleText: {
    fontSize: FontSize.bodysmall_14,
    fontFamily: FontFamily.medium,
    color: Color.primary
  },
  institution: {
    fontSize: FontSize.bodymedium_16,
    color: Color.Gray.v400,
    fontFamily: FontFamily.medium
  },
  headerContainer: {
    flex: 1,
    alignSelf:'stretch',
    paddingVertical: Spacing.sm_8,
    paddingHorizontal: Spacing.md_16,
    backgroundColor: Color.white,
    borderRadius: Border.lg_16,
    borderColor: Color.Gray.v100,
    borderWidth: 1,
    ...shadowStyles.cardShadow,
  },
  userInfo: {
    flex: 1,
    minWidth: 0,
  },
  sectionTitle: {
    fontFamily: FontFamily.bold,
    fontSize: FontSize.bodymedium_16,
    color: Color.Gray.v500,
    marginBottom: Spacing.xs_4,
    alignSelf: 'flex-start'
  },
  sectionCard: {
    backgroundColor: Color.white,
    borderRadius: Border.lg_16,
    borderColor: Color.Gray.v100,
    borderWidth: 1,
    alignSelf: 'stretch',
    ...shadowStyles.cardShadow,
  },
  menuOption: {
    padding: Spacing.md_16,
    alignSelf: 'stretch',
  },
  menuOptionBorder: {
    borderBottomWidth: 1,
    borderBottomColor: Color.Gray.v100,
  },
  entryText: {
    fontSize: FontSize.bodymedium_16,
    fontFamily: FontFamily.medium,
    flex: 1,
  },
  badge: {
    backgroundColor: Color.Error.default,
    borderRadius: Border.full,
    minWidth: 20,
    height: 20,
    paddingHorizontal: Spacing.xs_6,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: Spacing.sm_8,
  },
  badgeText: {
    color: Color.white,
    fontSize: FontSize.caption_12,
    fontFamily: FontFamily.bold,
  },
});

export default UserMenuScreen;