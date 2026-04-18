import { useState, useEffect, useCallback } from 'react';
import {
  View, Text, StyleSheet, SafeAreaView, FlatList, RefreshControl,
  ActivityIndicator, TouchableOpacity, Clipboard, Alert
} from 'react-native';
import { Color } from '@src/styles/colors';
import { Spacing } from '@src/styles/spacings';
import { FontFamily, FontSize } from '@src/styles/fonts';
import { Border } from '@src/styles/borders';
import { VStack, HStack, Spacer } from '@components/CoreComponents';
import { MaterialIcons } from '@expo/vector-icons';
import { useTranslation } from '@src/localization/hooks/useTranslation';
import { invitationsApi } from '@src/api/endpoints/invitations';
import { InvitationListItem } from 'moveplus-shared';
import { shadowStyles } from '@src/styles/shadow';
import { useFocusEffect } from '@react-navigation/native';
import { useToast } from '@src/providers/ToastProvider';

interface InstitutionInvitationsScreenProps {
  navigation: any;
  route: {
    params: {
      institutionId: number;
    };
  };
}

const InstitutionInvitationsScreen: React.FC<InstitutionInvitationsScreenProps> = ({ navigation, route }) => {
  const [invitations, setInvitations] = useState<InvitationListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const { t } = useTranslation();
  const { showError, showSuccess } = useToast();
  const { institutionId } = route.params;

  const fetchInvitations = async () => {
    try {
      const response = await invitationsApi.getInvitations({ institutionId });
      setInvitations(response.data);
    } catch (error) {
      console.error('Error fetching invitations:', error);
      showError(t('errors.genericError'));
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchInvitations();
    setRefreshing(false);
  };

  useEffect(() => {
    setLoading(true);
    fetchInvitations();
    setLoading(false);
  }, [institutionId]);

  useFocusEffect(
    useCallback(() => {
      setLoading(true);
      fetchInvitations();
      setLoading(false);
    }, [institutionId])
  );

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'PENDING':
        return Color.Orange.v400;
      case 'ACCEPTED':
        return Color.Cyan.v400;
      case 'PROFILE_INCOMPLETE':
        return Color.Warning.amber;
      case 'EXPIRED':
        return Color.Gray.v400;
      case 'CANCELLED':
        return Color.Error.default;
      default:
        return Color.Gray.v400;
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'PENDING':
        return t('invitation.statusPending');
      case 'ACCEPTED':
        return t('invitation.statusAccepted');
      case 'PROFILE_INCOMPLETE':
        return t('invitation.statusProfileIncomplete');
      case 'EXPIRED':
        return t('invitation.statusExpired');
      case 'CANCELLED':
        return t('invitation.statusCancelled');
      default:
        return status;
    }
  };

  const getRoleText = (role: string) => {
    switch (role) {
      case 'ELDERLY':
        return t('userRole.elderly');
      case 'CAREGIVER':
        return t('userRole.caregiver');
      case 'INSTITUTION_ADMIN':
        return t('userRole.admin');
      default:
        return role;
    }
  };

  const handleCopyInvite = (token: string) => {
    Clipboard.setString(token);
    showSuccess(t('invitation.inviteCopied'));
  };

  const handleCancelInvitation = (invitation: InvitationListItem) => {
    Alert.alert(
      t('invitation.cancelConfirmTitle'),
      t('invitation.cancelConfirmMessage'),
      [
        {
          text: t('common.goBack'),
          style: 'cancel',
        },
        {
          text: t('invitation.confirmCancel'),
          style: 'destructive',
          onPress: async () => {
            try {
              await invitationsApi.cancelInvitation(invitation.id);
              showSuccess(t('invitation.inviteCancelled'));
              await fetchInvitations();
            } catch (error) {
              console.error('Error cancelling invitation:', error);
              showError(t('errors.genericError'));
            }
          },
        },
      ]
    );
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString(undefined, {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const isExpired = (expiresAt: string) => {
    return new Date() > new Date(expiresAt);
  };

  const renderInvitation = ({ item }: { item: InvitationListItem }) => {
    const expired = isExpired(item.expiresAt);
    const statusColor = getStatusColor(item.status);

    return (
      <View style={styles.invitationCard}>
        <VStack spacing={Spacing.sm_8} align="flex-start" style={{ flex: 1 }}>
          <HStack spacing={Spacing.sm_8} style={{ alignSelf: 'stretch', alignItems: 'center' }}>
            <View style={[styles.statusBadge, { backgroundColor: statusColor }]}>
              <Text style={styles.statusText}>{getStatusText(item.status)}</Text>
            </View>
            <Spacer />
            <View style={styles.roleBadge}>
              <Text style={styles.roleText}>{getRoleText(item.role)}</Text>
            </View>
          </HStack>

          <Text style={styles.email}>{item.email}</Text>

          <HStack spacing={Spacing.md_16} style={{ alignSelf: 'stretch' }}>
            <VStack spacing={Spacing.xs_4} align="flex-start" style={{ flex: 1 }}>
              <Text style={styles.label}>{t('invitation.invitedBy')}</Text>
              <Text style={styles.value}>{item.invitedBy.name}</Text>
            </VStack>

            <VStack spacing={Spacing.xs_4} align="flex-start" style={{ flex: 1 }}>
              <Text style={styles.label}>{t('invitation.createdAt')}</Text>
              <Text style={styles.value}>{formatDate(item.createdAt)}</Text>
            </VStack>
          </HStack>

          {item.status !== 'CANCELLED' && (
            <HStack spacing={Spacing.xs_6} style={{ alignItems: 'center' }}>
              <MaterialIcons
                name="schedule"
                size={16}
                color={expired ? Color.Error.default : Color.Gray.v400}
              />
              <Text style={[styles.expiresText, expired && styles.expiredText]}>
                {t('invitation.expiresOn')}: {formatDate(item.expiresAt)}
              </Text>
            </HStack>
          )}

          {(item.status === 'PENDING' || item.status === 'PROFILE_INCOMPLETE') && !expired && (
            <>
              <View style={styles.tokenContainer}>
                <Text style={styles.tokenLabel}>{t('invitation.invitationCode')}</Text>
                <Text style={styles.token}>{item.token}</Text>
              </View>

              <HStack spacing={Spacing.sm_8} style={{ alignSelf: 'stretch', marginTop: Spacing.sm_8 }}>
                <TouchableOpacity
                  style={styles.copyButton}
                  onPress={() => handleCopyInvite(item.token)}
                >
                  <MaterialIcons name="content-copy" size={18} color={Color.primary} />
                  <Text style={styles.copyButtonText}>{t('invitation.copyInvite')}</Text>
                </TouchableOpacity>

                {item.status === 'PENDING' && (
                  <TouchableOpacity
                    style={styles.cancelButton}
                    onPress={() => handleCancelInvitation(item)}
                  >
                    <MaterialIcons name="close" size={18} color={Color.Error.default} />
                    <Text style={styles.cancelButtonText}>{t('invitation.cancelInvite')}</Text>
                  </TouchableOpacity>
                )}
              </HStack>
            </>
          )}
        </VStack>
      </View>
    );
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={Color.primary} />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <FlatList
        data={invitations}
        keyExtractor={(item) => item.id.toString()}
        renderItem={renderInvitation}
        contentContainerStyle={styles.listContainer}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <MaterialIcons name="mail-outline" size={64} color={Color.Gray.v300} />
            <Text style={styles.emptyText}>{t('invitation.noInvitations')}</Text>
          </View>
        }
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={Color.primary}
          />
        }
      />
    </SafeAreaView>
  );
};

