import React, { useMemo, useState } from 'react';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import Body, { ExtendedBodyPart, Slug } from 'react-native-body-highlighter';
import { useTranslation } from 'react-i18next';
import { Color } from '@src/styles/colors';
import { FontFamily, FontSize } from '@src/styles/fonts';
import { Spacing } from '@src/styles/spacings';

const PRIMARY = '#35C2C1';
const SELECTED_COLOR = PRIMARY;
const SKIN = '#F5C9A0';
const SKIN_STROKE = '#C8965A';

// ---------------------------------------------------------------------------
// Mapping: App zone ID → library slugs + optional side + which views it belongs to
// ---------------------------------------------------------------------------
type ZoneDef = {
  slugs: Slug[];
  side?: 'left' | 'right';
  views: ('front' | 'back')[];
};

const ZONE_MAP: Record<string, ZoneDef> = {
  HEAD:            { slugs: ['head'],                       views: ['front', 'back'] },
  NECK:            { slugs: ['neck'],                       views: ['front', 'back'] },

  SHOULDER_RIGHT:  { slugs: ['deltoids'],  side: 'right',  views: ['front'] },
  SHOULDER_LEFT:   { slugs: ['deltoids'],  side: 'left',   views: ['front'] },

  CHEST:           { slugs: ['chest'],                          views: ['front'] },
  ABDOMEN:         { slugs: ['abs', 'obliques'],               views: ['front'] },
  BACK_UPPER:      { slugs: ['upper-back', 'trapezius'],       views: ['back'] },
  BACK_LOWER:      { slugs: ['lower-back'],                    views: ['back'] },

  PELVIS:          { slugs: ['adductors'],                     views: ['front'] },

  ARM_UPPER_RIGHT: { slugs: ['biceps'],    side: 'right',      views: ['front'] },
  ARM_UPPER_LEFT:  { slugs: ['biceps'],    side: 'left',       views: ['front'] },
  ELBOW_RIGHT:     { slugs: ['triceps'],   side: 'right',      views: ['back'] },
  ELBOW_LEFT:      { slugs: ['triceps'],   side: 'left',       views: ['back'] },
  FOREARM_RIGHT:   { slugs: ['forearm'],   side: 'right',  views: ['front', 'back'] },
  FOREARM_LEFT:    { slugs: ['forearm'],   side: 'left',   views: ['front', 'back'] },
  WRIST_RIGHT:     { slugs: ['forearm'],   side: 'right',  views: ['front', 'back'] },
  WRIST_LEFT:      { slugs: ['forearm'],   side: 'left',   views: ['front', 'back'] },
  HAND_RIGHT:      { slugs: ['hands'],     side: 'right',  views: ['front', 'back'] },
  HAND_LEFT:       { slugs: ['hands'],     side: 'left',   views: ['front', 'back'] },

  HIP_RIGHT:       { slugs: ['gluteal'],   side: 'right',  views: ['back'] },
  HIP_LEFT:        { slugs: ['gluteal'],   side: 'left',   views: ['back'] },

  THIGH_RIGHT:     { slugs: ['quadriceps', 'hamstring'], side: 'right', views: ['front', 'back'] },
  THIGH_LEFT:      { slugs: ['quadriceps', 'hamstring'], side: 'left',  views: ['front', 'back'] },
  KNEE_RIGHT:      { slugs: ['knees'],               side: 'right',      views: ['front', 'back'] },
  KNEE_LEFT:       { slugs: ['knees'],               side: 'left',       views: ['front', 'back'] },
  LEG_LOWER_RIGHT: { slugs: ['tibialis', 'calves'],  side: 'right',      views: ['front', 'back'] },
  LEG_LOWER_LEFT:  { slugs: ['tibialis', 'calves'],  side: 'left',       views: ['front', 'back'] },
  ANKLE_RIGHT:     { slugs: ['ankles'],    side: 'right',  views: ['front', 'back'] },
  ANKLE_LEFT:      { slugs: ['ankles'],    side: 'left',   views: ['front', 'back'] },
  FOOT_RIGHT:      { slugs: ['feet'],      side: 'right',  views: ['front', 'back'] },
  FOOT_LEFT:       { slugs: ['feet'],      side: 'left',   views: ['front', 'back'] },
};

// All slugs available in the library — used to pre-fill the body with skin
// color so the library's dark default (#3f3f3f) never shows.
const ALL_SLUGS: Slug[] = [
  'abs', 'adductors', 'ankles', 'biceps', 'calves', 'chest',
  'deltoids', 'feet', 'forearm', 'gluteal', 'hamstring', 'hands',
  'head', 'knees', 'lower-back', 'neck', 'obliques',
  'quadriceps', 'tibialis', 'trapezius', 'triceps', 'upper-back',
];

