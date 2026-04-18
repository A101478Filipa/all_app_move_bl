import React, { useState } from 'react';
import { View, Text, StyleSheet, ActivityIndicator, Image } from 'react-native';
import { useTranslation } from 'react-i18next';
import { dataAccessRequestApi, DataAccessRequest } from '@src/api/endpoints/dataAccessRequest';
import { Color } from '@src/styles/colors';
import { Border } from '@src/styles/borders';
import { Spacing } from '@src/styles/spacings';
import { shadowStyles } from '@src/styles/shadow';
import { FontFamily, FontSize } from '@src/styles/fonts';
import Toast from 'react-native-toast-message';
import { MaterialIcons } from '@expo/vector-icons';
import { buildAvatarUrl } from '@services/ApiService';
import { VStack, HStack, Spaced } from '@components/CoreComponents';
import { PrimaryButton, SecondaryButton } from '@components/ButtonComponents';
import { ConfirmDataAccessModal } from '@components/ConfirmDataAccessModal';
import ScreenState from '@src/constants/screenState';
import { UserRole } from 'moveplus-shared';

interface PendingDataAccessRequestsWidgetProps {
  requests: DataAccessRequest[];
  state: ScreenState;
  onRequestResponded: (requestId: number) => void;
  userRole?: UserRole; // Add userRole to determine if it's a caregiver responding
}

