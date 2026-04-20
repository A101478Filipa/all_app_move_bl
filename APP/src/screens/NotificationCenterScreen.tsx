import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  RefreshControl,
  ActivityIndicator,
  Modal,
  Pressable,
} from 'react-native';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { notificationApi, Notification } from '@src/api/endpoints/notifications';
import { useTranslation } from 'react-i18next';
import { Ionicons } from '@expo/vector-icons';
import { translateNotification } from '@src/utils/notificationTranslation';
import { useNotifications } from '@src/providers/NotificationProvider';
import { Color } from '@styles/colors';
import { FontFamily, FontSize } from '@styles/fonts';
import { Spacing } from '@styles/spacings';
import { Border } from '@styles/borders';
import { shadowStyles } from '@styles/shadow';
import { HStack, VStack } from '@components/CoreComponents';

export const NotificationCenterScreen: React.FC = () => {
  const { t } = useTranslation();
  const navigation = useNavigation();
  const { refreshUnreadCount } = useNotifications();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const [selectedNotification, setSelectedNotification] = useState<Notification | null>(null);
  const [modalVisible, setModalVisible] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);

  const openModal = useCallback((notification: Notification) => {
    setSelectedNotification(notification);
    setModalVisible(true);
  }, []);

  const closeModal = useCallback(() => {
    setModalVisible(false);
    setTimeout(() => setSelectedNotification(null), 300);
  }, []);

  const loadNotifications = useCallback(async () => {
    try {
      const response = await notificationApi.getNotifications();
      if (response.data) {
        setNotifications(response.data.notifications);
        setUnreadCount(response.data.unreadCount);
      }
    } catch (error) {
      console.error('Error loading notifications:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      loadNotifications();
    }, [loadNotifications])
  );

  const handleRefresh = () => {
    setRefreshing(true);
    loadNotifications();
  };

  const handleScroll = (event: any) => {
    const scrollY = event.nativeEvent.contentOffset.y;
    setIsScrolled(scrollY > 10);
  };

  const navigateToNotificationDetails = useCallback((notification: Notification) => {
    if (!notification.data?.screen) return;

    const params: any = {};

    if (notification.type === 'fall_occurrence' && notification.data.fallOccurrenceId) {
      params.occurrenceId = notification.data.fallOccurrenceId;
      (navigation as any).navigate('FallOccurrenceScreen', params);
    } else if (notification.type === 'fall_detection_alert' && notification.data.fallOccurrenceId) {
      params.occurrenceId = notification.data.fallOccurrenceId;
      (navigation as any).navigate('FallOccurrenceScreen', params);
    } else if (notification.type === 'data_access_request') {
      // Navigate to data access requests screen if needed
    }
  }, [navigation]);

  const handleNotificationPress = async (notification: Notification) => {
    // Mark as read if unread
    if (!notification.read) {
      try {
        await notificationApi.markAsRead(notification.id);
        setNotifications((prev) =>
          prev.map((n) =>
            n.id === notification.id ? { ...n, read: true, readAt: new Date().toISOString() } : n
          )
        );
        setUnreadCount((prev) => Math.max(0, prev - 1));
        refreshUnreadCount();
      } catch (error) {
        console.error('Error marking notification as read:', error);
      }
    }

    navigateToNotificationDetails(notification);
  };

  const handleNotificationLongPress = (notification: Notification) => {
    openModal(notification);
  };

  const handleNavigateToNotification = async () => {
    if (!selectedNotification) return;
    closeModal();
    navigateToNotificationDetails(selectedNotification);
  };

  const handleToggleReadStatus = async () => {
    if (!selectedNotification) return;

    try {
      if (selectedNotification.read) {
        await notificationApi.markAsUnread(selectedNotification.id);
        setNotifications((prev) =>
          prev.map((n) =>
            n.id === selectedNotification.id ? { ...n, read: false, readAt: null } : n
          )
        );
        setUnreadCount((prev) => prev + 1);
      } else {
        await notificationApi.markAsRead(selectedNotification.id);
        setNotifications((prev) =>
          prev.map((n) =>
            n.id === selectedNotification.id ? { ...n, read: true, readAt: new Date().toISOString() } : n
          )
        );
        setUnreadCount((prev) => Math.max(0, prev - 1));
      }
      refreshUnreadCount();
      closeModal();
    } catch (error) {
      console.error('Error toggling read status:', error);
    }
  };

  const handleMarkAllAsRead = async () => {
    try {
      await notificationApi.markAllAsRead();
      setNotifications((prev) =>
        prev.map((n) => ({ ...n, read: true, readAt: new Date().toISOString() }))
      );
      setUnreadCount(0);
      refreshUnreadCount();
    } catch (error) {
      console.error('Error marking all as read:', error);
    }
  };

  const handleDeleteNotification = async () => {
    if (!selectedNotification) return;

    try {
      await notificationApi.deleteNotification(selectedNotification.id);
      setNotifications((prev) => prev.filter((n) => n.id !== selectedNotification.id));
      if (!selectedNotification.read) {
        setUnreadCount((prev) => Math.max(0, prev - 1));
        refreshUnreadCount();
      }
      closeModal();
    } catch (error) {
      console.error('Error deleting notification:', error);
    }
  };

  const renderNotificationItem = ({ item }: { item: Notification }) => {
    const data = item.data || {};
    const { title, body } = translateNotification(
      data.titleKey || item.title,
      data.bodyKey || item.body,
      data.params || {},
      item.title,
      item.body
    );

    const isUnread = !item.read;
    const timeAgo = getTimeAgo(new Date(item.createdAt));

    return (
      <TouchableOpacity
        style={[styles.notificationItem, isUnread && styles.unreadItem]}
        onPress={() => handleNotificationPress(item)}
        onLongPress={() => handleNotificationLongPress(item)}
      >
        <HStack spacing={Spacing.sm_12} align="center" style={styles.notificationContent}>
          <View style={styles.iconContainer}>
            <Ionicons
              name={getNotificationIcon(item.type)}
              size={24}
              color={isUnread ? Color.primary : Color.Gray.v300}
            />
          </View>

          <VStack align='flex-start' spacing={Spacing.sm_8} style={styles.textContent}>
            <HStack align="center" spacing={Spacing.xs_4}>
              <Text style={[styles.notificationTitle, isUnread && styles.unreadText]}>{title}</Text>
              {isUnread && <View style={styles.unreadDot} />}
            </HStack>
            <Text style={styles.notificationBody} numberOfLines={3}>{body}</Text>
            <Text style={styles.notificationTime}>{timeAgo}</Text>
          </VStack>

          <Ionicons name="chevron-forward" size={20} color={Color.Gray.v300} />
        </HStack>
      </TouchableOpacity>
    );
  };

  const getNotificationIcon = (type: string): any => {
    switch (type) {
      case 'fall_occurrence':
        return 'warning';
      case 'data_access_request':
        return 'lock-closed';
      case 'medication_reminder':
        return 'medical';
      case 'appointment_reminder':
        return 'calendar';
      default:
        return 'notifications';
    }
  };

  const getTimeAgo = (date: Date): string => {
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);

    if (minutes < 1) return t('notifications.justNow');
    if (minutes < 60) return t('notifications.minutesAgo', { count: minutes });
    if (hours < 24) return t('notifications.hoursAgo', { count: hours });
    return t('notifications.daysAgo', { count: days });
  };

  if (loading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color={Color.primary} />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={[styles.header, isScrolled && styles.headerScrolled]}>
        <Text style={styles.headerTitle}>{t('notifications.title')}</Text>
        {unreadCount > 0 && (
          <TouchableOpacity onPress={handleMarkAllAsRead} style={styles.markAllButton}>
            <Text style={styles.markAllText}>
              {t('notifications.markAllRead')}
            </Text>
          </TouchableOpacity>
        )}
      </View>

      {notifications.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Ionicons name="notifications-off-outline" size={64} color={Color.Gray.v300} />
          <Text style={styles.emptyText}>
            {t('notifications.noNotifications')}
          </Text>
        </View>
      ) : (
        <FlatList
          data={notifications}
          renderItem={renderNotificationItem}
          keyExtractor={(item) => item.id.toString()}
          onScroll={handleScroll}
          scrollEventThrottle={16}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={handleRefresh}
              tintColor={Color.primary}
              colors={[Color.primary]}
            />
          }
          contentContainerStyle={styles.listContent}
        />
      )}

      <Modal
        visible={modalVisible}
        transparent
        animationType="slide"
        onRequestClose={closeModal}
      >
        <Pressable style={styles.modalOverlay} onPress={closeModal}>
          <Pressable style={styles.modalContent} onPress={(e) => e.stopPropagation()}>
            <View style={styles.modalHeader}>
              <View style={styles.modalHandle} />
              <Text style={styles.modalTitle}>{t('notifications.actions', 'Actions')}</Text>
            </View>

            <VStack spacing={Spacing.xs_6} style={{alignSelf: 'stretch', paddingBottom: Spacing.md_16}}>
              {selectedNotification?.data?.screen && (
                <TouchableOpacity
                  style={styles.modalAction}
                  onPress={handleNavigateToNotification}
                  activeOpacity={0.7}
                >
                  <View style={[styles.modalActionIcon, { backgroundColor: Color.Background.cyanTint }]}>
                    <Ionicons name="open-outline" size={20} color={Color.primary} />
                  </View>
                  <Text style={styles.modalActionText}>
                    {t('notifications.viewDetails')}
                  </Text>
                  <Ionicons name="chevron-forward" size={20} color={Color.Gray.v300} style={styles.modalActionChevron} />
                </TouchableOpacity>
              )}

              <TouchableOpacity
                style={styles.modalAction}
                onPress={handleToggleReadStatus}
                activeOpacity={0.7}
              >
                <View style={[styles.modalActionIcon, { backgroundColor: Color.Background.cyanTint }]}>
                  <Ionicons
                    name={selectedNotification?.read ? "mail-unread-outline" : "checkmark-done-outline"}
                    size={20}
                    color={Color.Cyan.v400}
                  />
                </View>
                <Text style={styles.modalActionText}>
                  {selectedNotification?.read
                    ? t('notifications.markAsUnread')
                    : t('notifications.markAsRead')}
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.modalAction}
                onPress={handleDeleteNotification}
                activeOpacity={0.7}
              >
                <View style={[styles.modalActionIcon, { backgroundColor: '#FEE' }]}>
                  <Ionicons name="trash-outline" size={20} color={Color.Error.default} />
                </View>
                <Text style={[styles.modalActionText, { color: Color.Error.default }]}>
                  {t('notifications.delete')}
                </Text>
              </TouchableOpacity>
            </VStack>
          </Pressable>
        </Pressable>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Color.Background.subtle,
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    paddingHorizontal: Spacing.md_16,
    paddingVertical: Spacing.sm_12,
    backgroundColor: Color.Background.subtle,
    borderBottomWidth: 1,
    borderBottomColor: Color.Gray.v200,
    zIndex: 10,
  },
  headerScrolled: {
    ...shadowStyles.cardShadow,
    elevation: 8,
  },
  headerTitle: {
    fontSize: FontSize.heading3_24,
    fontFamily: FontFamily.bold,
    color: Color.Gray.v500,
  },
  markAllButton: {
  },
  markAllText: {
    fontSize: FontSize.bodysmall_14,
    fontFamily: FontFamily.semi_bold,
    color: Color.primary,
  },
  listContent: {
    paddingVertical: Spacing.sm_8,
  },
  notificationItem: {
    backgroundColor: Color.white,
    paddingVertical: Spacing.sm_12,
    paddingHorizontal: Spacing.md_16,
    marginHorizontal: Spacing.md_16,
    marginVertical: Spacing.xs_4,
    borderRadius: Border.md_12,
    borderWidth: 1,
    borderColor: Color.Gray.v100,
    ...shadowStyles.cardShadow,
  },
  unreadItem: {
    backgroundColor: Color.Background.cyanTint,
    borderColor: Color.Cyan.v200,
  },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: Border.full,
    backgroundColor: Color.Background.muted,
    justifyContent: 'center',
    alignItems: 'center',
  },
  notificationContent: {
    flex: 1,
    alignSelf: 'stretch',
  },
  textContent: {
    flex: 1,
  },
  notificationTitle: {
    fontSize: FontSize.bodymedium_16,
    fontFamily: FontFamily.semi_bold,
    color: Color.Gray.v500,
  },
  unreadText: {
    fontFamily: FontFamily.bold,
  },
  notificationBody: {
    alignSelf: 'stretch',
    fontSize: FontSize.bodysmall_14,
    fontFamily: FontFamily.regular,
    color: Color.Gray.v400,
  },
  notificationTime: {
    fontSize: FontSize.caption_12,
    fontFamily: FontFamily.regular,
    color: Color.Gray.v500,
  },
  unreadDot: {
    width: 8,
    height: 8,
    borderRadius: Border.full,
    backgroundColor: Color.primary,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: Spacing.xl_32,
  },
  emptyText: {
    fontSize: FontSize.bodymedium_16,
    fontFamily: FontFamily.medium,
    color: Color.Gray.v300,
    marginTop: Spacing.md_16,
    textAlign: 'center',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: Color.white,
    borderTopLeftRadius: Border.xl_24,
    borderTopRightRadius: Border.xl_24,
    paddingHorizontal: Spacing.lg_24,
    paddingBottom: Spacing.xl_32,
    ...shadowStyles.cardShadow,
  },
  modalHeader: {
    alignItems: 'center',
    paddingTop: Spacing.sm_12,
    paddingBottom: Spacing.md_16,
  },
  modalHandle: {
    width: 40,
    height: 4,
    backgroundColor: Color.Gray.v200,
    borderRadius: Border.full,
    marginBottom: Spacing.sm_12,
  },
  modalTitle: {
    fontSize: FontSize.bodylarge_18,
    fontFamily: FontFamily.bold,
    color: Color.Gray.v500,
  },
  modalAction: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'stretch',
    padding: Spacing.md_16,
    backgroundColor: Color.white,
    borderRadius: Border.md_12,
    borderWidth: 1,
    borderColor: Color.Gray.v200,
  },
  modalActionIcon: {
    width: 36,
    height: 36,
    borderRadius: Border.sm_8,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: Spacing.sm_12,
  },
  modalActionText: {
    flex: 1,
    fontSize: FontSize.bodymedium_16,
    fontFamily: FontFamily.medium,
    color: Color.Gray.v500,
  },
  modalActionChevron: {
    marginLeft: Spacing.xs_4,
  },
});
