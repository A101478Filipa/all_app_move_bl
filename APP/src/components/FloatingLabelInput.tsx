import React, { useState, useRef, useEffect } from 'react';
import { StyleSheet, TextInput, View, Animated, TextInputProps } from 'react-native';
import { Color } from '@src/styles/colors';
import { Spacing } from '@src/styles/spacings';
import { FontFamily, FontSize } from '@src/styles/fonts';
import { Border } from '@src/styles/borders';

interface FloatingLabelInputProps extends TextInputProps {
  label: string;
  value: string;
  onChangeText: (text: string) => void;
  hasError?: boolean;
}

export const FloatingLabelInput: React.FC<FloatingLabelInputProps> = ({
  label,
  value,
  onChangeText,
  hasError = false,
  ...props
}) => {
  const [isFocused, setIsFocused] = useState(false);
  const animatedValue = useRef(new Animated.Value(value ? 1 : 0)).current;

  useEffect(() => {
    Animated.timing(animatedValue, {
      toValue: isFocused || value ? 1 : 0,
      duration: 200,
      useNativeDriver: false,
    }).start();
  }, [isFocused, value, animatedValue]);

  const labelTop = animatedValue.interpolate({
    inputRange: [0, 1],
    outputRange: [Spacing.lg_24, Spacing.sm_8],
  });

  const labelFontSize = animatedValue.interpolate({
    inputRange: [0, 1],
    outputRange: [FontSize.bodymedium_16, FontSize.bodysmall_14],
  });

  const getLabelColor = () => {
    if (hasError) return Color.Error.default;
    if (isFocused) return Color.primary;
    return Color.Gray.v400;
  };

  const labelStyle = {
    position: 'absolute' as const,
    left: Spacing.lg_24,
    top: labelTop,
    fontSize: labelFontSize,
    color: getLabelColor(),
    fontFamily: FontFamily.medium,
  };

  const borderColor = hasError
    ? Color.Error.default
    : isFocused
    ? Color.primary
    : Color.Gray.v200;

  return (
    <View style={styles.container}>
      <TextInput
        {...props}
        style={[
          styles.input,
          { borderColor },
          (isFocused || value) && styles.inputWithLabel,
        ]}
        value={value}
        onChangeText={onChangeText}
        onFocus={(e) => {
          setIsFocused(true);
          props.onFocus?.(e);
        }}
        onBlur={(e) => {
          setIsFocused(false);
          props.onBlur?.(e);
        }}
      />
      <View style={styles.labelContainer} pointerEvents="none">
        <Animated.Text style={labelStyle}>
          {label}
        </Animated.Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'relative',
    width: '100%',
  },
  labelContainer: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: 0,
    bottom: 0,
  },
  input: {
    paddingHorizontal: Spacing.lg_24,
    paddingTop: Spacing.lg_24 + Spacing.sm_8,
    paddingBottom: Spacing.sm_12,
    backgroundColor: Color.white,
    color: Color.black,
    fontFamily: FontFamily.medium,
    fontSize: FontSize.bodymedium_16,
    borderRadius: Border.sm_8,
    borderWidth: 1,
    width: '100%',
  },
  inputWithLabel: {
  },
});
