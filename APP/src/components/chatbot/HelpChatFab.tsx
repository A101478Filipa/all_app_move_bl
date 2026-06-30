import React from 'react';
import {
  Modal,
  Platform,
  SafeAreaView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { Color } from '@src/styles/colors';
import { FontFamily, FontSize } from '@src/styles/fonts';
import { Spacing } from '@src/styles/spacings';
import { Border } from '@src/styles/borders';
import { shadowStyles } from '@src/styles/shadow';
import { useTranslation } from '@src/localization/hooks/useTranslation';
import { useChatbotStore } from '@src/stores/chatbotStore';
import HelpChatPanel from './HelpChatPanel';

/**
 * Floating Action Button that opens the help assistant modal.
 *
 * Mounted once in AppNavigator above the role's tab navigator so the
 * assistant is reachable from any screen with a single tap.
 */
export const HelpChatFab: React.FC = () => {
  const { t } = useTranslation();
  const { isOpen, open, close } = useChatbotStore();

  return (
    <>
      <TouchableOpacity
        accessibilityLabel={t('helpChat.title')}
        style={styles.fab}
        onPress={open}
        activeOpacity={0.85}
      >
        <MaterialIcons name="chat" size={26} color={Color.white} />
      </TouchableOpacity>

      <Modal
        visible={isOpen}
        animationType="slide"
        onRequestClose={close}
        presentationStyle="pageSheet"
      >
        <SafeAreaView style={styles.modalContainer}>
          <View style={styles.header}>
            <View style={styles.headerTextContainer}>
              <Text style={styles.headerTitle}>{t('helpChat.title')}</Text>
              <Text style={styles.headerSubtitle} numberOfLines={1}>
                {t('helpChat.headerSubtitle')}
              </Text>
            </View>
            <TouchableOpacity
              accessibilityLabel={t('common.close')}
              onPress={close}
              style={styles.closeButton}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            >
              <MaterialIcons name="close" size={24} color={Color.Gray.v500} />
            </TouchableOpacity>
          </View>
          <HelpChatPanel active={isOpen} />
        </SafeAreaView>
      </Modal>
    </>
  );
};

const FAB_BOTTOM = Platform.OS === 'ios' ? 100 : 80;

const styles = StyleSheet.create({
  fab: {
    position: 'absolute',
    right: Spacing.md_16,
    bottom: FAB_BOTTOM,
    width: 56,
    height: 56,
    borderRadius: Border.full,
    backgroundColor: Color.primary,
    alignItems: 'center',
    justifyContent: 'center',
    ...shadowStyles.cardShadow,
    elevation: 6,
  },
  modalContainer: { flex: 1, backgroundColor: Color.Background.subtle },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.md_16,
    paddingVertical: Spacing.sm_12,
    backgroundColor: Color.white,
    borderBottomWidth: 1,
    borderBottomColor: Color.Gray.v100,
  },
  headerTextContainer: { flex: 1 },
  headerTitle: { fontSize: FontSize.bodymedium_16, fontFamily: FontFamily.bold, color: Color.Gray.v500 },
  headerSubtitle: { fontSize: FontSize.caption_12, fontFamily: FontFamily.medium, color: Color.Gray.v400 },
  closeButton: { padding: Spacing.xs_4 },
});

export default HelpChatFab;
