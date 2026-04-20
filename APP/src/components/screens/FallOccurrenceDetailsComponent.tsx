import React, { useState } from 'react';
import { VStack, HStack, Spacer } from "@components/CoreComponents";
import { StyleSheet, Text, ScrollView, View, Image, TouchableOpacity, ActivityIndicator, Alert } from "react-native";
import { MaterialIcons } from '@expo/vector-icons';
import { Color } from '@src/styles/colors';
import { Spacing, spacingStyles } from '@src/styles/spacings';
import { Border } from '@src/styles/borders';
import { FontFamily, FontSize } from '@src/styles/fonts';
import { shadowStyles } from '@src/styles/shadow';
import { formatDateLong } from '@src/utils/Date';
import { useTranslation } from 'react-i18next';
import { buildAvatarUrl } from '@src/services/ApiService';
import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';
import * as FileSystem from 'expo-file-system/legacy';
import * as ImagePicker from 'expo-image-picker';
import { fallOccurrenceApi } from '@src/api/endpoints/fallOccurrences';
import { woundTrackingApi, WoundTracking } from '@src/api/endpoints/woundTracking';
import WoundTrackingComponent from '@src/components/WoundTrackingComponent';

type Props = {
  data: any;
  occurrenceId?: number;
  canAddPhoto?: boolean;
  canAdd?: boolean;
  canDelete?: boolean;
  onDataRefresh?: () => void;
};

const DetailRow = ({ label, value, important = false }: {
  label: string,
  value?: string | number | boolean | null,
  important?: boolean
}) => (
  <View style={[styles.detailRow, important && styles.importantRow]}>
    <Text style={styles.detailLabel}>{label}</Text>
    <Text style={[styles.detailValue, important && styles.importantValue]}>
      {value === null || value === undefined || value === '' ? '-' : String(value)}
    </Text>
  </View>
);

const Card = ({ title, children }: { title: string, children: React.ReactNode }) => (
  <View style={styles.card}>
    <Text style={styles.cardTitle}>{title}</Text>
    {children}
  </View>
);