export const PendingDataAccessRequestsWidget: React.FC<PendingDataAccessRequestsWidgetProps> = ({
  requests,
  state,
  onRequestResponded,
  userRole,
}) => {
  const { t } = useTranslation();
  const [processingId, setProcessingId] = useState<number | null>(null);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [selectedRequest, setSelectedRequest] = useState<DataAccessRequest | null>(null);

  const isCaregiver = userRole === UserRole.CAREGIVER || userRole === UserRole.INSTITUTION_ADMIN;

  const handleApproveClick = (request: DataAccessRequest) => {
    setSelectedRequest(request);
    setShowConfirmModal(true);
  };

  const handleConfirmApproval = async () => {
    if (!selectedRequest) return;

    setShowConfirmModal(false);
    await handleRespond(selectedRequest.id, 'APPROVED');
    setSelectedRequest(null);
  };

  const handleCancelApproval = () => {
    setShowConfirmModal(false);
    setSelectedRequest(null);
  };

  const handleRespond = async (requestId: number, status: 'APPROVED' | 'DENIED') => {
    try {
      setProcessingId(requestId);

      if (isCaregiver) {
        await dataAccessRequestApi.respondToRequestAsCaregiver(requestId, { status });
      } else {
        await dataAccessRequestApi.respondToRequest(requestId, { status });
      }

      onRequestResponded(requestId);

      Toast.show({
        type: 'success',
        text1: t('common.success'),
        text2: status === 'APPROVED'
          ? t(isCaregiver ? 'caregiver.accessApprovedOnBehalf' : 'elderly.accessApproved')
          : t(isCaregiver ? 'caregiver.accessDeniedOnBehalf' : 'elderly.accessDenied'),
      });
    } catch (error) {
      console.error('Error responding to request:', error);
      Toast.show({
        type: 'error',
        text1: t('common.error'),
        text2: t('elderly.failedToRespond'),
      });
    } finally {
      setProcessingId(null);
    }
  };

  if (state === ScreenState.LOADING) {
    return (
      <View style={styles.container}>
        <Text style={styles.headerTitle}>{t('elderly.pendingAccessRequests')}</Text>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={Color.primary} />
        </View>
      </View>
    );
  }

  if (requests.length === 0) {
    return null;
  }

  return (
    <VStack spacing={Spacing.md_16} style={{ alignSelf: 'stretch', paddingBottom: Spacing.lg_24 }}>
      {/* Section Header */}
      <VStack align="flex-start" style={{ flex: 1, alignSelf: 'stretch' }}>
        <Text style={styles.headerTitle}>
          {isCaregiver ? t('caregiver.pendingAccessRequests') : t('elderly.pendingAccessRequests')}
        </Text>
        <Text style={styles.headerSubtitle}>
          {requests.length} {requests.length === 1 ? t('elderly.request') : t('elderly.requests')}
        </Text>
      </VStack>

      {/* Request Cards */}
      {requests.map(request => (
        <View key={request.id} style={styles.requestCard}>
          {/* Show elderly info for caregivers */}
          {isCaregiver && request.elderly && (
            <>
              <VStack spacing={Spacing.xs_4} align="flex-start" style={{ alignSelf: 'stretch' }}>
                <Text style={styles.elderlyLabel}>{t('caregiver.forElderly')}:</Text>
                <HStack spacing={Spacing.sm_8} align="center">
                  <Image
                    source={{ uri: buildAvatarUrl(request.elderly.user?.avatarUrl) }}
                    style={styles.smallAvatar}
                  />
                  <Text style={styles.elderlyName}>{request.elderly.name}</Text>
                </HStack>
              </VStack>
              <Spaced height={Spacing.sm_12} />
            </>
          )}

          {/* Clinician Header */}
          <HStack spacing={Spacing.md_16} align="center" style={styles.clinicianHeader}>
            <Image
              source={{ uri: buildAvatarUrl(request.clinician?.user?.avatarUrl) }}
              style={styles.avatar}
            />
            <VStack align="flex-start" style={{ flex: 1 }}>
              <Text style={styles.clinicianName}>
                {request.clinician?.name || t('common.unknown')}
              </Text>
              <HStack spacing={Spacing.xs_4} align="center">
                <MaterialIcons name="schedule" size={14} color={Color.Gray.v400} />
                <Text style={styles.requestDate}>
                  {new Date(request.requestedAt).toLocaleDateString()}
                </Text>
              </HStack>
            </VStack>
          </HStack>

          {/* Notes Section */}
          {request.notes && (
            <>
              <Spaced height={Spacing.md_16} />
              <VStack spacing={Spacing.xs_4} align="flex-start" style={{ alignSelf: 'stretch' }}>
                <Text style={styles.notesLabel}>{t('elderly.notes')}:</Text>
                <Text style={styles.notesText}>{request.notes}</Text>
              </VStack>
            </>
          )}

          {/* Action Buttons */}
          <Spaced height={Spacing.md_16} />
          <HStack spacing={Spacing.sm_12}>
            <SecondaryButton
              title={t('elderly.deny')}
              onPress={() => handleRespond(request.id, 'DENIED')}
              loading={processingId === request.id}
              icon={<MaterialIcons name="close" size={18} color={Color.secondary} />}
              paddingVertical={Spacing.sm_12}
              style={{ flex: 1 }}
            />

            <PrimaryButton
              title={t('elderly.approve')}
              onPress={() => handleApproveClick(request)}
              loading={processingId === request.id}
              icon={<MaterialIcons name="check" size={18} color={Color.white} />}
              paddingVertical={Spacing.sm_12}
              style={{ flex: 1 }}
            />
          </HStack>
        </View>
      ))}

      {/* Confirmation Modal */}
      <ConfirmDataAccessModal
        visible={showConfirmModal}
        clinicianName={selectedRequest?.clinician?.name || t('common.unknown')}
        onConfirm={handleConfirmApproval}
        onCancel={handleCancelApproval}
        loading={processingId !== null}
      />
    </VStack>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: Color.white,
    borderRadius: Border.lg_16,
    padding: Spacing.md_16,
    alignSelf: 'stretch',
    ...shadowStyles.cardShadow,
  },
  loadingContainer: {
    paddingVertical: Spacing.xl_32,
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: FontSize.bodylarge_18,
    fontFamily: FontFamily.bold,
    color: Color.dark,
  },
  headerSubtitle: {
    fontSize: FontSize.bodysmall_14,
    fontFamily: FontFamily.regular,
    color: Color.Gray.v400,
  },
  requestCard: {
    backgroundColor: Color.white,
    borderRadius: Border.lg_16,
    padding: Spacing.md_16,
    borderWidth: 1,
    borderColor: Color.Gray.v200,
    alignSelf: 'stretch',
    ...shadowStyles.cardShadow,
  },
  clinicianHeader: {
    alignSelf: 'stretch',
  },
  avatar: {
    width: 56,
    height: 56,
    borderRadius: Border.full,
  },
  clinicianName: {
    fontSize: FontSize.bodymedium_16,
    fontFamily: FontFamily.bold,
    color: Color.dark,
  },
  requestDate: {
    fontSize: FontSize.caption_12,
    fontFamily: FontFamily.regular,
    color: Color.Gray.v400,
  },
  notesLabel: {
    fontSize: FontSize.caption_12,
    fontFamily: FontFamily.semi_bold,
    color: Color.Gray.v400,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  notesText: {
    fontSize: FontSize.bodysmall_14,
    fontFamily: FontFamily.regular,
    color: Color.dark,
    lineHeight: 20,
  },
  elderlyLabel: {
    fontSize: FontSize.caption_12,
    fontFamily: FontFamily.semi_bold,
    color: Color.primary,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  smallAvatar: {
    width: 32,
    height: 32,
    borderRadius: Border.full,
  },
  elderlyName: {
    fontSize: FontSize.bodymedium_16,
    fontFamily: FontFamily.semi_bold,
    color: Color.primary,
  },
});
