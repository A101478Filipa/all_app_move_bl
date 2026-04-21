import React from 'react';
import { View, ScrollView, StyleSheet } from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import WoundTrackingComponent from '@components/WoundTrackingComponent';
import { useAuthStore } from '@src/stores/authStore';
import { UserRole } from 'moveplus-shared';
import { Color } from '@src/styles/colors';
import { spacingStyles } from '@src/styles/spacings';

type Props = NativeStackScreenProps<any, 'ElderlyWoundTrackingScreen'>;

const ElderlyWoundTrackingScreen: React.FC<Props> = ({ route }) => {
  const { elderlyId } = route.params;
  const { user } = useAuthStore();
  const role = user?.user?.role;

  const isPrivileged = [
    UserRole.INSTITUTION_ADMIN,
    UserRole.CAREGIVER,
    UserRole.CLINICIAN,
    UserRole.PROGRAMMER,
  ].includes(role as UserRole);

  return (
    <View style={styles.container}>
      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        <WoundTrackingComponent
          occurrenceId={elderlyId}
          occurrenceType="elderly"
          canAdd={isPrivileged}
          canDelete={isPrivileged}
        />
      </ScrollView>
    </View>
  );
};

export default ElderlyWoundTrackingScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Color.Background.subtle,
  },
  content: {
    ...spacingStyles.screenScrollContainer,
  },
});
