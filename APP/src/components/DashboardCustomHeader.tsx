import React from 'react';
import { View, Text, Image, StyleSheet } from 'react-native';
import { HStack } from '@components/CoreComponents';
import { Color } from '@src/styles/colors';
import { FontFamily, FontSize } from '@src/styles/fonts';
import { Spacing } from '@src/styles/spacings';
import { useAuthStore } from '@src/stores';
import { buildAvatarUrl } from '@src/services/ApiService';
import { useTranslation } from '@src/localization/hooks/useTranslation';
import { Border } from '@styles/borders';
import { NotificationBellButton } from './NotificationBellButton';
import { TouchableOpacity } from 'react-native';
import { useNavigation } from '@react-navigation/native';

export const DashboardCustomHeader: React.FC = () => {
  const { user } = useAuthStore();
  const navigation = useNavigation<any>();
  const { t } = useTranslation();
  const firstName = user?.name?.split(' ')[0] || user?.name || 'User';

  const handleAvatarPress = () => {
  navigation.getParent()?.navigate('MenuTab', {
    screen: 'UserMenu'
    });
  };

  return (
    <View style={styles.container}>
      <HStack align="center" spacing={0} style={styles.content}>
        <Text style={styles.helloText}>
          {t('dashboard.hello')} {firstName}
        </Text>

        <View style={styles.spacer} />

        <View style={styles.notificationBell}>
          <NotificationBellButton/>
        </View>

        <TouchableOpacity onPress={handleAvatarPress} activeOpacity={0.7}>
        <Image
          source={{ uri: buildAvatarUrl(user?.user?.avatarUrl || '') }}
          style={styles.avatar}
        />
      </TouchableOpacity>
      </HStack>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: Color.Background.subtle,
    flexDirection: 'row',
  },
  content: {
    alignSelf: 'stretch',
  },
  helloText: {
    fontFamily: FontFamily.bold,
    fontSize: FontSize.heading3_24,
    color: Color.Gray.v500,
  },
  spacer: {
    flex: 1,
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: Border.full,
  },
  notificationBell: {
    paddingHorizontal: Spacing.xs_4,
  }
});
