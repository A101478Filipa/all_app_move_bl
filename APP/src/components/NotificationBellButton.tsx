import React from 'react';
import { TouchableOpacity, View, Text, StyleSheet } from 'react-native';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import { useNavigation } from '@react-navigation/native';
import { useNotifications } from '@src/providers/NotificationProvider';
import { Color } from '@styles/colors';
import { FontFamily, FontSize } from '@styles/fonts';
import { Spacing } from '@styles/spacings';
import { Border } from '@styles/borders';

export const NotificationBellButton: React.FC = () => {
  const navigation = useNavigation();
  const { unreadCount } = useNotifications();

  const handlePress = () => {
    (navigation as any).navigate('NotificationCenter');
  };

  return (
    <TouchableOpacity onPress={handlePress} style={styles.container}>
      <MaterialIcons name="notifications-none" size={24} color={Color.Gray.v500} />
      {unreadCount > 0 && (
        <View style={styles.badge}>
          <Text style={styles.badgeText}>{unreadCount > 99 ? '99+' : unreadCount}</Text>
        </View>
      )}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: 8,
    position: 'relative',
  },
  badge: {
    position: 'absolute',
    top: Spacing.xs_4,
    right: Spacing.xs_4,
    backgroundColor: '#FF3B30',
    borderRadius: Border.full,
    minWidth: 18,
    height: 18,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 4,
  },
  badgeText: {
    color: Color.white,
    fontSize: FontSize.caption_12,
    fontFamily: FontFamily.semi_bold,
  },
});
