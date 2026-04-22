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
const PRIMARY       = '#35C2C1';
const OVERLAY_SEL   = 'rgba(53,194,193,0.42)';
const OUTLINE_IDLE  = 'rgba(53,194,193,0.45)';

// Display size. Images are 499x820 (front) and 488x822 (back).
// Container uses exact aspect ratio 499/820 ≈ 0.608 so contain fills fully.
const BODY_W = 200;
const BODY_H = 329;

const FRONT_IMG = require('../../assets/body_front.png');
const BACK_IMG  = require('../../assets/body_back.png');

// ─── zone type ───────────────────────────────────────────────────────────────
// Coordinates calibrated to 200x329 container for 499x820 image (scale ≈ 0.401).
// Anatomical convention: patient RIGHT = screen LEFT (x<100), LEFT = screen RIGHT (x>100).
// All zones show a subtle teal outline so the user can see where to tap.
interface Zone {
  id: string;
  top: number; left: number; width: number; height: number;
  borderRadius?: number;
}

// ─── FRONT zones ─────────────────────────────────────────────────────────────
const FRONT_ZONES: Zone[] = [
  // Head & neck
  { id: 'HEAD',            top:  13, left: 75, width: 50, height: 38, borderRadius: 25 },
  { id: 'FACE',            top:  17, left: 79, width: 42, height: 30, borderRadius: 22 },
  { id: 'NECK',            top:  50, left: 87, width: 26, height: 15, borderRadius:  8 },
  // Torso front
  { id: 'SHOULDER_RIGHT',  top:  63, left: 22, width: 58, height: 34, borderRadius: 14 },
  { id: 'SHOULDER_LEFT',   top:  63, left:120, width: 58, height: 34, borderRadius: 14 },
  { id: 'CHEST',           top:  63, left: 62, width: 76, height: 64, borderRadius:  8 },
  { id: 'ABDOMEN',         top: 124, left: 66, width: 68, height: 52, borderRadius:  8 },
  { id: 'PELVIS',          top: 174, left: 68, width: 64, height: 22, borderRadius: 11 },
  // Right arm (patient right = screen left)
  { id: 'ARM_UPPER_RIGHT', top:  63, left: 14, width: 52, height: 72, borderRadius: 14 },
  { id: 'ELBOW_RIGHT',     top: 132, left: 12, width: 44, height: 20, borderRadius: 10 },
  { id: 'FOREARM_RIGHT',   top: 150, left:  8, width: 44, height: 46, borderRadius: 12 },
  { id: 'WRIST_RIGHT',     top: 194, left:  6, width: 42, height: 16, borderRadius:  8 },
  { id: 'HAND_RIGHT',      top: 208, left:  4, width: 44, height: 40, borderRadius: 10 },
  // Left arm (patient left = screen right)
  { id: 'ARM_UPPER_LEFT',  top:  63, left:134, width: 52, height: 72, borderRadius: 14 },
  { id: 'ELBOW_LEFT',      top: 132, left:144, width: 44, height: 20, borderRadius: 10 },
  { id: 'FOREARM_LEFT',    top: 150, left:148, width: 44, height: 46, borderRadius: 12 },
  { id: 'WRIST_LEFT',      top: 194, left:152, width: 42, height: 16, borderRadius:  8 },
  { id: 'HAND_LEFT',       top: 208, left:152, width: 44, height: 40, borderRadius: 10 },
  // Hips & legs (right = screen left)
  { id: 'HIP_RIGHT',       top: 194, left: 64, width: 38, height: 22, borderRadius: 11 },
  { id: 'HIP_LEFT',        top: 194, left: 98, width: 38, height: 22, borderRadius: 11 },
  { id: 'THIGH_RIGHT',     top: 207, left: 62, width: 38, height: 54, borderRadius: 10 },
  { id: 'THIGH_LEFT',      top: 207, left: 98, width: 38, height: 54, borderRadius: 10 },
  { id: 'KNEE_RIGHT',      top: 259, left: 62, width: 38, height: 20, borderRadius: 10 },
  { id: 'KNEE_LEFT',       top: 259, left: 98, width: 38, height: 20, borderRadius: 10 },
  { id: 'LEG_LOWER_RIGHT', top: 277, left: 63, width: 36, height: 38, borderRadius: 10 },
  { id: 'LEG_LOWER_LEFT',  top: 277, left: 99, width: 36, height: 38, borderRadius: 10 },
  { id: 'ANKLE_RIGHT',     top: 313, left: 63, width: 34, height: 12, borderRadius:  6 },
  { id: 'ANKLE_LEFT',      top: 313, left: 99, width: 34, height: 12, borderRadius:  6 },
  { id: 'FOOT_RIGHT',      top: 320, left: 52, width: 44, height: 10, borderRadius:  5 },
  { id: 'FOOT_LEFT',       top: 320, left: 98, width: 44, height: 10, borderRadius:  5 },
];

