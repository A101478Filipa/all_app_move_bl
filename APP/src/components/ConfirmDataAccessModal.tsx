import React from 'react';
import { View, Text, Modal, TouchableOpacity, TouchableWithoutFeedback, StyleSheet } from 'react-native';
import { VStack } from '@components/CoreComponents';
import { Color } from '@src/styles/colors';
import { FontFamily, FontSize } from '@src/styles/fonts';
import { Spacing } from '@src/styles/spacings';
import { Border } from '@src/styles/borders';
import { useTranslation } from 'react-i18next';
import { MaterialIcons } from '@expo/vector-icons';

interface ConfirmDataAccessModalProps {
  visible: boolean;
  clinicianName: string;
  onConfirm: () => void;
  onCancel: () => void;
  loading?: boolean;
}

export const ConfirmDataAccessModal: React.FC<ConfirmDataAccessModalProps> = ({
  visible,
  clinicianName,
  onConfirm,
  onCancel,
  loading = false,
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
                {/* Icon */}
                <View style={styles.iconContainer}>
                  <MaterialIcons name="privacy-tip" size={48} color={Color.Warning.amber} />
                </View>

                {/* Content */}
                <VStack spacing={Spacing.sm_8} align="stretch">
                  <Text style={styles.title}>{t('elderly.confirmDataAccess')}</Text>
                  <Text style={styles.message}>
                    {t('elderly.confirmDataAccessMessage', { clinicianName })}
                  </Text>
                </VStack>

                {/* Warning */}
                <View style={styles.warningContainer}>
                  <MaterialIcons name="info" size={20} color={Color.primary} />
                  <Text style={styles.warningText}>
                    {t('elderly.dataAccessWarning')}
                  </Text>
                </View>

                {/* Buttons */}
                <VStack spacing={Spacing.sm_12} align="stretch">
                  <TouchableOpacity
                    style={[styles.button, styles.confirmButton]}
                    onPress={onConfirm}
                    disabled={loading}
                    activeOpacity={0.8}
                  >
                    <Text style={styles.confirmButtonText}>
                      {t('elderly.grantAccess')}
                    </Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={[styles.button, styles.cancelButton]}
                    onPress={onCancel}
                    disabled={loading}
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
    justifyContent: 'center',
    alignItems: 'center',
    padding: Spacing.lg_24,
  },
  modal: {
    backgroundColor: Color.white,
    borderRadius: Border.lg_16,
    padding: Spacing.lg_24,
    width: '100%',
    maxWidth: 400,
  },
  iconContainer: {
    alignSelf: 'center',
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    fontSize: FontSize.xl_20,
    fontFamily: FontFamily.bold,
    color: Color.dark,
    textAlign: 'center',
  },
  message: {
    fontSize: FontSize.bodymedium_16,
    fontFamily: FontFamily.regular,
    color: Color.Gray.v500,
    textAlign: 'center',
    lineHeight: 24,
  },
  warningContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: `${Color.primary}10`,
    padding: Spacing.sm_12,
    borderRadius: Border.sm_8,
    borderLeftWidth: 3,
    borderLeftColor: Color.primary,
    gap: Spacing.sm_8,
  },
  warningText: {
    flex: 1,
    fontSize: FontSize.bodysmall_14,
    fontFamily: FontFamily.medium,
    color: Color.Gray.v500,
    lineHeight: 20,
  },
  button: {
    paddingVertical: Spacing.md_16,
    paddingHorizontal: Spacing.lg_24,
    borderRadius: Border.sm_8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  confirmButton: {
    backgroundColor: Color.primary,
  },
  confirmButtonText: {
    fontSize: FontSize.bodymedium_16,
    fontFamily: FontFamily.bold,
    color: Color.white,
  },
  cancelButton: {
    backgroundColor: Color.white,
    borderWidth: 1.5,
    borderColor: Color.Gray.v300,
  },
  cancelButtonText: {
    fontSize: FontSize.bodymedium_16,
    fontFamily: FontFamily.bold,
    color: Color.Gray.v500,
  },
});
