import React, { FC } from 'react';
import { StyleSheet, ViewStyle } from 'react-native';
import { TouchableOpacity, Text, ActivityIndicator, View } from 'react-native';
import { Color } from '@src/styles/colors';
import { Border } from '@src/styles/borders';
import { FontFamily, FontSize } from '@src/styles/fonts';
import { Spacing } from '@src/styles/spacings';

interface ButtonProps {
  title: string,
  style?: ViewStyle,
  onPress: () => void,
  loading?: boolean,
  disabled?: boolean,
  icon?: React.ReactNode,
  paddingVertical?: number,
}

export const PrimaryButton: FC<ButtonProps> = ({ title, style, onPress, loading, disabled = false, icon, paddingVertical }) => {
  const isDisabled = loading || disabled;

  return (
    <TouchableOpacity
      style={[
        styles.mainButton,
        isDisabled && styles.disabledButton,
        paddingVertical !== undefined && { paddingVertical },
        style
      ]}
      onPress={isDisabled ? undefined : onPress}
      disabled={isDisabled}
    >
      {loading ? (
        <ActivityIndicator color={Color.white} />
      ) : (
        <View style={styles.buttonContent}>
          {icon && <View style={styles.iconContainer}>{icon}</View>}
          <Text style={[
            styles.mainButtonText,
            isDisabled && styles.disabledButtonText
          ]}>
            {title}
          </Text>
        </View>
      )}
    </TouchableOpacity>
  );
};

export const SecondaryButton: FC<ButtonProps> = ({ title, style, onPress, loading, icon, paddingVertical }) => {
  return (
    <TouchableOpacity
      style={[
        styles.secondaryButton,
        paddingVertical !== undefined && { paddingVertical },
        style
      ]}
      onPress={onPress}
      disabled={loading}
    >
      {loading ? (
        <ActivityIndicator color={Color.Gray.v500} />
      ) : (
        <View style={styles.buttonContent}>
          {icon && <View style={styles.iconContainer}>{icon}</View>}
          <Text style={styles.secondaryButtonText}>{title}</Text>
        </View>
      )}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  mainButton: {
    backgroundColor: Color.primary,
    borderRadius: Border.sm_8,
    paddingVertical: 24,
    paddingHorizontal: 24,
    justifyContent: 'center',
    alignItems: 'center',
    alignSelf: 'center',
    width: "100%",
    fontFamily: FontFamily.extraBold,
    fontSize: FontSize.bodymedium_16
  },
  mainButtonText: {
    color: Color.white,
    fontSize: FontSize.size_mini,
    fontFamily: FontFamily.extraBold,
    textAlign: 'center'
  },
  secondaryButton: {
    backgroundColor: Color.white,
    borderRadius: Border.sm_8,
    borderStyle: 'solid',
    borderColor: Color.secondary,
    borderWidth: 1,
    paddingVertical: 24,
    paddingHorizontal: 24,
    justifyContent: 'center',
    alignItems: 'center',
    alignSelf: 'center',
    width: "100%",
    fontFamily: FontFamily.extraBold,
    fontSize: FontSize.bodymedium_16
  },
  secondaryButtonText: {
    color: Color.Gray.v500,
    fontFamily: FontFamily.extraBold,
    fontSize: FontSize.size_mini,
    textAlign: "center",
  },
  disabledButton: {
    backgroundColor: Color.Gray.v200,
  },
  disabledButtonText: {
    color: Color.Gray.v400,
  },
  buttonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.sm_8,
  },
  iconContainer: {
    justifyContent: 'center',
    alignItems: 'center',
  }
});