// ─── BACK zones ───────────────────────────────────────────────────────────────
// Back image 488x822; scale ≈ 0.409/0.400 – very close to front, same coords work.
const BACK_ZONES: Zone[] = [
  { id: 'HEAD',            top:  13, left: 75, width: 50, height: 38, borderRadius: 25 },
  { id: 'NECK',            top:  50, left: 87, width: 26, height: 15, borderRadius:  8 },
  { id: 'SHOULDER_RIGHT',  top:  63, left: 22, width: 58, height: 34, borderRadius: 14 },
  { id: 'SHOULDER_LEFT',   top:  63, left:120, width: 58, height: 34, borderRadius: 14 },
  { id: 'BACK_UPPER',      top:  63, left: 62, width: 76, height: 64, borderRadius:  8 },
  { id: 'BACK_LOWER',      top: 124, left: 66, width: 68, height: 52, borderRadius:  8 },
  { id: 'PELVIS',          top: 174, left: 68, width: 64, height: 22, borderRadius: 11 },
  { id: 'ARM_UPPER_RIGHT', top:  63, left: 14, width: 52, height: 72, borderRadius: 14 },
  { id: 'ELBOW_RIGHT',     top: 132, left: 12, width: 44, height: 20, borderRadius: 10 },
  { id: 'FOREARM_RIGHT',   top: 150, left:  8, width: 44, height: 46, borderRadius: 12 },
  { id: 'WRIST_RIGHT',     top: 194, left:  6, width: 42, height: 16, borderRadius:  8 },
  { id: 'HAND_RIGHT',      top: 208, left:  4, width: 44, height: 40, borderRadius: 10 },
  { id: 'ARM_UPPER_LEFT',  top:  63, left:134, width: 52, height: 72, borderRadius: 14 },
  { id: 'ELBOW_LEFT',      top: 132, left:144, width: 44, height: 20, borderRadius: 10 },
  { id: 'FOREARM_LEFT',    top: 150, left:148, width: 44, height: 46, borderRadius: 12 },
  { id: 'WRIST_LEFT',      top: 194, left:152, width: 42, height: 16, borderRadius:  8 },
  { id: 'HAND_LEFT',       top: 208, left:152, width: 44, height: 40, borderRadius: 10 },
  { id: 'HIP_RIGHT',       top: 194, left: 64, width: 38, height: 22, borderRadius: 11 },
  { id: 'HIP_LEFT',        top: 194, left: 98, width: 38, height: 22, borderRadius: 11 },
  { id: 'THIGH_RIGHT',     top: 207, left: 62, width: 38, height: 54, borderRadius: 10 },
  { id: 'THIGH_LEFT',      top: 207, left: 98, width: 38, height: 54, borderRadius: 10 },
  { id: 'KNEE_RIGHT',      top: 259, left: 62, width: 38, height: 20, borderRadius: 10 },
  { id: 'KNEE_LEFT',       top: 259, left: 98, width: 38, height: 20, borderRadius: 10 },
  { id: 'LEG_LOWER_RIGHT', top: 277, left: 63, width: 36, height: 38, borderRadius: 10 },
  { id: 'LEG_LOWER_LEFT',  top: 277, left: 99, width: 36, height: 38, borderRadius: 10 },
  { id: 'ANKLE_RIGHT',     top: 313, left: 63, width: 34, height: 12, borderRadius:  6 },
  { id: 'ANKLE_LEFT',      top: 313, left: 99, width: 34, height: 12, borderRadius:  6 },
  { id: 'FOOT_RIGHT',      top: 320, left: 52, width: 44, height: 10, borderRadius:  5 },
  { id: 'FOOT_LEFT',       top: 320, left: 98, width: 44, height: 10, borderRadius:  5 },
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

  const toggle = (id: string) =>
    onChange(selected.includes(id) ? selected.filter(l => l !== id) : [...selected, id]);

  const zones      = view === 'front' ? FRONT_ZONES : BACK_ZONES;
  const bodyImage  = view === 'front' ? FRONT_IMG : BACK_IMG;

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
          const isSel = selected.includes(zone.id);
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
                isSel ? styles.zoneSelected : styles.zoneIdle,
              ]}
              onPress={() => toggle(zone.id)}
              hitSlop={4}
            />
          );
        })}
      </View>

      {/* Selected chips */}
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
              onPress={() => toggle(loc)}
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
  },
  // Subtle visible outline so user can see where to tap
  zoneIdle: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: OUTLINE_IDLE,
    borderStyle: 'dashed',
  },
  // Teal solid fill when selected
  zoneSelected: {
    backgroundColor: OVERLAY_SEL,
    borderWidth: 2,
    borderColor: PRIMARY,
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