// ---------------------------------------------------------------------------
// Build Body component data.
// Selected parts come FIRST so data.find() returns them for bilateral
// side-detection. All OTHER slugs are pre-filled with skin color so the
// library's dark default never appears for unselected bilateral halves.
// ---------------------------------------------------------------------------
function buildBodyData(selectedIds: string[], view?: 'front' | 'back'): ExtendedBodyPart[] {
  const slugSides = new Map<string, Set<string>>();

  for (const id of selectedIds) {
    const def = ZONE_MAP[id];
    if (!def) continue;
    if (view && !def.views.includes(view)) continue;
    for (const slug of def.slugs) {
      if (!slugSides.has(slug)) slugSides.set(slug, new Set());
      slugSides.get(slug)!.add(def.side ?? '__none__');
    }
  }

  const selectedParts: ExtendedBodyPart[] = [];
  const selectedSlugs = new Set<string>();

  for (const [slug, sides] of slugSides) {
    const hasLeft  = sides.has('left');
    const hasRight = sides.has('right');
    const hasNone  = sides.has('__none__');
    selectedSlugs.add(slug);

    if (hasNone || (hasLeft && hasRight)) {
      selectedParts.push({ slug: slug as Slug, color: SELECTED_COLOR });
    } else if (hasRight) {
      selectedParts.push({ slug: slug as Slug, side: 'right', color: SELECTED_COLOR });
    } else if (hasLeft) {
      selectedParts.push({ slug: slug as Slug, side: 'left', color: SELECTED_COLOR });
    }
  }

  // Pre-fill every unselected slug with explicit skin styles so the library's
  // getColorToFill() returns SKIN instead of its hardcoded dark default.
  const skinParts: ExtendedBodyPart[] = ALL_SLUGS
    .filter(slug => !selectedSlugs.has(slug))
    .map(slug => ({ slug, styles: { fill: SKIN, stroke: SKIN_STROKE, strokeWidth: 0.5 } }));

  return [...selectedParts, ...skinParts];
}

// ---------------------------------------------------------------------------
// Find zone IDs matching a pressed slug/side on the current view.
//
// ALL library slugs except "head"/"hair" have bilateral left+right SVG paths,
// so onBodyPartPress ALWAYS fires with _side = 'left' | 'right'.
// Rules:
//   • If the zone has no side (CHEST, ABDOMEN, BACK_UPPER …) → accept any
//     press side (the whole zone is selected regardless of which half was hit).
//   • If the zone has a specific side (ARM_UPPER_RIGHT …) → only match when
//     the pressed side equals the zone's side.
// ---------------------------------------------------------------------------
function findZoneIds(slug: string, side: 'left' | 'right' | undefined, currentView: 'front' | 'back'): string[] {
  return Object.entries(ZONE_MAP)
    .filter(([, def]) => {
      if (!def.slugs.includes(slug as Slug)) return false;
      if (!def.views.includes(currentView)) return false;
      // Zone with a defined side must match exactly.
      // Zone with no side (bilateral-agnostic) matches any press direction.
      if (def.side !== undefined && def.side !== side) return false;
      return true;
    })
    .map(([id]) => id);
}

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------
export interface BodyLocationPickerProps {
  selected: string[];
  onChange: (locations: string[]) => void;
  label?: string;
}

export interface BodyLocationDisplayProps {
  selectedFront: string[];
  selectedBack: string[];
}

