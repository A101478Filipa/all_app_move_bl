export const FontSize = {
  // DELETE FROM THIS
  size_mini: 15,
  small: 14,
  base: 16,
  large: 22,
  extra_large: 30,
  // TO THIS

  heading1_32: 32,
  heading2_28: 28,
  heading3_24: 24,
  xl_20: 20,
  subtitle_20: 20,
  bodylarge_18: 18,
  bodymedium_16: 16,
  bodysmall_14: 14,
  caption_12: 12,
} as const;

export const FontFamily = {
  regular:   "Urbanist-Regular",
  medium:    "Urbanist-Medium",
  semi_bold: "Urbanist-SemiBold",
  bold:      "Urbanist-Bold",
  extraBold: "Urbanist-ExtraBold",
} as const;

export const Typography = {
  heading1: { fontSize: FontSize.heading1_32, fontFamily: FontFamily.extraBold },
  heading2: { fontSize: FontSize.heading2_28, fontFamily: FontFamily.bold },
  heading3: { fontSize: FontSize.heading3_24, fontFamily: FontFamily.semi_bold },
  subtitle: { fontSize: FontSize.subtitle_20, fontFamily: FontFamily.medium },
  bodylarge: { fontSize: FontSize.bodylarge_18, fontFamily: FontFamily.regular },
  bodymedium: { fontSize: FontSize.bodymedium_16, fontFamily: FontFamily.regular },
  bodysmall: { fontSize: FontSize.bodysmall_14, fontFamily: FontFamily.regular },
  caption: { fontSize: FontSize.caption_12, fontFamily: FontFamily.regular },
} as const;
