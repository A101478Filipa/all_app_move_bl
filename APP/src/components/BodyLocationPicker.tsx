import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView } from 'react-native';
import Svg, { G, Path, Defs, LinearGradient, Stop, Circle } from 'react-native-svg';
import { useTranslation } from 'react-i18next';
import { Color } from '@src/styles/colors';
import { Spacing } from '@src/styles/spacings';
import { FontFamily, FontSize } from '@src/styles/fonts';

// ─── theme ───────────────────────────────────────────────────────────────────
const PRIMARY = '#35C2C1';
const SKIN_BASE = '#F0E6D8';
const SKIN_MID = '#E2CDB8';
const SKIN_DARK = '#C9A882';
const OUTLINE = '#8B7355';
const CANVAS_W = 160;
const CANVAS_H = 400;

// ─── zone data ────────────────────────────────────────────────────────────────
interface Zone { id: string; front: boolean; back: boolean; d: string }

const FRONT_ZONES: Zone[] = [
  { id: 'HEAD',            front: true, back: false, d: 'M80,6 C65,6 54,16 54,30 C54,44 65,54 80,54 C95,54 106,44 106,30 C106,16 95,6 80,6 Z' },
  { id: 'FACE',            front: true, back: false, d: 'M80,14 C70,14 63,21 63,31 C63,41 70,48 80,48 C90,48 97,41 97,31 C97,21 90,14 80,14 Z' },
  { id: 'NECK',            front: true, back: false, d: 'M73,54 L73,70 Q80,73 87,70 L87,54 Q80,56 73,54 Z' },
  { id: 'SHOULDER_RIGHT',  front: true, back: false, d: 'M42,68 C34,68 27,74 27,83 C27,92 34,97 42,97 L62,95 L60,70 Z' },
  { id: 'SHOULDER_LEFT',   front: true, back: false, d: 'M118,68 C126,68 133,74 133,83 C133,92 126,97 118,97 L98,95 L100,70 Z' },
  { id: 'CHEST',           front: true, back: false, d: 'M62,70 L98,70 L100,115 Q80,120 60,115 Z' },
  { id: 'ABDOMEN',         front: true, back: false, d: 'M60,115 Q80,120 100,115 L98,152 Q80,156 62,152 Z' },
  { id: 'PELVIS',          front: true, back: false, d: 'M62,152 Q80,156 98,152 L96,175 Q80,178 64,175 Z' },
  { id: 'ARM_UPPER_RIGHT', front: true, back: false, d: 'M28,97 C20,100 18,110 20,124 L36,128 L42,97 Z' },
  { id: 'ELBOW_RIGHT',     front: true, back: false, d: 'M20,124 C18,133 22,140 28,142 L38,140 L36,128 Z' },
  { id: 'FOREARM_RIGHT',   front: true, back: false, d: 'M28,142 C22,148 20,162 22,176 L36,178 L38,140 Z' },
  { id: 'WRIST_RIGHT',     front: true, back: false, d: 'M22,176 C21,182 22,188 26,190 L36,190 L36,178 Z' },
  { id: 'HAND_RIGHT',      front: true, back: false, d: 'M26,190 C20,194 18,204 22,212 C26,218 34,218 38,212 L38,190 Z' },
  { id: 'ARM_UPPER_LEFT',  front: true, back: false, d: 'M132,97 C140,100 142,110 140,124 L124,128 L118,97 Z' },
  { id: 'ELBOW_LEFT',      front: true, back: false, d: 'M140,124 C142,133 138,140 132,142 L122,140 L124,128 Z' },
  { id: 'FOREARM_LEFT',    front: true, back: false, d: 'M132,142 C138,148 140,162 138,176 L124,178 L122,140 Z' },
  { id: 'WRIST_LEFT',      front: true, back: false, d: 'M138,176 C139,182 138,188 134,190 L124,190 L124,178 Z' },
  { id: 'HAND_LEFT',       front: true, back: false, d: 'M134,190 C140,194 142,204 138,212 C134,218 126,218 122,212 L122,190 Z' },
  { id: 'HIP_RIGHT',       front: true, back: false, d: 'M64,175 Q72,176 78,175 L78,195 Q70,197 62,194 Z' },
  { id: 'HIP_LEFT',        front: true, back: false, d: 'M82,175 Q88,176 96,175 L98,194 Q90,197 82,195 Z' },
  { id: 'THIGH_RIGHT',     front: true, back: false, d: 'M62,194 Q70,197 78,195 L76,255 Q68,258 60,254 Z' },
  { id: 'THIGH_LEFT',      front: true, back: false, d: 'M82,195 Q90,197 98,194 L100,254 Q92,258 84,255 Z' },
  { id: 'KNEE_RIGHT',      front: true, back: false, d: 'M60,254 Q68,258 76,255 L76,278 Q68,280 60,278 Z' },
  { id: 'KNEE_LEFT',       front: true, back: false, d: 'M84,255 Q92,258 100,254 L100,278 Q92,280 84,278 Z' },
  { id: 'LEG_LOWER_RIGHT', front: true, back: false, d: 'M60,278 Q68,280 76,278 L74,340 Q66,342 60,340 Z' },
  { id: 'LEG_LOWER_LEFT',  front: true, back: false, d: 'M84,278 Q92,280 100,278 L100,340 Q94,342 86,340 Z' },
  { id: 'ANKLE_RIGHT',     front: true, back: false, d: 'M60,340 Q66,342 74,340 L74,356 Q66,358 60,356 Z' },
  { id: 'ANKLE_LEFT',      front: true, back: false, d: 'M86,340 Q94,342 100,340 L100,356 Q94,358 86,356 Z' },
  { id: 'FOOT_RIGHT',      front: true, back: false, d: 'M56,356 Q66,358 74,356 L76,368 Q68,378 54,374 Q48,368 56,356 Z' },
  { id: 'FOOT_LEFT',       front: true, back: false, d: 'M86,356 Q94,358 104,356 L106,368 Q108,378 92,374 Q84,372 86,356 Z' },
];