// ---------------------------------------------------------------------------
// BodyLocationPicker (interactive)
// Front/back selections are tracked independently so choosing a zone on the
// back view does not highlight anything on the front view and vice-versa.
// ---------------------------------------------------------------------------
const BodyLocationPicker: React.FC<BodyLocationPickerProps> = ({ selected, onChange }) => {
  const { t } = useTranslation();
  const [view, setView] = useState<'front' | 'back'>('front');

  // Split external `selected` array into per-view buckets on mount.
  const [viewSel, setViewSel] = useState<{ front: string[]; back: string[] }>(() => {
    const front: string[] = [];
    const back:  string[] = [];
    for (const id of selected) {
      const def = ZONE_MAP[id];
      if (!def) continue;
      // Primary assignment: first view listed wins
      if (def.views[0] === 'back') back.push(id);
      else front.push(id);
    }
    return { front, back };
  });

  const handleBodyPartPress = (part: ExtendedBodyPart, _side?: 'left' | 'right') => {
    const slug = part.slug as string;
    const side = _side ?? part.side;   // _side is more reliable (hardcoded by library)
    const matchedIds = findZoneIds(slug, side, view);
    if (matchedIds.length === 0) return;

    const arr = viewSel[view];
    const allSelected = matchedIds.every(id => arr.includes(id));
    const next = allSelected
      ? arr.filter(id => !matchedIds.includes(id))
      : [...new Set([...arr, ...matchedIds])];
    const updated = { ...viewSel, [view]: next };
    setViewSel(updated);
    onChange([...new Set([...updated.front, ...updated.back])]);
  };

  const currentViewIds = viewSel[view];
  const bodyData = useMemo(() => buildBodyData(currentViewIds, view), [currentViewIds, view]);

  // Build chip list: { id, isBack } — zones selected on the back view get a
  // "(Post.)" suffix. If the same zone is selected on both views, show two chips.
  const chips = useMemo(() => {
    const result: { id: string; isBack: boolean }[] = [];
    const frontSet = new Set(viewSel.front);
    const backSet  = new Set(viewSel.back);
    const allIds   = new Set([...viewSel.front, ...viewSel.back]);
    for (const id of allIds) {
      if (frontSet.has(id)) result.push({ id, isBack: false });
      if (backSet.has(id))  result.push({ id, isBack: true });
    }
    return result;
  }, [viewSel]);

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

      <Body
        data={bodyData}
        side={view}
        scale={1.1}
        onBodyPartPress={handleBodyPartPress}
        colors={[SELECTED_COLOR]}
        defaultFill={SKIN}
        defaultStroke={SKIN_STROKE}
        defaultStrokeWidth={0.5}
        border="none"
      />

      {chips.length > 0 ? (
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chips}>
          {chips.map(({ id: loc, isBack }) => (
            <TouchableOpacity
              key={`${loc}-${isBack ? 'back' : 'front'}`}
              style={styles.chip}
              onPress={() => {
                const updated = isBack
                  ? { ...viewSel, back:  viewSel.back.filter(l => l !== loc) }
                  : { ...viewSel, front: viewSel.front.filter(l => l !== loc) };
                setViewSel(updated);
                onChange([...new Set([...updated.front, ...updated.back])]);
              }}
              activeOpacity={0.7}
            >
              <Text style={styles.chipText}>
                {t(`woundTracking.bodyLocation_${loc}`)}
                {isBack ? ` (${t('woundTracking.bodyPostSuffix')})` : ''}
              </Text>
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

// ---------------------------------------------------------------------------
// Styles
// ---------------------------------------------------------------------------
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
  hint: { fontFamily: FontFamily.regular, fontSize: 12, color: Color.Gray.v300, textAlign: 'center' },
});

// ---------------------------------------------------------------------------
// BodyLocationDisplay (read-only — both sides shown simultaneously)
// ---------------------------------------------------------------------------
export const BodyLocationDisplay: React.FC<BodyLocationDisplayProps> = ({ selectedFront, selectedBack }) => {
  const { t } = useTranslation();
  const frontData = useMemo(() => buildBodyData(selectedFront, 'front'), [selectedFront]);
  const backData  = useMemo(() => buildBodyData(selectedBack,  'back'),  [selectedBack]);
  const hasFront = selectedFront.length > 0;
  const hasBack  = selectedBack.length > 0;
  if (!hasFront && !hasBack) return null;

  return (
    <View style={displayStyles.row}>
      {hasFront && (
        <View style={displayStyles.sideWrapper}>
          <Body
            data={frontData}
            side="front"
            scale={0.7}
            colors={[SELECTED_COLOR]}
            defaultFill={SKIN}
            defaultStroke={SKIN_STROKE}
            defaultStrokeWidth={0.5}
            border="none"
          />
          <Text style={displayStyles.label}>{t('woundTracking.bodyFrontDisplay')}</Text>
        </View>
      )}
      {hasBack && (
        <View style={displayStyles.sideWrapper}>
          <Body
            data={backData}
            side="back"
            scale={0.7}
            colors={[SELECTED_COLOR]}
            defaultFill={SKIN}
            defaultStroke={SKIN_STROKE}
            defaultStrokeWidth={0.5}
            border="none"
          />
          <Text style={displayStyles.label}>{t('woundTracking.bodyBackDisplay')}</Text>
        </View>
      )}
    </View>
  );
};

const displayStyles = StyleSheet.create({
  row:         { flexDirection: 'row', gap: 16, justifyContent: 'center', flexWrap: 'wrap' },
  sideWrapper: { alignItems: 'center', gap: 4 },
  label: { fontFamily: FontFamily.medium, fontSize: 11, color: PRIMARY, textAlign: 'center' },
});

export default BodyLocationPicker;
