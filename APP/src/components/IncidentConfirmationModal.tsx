import React, { useEffect, useState } from 'react';
import {
  Modal,
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Dimensions,
} from 'react-native';
import { useTranslation } from 'react-i18next';
import { Ionicons } from '@expo/vector-icons';

interface IncidentConfirmationModalProps {
  visible: boolean;
  incidentType: 'fall' | 'inactivity';
  onConfirm: () => void;
  onCancel: () => void;
  timeoutSeconds?: number;
}

const IncidentConfirmationModal: React.FC<IncidentConfirmationModalProps> = ({
  visible,
  incidentType,
  onConfirm,
  onCancel,
  timeoutSeconds = 30,
}) => {
  const { t } = useTranslation();
  const [remainingTime, setRemainingTime] = useState(timeoutSeconds);

  useEffect(() => {
    if (visible) {
      setRemainingTime(timeoutSeconds);

      const interval = setInterval(() => {
        setRemainingTime((prev) => {
          if (prev <= 1) {
            clearInterval(interval);
            onConfirm();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);

      return () => clearInterval(interval);
    }
  }, [visible, timeoutSeconds]);

  const getIncidentInfo = () => {
    if (incidentType === 'fall') {
      return {
        icon: 'alert-circle' as const,
        iconColor: '#FF6B6B',
        title: t('incidentConfirmation.fallDetected'),
        message: t('incidentConfirmation.fallMessage'),
      };
    } else {
      return {
        icon: 'time' as const,
        iconColor: '#FFA500',
        title: t('incidentConfirmation.inactivityDetected'),
        message: t('incidentConfirmation.inactivityMessage'),
      };
    }
  };

  const info = getIncidentInfo();

  return (
    <Modal
      visible={visible}
      transparent={true}
      animationType="fade"
      onRequestClose={onCancel}
    >
      <View style={styles.overlay}>
        <View style={styles.modalContainer}>
          <View style={styles.iconContainer}>
            <Ionicons name={info.icon} size={80} color={info.iconColor} />
          </View>

          <Text style={styles.title}>{info.title}</Text>
          <Text style={styles.message}>{info.message}</Text>

          <View style={styles.timerContainer}>
            <Text style={styles.timerText}>
              {t('incidentConfirmation.autoConfirmIn', { seconds: remainingTime })}
            </Text>
            <View style={styles.timerBar}>
              <View
                style={[
                  styles.timerBarFill,
                  { width: `${(remainingTime / timeoutSeconds) * 100}%` },
                ]}
              />
            </View>
          </View>

          <View style={styles.buttonContainer}>
            <TouchableOpacity
              style={[styles.button, styles.cancelButton]}
              onPress={onCancel}
            >
              <Ionicons name="close-circle" size={24} color="#FFF" />
              <Text style={styles.buttonText}>
                {t('incidentConfirmation.imFine')}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.button, styles.confirmButton]}
              onPress={onConfirm}
            >
              <Ionicons name="checkmark-circle" size={24} color="#FFF" />
              <Text style={styles.buttonText}>
                {t('incidentConfirmation.needHelp')}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalContainer: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 30,
    width: '100%',
    maxWidth: 400,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
    elevation: 10,
  },
  iconContainer: {
    marginBottom: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 10,
    textAlign: 'center',
  },
  message: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    marginBottom: 20,
    lineHeight: 22,
  },
  timerContainer: {
    width: '100%',
    marginBottom: 25,
  },
  timerText: {
    fontSize: 14,
    color: '#999',
    textAlign: 'center',
    marginBottom: 8,
  },
  timerBar: {
    width: '100%',
    height: 6,
    backgroundColor: '#E0E0E0',
    borderRadius: 3,
    overflow: 'hidden',
  },
  timerBarFill: {
    height: '100%',
    backgroundColor: '#4CAF50',
    borderRadius: 3,
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
    gap: 15,
  },
  button: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 15,
    paddingHorizontal: 20,
    borderRadius: 12,
    gap: 8,
  },
  cancelButton: {
    backgroundColor: '#4CAF50',
  },
  confirmButton: {
    backgroundColor: '#FF6B6B',
  },
  buttonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
});

export default IncidentConfirmationModal;