const BACK_ZONES: Zone[] = [
  { id: 'HEAD',            front: false, back: true, d: 'M80,6 C65,6 54,16 54,30 C54,44 65,54 80,54 C95,54 106,44 106,30 C106,16 95,6 80,6 Z' },
  { id: 'NECK',            front: false, back: true, d: 'M73,54 L73,70 Q80,73 87,70 L87,54 Q80,56 73,54 Z' },
  { id: 'SHOULDER_RIGHT',  front: false, back: true, d: 'M42,68 C34,68 27,74 27,83 C27,92 34,97 42,97 L62,95 L60,70 Z' },
  { id: 'SHOULDER_LEFT',   front: false, back: true, d: 'M118,68 C126,68 133,74 133,83 C133,92 126,97 118,97 L98,95 L100,70 Z' },
  { id: 'BACK_UPPER',      front: false, back: true, d: 'M62,70 L98,70 L100,120 Q80,124 60,120 Z' },
  { id: 'BACK_LOWER',      front: false, back: true, d: 'M60,120 Q80,124 100,120 L98,157 Q80,160 62,157 Z' },
  { id: 'PELVIS',          front: false, back: true, d: 'M62,157 Q80,160 98,157 L96,178 Q80,181 64,178 Z' },
  { id: 'ARM_UPPER_RIGHT', front: false, back: true, d: 'M28,97 C20,100 18,110 20,124 L36,128 L42,97 Z' },
  { id: 'ELBOW_RIGHT',     front: false, back: true, d: 'M20,124 C18,133 22,140 28,142 L38,140 L36,128 Z' },
  { id: 'FOREARM_RIGHT',   front: false, back: true, d: 'M28,142 C22,148 20,162 22,176 L36,178 L38,140 Z' },
  { id: 'WRIST_RIGHT',     front: false, back: true, d: 'M22,176 C21,182 22,188 26,190 L36,190 L36,178 Z' },
  { id: 'HAND_RIGHT',      front: false, back: true, d: 'M26,190 C20,194 18,204 22,212 C26,218 34,218 38,212 L38,190 Z' },
  { id: 'ARM_UPPER_LEFT',  front: false, back: true, d: 'M132,97 C140,100 142,110 140,124 L124,128 L118,97 Z' },
  { id: 'ELBOW_LEFT',      front: false, back: true, d: 'M140,124 C142,133 138,140 132,142 L122,140 L124,128 Z' },
  { id: 'FOREARM_LEFT',    front: false, back: true, d: 'M132,142 C138,148 140,162 138,176 L124,178 L122,140 Z' },
  { id: 'WRIST_LEFT',      front: false, back: true, d: 'M138,176 C139,182 138,188 134,190 L124,190 L124,178 Z' },
  { id: 'HAND_LEFT',       front: false, back: true, d: 'M134,190 C140,194 142,204 138,212 C134,218 126,218 122,212 L122,190 Z' },
  { id: 'HIP_RIGHT',       front: false, back: true, d: 'M64,178 Q72,179 78,178 L78,198 Q70,200 62,197 Z' },
  { id: 'HIP_LEFT',        front: false, back: true, d: 'M82,178 Q88,179 96,178 L98,197 Q90,200 82,198 Z' },
  { id: 'THIGH_RIGHT',     front: false, back: true, d: 'M62,197 Q70,200 78,198 L76,258 Q68,261 60,257 Z' },
  { id: 'THIGH_LEFT',      front: false, back: true, d: 'M82,198 Q90,200 98,197 L100,257 Q92,261 84,258 Z' },
  { id: 'KNEE_RIGHT',      front: false, back: true, d: 'M60,257 Q68,261 76,258 L76,280 Q68,282 60,280 Z' },
  { id: 'KNEE_LEFT',       front: false, back: true, d: 'M84,258 Q92,261 100,257 L100,280 Q92,282 84,280 Z' },
  { id: 'LEG_LOWER_RIGHT', front: false, back: true, d: 'M60,280 Q68,282 76,280 L74,342 Q66,344 60,342 Z' },
  { id: 'LEG_LOWER_LEFT',  front: false, back: true, d: 'M84,280 Q92,282 100,280 L100,342 Q94,344 86,342 Z' },
  { id: 'ANKLE_RIGHT',     front: false, back: true, d: 'M60,342 Q66,344 74,342 L74,358 Q66,360 60,358 Z' },
  { id: 'ANKLE_LEFT',      front: false, back: true, d: 'M86,342 Q94,344 100,342 L100,358 Q94,360 86,358 Z' },
  { id: 'FOOT_RIGHT',      front: false, back: true, d: 'M56,358 Q66,360 74,358 L74,368 Q64,374 52,370 Q48,364 56,358 Z' },
  { id: 'FOOT_LEFT',       front: false, back: true, d: 'M86,358 Q94,360 104,358 L106,368 Q108,374 92,370 Q84,368 86,358 Z' },
];

