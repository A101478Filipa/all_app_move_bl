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
const PRIMARY  = '#35C2C1';
const OVERLAY  = 'rgba(53,194,193,0.40)';
const BODY_W   = 200;
const BODY_H   = 325;

// ─── PNG assets ──────────────────────────────────────────────────────────────
// Place body_front.png and body_back.png in APP/assets/
const FRONT_IMG = require('../../assets/body_front.png');
const BACK_IMG  = require('../../assets/body_back.png');

// ─── zone type ───────────────────────────────────────────────────────────────
// All coordinates are in pixels for a BODY_W×BODY_H (200×325) display container.
// Zones are invisible Pressable overlays placed on top of the PNG image.
// Anatomical convention: patient RIGHT = screen LEFT (x < 100), LEFT = screen RIGHT (x > 100).
interface Zone {
  id: string;
  top: number;
  left: number;
  width: number;
  height: number;
  borderRadius?: number;
}

// ─── FRONT zones ─────────────────────────────────────────────────────────────
const FRONT_ZONES: Zone[] = [
  { id: 'HEAD',            top:  8, left: 80, width: 40, height: 44, borderRadius: 22 },
  { id: 'NECK',            top: 51, left: 88, width: 24, height: 15, borderRadius: 8  },
  // torso
  { id: 'SHOULDER_RIGHT',  top: 62, left: 38, width: 46, height: 28, borderRadius: 14 },
  { id: 'SHOULDER_LEFT',   top: 62, left:116, width: 46, height: 28, borderRadius: 14 },
  { id: 'CHEST',           top: 62, left: 78, width: 44, height: 56, borderRadius: 8  },
  { id: 'ABDOMEN',         top:118, left: 80, width: 40, height: 44, borderRadius: 6  },
  { id: 'PELVIS',          top:162, left: 80, width: 40, height: 22, borderRadius: 11 },
  // right arm (patient right = screen left)
  { id: 'ARM_UPPER_RIGHT', top: 64, left: 36, width: 24, height: 64, borderRadius: 12 },
  { id: 'ELBOW_RIGHT',     top:128, left: 30, width: 24, height: 22, borderRadius: 11 },
  { id: 'FOREARM_RIGHT',   top:150, left: 24, width: 22, height: 54, borderRadius: 8  },
  { id: 'WRIST_RIGHT',     top:204, left: 20, width: 22, height: 16, borderRadius: 8  },
  { id: 'HAND_RIGHT',      top:220, left: 12, width: 32, height: 48, borderRadius: 8  },
  // left arm (patient left = screen right)
  { id: 'ARM_UPPER_LEFT',  top: 64, left:140, width: 24, height: 64, borderRadius: 12 },
  { id: 'ELBOW_LEFT',      top:128, left:146, width: 24, height: 22, borderRadius: 11 },
  { id: 'FOREARM_LEFT',    top:150, left:154, width: 22, height: 54, borderRadius: 8  },
  { id: 'WRIST_LEFT',      top:204, left:158, width: 22, height: 16, borderRadius: 8  },
  { id: 'HAND_LEFT',       top:220, left:156, width: 32, height: 48, borderRadius: 8  },
  // right leg
  { id: 'HIP_RIGHT',       top:184, left: 68, width: 32, height: 24, borderRadius: 10 },
  { id: 'THIGH_RIGHT',     top:184, left: 66, width: 34, height: 72, borderRadius: 10 },
  { id: 'KNEE_RIGHT',      top:256, left: 68, width: 32, height: 22, borderRadius: 11 },
  { id: 'LEG_LOWER_RIGHT', top:278, left: 70, width: 28, height: 42, borderRadius: 8  },
  { id: 'ANKLE_RIGHT',     top:298, left: 71, width: 26, height: 16, borderRadius: 6  },
  { id: 'FOOT_RIGHT',      top:306, left: 60, width: 36, height: 16, borderRadius: 6  },
  // left leg
  { id: 'HIP_LEFT',        top:184, left:100, width: 32, height: 24, borderRadius: 10 },
  { id: 'THIGH_LEFT',      top:184, left:100, width: 34, height: 72, borderRadius: 10 },
  { id: 'KNEE_LEFT',       top:256, left:100, width: 32, height: 22, borderRadius: 11 },
  { id: 'LEG_LOWER_LEFT',  top:278, left:102, width: 28, height: 42, borderRadius: 8  },
  { id: 'ANKLE_LEFT',      top:298, left:103, width: 26, height: 16, borderRadius: 6  },
  { id: 'FOOT_LEFT',       top:306, left:104, width: 36, height: 16, borderRadius: 6  },
];

