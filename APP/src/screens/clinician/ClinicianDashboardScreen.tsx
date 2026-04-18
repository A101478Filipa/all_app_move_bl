import React, { useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, SafeAreaView, TouchableOpacity } from 'react-native';
import { Color } from '@src/styles/colors';
import { Spacing, spacingStyles } from '@src/styles/spacings';
import { Border } from '@src/styles/borders';
import { FontFamily, FontSize } from '@src/styles/fonts';
import { shadowStyles } from '@src/styles/shadow';
import { VStack, HStack } from '@components/CoreComponents';
import { useAuthStore } from '@src/stores';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import { useTranslation } from '@src/localization/hooks/useTranslation';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { ClinicianDashboardNavigationStackParamList } from '@navigation/ClinicianDashboardNavigationStack';

// MARK: Types
type NavigationProp = NativeStackNavigationProp<ClinicianDashboardNavigationStackParamList>;
type DashboardWidgetProps = {
  title: string;
  subtitle: string;
  icon: React.ReactNode;
  onPress: () => void;
  disabled?: boolean;
  color?: string;
};

// MARK: Components
const DashboardWidget: React.FC<DashboardWidgetProps> = ({
  title,
  subtitle,
  icon,
  onPress,
  disabled = false,
  color = Color.primary
}) => {
  return (
    <TouchableOpacity
      style={[
        styles.widget,
        disabled && styles.widgetDisabled,
      ]}
      onPress={onPress}
      disabled={disabled}
      activeOpacity={disabled ? 1 : 0.7}
    >
      <HStack spacing={Spacing.md_16} align="center">
        <View style={[styles.iconContainer, { backgroundColor: `${color}15` }]}>
          {icon}
        </View>
        <VStack align="flex-start" style={{ flex: 1 }}>
          <Text style={[styles.widgetTitle, disabled && styles.widgetTitleDisabled]}>
            {title}
          </Text>
          <Text style={[styles.widgetSubtitle, disabled && styles.widgetSubtitleDisabled]}>
            {subtitle}
          </Text>
        </VStack>
        <MaterialIcons
          name="chevron-right"
          size={20}
          color={disabled ? Color.Gray.v300 : Color.Gray.v400}
        />
      </HStack>
    </TouchableOpacity>
  );
};

// MARK: Screen
const ClinicianDashboardScreen = () => {
  const { t } = useTranslation();
  const { user } = useAuthStore();
  const navigation = useNavigation<NavigationProp>();

  const handleViewApprovedPatients = useCallback(() => {
    navigation.push('DataAccessRequests', { filter: 'APPROVED' });
  }, [navigation]);

  const handleViewMyCalendar = useCallback(() => {
    const userId = user?.user?.id;
    const name = user?.name;
    if (userId) {
      navigation.push('ProfessionalCalendar', { userId, professionalName: name });
    }
  }, [navigation, user]);

  const handleViewTimeline = useCallback(() => {
    navigation.push('InstitutionTimelineScreen');
  }, [navigation]);

  return (
    <View style={styles.container}>
      <ScrollView
        style={{ flex: 1 }}
        contentInsetAdjustmentBehavior='automatic'
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >

        {/* Quick Actions Section */}
        <VStack spacing={Spacing.sm_8} style={styles.section}>
          <Text style={styles.sectionTitle}>{t('dashboard.quickActions')}</Text>

          <VStack style={{ alignSelf: 'stretch' }} spacing={Spacing.md_16}>
            <DashboardWidget
              title={t('dataAccessRequest.approvedRequests')}
              subtitle={t('dashboard.viewYourPatients')}
              icon={<MaterialIcons name="people" size={24} color={Color.primary} />}
              onPress={handleViewApprovedPatients}
              color={Color.primary}
            />
            <DashboardWidget
              title={t('dashboard.myCalendar')}
              subtitle={t('dashboard.myCalendarSubtitle')}
              icon={<MaterialIcons name="calendar-today" size={24} color={Color.secondary} />}
              onPress={handleViewMyCalendar}
              color={Color.secondary}
            />
            <DashboardWidget
              title={t('dashboard.viewTimeline')}
              subtitle={t('dashboard.seeActivityHistory')}
              icon={<MaterialIcons name="timeline" size={24} color={Color.Gray.v500} />}
              onPress={handleViewTimeline}
              color={Color.Gray.v500}
            />
          </VStack>
        </VStack>
      </ScrollView>
    </View>
  );
};

// MARK: Styles
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Color.Background.subtle,
  },
  scrollContent: {
    flexGrow: 1,
    ...spacingStyles.screenScrollContainer,
  },
  section: {
    alignSelf: 'stretch',
    marginBottom: Spacing.xl_32,
  },
  sectionTitle: {
    fontFamily: FontFamily.bold,
    fontSize: FontSize.bodylarge_18,
    color: Color.Gray.v500,
    alignSelf: 'flex-start',
  },
  widget: {
    backgroundColor: Color.white,
    padding: Spacing.md_16,
    borderRadius: Border.lg_16,
    alignSelf: 'stretch',
    ...shadowStyles.cardShadow,
  },
  widgetDisabled: {
    opacity: 0.6,
  },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: Border.sm_8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  widgetTitle: {
    fontFamily: FontFamily.bold,
    fontSize: FontSize.bodymedium_16,
    color: Color.Gray.v500,
  },
  widgetTitleDisabled: {
    color: Color.Gray.v400,
  },
  widgetSubtitle: {
    fontFamily: FontFamily.regular,
    fontSize: FontSize.bodysmall_14,
    color: Color.Gray.v400,
  },
  widgetSubtitleDisabled: {
    color: Color.Gray.v300,
  },
});

export default ClinicianDashboardScreen;