const FallOccurrenceDetailsComponent: React.FC<Props> = ({ data, occurrenceId, canAddPhoto = false, canAdd = false, canDelete = false, onDataRefresh }) => {
  const { t } = useTranslation();
  const handled = Boolean(data?.handlerUserId);
  const [generatingPdf, setGeneratingPdf] = useState(false);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);

  const buildPdfFilename = () => {
    const name = (data?.elderly?.name ?? 'Utente').replace(/\s+/g, '_');
    const d = data?.date ? new Date(data.date) : new Date();
    const day = String(d.getDate()).padStart(2, '0');
    const month = String(d.getMonth() + 1).padStart(2, '0');
    return `${name}_Queda_${day}${month}`;
  };

  const buildTrackingSectionHtml = (trackings: WoundTracking[], borderColor: string, lightBg: string) => {
    if (!trackings.length) {
      return '';
    }

    const formatTrackingDate = (value: string) => new Date(value).toLocaleDateString('pt-PT', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });

    return `
      <div class="section">
        <div class="section-title">${t('woundTracking.title')}</div>
        ${trackings.map((tracking) => `
          <div class="tracking-item">
            <div class="tracking-head">
              <strong>${formatTrackingDate(tracking.createdAt)}</strong>
              <span class="${tracking.isResolved ? 'badge-ok' : 'badge-injured'}">${tracking.isResolved ? t('woundTracking.resolved') : t('woundTracking.ongoing')}</span>
            </div>
            ${tracking.notes ? `<div class="tracking-note">${tracking.notes}</div>` : ''}
          </div>
        `).join('')}
      </div>
    `;
  };

  const generatePdfHtml = (photoBase64?: string | null, woundTrackings: WoundTracking[] = []) => {
    const elderlyName = data?.elderly?.name ?? '-';
    const date = data?.date ? formatDateLong(data.date) : '-';
    const status = handled ? t('fallOccurrence.handled') : t('fallOccurrence.unhandled');
    const handlerName = data?.handler?.name ?? '-';
    const isFalseAlarm = data?.isFalseAlarm;
    const primaryColor = '#35C2C1';
    const darkColor = '#1a2b3c';
    const mutedColor = '#6b7280';
    const borderColor = '#e5e7eb';
    const lightBg = '#f8fffe';
    const accentBg = '#f0fffe';

    const row = (label: string, value: string) =>
      `<tr><td class="td-label">${label}</td><td class="td-value">${value || '-'}</td></tr>`;

    const photoHtml = photoBase64
      ? `<div class="section">
          <div class="section-title">${t('fallOccurrence.injuryPhoto')}</div>
          <img src="data:image/jpeg;base64,${photoBase64}" style="max-width:100%;max-height:320px;border-radius:8px;border:1px solid ${borderColor};" />
        </div>`
      : '';

    return `
      <!DOCTYPE html>
      <html lang="pt">
      <head>
        <meta charset="utf-8"/>
        <meta name="viewport" content="width=device-width, initial-scale=1"/>
        <style>
          * { box-sizing: border-box; margin: 0; padding: 0; }
          body { font-family: Arial, Helvetica, sans-serif; background: #fff; color: ${darkColor}; font-size: 13px; }
          .header { background: ${primaryColor}; color: #fff; padding: 28px 36px 22px; }
          .header-title { font-size: 26px; font-weight: bold; letter-spacing: 1px; }
          .header-subtitle { font-size: 13px; opacity: 0.85; margin-top: 4px; }
          .header-meta { margin-top: 14px; font-size: 12px; opacity: 0.9; background: rgba(0,0,0,0.12); display: inline-block; padding: 4px 12px; border-radius: 20px; }
          .content { padding: 28px 36px; }
          .section { margin-bottom: 24px; }
          .section-title { font-size: 14px; font-weight: bold; color: ${primaryColor}; text-transform: uppercase; letter-spacing: 0.8px; padding-bottom: 8px; border-bottom: 2px solid ${primaryColor}; margin-bottom: 12px; }
          table { width: 100%; border-collapse: collapse; }
          .td-label { font-weight: bold; color: ${mutedColor}; font-size: 11px; text-transform: uppercase; letter-spacing: 0.5px; padding: 8px 12px; width: 40%; background: ${lightBg}; border-bottom: 1px solid ${borderColor}; vertical-align: top; }
          .td-value { color: ${darkColor}; font-size: 13px; padding: 8px 12px; border-bottom: 1px solid ${borderColor}; vertical-align: top; }
          .badge-false-alarm { display: inline-block; background: #fef3c7; color: #b45309; padding: 4px 14px; border-radius: 20px; font-size: 12px; font-weight: bold; border: 1px solid #fbbf24; }
          .badge-handled { display: inline-block; background: #d1fae5; color: #065f46; padding: 4px 14px; border-radius: 20px; font-size: 12px; font-weight: bold; border: 1px solid #6ee7b7; }
          .badge-unhandled { display: inline-block; background: #fee2e2; color: #991b1b; padding: 4px 14px; border-radius: 20px; font-size: 12px; font-weight: bold; border: 1px solid #fca5a5; }
          .badge-injured { display: inline-block; background: #fee2e2; color: #991b1b; padding: 4px 14px; border-radius: 20px; font-size: 12px; font-weight: bold; }
          .badge-ok { display: inline-block; background: #d1fae5; color: #065f46; padding: 4px 14px; border-radius: 20px; font-size: 12px; font-weight: bold; }
          .tracking-item { border: 1px solid ${borderColor}; border-radius: 10px; padding: 12px; background: ${lightBg}; margin-bottom: 10px; }
          .tracking-head { display: flex; justify-content: space-between; align-items: center; gap: 8px; margin-bottom: 8px; }
          .tracking-note { color: ${darkColor}; line-height: 1.5; }
          .footer { margin-top: 36px; padding: 16px 36px; background: ${lightBg}; border-top: 1px solid ${borderColor}; font-size: 11px; color: ${mutedColor}; display: flex; justify-content: space-between; }
        </style>
      </head>
      <body>
        <div class="header">
          <div class="header-title">Move+</div>
          <div class="header-subtitle">${t('fallOccurrence.title')}</div>
          <div class="header-meta">${t('fallOccurrence.elderly')}: ${elderlyName}</div>
        </div>

        <div class="content">
          <div class="section">
            <div class="section-title">${t('fallOccurrence.basicInformation')}</div>
            <table>
              ${row(t('fallOccurrence.elderly'), `<strong>${elderlyName}</strong>`)}
              ${row(t('fallOccurrence.date'), `<strong>${date}</strong>`)}
              ${row(t('fallOccurrence.status'), handled
                ? `<span class="badge-handled">${t('fallOccurrence.handled')}</span>`
                : `<span class="badge-unhandled">${t('fallOccurrence.unhandled')}</span>`)}
              ${isFalseAlarm ? row('', `<span class="badge-false-alarm">${t('fallOccurrence.falseAlarm')}</span>`) : ''}
              ${data?.handler ? row(t('fallOccurrence.handledBy'), handlerName) : ''}
              ${row(t('fallOccurrence.description'), data?.description ?? '-')}
            </table>
          </div>

          ${handled && !isFalseAlarm ? `
          <div class="section">
            <div class="section-title">${t('fallOccurrence.fallDetails')}</div>
            <table>
              ${row(t('fallOccurrence.recoveryProcess'), data?.recovery ?? '-')}
              ${row(t('fallOccurrence.preActivity'), data?.preActivity ?? '-')}
              ${row(t('fallOccurrence.postActivity'), data?.postActivity ?? '-')}
              ${row(t('fallOccurrence.fallDirection'), data?.direction ?? '-')}
              ${row(t('fallOccurrence.environment'), data?.environment ?? '-')}
            </table>
          </div>

          <div class="section">
            <div class="section-title">${t('fallOccurrence.injuryInformation')}</div>
            <table>
              ${row(t('fallOccurrence.injured'), data?.injured
                ? `<span class="badge-injured">${t('fallOccurrence.yes')}</span>`
                : `<span class="badge-ok">${t('fallOccurrence.no')}</span>`)}
              ${data?.injured ? row(t('fallOccurrence.injuryDescription'), data?.injuryDescription ?? '-') : ''}
              ${row(t('fallOccurrence.measuresTaken'), data?.measuresTaken ?? '-')}
            </table>
          </div>

          ${photoHtml}

          ${buildTrackingSectionHtml(woundTrackings, borderColor, lightBg)}
          ` : ''}
        </div>

        <div class="footer">
          <span>Move+ &copy; ${new Date().getFullYear()}</span>
          <span>${t('fallOccurrence.generatingPdf').replace('...', '')} ${new Date().toLocaleDateString('pt-PT', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' })}</span>
        </div>
      </body>
      </html>
    `;
  };

  const downloadPdf = async () => {
    setGeneratingPdf(true);
    try {
      let photoBase64: string | null = null;
      let woundTrackings: WoundTracking[] = [];
      if (data?.injuryPhotoUrl) {
        try {
          const remoteUrl = buildAvatarUrl(data.injuryPhotoUrl);
          const tmpPath = `${FileSystem.cacheDirectory}pdf_photo_tmp.jpg`;
          const dl = await FileSystem.downloadAsync(remoteUrl, tmpPath);
          photoBase64 = await FileSystem.readAsStringAsync(dl.uri, { encoding: FileSystem.EncodingType.Base64 });
        } catch {
          // photo fetch failed — continue without it
        }
      }
      if (occurrenceId && handled && !data?.isFalseAlarm && data?.injured) {
        try {
          const trackingResponse = await woundTrackingApi.getFallWoundTrackings(occurrenceId);
          woundTrackings = Array.isArray(trackingResponse.data) ? trackingResponse.data : [];
        } catch {
          woundTrackings = [];
        }
      }
      const html = generatePdfHtml(photoBase64, woundTrackings);
      const { uri } = await Print.printToFileAsync({ html, base64: false });
      const filename = buildPdfFilename();
      const destUri = `${FileSystem.documentDirectory}${filename}.pdf`;
      await FileSystem.moveAsync({ from: uri, to: destUri });
      await Sharing.shareAsync(destUri, { mimeType: 'application/pdf', dialogTitle: filename, UTI: 'com.adobe.pdf' });
    } catch (e) {
      console.error('Error generating PDF:', e);
      Alert.alert(t('fallOccurrence.pdfError'));
    }
    setGeneratingPdf(false);
  };

  const pickAndUploadPhoto = async (fromCamera: boolean) => {
    if (!occurrenceId) return;
    try {
      let result: ImagePicker.ImagePickerResult;
      if (fromCamera) {
        const { status } = await ImagePicker.requestCameraPermissionsAsync();
        if (status !== 'granted') return;
        result = await ImagePicker.launchCameraAsync({ mediaTypes: ImagePicker.MediaTypeOptions.Images, quality: 0.7 });
      } else {
        const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
        if (status !== 'granted') return;
        result = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ImagePicker.MediaTypeOptions.Images, quality: 0.7 });
      }
      if (!result.canceled && result.assets.length > 0) {
        setUploadingPhoto(true);
        const uri = result.assets[0].uri;
        const formData = new FormData();
        const filename = uri.split('/').pop() || 'photo.jpg';
        const ext = /\.(\w+)$/.exec(filename);
        formData.append('photo', { uri, name: filename, type: ext ? `image/${ext[1]}` : 'image/jpeg' } as any);
        await fallOccurrenceApi.uploadFallOccurrencePhoto(occurrenceId, formData);
        setUploadingPhoto(false);
        onDataRefresh?.();
      }
    } catch (e) {
      console.error('Error uploading photo:', e);
      setUploadingPhoto(false);
    }
  };

  const showPhotoOptions = () => {
    Alert.alert(
      t('fallOccurrence.injuryPhoto'),
      undefined,
      [
        { text: t('fallOccurrence.takePhoto'), onPress: () => pickAndUploadPhoto(true) },
        { text: t('fallOccurrence.chooseFromGallery'), onPress: () => pickAndUploadPhoto(false) },
        { text: t('common.cancel'), style: 'cancel' },
      ]
    );
  };

  return (
    <ScrollView
      contentContainerStyle={styles.scrollContainer}
      showsVerticalScrollIndicator={false}
    >
      <VStack align="flex-start" spacing={Spacing.lg_24}>
        <Card title={t('fallOccurrence.basicInformation')}>
          <VStack align="flex-start" spacing={Spacing.sm_8}>
            <DetailRow label={t('fallOccurrence.elderly')} value={data?.elderly?.name} important />
            <DetailRow label={t('fallOccurrence.date')} value={data?.date ? formatDateLong(data.date) : null} important />
            <DetailRow label={t('fallOccurrence.status')} value={handled ? t('fallOccurrence.handled') : t('fallOccurrence.unhandled')} important />
            {data?.isFalseAlarm && (
              <View style={styles.falseAlarmBadge}>
                <Text style={styles.falseAlarmText}>{t('fallOccurrence.falseAlarm')}</Text>
              </View>
            )}
            {data?.handler && (
              <DetailRow label={t('fallOccurrence.handledBy')} value={data.handler.name} />
            )}
            <DetailRow label={t('fallOccurrence.description')} value={data?.description} />
          </VStack>
        </Card>

        {handled && !data?.isFalseAlarm && (
          <>
            <Card title={t('fallOccurrence.fallDetails')}>
              <VStack align="flex-start" spacing={Spacing.sm_8}>
                <DetailRow label={t('fallOccurrence.recoveryProcess')} value={data?.recovery} />
                <DetailRow label={t('fallOccurrence.preActivity')} value={data?.preActivity} />
                <DetailRow label={t('fallOccurrence.postActivity')} value={data?.postActivity} />
                <DetailRow label={t('fallOccurrence.fallDirection')} value={data?.direction} />
                <DetailRow label={t('fallOccurrence.environment')} value={data?.environment} />
              </VStack>
            </Card>

            <Card title={t('fallOccurrence.injuryInformation')}>
              <VStack align="flex-start" spacing={Spacing.sm_8}>
                <DetailRow
                  label={t('fallOccurrence.injured')}
                  value={data?.injured ? t('fallOccurrence.yes') : t('fallOccurrence.no')}
                  important={data?.injured}
                />

                {data?.injured && (
                  <View style={styles.injuryDetails}>
                    <DetailRow label={t('fallOccurrence.injuryDescription')} value={data?.injuryDescription} />
                  </View>
                )}

                <DetailRow label={t('fallOccurrence.measuresTaken')} value={data?.measuresTaken} />

                {/* Injury photo */}
                {data?.injuryPhotoUrl ? (
                  <View style={styles.photoContainer}>
                    <Text style={styles.detailLabel}>{t('fallOccurrence.injuryPhoto')}</Text>
                    <Image
                      source={{ uri: buildAvatarUrl(data.injuryPhotoUrl) }}
                      style={styles.injuryPhoto}
                      resizeMode="cover"
                    />
                    {canAddPhoto && (
                      <TouchableOpacity style={styles.changePhotoButton} onPress={showPhotoOptions} disabled={uploadingPhoto}>
                        {uploadingPhoto
                          ? <ActivityIndicator size="small" color={Color.primary} />
                          : <Text style={styles.changePhotoText}>{t('fallOccurrence.addInjuryPhoto')}</Text>
                        }
                      </TouchableOpacity>
                    )}
                  </View>
                ) : canAddPhoto ? (
                  <View style={styles.photoContainer}>
                    <Text style={styles.detailLabel}>{t('fallOccurrence.injuryPhoto')}</Text>
                    <TouchableOpacity style={styles.addPhotoButton} onPress={showPhotoOptions} disabled={uploadingPhoto}>
                      {uploadingPhoto
                        ? <ActivityIndicator size="small" color={Color.primary} />
                        : <Text style={styles.addPhotoText}>📷  {t('fallOccurrence.addInjuryPhoto')}</Text>
                      }
                    </TouchableOpacity>
                  </View>
                ) : null}
              </VStack>
            </Card>
          </>
        )}

        {/* Wound Tracking */}
        {handled && !data?.isFalseAlarm && data?.injured && occurrenceId && (
          <WoundTrackingComponent
            occurrenceId={occurrenceId}
            occurrenceType="fall"
            canAdd={canAdd}
            canDelete={canDelete}
          />
        )}

        {/* PDF Download Button */}
        <TouchableOpacity style={styles.pdfButton} onPress={downloadPdf} disabled={generatingPdf}>
          {generatingPdf
            ? <ActivityIndicator size="small" color={Color.white} />
            : <View style={styles.pdfButtonInner}>
                <MaterialIcons name="picture-as-pdf" size={22} color={Color.white} />
                <Text style={styles.pdfButtonText}>{t('fallOccurrence.downloadPdf')}</Text>
              </View>
          }
        </TouchableOpacity>
      </VStack>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  scrollContainer: {
    flexGrow: 1,
    ...spacingStyles.screenScrollContainer,
  },
  card: {
    backgroundColor: Color.white,
    padding: Spacing.lg_24,
    borderRadius: Border.lg_16,
    ...shadowStyles.cardShadow,
    alignSelf: 'stretch',
  },
  cardTitle: {
    fontFamily: FontFamily.bold,
    fontSize: FontSize.bodylarge_18,
    color: Color.primary,
    marginBottom: Spacing.md_16,
  },
  detailRow: {
    paddingVertical: Spacing.xs_4,
  },
  importantRow: {
    backgroundColor: Color.primary + '08',
    paddingHorizontal: Spacing.sm_8,
    borderRadius: Border.sm_8,
  },
  detailLabel: {
    fontFamily: FontFamily.bold,
    fontSize: FontSize.bodysmall_14,
    color: Color.Gray.v400,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  detailValue: {
    fontFamily: FontFamily.regular,
    fontSize: FontSize.bodymedium_16,
    color: Color.Gray.v500,
    lineHeight: 22,
  },
  importantValue: {
    fontFamily: FontFamily.bold,
    color: Color.primary,
  },
  injuryDetails: {
    backgroundColor: Color.Error.default + '08',
    padding: Spacing.sm_8,
    borderRadius: Border.sm_8,
    borderLeftWidth: 3,
    borderLeftColor: Color.Error.default,
  },
  falseAlarmBadge: {
    backgroundColor: Color.Warning.amber + '20',
    paddingHorizontal: Spacing.md_16,
    paddingVertical: Spacing.sm_8,
    borderRadius: Border.md_12,
    borderWidth: 1,
    borderColor: Color.Warning.amber,
    alignSelf: 'flex-start',
    marginTop: Spacing.xs_4,
  },
  falseAlarmText: {
    fontFamily: FontFamily.bold,
    fontSize: FontSize.bodysmall_14,
    color: Color.Warning.amber,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  photoContainer: {
    marginTop: Spacing.sm_8,
    gap: Spacing.sm_8,
    width: '100%',
  },
  injuryPhoto: {
    width: '100%',
    height: 220,
    borderRadius: Border.md_12,
    backgroundColor: Color.Gray.v100,
  },
  addPhotoButton: {
    borderWidth: 1.5,
    borderColor: Color.primary + '60',
    borderStyle: 'dashed',
    borderRadius: Border.md_12,
    padding: Spacing.md_16,
    alignItems: 'center',
    backgroundColor: Color.primary + '05',
  },
  addPhotoText: {
    fontFamily: FontFamily.medium,
    fontSize: FontSize.bodymedium_16,
    color: Color.primary,
  },
  changePhotoButton: {
    alignSelf: 'flex-end',
    paddingHorizontal: Spacing.md_16,
    paddingVertical: Spacing.xs_4,
    backgroundColor: Color.primary + '15',
    borderRadius: Border.sm_8,
  },
  changePhotoText: {
    fontFamily: FontFamily.medium,
    fontSize: FontSize.bodysmall_14,
    color: Color.primary,
  },
  pdfButton: {
    backgroundColor: Color.primary,
    paddingVertical: Spacing.md_16,
    borderRadius: Border.md_12,
    alignItems: 'center',
    alignSelf: 'stretch',
    ...shadowStyles.cardShadow,
  },
  pdfButtonInner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm_8,
  },
  pdfButtonText: {
    fontFamily: FontFamily.bold,
    fontSize: FontSize.bodymedium_16,
    color: Color.white,
  },
});

export default FallOccurrenceDetailsComponent;