// ─── component ───────────────────────────────────────────────────────────────
export interface BodyLocationPickerProps {
  selected: string[];
  onChange: (locations: string[]) => void;
  label?: string;
}

const BodyLocationPicker: React.FC<BodyLocationPickerProps> = ({ selected, onChange }) => {
  const { t } = useTranslation();
  const [view, setView] = useState<'front' | 'back'>('front');

  const toggle = (id: string) => {
    onChange(selected.includes(id) ? selected.filter(l => l !== id) : [...selected, id]);
  };

  const zones = view === 'front' ? FRONT_ZONES : BACK_ZONES;

  return (
    <View style={styles.wrapper}>
      {/* Toggle */}
      <View style={styles.toggle}>
        {(['front', 'back'] as const).map(v => (
          <TouchableOpacity
            key={v}
            style={[styles.toggleBtn, view === v && styles.toggleBtnActive]}
            onPress={() => setView(v)}
            activeOpacity={0.8}
          >
            <Text style={[styles.toggleText, view === v && styles.toggleTextActive]}>
              {t(v === 'front' ? 'woundTracking.bodyFront' : 'woundTracking.bodyBack')}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* SVG body */}
      <View style={styles.svgContainer}>
        <Svg width={CANVAS_W} height={CANVAS_H} viewBox={`0 0 ${CANVAS_W} ${CANVAS_H}`}>
          <Defs>
            <LinearGradient id="skinGrad" x1="0" y1="0" x2="1" y2="1">
              <Stop offset="0%" stopColor={SKIN_BASE} stopOpacity="1" />
              <Stop offset="60%" stopColor={SKIN_MID} stopOpacity="1" />
              <Stop offset="100%" stopColor={SKIN_DARK} stopOpacity="1" />
            </LinearGradient>
            <LinearGradient id="selGrad" x1="0" y1="0" x2="0" y2="1">
              <Stop offset="0%" stopColor={PRIMARY} stopOpacity="0.55" />
              <Stop offset="100%" stopColor={PRIMARY} stopOpacity="0.80" />
            </LinearGradient>
          </Defs>

          {/* Unselected zones */}
          <G>
            {zones.filter(z => !selected.includes(z.id)).map(z => (
              <Path
                key={z.id}
                d={z.d}
                fill="url(#skinGrad)"
                stroke={OUTLINE}
                strokeWidth={0.8}
                onPress={() => toggle(z.id)}
              />
            ))}
          </G>

          {/* Selected zones */}
          <G>
            {zones.filter(z => selected.includes(z.id)).map(z => (
              <Path
                key={z.id}
                d={z.d}
                fill="url(#selGrad)"
                stroke={PRIMARY}
                strokeWidth={1.2}
                onPress={() => toggle(z.id)}
              />
            ))}
          </G>

          {/* Dot on selected zone centroids */}
          {zones.filter(z => selected.includes(z.id)).map(z => {
            const all = (z.d.match(/-?\d+\.?\d*/g) || []).map(Number);
            const xs = all.filter((_, i) => i % 2 === 0);
            const ys = all.filter((_, i) => i % 2 === 1);
            const cx = xs.reduce((s, v) => s + v, 0) / (xs.length || 1);
            const cy = ys.reduce((s, v) => s + v, 0) / (ys.length || 1);
            return <Circle key={`dot-${z.id}`} cx={cx} cy={cy} r={4} fill={PRIMARY} onPress={() => toggle(z.id)} />;
          })}
        </Svg>
      </View>

      {/* Selected chips */}
      {selected.length > 0 ? (
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chips}>
          {selected.map(loc => (
            <TouchableOpacity key={loc} style={styles.chip} onPress={() => toggle(loc)} activeOpacity={0.7}>
              <Text style={styles.chipText}>{t(`woundTracking.bodyLocation_${loc}`)}</Text>
              <Text style={styles.chipRemove}>✕</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      ) : (
        <Text style={styles.hint}>{t('woundTracking.bodyTapHint')}</Text>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  wrapper: { gap: Spacing.sm_8, alignItems: 'center' },
  toggle: { flexDirection: 'row', borderRadius: 8, overflow: 'hidden', borderWidth: 1, borderColor: PRIMARY },
  toggleBtn: { paddingHorizontal: 32, paddingVertical: 8, backgroundColor: Color.white },
  toggleBtnActive: { backgroundColor: PRIMARY },
  toggleText: { fontFamily: FontFamily.medium, fontSize: FontSize.bodysmall_14, color: PRIMARY },
  toggleTextActive: { color: Color.white },
  svgContainer: { alignItems: 'center' },
  chips: { flexDirection: 'row', gap: Spacing.xs_4, paddingHorizontal: 2 },
  chip: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    paddingHorizontal: 10, paddingVertical: 4,
    borderRadius: 20, backgroundColor: PRIMARY,
  },
  chipText: { fontFamily: FontFamily.medium, fontSize: 12, color: Color.white },
  chipRemove: { fontSize: 10, color: Color.white, fontFamily: FontFamily.bold },
  hint: { fontFamily: FontFamily.regular, fontSize: 12, color: Color.Gray.v300, textAlign: 'center' },
});

export default BodyLocationPicker;
