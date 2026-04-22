import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView } from 'react-native';
import Svg, { G, Ellipse, Rect, Path } from 'react-native-svg';
import { useTranslation } from 'react-i18next';
import { Color } from '@src/styles/colors';
import { Spacing } from '@src/styles/spacings';
import { FontFamily, FontSize } from '@src/styles/fonts';

// ─── constants ───────────────────────────────────────────────────────────────
const PRIMARY = '#35C2C1';
const SKIN = '#F5DEB3';
const SKIN_STROKE = '#C8A882';
const SELECTED_OPACITY = 0.85;
const CANVAS_W = 180;
const CANVAS_H = 420;

// ─── zone definitions ────────────────────────────────────────────────────────
// Each zone: { id: BodyLocation key, front: bool, back: bool, shape: 'ellipse'|'rect'|'path', ...params }
// Coordinates designed for CANVAS_W=180, CANVAS_H=420
// NOTE: LEFT/RIGHT follow anatomical convention:
//   patient's LEFT = screen RIGHT (x > 90), patient's RIGHT = screen LEFT (x < 90)

type Shape =
  | { type: 'ellipse'; cx: number; cy: number; rx: number; ry: number }
  | { type: 'rect'; x: number; y: number; w: number; h: number; r?: number }
  | { type: 'path'; d: string };

interface Zone {
  id: string;
  front: boolean;
  back: boolean;
  shape: Shape;
  label?: string; // short display label for the tooltip chip
}

const ZONES: Zone[] = [
  // ── Head & Neck ──────────────────────────────────────────────────────────
  { id: 'HEAD',  front: true,  back: true,  shape: { type: 'ellipse', cx: 90, cy: 28, rx: 26, ry: 26 } },
  { id: 'FACE',  front: true,  back: false, shape: { type: 'ellipse', cx: 90, cy: 34, rx: 18, ry: 18 } },
  { id: 'NECK',  front: true,  back: true,  shape: { type: 'rect', x: 80, y: 54, w: 20, h: 18, r: 4 } },

  // ── Shoulders ────────────────────────────────────────────────────────────
  // patient RIGHT = screen LEFT
  { id: 'SHOULDER_RIGHT', front: true, back: true, shape: { type: 'ellipse', cx: 53, cy: 81, rx: 18, ry: 12 } },
  // patient LEFT  = screen RIGHT
  { id: 'SHOULDER_LEFT',  front: true, back: true, shape: { type: 'ellipse', cx: 127, cy: 81, rx: 18, ry: 12 } },

  // ── Torso front ──────────────────────────────────────────────────────────
  { id: 'CHEST',   front: true,  back: false, shape: { type: 'rect', x: 66, y: 72, w: 48, h: 44, r: 4 } },
  { id: 'ABDOMEN', front: true,  back: false, shape: { type: 'rect', x: 66, y: 116, w: 48, h: 38, r: 4 } },
  { id: 'PELVIS',  front: true,  back: true,  shape: { type: 'rect', x: 66, y: 154, w: 48, h: 32, r: 4 } },

  // ── Torso back ───────────────────────────────────────────────────────────
  { id: 'BACK_UPPER', front: false, back: true, shape: { type: 'rect', x: 66, y: 72, w: 48, h: 44, r: 4 } },
  { id: 'BACK_LOWER', front: false, back: true, shape: { type: 'rect', x: 66, y: 116, w: 48, h: 38, r: 4 } },

  // ── Upper limbs (RIGHT = screen LEFT, LEFT = screen RIGHT) ───────────────
  // patient RIGHT arm (screen left)
  { id: 'ARM_UPPER_RIGHT', front: true, back: true, shape: { type: 'rect', x: 27, y: 74, w: 20, h: 50, r: 6 } },
  { id: 'ELBOW_RIGHT',     front: true, back: true, shape: { type: 'rect', x: 22, y: 124, w: 20, h: 20, r: 4 } },
  { id: 'FOREARM_RIGHT',   front: true, back: true, shape: { type: 'rect', x: 17, y: 144, w: 18, h: 46, r: 5 } },
  { id: 'WRIST_RIGHT',     front: true, back: true, shape: { type: 'rect', x: 15, y: 190, w: 18, h: 16, r: 4 } },
  { id: 'HAND_RIGHT',      front: true, back: true, shape: { type: 'rect', x: 12, y: 206, w: 22, h: 30, r: 5 } },
  // patient LEFT arm (screen right)
  { id: 'ARM_UPPER_LEFT',  front: true, back: true, shape: { type: 'rect', x: 133, y: 74, w: 20, h: 50, r: 6 } },
  { id: 'ELBOW_LEFT',      front: true, back: true, shape: { type: 'rect', x: 138, y: 124, w: 20, h: 20, r: 4 } },
  { id: 'FOREARM_LEFT',    front: true, back: true, shape: { type: 'rect', x: 145, y: 144, w: 18, h: 46, r: 5 } },
  { id: 'WRIST_LEFT',      front: true, back: true, shape: { type: 'rect', x: 147, y: 190, w: 18, h: 16, r: 4 } },
  { id: 'HAND_LEFT',       front: true, back: true, shape: { type: 'rect', x: 146, y: 206, w: 22, h: 30, r: 5 } },

  // ── Lower limbs (RIGHT = screen LEFT, LEFT = screen RIGHT) ───────────────
  // patient RIGHT leg (screen left)
  { id: 'HIP_RIGHT',       front: true, back: true, shape: { type: 'rect', x: 64, y: 186, w: 24, h: 20, r: 4 } },
  { id: 'THIGH_RIGHT',     front: true, back: true, shape: { type: 'rect', x: 63, y: 206, w: 24, h: 58, r: 5 } },
  { id: 'KNEE_RIGHT',      front: true, back: true, shape: { type: 'rect', x: 63, y: 264, w: 24, h: 22, r: 4 } },
  { id: 'LEG_LOWER_RIGHT', front: true, back: true, shape: { type: 'rect', x: 64, y: 286, w: 22, h: 56, r: 5 } },
  { id: 'ANKLE_RIGHT',     front: true, back: true, shape: { type: 'rect', x: 64, y: 342, w: 22, h: 18, r: 4 } },
  { id: 'FOOT_RIGHT',      front: true, back: true, shape: { type: 'path', d: 'M64,360 h22 l8,30 h-38 z' } },
  // patient LEFT leg (screen right)
  { id: 'HIP_LEFT',        front: true, back: true, shape: { type: 'rect', x: 92, y: 186, w: 24, h: 20, r: 4 } },
  { id: 'THIGH_LEFT',      front: true, back: true, shape: { type: 'rect', x: 93, y: 206, w: 24, h: 58, r: 5 } },
  { id: 'KNEE_LEFT',       front: true, back: true, shape: { type: 'rect', x: 93, y: 264, w: 24, h: 22, r: 4 } },
  { id: 'LEG_LOWER_LEFT',  front: true, back: true, shape: { type: 'rect', x: 94, y: 286, w: 22, h: 56, r: 5 } },
  { id: 'ANKLE_LEFT',      front: true, back: true, shape: { type: 'rect', x: 94, y: 342, w: 22, h: 18, r: 4 } },
  { id: 'FOOT_LEFT',       front: true, back: true, shape: { type: 'path', d: 'M94,360 h22 l8,30 h-38 z' } },
];