export default InstitutionInvitationsScreen;

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: Color.Background.subtle,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  listContainer: {
    flexGrow: 1,
    padding: Spacing.md_16,
  },
  invitationCard: {
    backgroundColor: Color.white,
    borderRadius: Border.lg_16,
    padding: Spacing.md_16,
    marginBottom: Spacing.md_16,
    borderWidth: 1,
    borderColor: Color.Gray.v200,
    ...shadowStyles.cardShadow,
  },
  statusBadge: {
    paddingHorizontal: Spacing.sm_8,
    paddingVertical: Spacing.xs_4,
    borderRadius: Border.sm_8,
  },
  statusText: {
    fontFamily: FontFamily.semi_bold,
    fontSize: FontSize.bodysmall_14,
    color: Color.white,
    textTransform: 'uppercase',
  },
  roleBadge: {
    paddingHorizontal: Spacing.sm_8,
    paddingVertical: Spacing.xs_4,
    borderRadius: Border.sm_8,
    backgroundColor: Color.Background.cyanTint,
  },
  roleText: {
    fontFamily: FontFamily.semi_bold,
    fontSize: FontSize.bodysmall_14,
    color: Color.primary,
  },
  email: {
    fontFamily: FontFamily.bold,
    fontSize: FontSize.bodylarge_18,
    color: Color.dark,
  },
  label: {
    fontFamily: FontFamily.regular,
    fontSize: FontSize.bodysmall_14,
    color: Color.Gray.v400,
  },
  value: {
    fontFamily: FontFamily.medium,
    fontSize: FontSize.bodymedium_16,
    color: Color.dark,
  },
  expiresText: {
    fontFamily: FontFamily.regular,
    fontSize: FontSize.bodysmall_14,
    color: Color.Gray.v400,
  },
  expiredText: {
    color: Color.Error.default,
    fontFamily: FontFamily.semi_bold,
  },
  tokenContainer: {
    backgroundColor: Color.Background.subtle,
    borderRadius: Border.md_12,
    borderWidth: 1,
    borderColor: Color.primary,
    borderStyle: 'dashed',
    padding: Spacing.sm_8,
    alignSelf: 'stretch',
    marginTop: Spacing.xs_4,
  },
  tokenLabel: {
    fontFamily: FontFamily.semi_bold,
    fontSize: FontSize.bodysmall_14,
    color: Color.Gray.v400,
    textTransform: 'uppercase',
    marginBottom: Spacing.xs_4,
  },
  token: {
    fontFamily: FontFamily.bold,
    fontSize: FontSize.bodymedium_16,
    color: Color.primary,
    letterSpacing: 1,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: Spacing.xl5_64,
  },
  emptyText: {
    fontFamily: FontFamily.regular,
    fontSize: FontSize.bodylarge_18,
    color: Color.Gray.v400,
    marginTop: Spacing.md_16,
    textAlign: 'center',
  },
  copyButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Color.Background.white,
    borderWidth: 1.5,
    borderColor: Color.primary,
    borderRadius: Border.md_12,
    paddingVertical: Spacing.sm_8,
    paddingHorizontal: Spacing.sm_8,
    gap: Spacing.xs_4,
  },
  copyButtonText: {
    fontFamily: FontFamily.semi_bold,
    fontSize: FontSize.bodysmall_14,
    color: Color.primary,
  },
  cancelButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Color.Background.white,
    borderWidth: 1.5,
    borderColor: Color.Error.default,
    borderRadius: Border.md_12,
    paddingVertical: Spacing.sm_8,
    paddingHorizontal: Spacing.sm_8,
    gap: Spacing.xs_4,
  },
  cancelButtonText: {
    fontFamily: FontFamily.semi_bold,
    fontSize: FontSize.bodysmall_14,
    color: Color.Error.default,
  },
});
