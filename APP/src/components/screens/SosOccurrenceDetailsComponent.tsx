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
import { translateBodyLocation } from '@src/utils/measurementHelper';
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
        <div class="section-title">🩹 ${t('woundTracking.title')}</div>
        <div class="section-body">
        ${trackings.map((tracking) => `
          <div class="tracking-item">
            <div class="tracking-head">
              <strong>📅 ${formatTrackingDate(tracking.createdAt)}</strong>
              <span class="badge ${tracking.isResolved ? 'badge-ok' : 'badge-injured'}">${tracking.isResolved ? t('woundTracking.resolved') : t('woundTracking.ongoing')}</span>
            </div>
            ${tracking.notes ? `<div class="tracking-note">${tracking.notes}</div>` : ''}
            ${tracking.bodyLocations && (tracking.bodyLocations as string[]).length > 0
              ? `<div class="loc-tags">${(tracking.bodyLocations as string[]).map((loc: string) => `<span class="loc-tag">${translateBodyLocation(loc, t)}</span>`).join('')}</div>`
              : ''}
          </div>
        `).join('')}
        </div>
      </div>
    `;
  };

  const generatePdfHtml = (photoBase64?: string | null, woundTrackings: WoundTracking[] = [], elderlyDetails: any = null) => {
    const elderlyName = data?.elderly?.name ?? '-';
    const date = data?.date ? formatDateLong(data.date) : '-';
    const handledInner = Boolean(data?.handlerUserId);
    const handlerName = data?.handler?.name ?? '-';
    const isFalseAlarm = data?.isFalseAlarm;
    const isActualFall = data?.wasActualFall;
    const primaryColor = '#35C2C1';
    const darkColor = '#1e293b';
    const mutedColor = '#64748b';
    const borderColor = '#e2e8f0';
    const lightBg = '#f8fafc';
    const accentBg = '#f0fdfc';
    const sectionBorder = '#cbd5e1';

    const row = (label: string, value: string) =>
      `<tr><td class="td-label">${label}</td><td class="td-value">${value || '-'}</td></tr>`;

    const fmtDate = (v: string) => new Date(v).toLocaleDateString('pt-PT', { day: '2-digit', month: '2-digit', year: 'numeric' });

    const elderlyDataHtml = elderlyDetails ? (() => {
      const measurements: any[] = elderlyDetails.measurements ?? [];
      const pathologies: any[] = elderlyDetails.pathologies ?? [];
      const medications: any[] = elderlyDetails.medications ?? [];
      const birthDate = elderlyDetails.birthDate ? new Date(elderlyDetails.birthDate).toLocaleDateString('pt-PT', { day: '2-digit', month: '2-digit', year: 'numeric' }) : null;
      const age = elderlyDetails.birthDate ? Math.floor((Date.now() - new Date(elderlyDetails.birthDate).getTime()) / (365.25 * 24 * 3600 * 1000)) : null;

      const measurementTypeLabels: Record<string, string> = {
        BLOOD_PRESSURE_SYSTOLIC: t('measurements.measurementTypes.BLOOD_PRESSURE_SYSTOLIC'),
        BLOOD_PRESSURE_DIASTOLIC: t('measurements.measurementTypes.BLOOD_PRESSURE_DIASTOLIC'),
        HEART_RATE: t('measurements.measurementTypes.HEART_RATE'),
        WEIGHT: t('measurements.measurementTypes.WEIGHT'),
        HEIGHT: t('measurements.measurementTypes.HEIGHT'),
        BODY_TEMPERATURE: t('measurements.measurementTypes.BODY_TEMPERATURE'),
        BLOOD_GLUCOSE: t('measurements.measurementTypes.BLOOD_GLUCOSE'),
        OXYGEN_SATURATION: t('measurements.measurementTypes.OXYGEN_SATURATION'),
        BALANCE_SCORE: t('measurements.measurementTypes.BALANCE_SCORE'),
        MOBILITY_SCORE: t('measurements.measurementTypes.MOBILITY_SCORE'),
        COGNITIVE_SCORE: t('measurements.measurementTypes.COGNITIVE_SCORE'),
      };

      const measurementIcons: Record<string, string> = {
        BLOOD_PRESSURE_SYSTOLIC: '🩸', BLOOD_PRESSURE_DIASTOLIC: '🩸',
        HEART_RATE: '❤️', WEIGHT: '⚖️', HEIGHT: '📏',
        BODY_TEMPERATURE: '🌡️', BLOOD_GLUCOSE: '🍬',
        OXYGEN_SATURATION: '💨', BALANCE_SCORE: '🧍',
        MOBILITY_SCORE: '🚶', COGNITIVE_SCORE: '🧠',
      };

      const latestByType: Record<string, any> = {};
      measurements.forEach((m) => {
        if (!latestByType[m.type] || new Date(m.createdAt) > new Date(latestByType[m.type].createdAt)) {
          latestByType[m.type] = m;
        }
      });

      const measurementCards = Object.values(latestByType)
        .sort((a, b) => a.type.localeCompare(b.type))
        .map((m) => `
          <div class="mcard">
            <div class="mcard-icon">${measurementIcons[m.type] ?? '📊'}</div>
            <div class="mcard-label">${measurementTypeLabels[m.type] ?? m.type}</div>
            <div class="mcard-value">${m.value}<span class="mcard-unit">${m.unit ? ` ${m.unit}` : ''}</span></div>
          </div>
        `).join('');

      const genderMap: Record<string, string> = { MALE: 'Masculino', FEMALE: 'Feminino', OTHER: 'Outro' };

      const pathologyStatusBadge = (status: string) => {
        const map: Record<string, string> = {
          ACTIVE: 'badge-status-danger', CHRONIC: 'badge-status-warn',
          INACTIVE: 'badge-status-muted', RESOLVED: 'badge-status-ok',
        };
        const labels: Record<string, string> = {
          ACTIVE: t('pathology.statusOptions.active') ?? 'Ativo',
          INACTIVE: t('pathology.statusOptions.inactive') ?? 'Inativo',
          RESOLVED: t('pathology.statusOptions.resolved') ?? 'Resolvido',
          CHRONIC: t('pathology.statusOptions.chronic') ?? 'Crónico',
        };
        return `<span class="badge-status ${map[status] ?? 'badge-status-muted'}">${labels[status] ?? status}</span>`;
      };

      const medicationStatusBadge = (status: string) => {
        const map: Record<string, string> = {
          ACTIVE: 'badge-status-ok', PAUSED: 'badge-status-warn',
          INACTIVE: 'badge-status-muted', DISCONTINUED: 'badge-status-danger', COMPLETED: 'badge-status-muted',
        };
        const labels: Record<string, string> = {
          ACTIVE: t('medication.statusOptions.active') ?? 'Ativo',
          INACTIVE: t('medication.statusOptions.inactive') ?? 'Inativo',
          PAUSED: t('medication.statusOptions.paused') ?? 'Pausado',
          DISCONTINUED: t('medication.statusOptions.discontinued') ?? 'Descontinuado',
          COMPLETED: t('medication.statusOptions.completed') ?? 'Concluído',
        };
        return `<span class="badge-status ${map[status] ?? 'badge-status-muted'}">${labels[status] ?? status}</span>`;
      };

      const pathologiesHtml = pathologies.length > 0 ? `
        <div class="subsection-title">🦠 ${t('elderly.pathologies')}</div>
        <table class="inner-table">
          <thead><tr>
            <th>Nome</th><th>Data de Diagnóstico</th><th>Local</th><th>Estado</th>
          </tr></thead>
          <tbody>
          ${pathologies.map((p: any) => `
          <tr>
            <td><strong>${p.name}</strong>${p.description ? `<br/><span class="cell-note">${p.description}</span>` : ''}</td>
            <td>${p.diagnosisDate ? fmtDate(p.diagnosisDate) : '-'}</td>
            <td>${p.diagnosisSite ?? '-'}</td>
            <td>${pathologyStatusBadge(p.status)}</td>
          </tr>`).join('')}
          </tbody>
        </table>
      ` : `<div class="empty-note">Sem patologias registadas</div>`;

      const medicationsHtml = medications.length > 0 ? `
        <div class="subsection-title">💊 ${t('elderly.medications')}</div>
        <table class="inner-table">
          <thead><tr>
            <th>Medicamento</th><th>Dosagem</th><th>Frequência</th><th>Via</th><th>Estado</th>
          </tr></thead>
          <tbody>
          ${medications.map((m: any) => `
          <tr>
            <td><strong>${m.name}</strong>${m.activeIngredient ? `<br/><span class="cell-note">${m.activeIngredient}</span>` : ''}</td>
            <td>${m.dosage ?? '-'}</td>
            <td>${m.frequency ?? '-'}</td>
            <td>${m.administration ?? '-'}</td>
            <td>${medicationStatusBadge(m.status)}</td>
          </tr>`).join('')}
          </tbody>
        </table>
      ` : `<div class="empty-note">Sem medicações registadas</div>`;

      return `
        <div class="section">
          <div class="section-title">👤 ${t('elderly.elderlyInfo')}</div>
          <div class="section-body">
            <div class="profile-grid">
              ${elderlyDetails.medicalId ? `<div class="profile-item"><span class="profile-label">${t('elderly.medicalId')}</span><span class="profile-value">${elderlyDetails.medicalId}</span></div>` : ''}
              ${birthDate ? `<div class="profile-item"><span class="profile-label">Data de Nascimento</span><span class="profile-value">${birthDate}${age !== null ? ` (${age} anos)` : ''}</span></div>` : ''}
              ${elderlyDetails.gender ? `<div class="profile-item"><span class="profile-label">${t('elderly.gender')}</span><span class="profile-value">${genderMap[elderlyDetails.gender] ?? elderlyDetails.gender}</span></div>` : ''}
              ${elderlyDetails.phone ? `<div class="profile-item"><span class="profile-label">${t('elderly.phone')}</span><span class="profile-value">${elderlyDetails.phone}</span></div>` : ''}
              ${elderlyDetails.emergencyContact ? `<div class="profile-item profile-item-wide"><span class="profile-label">📞 ${t('elderly.emergencyContact')}</span><span class="profile-value">${elderlyDetails.emergencyContact}</span></div>` : ''}
              ${elderlyDetails.address ? `<div class="profile-item profile-item-wide"><span class="profile-label">${t('elderly.address')}</span><span class="profile-value">${elderlyDetails.address}</span></div>` : ''}
            </div>
            ${measurementCards ? `
              <div class="subsection-title">📊 ${t('elderly.measurements')}</div>
              <div class="mcards">${measurementCards}</div>
            ` : ''}
            ${pathologiesHtml}
            ${medicationsHtml}
          </div>
        </div>
      `;
    })() : '';

    const photoHtml = photoBase64
      ? `<div class="section">
          <div class="section-title">📷 ${t('fallOccurrence.injuryPhoto')}</div>
          <div class="section-body">
            <img src="data:image/jpeg;base64,${photoBase64}" style="max-width:100%;max-height:360px;border-radius:10px;border:2px solid ${borderColor};display:block;margin:0 auto;" />
          </div>
        </div>`
      : '';

    return `
      <!DOCTYPE html>
      <html lang="pt">
      <head>
        <meta charset="utf-8"/>
        <style>
          * { box-sizing: border-box; margin: 0; padding: 0; }
          body { font-family: -apple-system, Arial, Helvetica, sans-serif; background: #f1f5f9; color: ${darkColor}; font-size: 13px; line-height: 1.5; }

          /* ── HEADER ── */
          .header { background: linear-gradient(135deg, #35C2C1 0%, #1a9d9c 100%); color: #fff; padding: 32px 40px 28px; }
          .header-logo { font-size: 11px; font-weight: bold; letter-spacing: 3px; text-transform: uppercase; opacity: 0.75; margin-bottom: 8px; }
          .header-title { font-size: 28px; font-weight: 800; letter-spacing: 0.5px; }
          .header-subtitle { font-size: 13px; opacity: 0.85; margin-top: 2px; }
          .header-badges { margin-top: 16px; display: flex; gap: 8px; flex-wrap: wrap; align-items: center; }
          .header-pill { font-size: 12px; background: rgba(255,255,255,0.2); padding: 4px 14px; border-radius: 20px; font-weight: 600; }
          .header-pill-danger { background: rgba(220,38,38,0.35); }

          /* ── LAYOUT ── */
          .content { padding: 28px 40px; }
          .section { background: #fff; border-radius: 12px; border: 1px solid ${borderColor}; margin-bottom: 20px; overflow: hidden; box-shadow: 0 1px 3px rgba(0,0,0,0.06); }
          .section-title { font-size: 13px; font-weight: 700; color: #fff; background: linear-gradient(90deg, ${primaryColor}, #1a9d9c); text-transform: uppercase; letter-spacing: 1px; padding: 10px 18px; }
          .section-body { padding: 16px 18px; }

          /* ── INFO TABLE ── */
          table.info-table { width: 100%; border-collapse: collapse; }
          .td-label { font-weight: 600; color: ${mutedColor}; font-size: 11px; text-transform: uppercase; letter-spacing: 0.5px; padding: 9px 14px; width: 38%; background: ${lightBg}; border-bottom: 1px solid ${borderColor}; vertical-align: top; }
          .td-value { color: ${darkColor}; font-size: 13px; padding: 9px 14px; border-bottom: 1px solid ${borderColor}; vertical-align: top; }

          /* ── BADGES ── */
          .badge { display: inline-block; padding: 3px 12px; border-radius: 20px; font-size: 11px; font-weight: 700; }
          .badge-handled { background: #dcfce7; color: #166534; border: 1px solid #86efac; }
          .badge-unhandled { background: #fee2e2; color: #991b1b; border: 1px solid #fca5a5; }
          .badge-false-alarm { background: #fef9c3; color: #854d0e; border: 1px solid #fde047; }
          .badge-yes { background: #fee2e2; color: #991b1b; }
          .badge-no { background: #dcfce7; color: #166534; }
          .badge-injured { background: #fee2e2; color: #991b1b; }
          .badge-ok { background: #dcfce7; color: #166534; }
          .badge-status { display: inline-block; padding: 2px 10px; border-radius: 20px; font-size: 11px; font-weight: 700; }
          .badge-status-ok { background: #dcfce7; color: #166534; }
          .badge-status-danger { background: #fee2e2; color: #991b1b; }
          .badge-status-warn { background: #fef9c3; color: #854d0e; }
          .badge-status-muted { background: #f1f5f9; color: #64748b; }

          /* ── PROFILE GRID ── */
          .profile-grid { display: flex; flex-wrap: wrap; gap: 10px; padding: 4px 0 8px; }
          .profile-item { background: ${lightBg}; border: 1px solid ${borderColor}; border-radius: 8px; padding: 8px 14px; min-width: 160px; flex: 1; }
          .profile-item-wide { flex: 2; min-width: 280px; }
          .profile-label { display: block; font-size: 10px; font-weight: 700; color: ${mutedColor}; text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 3px; }
          .profile-value { display: block; font-size: 13px; font-weight: 600; color: ${darkColor}; }

          /* ── MEASUREMENT CARDS ── */
          .subsection-title { font-size: 12px; font-weight: 700; color: ${darkColor}; margin: 14px 0 8px; padding-bottom: 4px; border-bottom: 1px solid ${sectionBorder}; }
          .mcards { display: flex; flex-wrap: wrap; gap: 8px; }
          .mcard { background: ${accentBg}; border: 1px solid #a7f3d0; border-radius: 10px; padding: 10px 14px; min-width: 120px; flex: 1; text-align: center; }
          .mcard-icon { font-size: 20px; margin-bottom: 4px; }
          .mcard-label { font-size: 10px; color: ${mutedColor}; font-weight: 600; text-transform: uppercase; letter-spacing: 0.4px; margin-bottom: 4px; }
          .mcard-value { font-size: 18px; font-weight: 800; color: ${primaryColor}; }
          .mcard-unit { font-size: 11px; font-weight: 400; color: ${mutedColor}; }

          /* ── INNER TABLES ── */
          .inner-table { width: 100%; border-collapse: collapse; margin-top: 4px; }
          .inner-table thead tr { background: ${lightBg}; }
          .inner-table th { font-size: 10px; font-weight: 700; color: ${mutedColor}; text-transform: uppercase; letter-spacing: 0.5px; padding: 7px 12px; border-bottom: 2px solid ${borderColor}; text-align: left; }
          .inner-table td { font-size: 12px; padding: 8px 12px; border-bottom: 1px solid ${borderColor}; vertical-align: top; color: ${darkColor}; }
          .inner-table tbody tr:last-child td { border-bottom: none; }
          .inner-table tbody tr:nth-child(even) td { background: #fafafa; }
          .cell-note { font-size: 11px; color: ${mutedColor}; display: block; margin-top: 2px; }
          .empty-note { color: ${mutedColor}; font-size: 12px; font-style: italic; padding: 8px 0; }

          /* ── WOUND TRACKING ── */
          .tracking-item { border: 1px solid ${borderColor}; border-radius: 10px; padding: 12px 14px; background: ${lightBg}; margin-bottom: 10px; }
          .tracking-head { display: flex; justify-content: space-between; align-items: center; gap: 8px; margin-bottom: 8px; font-weight: 600; font-size: 13px; }
          .tracking-note { color: ${darkColor}; line-height: 1.6; font-size: 13px; }
          .loc-tags { display: flex; flex-wrap: wrap; gap: 6px; margin-top: 8px; }
          .loc-tag { display: inline-block; background: #e0f2fe; color: #0369a1; padding: 2px 10px; border-radius: 12px; font-size: 11px; font-weight: 600; border: 1px solid #bae6fd; }

          /* ── FOOTER ── */
          .footer { margin-top: 8px; padding: 14px 40px; background: #fff; border-top: 2px solid ${borderColor}; font-size: 11px; color: ${mutedColor}; display: flex; justify-content: space-between; align-items: center; }
          .footer-logo { font-weight: 800; color: ${primaryColor}; font-size: 13px; }
        </style>
      </head>
      <body>
        <div class="header">
          <div class="header-logo">Move+</div>
          <div class="header-title">Relatório SOS${isActualFall ? ' / Queda' : ''}</div>
          <div class="header-subtitle">${t('sosOccurrence.title')}${isActualFall ? ' — ' + t('fallOccurrence.title') : ''}</div>
          <div class="header-badges">
            <span class="header-pill">👤 ${elderlyName}</span>
            <span class="header-pill">📅 ${date}</span>
            ${handledInner
              ? `<span class="header-pill">✅ ${t('sosOccurrence.handled')}</span>`
              : `<span class="header-pill header-pill-danger">⚠️ ${t('sosOccurrence.unhandled')}</span>`}
            ${isActualFall ? `<span class="header-pill header-pill-danger">🏥 Queda Confirmada</span>` : ''}
            ${isFalseAlarm ? `<span class="header-pill">ℹ️ ${t('sosOccurrence.falseAlarm')}</span>` : ''}
          </div>
        </div>

        <div class="content">

          <div class="section">
            <div class="section-title">📋 ${t('sosOccurrence.basicInformation')}</div>
            <div class="section-body">
              <table class="info-table">
                ${row(t('sosOccurrence.elderly'), `<strong>${elderlyName}</strong>`)}
                ${row(t('sosOccurrence.date'), `<strong>${date}</strong>`)}
                ${row(t('sosOccurrence.status'), handledInner
                  ? `<span class="badge badge-handled">✅ ${t('sosOccurrence.handled')}</span>`
                  : `<span class="badge badge-unhandled">⚠️ ${t('sosOccurrence.unhandled')}</span>`)}
                ${isFalseAlarm ? row('', `<span class="badge badge-false-alarm">ℹ️ ${t('sosOccurrence.falseAlarm')}</span>`) : ''}
                ${row(t('sosOccurrence.wasActualFall'), isActualFall
                  ? `<span class="badge badge-yes">🏥 ${t('sosOccurrence.yes')}</span>`
                  : `<span class="badge badge-no">✅ ${t('sosOccurrence.no')}</span>`)}
                ${data?.handler ? row(t('sosOccurrence.handledBy'), handlerName) : ''}
                ${data?.notes ? row(t('sosOccurrence.notes'), data.notes) : ''}
              </table>
            </div>
          </div>

          ${elderlyDataHtml}

          ${handledInner && !isFalseAlarm ? `
          <div class="section">
            <div class="section-title">🏃 ${isActualFall ? t('fallOccurrence.fallDetails') : t('sosOccurrence.occurrenceDetails')}</div>
            <div class="section-body">
              <table class="info-table">
                ${row(t('fallOccurrence.recoveryProcess'), data?.recovery ?? '-')}
                ${row(t('fallOccurrence.preActivity'), data?.preActivity ?? '-')}
                ${row(t('fallOccurrence.postActivity'), data?.postActivity ?? '-')}
                ${isActualFall ? row(t('fallOccurrence.fallDirection'), data?.direction ?? '-') : ''}
                ${row(t('fallOccurrence.environment'), data?.environment ?? '-')}
              </table>
            </div>
          </div>

          <div class="section">
            <div class="section-title">🩹 ${t('fallOccurrence.injuryInformation')}</div>
            <div class="section-body">
              <table class="info-table">
                ${row(t('fallOccurrence.injured'), data?.injured
                  ? `<span class="badge badge-injured">🤕 ${t('fallOccurrence.yes')}</span>`
                  : `<span class="badge badge-ok">✅ ${t('fallOccurrence.no')}</span>`)}
                ${data?.injured ? row(t('fallOccurrence.injuryDescription'), data?.injuryDescription ?? '-') : ''}
                ${row(t('fallOccurrence.measuresTaken'), data?.measuresTaken ?? '-')}
              </table>
              ${Array.isArray(data?.injuryBodyLocations) && data.injuryBodyLocations.length > 0
                ? `<div class="subsection-title">📍 ${t('woundTracking.bodyLocation')}</div><div class="loc-tags">${(data.injuryBodyLocations as string[]).map((loc: string) => `<span class="loc-tag">${translateBodyLocation(loc, t)}</span>`).join('')}</div>`
                : ''}
            </div>
          </div>

          ${photoHtml}

          ${buildTrackingSectionHtml(woundTrackings, borderColor, lightBg)}
          ` : ''}
        </div>

        <div class="footer">
          <span class="footer-logo">Move+</span>
          <span>Gerado em ${new Date().toLocaleDateString('pt-PT', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' })}</span>
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
                          <Text style={styles.injuryLocationTagText}>{translateBodyLocation(loc, t)}</Text>
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