// ─── helper: render one SVG shape ────────────────────────────────────────────
function ZoneShape({ zone, fill, stroke }: { zone: Zone; fill: string; stroke: string }) {
  const s = zone.shape;
  const common = { fill, stroke, strokeWidth: 1.2 };
  if (s.type === 'ellipse') return <Ellipse {...common} cx={s.cx} cy={s.cy} rx={s.rx} ry={s.ry} />;
  if (s.type === 'rect')    return <Rect    {...common} x={s.x} y={s.y} width={s.w} height={s.h} rx={s.r ?? 3} />;
  if (s.type === 'path')    return <Path    {...common} d={s.d} />;
  return null;
}

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

  const visibleZones = ZONES.filter(z => view === 'front' ? z.front : z.back);

  return (
    <View style={styles.wrapper}>
      {/* Front / Back toggle */}
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

      {/* SVG body diagram */}
      <View style={styles.svgContainer}>
        <Svg width={CANVAS_W} height={CANVAS_H} viewBox={`0 0 ${CANVAS_W} ${CANVAS_H}`}>
          {/* Render unselected zones first, then selected on top */}
          <G>
            {visibleZones.filter(z => !selected.includes(z.id)).map(z => (
              <G key={z.id} onPress={() => toggle(z.id)}>
                <ZoneShape zone={z} fill={SKIN} stroke={SKIN_STROKE} />
              </G>
            ))}
            {visibleZones.filter(z => selected.includes(z.id)).map(z => (
              <G key={z.id} onPress={() => toggle(z.id)} opacity={SELECTED_OPACITY}>
                <ZoneShape zone={z} fill={PRIMARY} stroke={PRIMARY} />
              </G>
            ))}
          </G>
        </Svg>
      </View>

      {/* Selected chips */}
      {selected.length > 0 && (
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chips}>
          {selected.map(loc => (
            <TouchableOpacity key={loc} style={styles.chip} onPress={() => toggle(loc)} activeOpacity={0.7}>
              <Text style={styles.chipText}>{t(`woundTracking.bodyLocation_${loc}`)}</Text>
              <Text style={styles.chipRemove}>✕</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      )}

      {selected.length === 0 && (
        <Text style={styles.hint}>{t('woundTracking.bodyTapHint')}</Text>
      )}
    </View>
  );
};

// ─── styles ──────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  wrapper: { gap: Spacing.sm_8, alignItems: 'center' },

  toggle: { flexDirection: 'row', gap: 0, borderRadius: 8, overflow: 'hidden', borderWidth: 1, borderColor: PRIMARY },
  toggleBtn: { paddingHorizontal: 28, paddingVertical: 7, backgroundColor: Color.white },
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

