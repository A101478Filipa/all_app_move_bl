import React, { useState } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet,
  ScrollView, Image, Pressable,
} from 'react-native';
import { useTranslation } from 'react-i18next';
import { Color } from '@src/styles/colors';
import { Spacing } from '@src/styles/spacings';
import { FontFamily, FontSize } from '@src/styles/fonts';

// ─── constants ───────────────────────────────────────────────────────────────
const PRIMARY = '#35C2C1';

// Both images: 499x820 px.  Display container: 200x329 dp.
// Scale: 200/499 = 0.4008 (x)  |  329/820 = 0.4012 (y)
//
// To tune a zone: measure pixel coord in image → multiply by 0.4008 (x) or 0.4012 (y).
// Anatomical convention: patient RIGHT = screen LEFT (x<100), patient LEFT = screen RIGHT (x>100).
const BODY_W = 200;
const BODY_H = 329;

const FRONT_IMG = require('../../assets/body_front.png');
const BACK_IMG  = require('../../assets/body_back.png');

interface Zone { id: string; top: number; left: number; width: number; height: number; borderRadius?: number }

// ─────────────────────────────────────────────────────────────────────────────
// FRONT ZONES
// Calibrated for 499x820 image → 200x329 container
// Arm proportion reference (820px figure, top-of-head ~y=25, feet ~y=800):
//   shoulder  y≈170 → display y≈68
//   elbow     y≈370 → display y≈148
//   wrist     y≈515 → display y≈207
//   fingertip y≈640 → display y≈257
// ─────────────────────────────────────────────────────────────────────────────
const FRONT_ZONES: Zone[] = [
  // Head (no separate FACE – HEAD covers whole head)
  { id: 'HEAD',            top:  10, left: 74, width: 52, height: 52, borderRadius: 26 },
  { id: 'NECK',            top:  60, left: 87, width: 26, height: 14, borderRadius:  7 },

  // Torso
  { id: 'SHOULDER_RIGHT',  top:  68, left: 22, width: 54, height: 30, borderRadius: 15 },
  { id: 'SHOULDER_LEFT',   top:  68, left:124, width: 54, height: 30, borderRadius: 15 },
  { id: 'CHEST',           top:  68, left: 68, width: 64, height: 60, borderRadius:  8 },
  { id: 'ABDOMEN',         top: 126, left: 70, width: 60, height: 50, borderRadius:  8 },
  { id: 'PELVIS',          top: 174, left: 72, width: 56, height: 22, borderRadius: 11 },

  // ── RIGHT ARM (patient right = screen LEFT) ────────────────────────────────
  // Upper arm: shoulder y≈68 → elbow y≈148  |  x ≈ img 42–116 → display 17–46
  { id: 'ARM_UPPER_RIGHT', top:  68, left: 14, width: 32, height: 80, borderRadius: 14 },
  // Elbow: img y≈370–400 → display 148–160
  { id: 'ELBOW_RIGHT',     top: 144, left: 12, width: 30, height: 22, borderRadius: 11 },
  // Forearm: img y≈400–515 → display 160–207  |  x ≈ img 36–106 → display 14–42
  { id: 'FOREARM_RIGHT',   top: 162, left: 10, width: 30, height: 48, borderRadius: 12 },
  // Wrist: img y≈515–545 → display 207–219
  { id: 'WRIST_RIGHT',     top: 207, left:  8, width: 28, height: 16, borderRadius:  8 },
  // Hand: img y≈545–640 → display 219–257  |  hand spreads wider
  { id: 'HAND_RIGHT',      top: 221, left:  4, width: 34, height: 40, borderRadius: 10 },

  // ── LEFT ARM (patient left = screen RIGHT) ─────────────────────────────────
  { id: 'ARM_UPPER_LEFT',  top:  68, left:154, width: 32, height: 80, borderRadius: 14 },
  { id: 'ELBOW_LEFT',      top: 144, left:158, width: 30, height: 22, borderRadius: 11 },
  { id: 'FOREARM_LEFT',    top: 162, left:160, width: 30, height: 48, borderRadius: 12 },
  { id: 'WRIST_LEFT',      top: 207, left:164, width: 28, height: 16, borderRadius:  8 },
  { id: 'HAND_LEFT',       top: 221, left:162, width: 34, height: 40, borderRadius: 10 },

  // ── LEGS ──────────────────────────────────────────────────────────────────
  // Hip: img y ≈ 545–585 → display 219–235
  { id: 'HIP_RIGHT',       top: 194, left: 66, width: 34, height: 26, borderRadius: 13 },
  { id: 'HIP_LEFT',        top: 194, left:100, width: 34, height: 26, borderRadius: 13 },
  // Thigh: img y ≈ 560–700 → display 225–281
  { id: 'THIGH_RIGHT',     top: 218, left: 64, width: 36, height: 58, borderRadius: 10 },
  { id: 'THIGH_LEFT',      top: 218, left:100, width: 36, height: 58, borderRadius: 10 },
  // Knee: img y ≈ 700–740 → display 281–297
  { id: 'KNEE_RIGHT',      top: 274, left: 64, width: 36, height: 22, borderRadius: 11 },
  { id: 'KNEE_LEFT',       top: 274, left:100, width: 36, height: 22, borderRadius: 11 },
  // Lower leg: img y ≈ 740–800 → display 297–321
  { id: 'LEG_LOWER_RIGHT', top: 294, left: 65, width: 32, height: 28, borderRadius: 8  },
  { id: 'LEG_LOWER_LEFT',  top: 294, left:103, width: 32, height: 28, borderRadius: 8  },
  // Ankle: img y ≈ 790–815 → display 317–327
  { id: 'ANKLE_RIGHT',     top: 318, left: 66, width: 28, height: 10, borderRadius: 5  },
  { id: 'ANKLE_LEFT',      top: 318, left:106, width: 28, height: 10, borderRadius: 5  },
  // Foot
  { id: 'FOOT_RIGHT',      top: 322, left: 52, width: 42, height: 8,  borderRadius: 4  },
  { id: 'FOOT_LEFT',       top: 322, left:106, width: 42, height: 8,  borderRadius: 4  },
];

