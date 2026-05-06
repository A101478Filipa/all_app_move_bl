import React, { useState } from 'react';
import { VStack } from '@components/CoreComponents';
import { StyleSheet, Text, ScrollView, View, Image, TouchableOpacity, ActivityIndicator, Alert } from 'react-native';
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
import { elderlyApi } from '@src/api/endpoints/elderly';
import { woundTrackingApi, WoundTracking } from '@src/api/endpoints/woundTracking';
import WoundTrackingComponent from '@src/components/WoundTrackingComponent';

type Props = {
  data: any;
  occurrenceId?: number;
  canAdd?: boolean;
  canDelete?: boolean;
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

const SosOccurrenceDetailsComponent: React.FC<Props> = ({ data, occurrenceId, canAdd = false, canDelete = false }) => {
  const { t } = useTranslation();
  const handled = Boolean(data?.handlerUserId);
  const [generatingPdf, setGeneratingPdf] = useState(false);

  const buildPdfFilename = () => {
    const name = (data?.elderly?.name ?? 'Utente').replace(/\s+/g, '_');
    const d = data?.date ? new Date(data.date) : new Date();
    const day = String(d.getDate()).padStart(2, '0');
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const type = data?.wasActualFall ? 'QuedaSOS' : 'SOS';
    return `${name}_${type}_${day}${month}`;
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
            ${tracking.bodyLocations && (tracking.bodyLocations as string[]).length > 0
              ? `<div class="loc-tags">${(tracking.bodyLocations as string[]).map((loc: string) => `<span class="loc-tag">${t(`woundTracking.bodyLocation_${loc}`) || loc}</span>`).join('')}</div>`
              : ''}
          </div>
        `).join('')}
      </div>
    `;
  };

  const generatePdfHtml = (photoBase64?: string | null, woundTrackings: WoundTracking[] = [], elderlyDetails: any = null) => {
    const elderlyName = data?.elderly?.name ?? '-';
    const date = data?.date ? formatDateLong(data.date) : '-';
    const handled = Boolean(data?.handlerUserId);
    const handlerName = data?.handler?.name ?? '-';
    const isFalseAlarm = data?.isFalseAlarm;
    const isActualFall = data?.wasActualFall;
    const primaryColor = '#35C2C1';
    const darkColor = '#1a2b3c';
    const mutedColor = '#6b7280';
    const borderColor = '#e5e7eb';
    const lightBg = '#f8fffe';
    const accentBg = '#f0fffe';

    const row = (label: string, value: string) =>
      `<tr><td class="td-label">${label}</td><td class="td-value">${value || '-'}</td></tr>`;

    const elderlyDataHtml = elderlyDetails ? (() => {
      const measurements: any[] = elderlyDetails.measurements ?? [];
      const pathologies: any[] = elderlyDetails.pathologies ?? [];
      const medications: any[] = elderlyDetails.medications ?? [];
      const latestWeight = measurements.filter(m => m.type === 'WEIGHT').sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())[0];
      const latestHeight = measurements.filter(m => m.type === 'HEIGHT').sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())[0];
      const birthDate = elderlyDetails.birthDate ? new Date(elderlyDetails.birthDate).toLocaleDateString('pt-PT', { day: '2-digit', month: '2-digit', year: 'numeric' }) : null;
      const age = elderlyDetails.birthDate ? Math.floor((Date.now() - new Date(elderlyDetails.birthDate).getTime()) / (365.25 * 24 * 3600 * 1000)) : null;
      return `
        <div class="section">
          <div class="section-title">${t('elderly.elderlyInfo')}</div>
          <table>
            ${elderlyDetails.medicalId ? row(t('elderly.medicalId'), String(elderlyDetails.medicalId)) : ''}
            ${birthDate ? row(t('authentication.birthDate'), `${birthDate}${age !== null ? ` (${age} ${t('elderly.years')})` : ''}`) : ''}
            ${latestWeight ? row(t('measurements.weight'), `${latestWeight.value} ${latestWeight.unit ?? 'kg'}`) : ''}
            ${latestHeight ? row(t('measurements.height'), `${latestHeight.value} ${latestHeight.unit ?? 'cm'}`) : ''}
          </table>
          ${pathologies.length > 0 ? `
          <div class="subsection-label">${t('elderly.pathologies')}</div>
          <div class="tag-list">${pathologies.map((p: any) => `<span class="info-tag">${p.name}${p.status ? ` (${p.status})` : ''}</span>`).join('')}</div>` : ''}
          ${medications.length > 0 ? `
          <div class="subsection-label">${t('elderly.medications')}</div>
          <div class="tag-list">${medications.map((m: any) => `<span class="info-tag">${m.name}${m.dosage ? ` — ${m.dosage}` : ''}${m.frequency ? `, ${m.frequency}` : ''}</span>`).join('')}</div>` : ''}
        </div>
      `;
    })() : '';

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
          .badge-yes { display: inline-block; background: #fee2e2; color: #991b1b; padding: 4px 14px; border-radius: 20px; font-size: 12px; font-weight: bold; }
          .badge-no { display: inline-block; background: #d1fae5; color: #065f46; padding: 4px 14px; border-radius: 20px; font-size: 12px; font-weight: bold; }
          .badge-injured { display: inline-block; background: #fee2e2; color: #991b1b; padding: 4px 14px; border-radius: 20px; font-size: 12px; font-weight: bold; }
          .badge-ok { display: inline-block; background: #d1fae5; color: #065f46; padding: 4px 14px; border-radius: 20px; font-size: 12px; font-weight: bold; }
          .tracking-item { border: 1px solid ${borderColor}; border-radius: 10px; padding: 12px; background: ${lightBg}; margin-bottom: 10px; }
          .tracking-head { display: flex; justify-content: space-between; align-items: center; gap: 8px; margin-bottom: 8px; }
          .tracking-note { color: ${darkColor}; line-height: 1.5; }
          .loc-tags { display: flex; flex-wrap: wrap; gap: 6px; margin-top: 8px; }
          .loc-tag { display: inline-block; background: #e0f7fa; color: #00696b; padding: 2px 9px; border-radius: 12px; font-size: 11px; font-weight: bold; border: 1px solid #b2ebf2; }
          .subsection-label { font-size: 11px; font-weight: bold; color: ${mutedColor}; text-transform: uppercase; letter-spacing: 0.5px; margin-top: 12px; margin-bottom: 6px; }
          .tag-list { display: flex; flex-wrap: wrap; gap: 6px; margin-bottom: 4px; }
          .info-tag { display: inline-block; background: ${accentBg}; color: ${darkColor}; padding: 3px 10px; border-radius: 12px; font-size: 12px; border: 1px solid ${borderColor}; }
          .footer { margin-top: 36px; padding: 16px 36px; background: ${lightBg}; border-top: 1px solid ${borderColor}; font-size: 11px; color: ${mutedColor}; display: flex; justify-content: space-between; }
        </style>
      </head>
      <body>
        <div class="header">
          <div class="header-title">Move+</div>
          <div class="header-subtitle">${t('sosOccurrence.title')}${isActualFall ? ' — ' + t('fallOccurrence.title') : ''}</div>
          <div class="header-meta">${t('sosOccurrence.elderly')}: ${elderlyName}</div>
        </div>

        <div class="content">
          <div class="section">
            <div class="section-title">${t('sosOccurrence.basicInformation')}</div>
            <table>
              ${row(t('sosOccurrence.elderly'), `<strong>${elderlyName}</strong>`)}
              ${row(t('sosOccurrence.date'), `<strong>${date}</strong>`)}
              ${row(t('sosOccurrence.status'), handled
                ? `<span class="badge-handled">${t('sosOccurrence.handled')}</span>`
                : `<span class="badge-unhandled">${t('sosOccurrence.unhandled')}</span>`)}
              ${isFalseAlarm ? row('', `<span class="badge-false-alarm">${t('sosOccurrence.falseAlarm')}</span>`) : ''}
              ${row(t('sosOccurrence.wasActualFall'), isActualFall
                ? `<span class="badge-yes">${t('sosOccurrence.yes')}</span>`
                : `<span class="badge-no">${t('sosOccurrence.no')}</span>`)}
              ${data?.handler ? row(t('sosOccurrence.handledBy'), handlerName) : ''}
              ${data?.notes ? row(t('sosOccurrence.notes'), data.notes) : ''}
            </table>
          </div>

          ${elderlyDataHtml}

          ${handled && !isFalseAlarm ? `
          <div class="section">
            <div class="section-title">${isActualFall ? t('fallOccurrence.fallDetails') : t('sosOccurrence.occurrenceDetails')}</div>
            <table>
              ${row(t('fallOccurrence.recoveryProcess'), data?.recovery ?? '-')}
              ${row(t('fallOccurrence.preActivity'), data?.preActivity ?? '-')}
              ${row(t('fallOccurrence.postActivity'), data?.postActivity ?? '-')}
              ${isActualFall ? row(t('fallOccurrence.fallDirection'), data?.direction ?? '-') : ''}
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
            ${Array.isArray(data?.injuryBodyLocations) && data.injuryBodyLocations.length > 0
              ? `<div class="subsection-label">${t('woundTracking.bodyLocation')}</div><div class="loc-tags">${(data.injuryBodyLocations as string[]).map((loc: string) => `<span class="loc-tag">${t(`woundTracking.bodyLocation_${loc}`) || loc}</span>`).join('')}</div>`
              : ''}
          </div>

          ${photoHtml}

          ${buildTrackingSectionHtml(woundTrackings, borderColor, lightBg)}
          ` : ''}
        </div>

        <div class="footer">
          <span>Move+ &copy; ${new Date().getFullYear()}</span>
          <span>${new Date().toLocaleDateString('pt-PT', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' })}</span>
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
          const trackingResponse = await woundTrackingApi.getSosWoundTrackings(occurrenceId);
          woundTrackings = Array.isArray(trackingResponse.data) ? trackingResponse.data : [];
        } catch {
          woundTrackings = [];
        }
      }
      let elderlyDetails: any = null;
      if (data?.elderly?.id) {
        try {
          const elderlyRes = await elderlyApi.getElderly(data.elderly.id);
          elderlyDetails = elderlyRes.data;
        } catch { /* continue without it */ }
      }
      const html = generatePdfHtml(photoBase64, woundTrackings, elderlyDetails);
      const { uri } = await Print.printToFileAsync({ html, base64: false });
      const filename = buildPdfFilename();
      const destUri = `${FileSystem.documentDirectory}${filename}.pdf`;
      await FileSystem.moveAsync({ from: uri, to: destUri });
      await Sharing.shareAsync(destUri, { mimeType: 'application/pdf', dialogTitle: filename, UTI: 'com.adobe.pdf' });
    } catch (e) {
      console.error('Error generating PDF:', e);
      Alert.alert(t('sosOccurrence.pdfError'));
    }
    setGeneratingPdf(false);
  };

  return (
    <ScrollView contentContainerStyle={styles.scrollContainer} showsVerticalScrollIndicator={false}>
      <VStack align="flex-start" spacing={Spacing.lg_24}>
        
        <Card title={t('sosOccurrence.basicInformation')}>
          <VStack align="flex-start" spacing={Spacing.sm_8}>
            <DetailRow label={t('sosOccurrence.elderly')} value={data?.elderly?.name} important />
            <DetailRow label={t('sosOccurrence.date')} value={data?.date ? formatDateLong(data.date) : null} important />
            <DetailRow label={t('sosOccurrence.status')} value={handled ? t('sosOccurrence.handled') : t('sosOccurrence.unhandled')} important />
            {data?.isFalseAlarm && (
              <View style={styles.falseAlarmBadge}><Text style={styles.falseAlarmText}>{t('sosOccurrence.falseAlarm')}</Text></View>
            )}
            <DetailRow label={t('sosOccurrence.wasActualFall')} value={data?.wasActualFall ? t('common.yes') : t('common.no')} />
            <DetailRow label={t('sosOccurrence.notes')} value={data?.notes} />
          </VStack>
        </Card>

        {handled && !data?.isFalseAlarm && (
          <>
            <Card title={data?.wasActualFall ? t('fallOccurrence.fallDetails') : t('sosOccurrence.occurrenceDetails')}>
              <VStack align="flex-start" spacing={Spacing.sm_8}>
                <DetailRow label={t('fallOccurrence.recoveryProcess')} value={data?.recovery} />
                <DetailRow label={t('fallOccurrence.preActivity')} value={data?.preActivity} />
                <DetailRow label={t('fallOccurrence.postActivity')} value={data?.postActivity} />
                {/* MOSTRA DIREÇÃO APENAS SE FOR QUEDA */}
                {data?.wasActualFall && (
                   <DetailRow label={t('fallOccurrence.fallDirection')} value={data?.direction} />
                )}
                <DetailRow label={t('fallOccurrence.environment')} value={data?.environment} />
              </VStack>
            </Card>

            <Card title={t('fallOccurrence.injuryInformation')}>
              <VStack align="flex-start" spacing={Spacing.sm_8}>
                <DetailRow label={t('fallOccurrence.injured')} value={data?.injured ? t('fallOccurrence.yes') : t('fallOccurrence.no')} important={data?.injured} />
                {data?.injured && (
                  <View style={styles.injuryDetails}>
                    <DetailRow label={t('fallOccurrence.injuryDescription')} value={data?.injuryDescription} />
                  </View>
                )}

                {data?.injuryBodyLocations && data.injuryBodyLocations.length > 0 && (
                  <View>
                    <Text style={styles.detailLabel}>{t('woundTracking.bodyLocation')}</Text>
                    <View style={styles.injuryLocationTags}>
                      {(data.injuryBodyLocations as string[]).map((loc: string) => (
                        <View key={loc} style={styles.injuryLocationTag}>
                          <Text style={styles.injuryLocationTagText}>{t(`woundTracking.bodyLocation_${loc}`) || loc}</Text>
                        </View>
                      ))}
                    </View>
                  </View>
                )}

                <DetailRow label={t('fallOccurrence.measuresTaken')} value={data?.measuresTaken} />

                {/* Injury photo */}
                {data?.injuryPhotoUrl && (
                  <View style={styles.photoContainer}>
                    <Text style={styles.detailLabel}>{t('fallOccurrence.injuryPhoto')}</Text>
                    <Image
                      source={{ uri: buildAvatarUrl(data.injuryPhotoUrl) }}
                      style={styles.injuryPhoto}
                      resizeMode="cover"
                    />
                  </View>
                )}
              </VStack>
            </Card>
          </>
        )}

        {/* Wound Tracking */}
        {handled && !data?.isFalseAlarm && data?.injured && occurrenceId && (
          <WoundTrackingComponent
            occurrenceId={occurrenceId}
            occurrenceType="sos"
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
                <Text style={styles.pdfButtonText}>{t('sosOccurrence.downloadPdf')}</Text>
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
    width: '100%',
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
  descriptionBox: {
    marginTop: Spacing.sm_8,
    padding: Spacing.sm_8,
    backgroundColor: Color.Gray.v100,
    borderRadius: Border.sm_8,
    width: '100%',
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
  injuryDetails: {
    backgroundColor: Color.Error.default + '08',
    padding: Spacing.sm_8,
    borderRadius: Border.sm_8,
    borderLeftWidth: 3,
    borderLeftColor: Color.Error.default,
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
  injuryLocationTags: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.xs_4,
    marginTop: Spacing.xs_4,
  },
  injuryLocationTag: {
    backgroundColor: Color.primary + '18',
    borderRadius: Border.sm_8,
    paddingHorizontal: Spacing.sm_8,
    paddingVertical: 3,
    borderWidth: 1,
    borderColor: Color.primary + '40',
  },
  injuryLocationTagText: {
    fontFamily: FontFamily.medium,
    fontSize: FontSize.bodysmall_14 - 1,
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

export default SosOccurrenceDetailsComponent;