// ─── BACK zones ───────────────────────────────────────────────────────────────
const BACK_ZONES: Zone[] = [
  { id: 'HEAD',            top:  8, left: 80, width: 40, height: 44, borderRadius: 22 },
  { id: 'NECK',            top: 51, left: 88, width: 24, height: 15, borderRadius: 8  },
  // torso back
  { id: 'SHOULDER_RIGHT',  top: 62, left: 38, width: 46, height: 28, borderRadius: 14 },
  { id: 'SHOULDER_LEFT',   top: 62, left:116, width: 46, height: 28, borderRadius: 14 },
  { id: 'BACK_UPPER',      top: 62, left: 78, width: 44, height: 56, borderRadius: 8  },
  { id: 'BACK_LOWER',      top:118, left: 80, width: 40, height: 44, borderRadius: 6  },
  { id: 'PELVIS',          top:162, left: 80, width: 40, height: 22, borderRadius: 11 },
  // right arm
  { id: 'ARM_UPPER_RIGHT', top: 64, left: 36, width: 24, height: 64, borderRadius: 12 },
  { id: 'ELBOW_RIGHT',     top:128, left: 30, width: 24, height: 22, borderRadius: 11 },
  { id: 'FOREARM_RIGHT',   top:150, left: 24, width: 22, height: 54, borderRadius: 8  },
  { id: 'WRIST_RIGHT',     top:204, left: 20, width: 22, height: 16, borderRadius: 8  },
  { id: 'HAND_RIGHT',      top:220, left: 12, width: 32, height: 48, borderRadius: 8  },
  // left arm
  { id: 'ARM_UPPER_LEFT',  top: 64, left:140, width: 24, height: 64, borderRadius: 12 },
  { id: 'ELBOW_LEFT',      top:128, left:146, width: 24, height: 22, borderRadius: 11 },
  { id: 'FOREARM_LEFT',    top:150, left:154, width: 22, height: 54, borderRadius: 8  },
  { id: 'WRIST_LEFT',      top:204, left:158, width: 22, height: 16, borderRadius: 8  },
  { id: 'HAND_LEFT',       top:220, left:156, width: 32, height: 48, borderRadius: 8  },
  // right leg
  { id: 'HIP_RIGHT',       top:184, left: 68, width: 32, height: 24, borderRadius: 10 },
  { id: 'THIGH_RIGHT',     top:184, left: 66, width: 34, height: 72, borderRadius: 10 },
  { id: 'KNEE_RIGHT',      top:256, left: 68, width: 32, height: 22, borderRadius: 11 },
  { id: 'LEG_LOWER_RIGHT', top:278, left: 70, width: 28, height: 42, borderRadius: 8  },
  { id: 'ANKLE_RIGHT',     top:298, left: 71, width: 26, height: 16, borderRadius: 6  },
  { id: 'FOOT_RIGHT',      top:306, left: 60, width: 36, height: 16, borderRadius: 6  },
  // left leg
  { id: 'HIP_LEFT',        top:184, left:100, width: 32, height: 24, borderRadius: 10 },
  { id: 'THIGH_LEFT',      top:184, left:100, width: 34, height: 72, borderRadius: 10 },
  { id: 'KNEE_LEFT',       top:256, left:100, width: 32, height: 22, borderRadius: 11 },
  { id: 'LEG_LOWER_LEFT',  top:278, left:102, width: 28, height: 42, borderRadius: 8  },
  { id: 'ANKLE_LEFT',      top:298, left:103, width: 26, height: 16, borderRadius: 6  },
  { id: 'FOOT_LEFT',       top:306, left:104, width: 36, height: 16, borderRadius: 6  },
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
  const bodyImage = view === 'front' ? FRONT_IMG : BACK_IMG;

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

      {/* Body image + invisible zone overlays */}
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
                isSel && styles.zoneSelected,
              ]}
              onPress={() => toggle(zone.id)}
            />
          );
        })}
      </View>

      {/* Selected location chips */}
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
  toggleBtn:       { paddingHorizontal: 32, paddingVertical: 8, backgroundColor: Color.white },
  toggleBtnActive: { backgroundColor: PRIMARY },
  toggleText:      { fontFamily: FontFamily.medium, fontSize: FontSize.bodysmall_14, color: PRIMARY },
  toggleTextActive:{ color: Color.white },

  bodyContainer: {
    width: BODY_W,
    height: BODY_H,
    position: 'relative',
  },
  bodyImage: {
    width: BODY_W,
    height: BODY_H,
  },

  // Transparent hotspot overlay (invisible by default)
  zone: {
    position: 'absolute',
    backgroundColor: 'transparent',
  },
  // Selected: teal fill + border
  zoneSelected: {
    backgroundColor: OVERLAY,
    borderWidth: 1.5,
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