// ─────────────────────────────────────────────────────────────────────────────
// BACK ZONES  (same Y/X estimates — figure fills same 499×820 canvas)
// ─────────────────────────────────────────────────────────────────────────────
const BACK_ZONES: Zone[] = [
  { id: 'HEAD',            top:  10, left: 74, width: 52, height: 52, borderRadius: 26 },
  { id: 'NECK',            top:  60, left: 87, width: 26, height: 14, borderRadius:  7 },

  { id: 'SHOULDER_RIGHT',  top:  68, left: 22, width: 54, height: 30, borderRadius: 15 },
  { id: 'SHOULDER_LEFT',   top:  68, left:124, width: 54, height: 30, borderRadius: 15 },
  { id: 'BACK_UPPER',      top:  68, left: 68, width: 64, height: 60, borderRadius:  8 },
  { id: 'BACK_LOWER',      top: 126, left: 70, width: 60, height: 50, borderRadius:  8 },
  { id: 'PELVIS',          top: 174, left: 72, width: 56, height: 22, borderRadius: 11 },

  { id: 'ARM_UPPER_RIGHT', top:  68, left: 14, width: 32, height: 80, borderRadius: 14 },
  { id: 'ELBOW_RIGHT',     top: 144, left: 12, width: 30, height: 22, borderRadius: 11 },
  { id: 'FOREARM_RIGHT',   top: 162, left: 10, width: 30, height: 48, borderRadius: 12 },
  { id: 'WRIST_RIGHT',     top: 207, left:  8, width: 28, height: 16, borderRadius:  8 },
  { id: 'HAND_RIGHT',      top: 221, left:  4, width: 34, height: 40, borderRadius: 10 },

  { id: 'ARM_UPPER_LEFT',  top:  68, left:154, width: 32, height: 80, borderRadius: 14 },
  { id: 'ELBOW_LEFT',      top: 144, left:158, width: 30, height: 22, borderRadius: 11 },
  { id: 'FOREARM_LEFT',    top: 162, left:160, width: 30, height: 48, borderRadius: 12 },
  { id: 'WRIST_LEFT',      top: 207, left:164, width: 28, height: 16, borderRadius:  8 },
  { id: 'HAND_LEFT',       top: 221, left:162, width: 34, height: 40, borderRadius: 10 },

  { id: 'HIP_RIGHT',       top: 194, left: 66, width: 34, height: 26, borderRadius: 13 },
  { id: 'HIP_LEFT',        top: 194, left:100, width: 34, height: 26, borderRadius: 13 },
  { id: 'THIGH_RIGHT',     top: 218, left: 64, width: 36, height: 58, borderRadius: 10 },
  { id: 'THIGH_LEFT',      top: 218, left:100, width: 36, height: 58, borderRadius: 10 },
  { id: 'KNEE_RIGHT',      top: 274, left: 64, width: 36, height: 22, borderRadius: 11 },
  { id: 'KNEE_LEFT',       top: 274, left:100, width: 36, height: 22, borderRadius: 11 },
  { id: 'LEG_LOWER_RIGHT', top: 294, left: 65, width: 32, height: 28, borderRadius: 8  },
  { id: 'LEG_LOWER_LEFT',  top: 294, left:103, width: 32, height: 28, borderRadius: 8  },
  { id: 'ANKLE_RIGHT',     top: 318, left: 66, width: 28, height: 10, borderRadius: 5  },
  { id: 'ANKLE_LEFT',      top: 318, left:106, width: 28, height: 10, borderRadius: 5  },
  { id: 'FOOT_RIGHT',      top: 322, left: 52, width: 42, height: 8,  borderRadius: 4  },
  { id: 'FOOT_LEFT',       top: 322, left:106, width: 42, height: 8,  borderRadius: 4  },
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

  // Isolated per-view selection so switching sides doesn't bleed highlights
  const [viewSel, setViewSel] = useState<{ front: string[]; back: string[] }>(() => {
    const frontIds = new Set(FRONT_ZONES.map(z => z.id));
    const backIds  = new Set(BACK_ZONES.map(z => z.id));
    const front: string[] = [];
    const back: string[]  = [];
    for (const id of selected) {
      const inF = frontIds.has(id);
      const inB = backIds.has(id);
      if (inF && !inB)      front.push(id);
      else if (inB && !inF) back.push(id);
      else { front.push(id); back.push(id); }
    }
    return { front, back };
  });

  const toggle = (id: string) => {
    setViewSel(prev => {
      const arr  = prev[view];
      const next = arr.includes(id) ? arr.filter(l => l !== id) : [...arr, id];
      const updated = { ...prev, [view]: next };
      onChange([...new Set([...updated.front, ...updated.back])]);
      return updated;
    });
  };

  const zones      = view === 'front' ? FRONT_ZONES : BACK_ZONES;
  const bodyImage  = view === 'front' ? FRONT_IMG   : BACK_IMG;
  const currentSel = viewSel[view];

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

      {/* Body PNG + invisible hit areas */}
      <View style={styles.bodyContainer}>
        <Image source={bodyImage} style={styles.bodyImage} resizeMode="contain" />

        {zones.map(zone => {
          const isSel = currentSel.includes(zone.id);
          return (
            <Pressable
              key={zone.id}
              style={[
                styles.zone,
                {
                  top: zone.top,
                  left: zone.left,
                  width: zone.width,
                  height: zone.height,
                  borderRadius: zone.borderRadius ?? 6,
                },
              ]}
              onPress={() => toggle(zone.id)}
              hitSlop={6}
            >
              {isSel && <View style={styles.dot} />}
            </Pressable>
          );
        })}
      </View>

      {/* Selected chips (union of both views) */}
      {selected.length > 0 ? (
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.chips}
        >
          {selected.map(loc => (
            <TouchableOpacity
              key={loc}
              style={styles.chip}
              onPress={() => {
                setViewSel(prev => {
                  const updated = {
                    front: prev.front.filter(l => l !== loc),
                    back:  prev.back.filter(l => l !== loc),
                  };
                  onChange([...new Set([...updated.front, ...updated.back])]);
                  return updated;
                });
              }}
              activeOpacity={0.7}
            >
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

// ─── styles ──────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  wrapper: { gap: Spacing.sm_8, alignItems: 'center' },

  toggle: {
    flexDirection: 'row',
    borderRadius: 8,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: PRIMARY,
  },
  toggleBtn:        { paddingHorizontal: 32, paddingVertical: 8, backgroundColor: Color.white },
  toggleBtnActive:  { backgroundColor: PRIMARY },
  toggleText:       { fontFamily: FontFamily.medium, fontSize: FontSize.bodysmall_14, color: PRIMARY },
  toggleTextActive: { color: Color.white },

  bodyContainer: { width: BODY_W, height: BODY_H, position: 'relative' },
  bodyImage:     { width: BODY_W, height: BODY_H },

  zone: {
    position: 'absolute',
    alignItems: 'center',
    justifyContent: 'center',
  },

  dot: {
    width: 14,
    height: 14,
    borderRadius: 7,
    backgroundColor: PRIMARY,
    shadowColor: '#fff',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 1,
    shadowRadius: 3,
    elevation: 4,
  },

  chips: { flexDirection: 'row', gap: Spacing.xs_4, paddingHorizontal: 2 },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 20,
    backgroundColor: PRIMARY,
  },
  chipText:   { fontFamily: FontFamily.medium, fontSize: 12, color: Color.white },
  chipRemove: { fontSize: 10, color: Color.white, fontFamily: FontFamily.bold },

  hint: {
    fontFamily: FontFamily.regular,
    fontSize: 12,
    color: Color.Gray.v300,
    textAlign: 'center',
  },
});

export default BodyLocationPicker;
