import { StyleSheet, Platform } from "react-native";

export const Spacing = {
  xxs_2: 2,
  xs_4:	4,
  xs_6: 6,
  sm_8:	8,
  sm_10: 10,
  sm_12: 12,
  md_12: 12,
  md_16: 16,
  lg_24: 24,
  xl_32: 32,
  xl2_40: 40,
  xl3_48: 48,
  xl4_56: 56,
  xl5_64: 64,
  tabBarPadding: 104,
} as const;

export const spacingStyles = StyleSheet.create({
  screenScrollContainer: {
    paddingTop: Spacing.lg_24,
    paddingHorizontal: Spacing.lg_24,
    paddingBottom: Platform.OS === 'ios' ? Spacing.lg_24 : Spacing.tabBarPadding,
  },
});
