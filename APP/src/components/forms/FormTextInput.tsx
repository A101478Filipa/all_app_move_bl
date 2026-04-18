import React from 'react';
import { View, Text, TextInput, StyleSheet, TextInputProps } from 'react-native';
import { Color } from '@src/styles/colors';
import { FontFamily, FontSize } from '@src/styles/fonts';
import { Spacing } from '@src/styles/spacings';
import { Border } from '@src/styles/borders';

interface FormTextInputProps extends TextInputProps {
  title: string;
  placeholder: string;
  required?: boolean;
  multiline?: boolean;
  numberOfLines?: number;
}

export const FormTextInput: React.FC<FormTextInputProps> = ({
  title,
  placeholder,
  required = false,
  multiline = false,
  numberOfLines = 1,
  style,
  ...textInputProps
}) => {
  return (
    <View style={styles.inputGroup}>
      <Text style={styles.label}>
        {title}
        {required && <Text style={styles.required}> *</Text>}
      </Text>

      <TextInput
        style={[
          styles.input,
          multiline && styles.textArea,
          style
        ]}
        placeholder={placeholder}
        placeholderTextColor={Color.Gray.v400}
        multiline={multiline}
        numberOfLines={multiline ? numberOfLines : 1}
        textAlignVertical={multiline ? 'top' : 'center'}
        {...textInputProps}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  inputGroup: {
    width: '100%',
  },
  label: {
    fontSize: FontSize.bodymedium_16,
    fontFamily: FontFamily.semi_bold,
    color: Color.dark,
    marginBottom: Spacing.xs_4,
  },
  required: {
    fontSize: FontSize.bodymedium_16,
    fontFamily: FontFamily.semi_bold,
    color: Color.Error.default,
  },
  input: {
    borderWidth: 1,
    borderColor: Color.Gray.v200,
    borderRadius: Border.sm_8,
    paddingHorizontal: Spacing.md_16,
    paddingVertical: Spacing.sm_8,
    fontSize: FontSize.bodymedium_16,
    fontFamily: FontFamily.regular,
    color: Color.dark,
    backgroundColor: Color.Background.white,
  },
  textArea: {
    minHeight: 100,
  },
});
