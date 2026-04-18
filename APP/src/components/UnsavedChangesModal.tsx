import React from 'react';
import { View, Text, Modal, TouchableOpacity, TouchableWithoutFeedback, StyleSheet } from 'react-native';
import { VStack } from '@components/CoreComponents';
import { Color } from '@src/styles/colors';
import { FontFamily, FontSize, Typography } from '@src/styles/fonts';
import { Spacing } from '@src/styles/spacings';
import { Border } from '@src/styles/borders';
import { useTranslation } from 'react-i18next';

interface UnsavedChangesModalProps {
  visible: boolean;
  onLeaveWithoutSaving: () => void;
  onCancel: () => void;
}

export const UnsavedChangesModal: React.FC<UnsavedChangesModalProps> = ({
  visible,
  onLeaveWithoutSaving,
  onCancel,
}) => {
  const { t } = useTranslation();

  return (
    <Modal
      visible={visible}
      transparent
      animationType='fade'
      onRequestClose={onCancel}
    >
      <TouchableWithoutFeedback onPress={onCancel}>
        <View style={styles.overlay}>
          <TouchableWithoutFeedback onPress={() => {}}>
            <View style={styles.modal}>
              <VStack spacing={Spacing.lg_24} align="stretch">
                <VStack spacing={Spacing.sm_8} align="stretch">
                  <Text style={styles.title}>{t('common.unsavedChanges')}</Text>
                  <Text style={styles.message}>
                    {t('common.unsavedChangesMessage')}
                  </Text>
                </VStack>

                <VStack spacing={Spacing.sm_12} align="stretch">
                  <TouchableOpacity
                    style={[styles.button, styles.primaryButton]}
                    onPress={onLeaveWithoutSaving}
                    activeOpacity={0.8}
                  >
                    <Text style={styles.secondaryButtonText}>{t('common.leaveWithoutSaving')}</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={[styles.button, styles.cancelButton]}
                    onPress={onCancel}
                    activeOpacity={0.8}
                  >
                    <Text style={styles.cancelButtonText}>{t('common.cancel')}</Text>
                  </TouchableOpacity>
                </VStack>
              </VStack>
            </View>
          </TouchableWithoutFeedback>
        </View>
      </TouchableWithoutFeedback>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modal: {
    backgroundColor: Color.white,
    borderTopLeftRadius: Border.xl_24,
    borderTopRightRadius: Border.xl_24,
    padding: Spacing.lg_24,
    paddingBottom: Spacing.xl_32,
  },
  title: {
    ...Typography.heading3,
    fontFamily: FontFamily.bold,
    color: Color.Gray.v500,
    textAlign: 'center',
  },
  message: {
    ...Typography.bodymedium,
    color: Color.Gray.v400,
    textAlign: 'center',
    lineHeight: 20,
  },
  button: {
    paddingVertical: Spacing.md_16,
    paddingHorizontal: Spacing.lg_24,
    borderRadius: Border.md_12,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 48,
  },
  primaryButton: {
    backgroundColor: Color.primary,
  },
  primaryButtonText: {
    ...Typography.bodymedium,
    fontFamily: FontFamily.semi_bold,
    color: Color.white,
  },
  secondaryButton: {
    backgroundColor: Color.Gray.v100,
    borderWidth: 1,
    borderColor: Color.Gray.v200,
  },
  secondaryButtonText: {
    ...Typography.bodymedium,
    fontFamily: FontFamily.medium,
    color: Color.Gray.v500,
  },
  cancelButton: {
    backgroundColor: 'transparent',
  },
  cancelButtonText: {
    ...Typography.bodymedium,
    fontFamily: FontFamily.medium,
    color: Color.primary,
  },
});

export default UnsavedChangesModal;