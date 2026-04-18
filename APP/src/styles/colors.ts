type HexColor = `#${string}` | 'transparent';

interface ColorVariants {
  v100: HexColor;
  v200: HexColor;
  v300: HexColor;
  v400: HexColor;
  v500: HexColor;
}

interface BackgroundColors {
  white: HexColor;
  muted: HexColor;
  cyanTint: HexColor;
  orangeTint: HexColor;
  subtle: HexColor;
}

interface ErrorColors {
  default: HexColor;
  dark: HexColor;
}

interface WarningColors {
  orange: HexColor;
  amber: HexColor;
  yellow: HexColor;
}

interface SemanticColors {
  measurements: HexColor;
  medication: HexColor;
  pathology: HexColor;
}

interface Colors {
  readonly colorAliceblue: HexColor;
  readonly gray1: HexColor;
  readonly gray: HexColor;
  readonly dark: HexColor;
  readonly colorGray_100: HexColor;
  readonly colorWhitesmoke: HexColor;
  readonly darkGray: HexColor;

  readonly transparent: HexColor;
  readonly white: HexColor;
  readonly black: HexColor;
  readonly primary: HexColor;
  readonly secondary: HexColor;

  readonly Cyan: ColorVariants;
  readonly Blue: ColorVariants;
  readonly Orange: ColorVariants;
  readonly Gray: ColorVariants;
  readonly Background: BackgroundColors;
  readonly Error: ErrorColors;
  readonly Warning: WarningColors;
  readonly Semantic: SemanticColors;
}

const Cyan: ColorVariants = {
  v100: "#D1F2F2",
  v200: "#8BE2E1",
  v300: "#35C2C1",
  v400: "#2A9E9D",
  v500: "#1E7B7A",
} as const;

const Blue: ColorVariants = {
  v100: "#D1E1FF",
  v200: "#A4C8FF",
  v300: "#7AAFFF",
  v400: "#4F97FF",
  v500: "#007BFF",
} as const;

const Orange: ColorVariants = {
  v100: "#FFE8DE", // Light but solid, peachy
  v200: "#FBBFA8", // Soft orange-tan
  v300: "#E57E58", // Your original color (kept)
  v400: "#BF5632", // Rich burnt orange
  v500: "#8D3519", // Deep terracotta
} as const;

const Gray: ColorVariants = {
  v100: "#F5F5F5",
  v200: "#E0E0E0",
  v300: "#BDBDBD",
  v400: "#757575",
  v500: "#424242",
} as const;

const Background: BackgroundColors = {
  white: "#FFFFFF",
  muted: "#FAFAFA",
  cyanTint: "#E6F7F7",
  orangeTint: "#FFF1EC",
  subtle: "#F5F5F5",
} as const;

const Error: ErrorColors = {
  default: "#FF4C4C",
  dark: "#D32F2F",
} as const;

const Warning: WarningColors = {
  orange: "#FFA500",
  amber: "#FFC107",
  yellow: "#FFEB3B",
} as const;

// Semantic colors for specific app features
const Semantic: SemanticColors = {
  measurements: "#f44336", // Material Red 500 - Health monitoring/vital signs
  medication: "#2196f3",   // Material Blue 500 - Medical treatment/prescriptions
  pathology: "#ff9800",    // Material Orange 500 - Medical conditions/hospital care
} as const;

export const Color: Colors = {
  // TODO: Legacy colors, remove after refactoring
  colorAliceblue: "#e8ecf4",
  gray1: "#8391a1",
  gray: "#838ba1",
  dark: "#1e232c",
  colorGray_100: "#032426",
  colorWhitesmoke: "#f7f8f9",
  darkGray: "#6a707c",

  // Core colors
  transparent: 'transparent',
  white: "#fff",
  black: "#000",
  primary: Cyan.v300,
  secondary: Orange.v300,

  Cyan,
  Blue,
  Orange,
  Gray,
  Background,
  Error,
  Warning,
  Semantic,
} as const;
