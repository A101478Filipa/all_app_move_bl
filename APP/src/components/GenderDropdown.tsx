import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Modal, FlatList } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { Color } from '@src/styles/colors';
import { FontFamily, FontSize } from '@src/styles/fonts';
import { Spacing } from '@src/styles/spacings';

export interface GenderOption {
  label: string;
  value: 'MALE' | 'FEMALE' | 'OTHER';
}

interface GenderDropdownProps {
  label: string;
  value: string;
  onValueChange: (value: 'MALE' | 'FEMALE' | 'OTHER') => void;
  options: GenderOption[];
  hasError?: boolean;
}

export const GenderDropdown: React.FC<GenderDropdownProps> = ({
  label,
  value,
  onValueChange,
  options,
  hasError = false,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [isFocused, setIsFocused] = useState(false);

  const selectedOption = options.find(option => option.value === value);
  const hasValue = !!value;

  const handleSelect = (optionValue: 'MALE' | 'FEMALE' | 'OTHER') => {
    onValueChange(optionValue);
    setIsOpen(false);
    setIsFocused(false);
  };

  const renderOption = ({ item }: { item: GenderOption }) => {
    const isSelected = item.value === value;

    return (
      <TouchableOpacity
        style={[styles.optionItem, isSelected && styles.selectedOption]}
        onPress={() => handleSelect(item.value)}
        activeOpacity={0.7}
      >
        <Text style={[styles.optionText, isSelected && styles.selectedOptionText]}>
          {item.label}
        </Text>
        {isSelected && (
          <MaterialIcons name="check" size={20} color={Color.primary} />
        )}
      </TouchableOpacity>
    );
  };

  return (
    <View style={styles.container}>
      <TouchableOpacity
        style={[
          styles.inputContainer,
          (isFocused || isOpen) && styles.inputFocused,
          hasError && styles.inputError,
        ]}
        onPress={() => {
          setIsOpen(true);
          setIsFocused(true);
        }}
        activeOpacity={1}
      >
        <Text
          style={[
            styles.label,
            (hasValue || isFocused || isOpen) && styles.labelFloating,
            (isFocused || isOpen) && styles.labelFocused,
            hasError && styles.labelError,
          ]}
        >
          {label}
        </Text>

        {hasValue && (
          <Text style={styles.valueText}>{selectedOption?.label}</Text>
        )}

        <MaterialIcons
          name={isOpen ? "arrow-drop-up" : "arrow-drop-down"}
          size={24}
          color={hasError ? Color.Error.default : Color.Gray.v400}
          style={styles.icon}
        />
      </TouchableOpacity>

      <Modal
        visible={isOpen}
        transparent
        animationType="fade"
        onRequestClose={() => {
          setIsOpen(false);
          setIsFocused(false);
        }}
      >
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => {
            setIsOpen(false);
            setIsFocused(false);
          }}
        >
          <View style={styles.modalContent}>
            <View style={styles.optionsContainer}>
              <FlatList
                data={options}
                renderItem={renderOption}
                keyExtractor={(item) => item.value}
                scrollEnabled={false}
              />
            </View>
          </View>
        </TouchableOpacity>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    width: '100%',
  },
  inputContainer: {
    borderWidth: 1,
    borderColor: Color.Gray.v200,
    borderRadius: Spacing.sm_8,
    paddingHorizontal: Spacing.lg_24,
    paddingTop: Spacing.lg_24 + Spacing.sm_8,
    paddingBottom: Spacing.sm_12,
    backgroundColor: Color.white,
    position: 'relative',
    minHeight: 56,
    justifyContent: 'center',
  },
  inputFocused: {
    borderColor: Color.primary,
  },
  inputError: {
    borderColor: Color.Error.default,
  },
  label: {
    position: 'absolute',
    left: Spacing.lg_24,
    top: 18, // Vertically centered: (56 - 16) / 2 + 1 for visual balance
    fontFamily: FontFamily.medium,
    fontSize: FontSize.bodymedium_16,
    color: Color.Gray.v400,
    backgroundColor: Color.white,
    paddingHorizontal: 0,
  },
  labelFloating: {
    top: Spacing.sm_8,
    fontSize: FontSize.bodysmall_14,
  },
  labelFocused: {
    color: Color.primary,
  },
  labelError: {
    color: Color.Error.default,
  },
  valueText: {
    fontFamily: FontFamily.medium,
    fontSize: FontSize.bodymedium_16,
    color: Color.black,
  },
  icon: {
    position: 'absolute',
    right: Spacing.md_16,
    top: 16,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    width: '80%',
    maxWidth: 400,
    backgroundColor: Color.white,
    borderRadius: Spacing.md_16,
    overflow: 'hidden',
  },
  optionsContainer: {
    maxHeight: 300,
  },
  optionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: Spacing.md_16,
    paddingHorizontal: Spacing.lg_24,
    borderBottomWidth: 1,
    borderBottomColor: Color.Gray.v200,
  },
  selectedOption: {
    backgroundColor: Color.Background.muted,
  },
  optionText: {
    fontFamily: FontFamily.regular,
    fontSize: FontSize.bodymedium_16,
    color: Color.black,
    flex: 1,
  },
  selectedOptionText: {
    fontFamily: FontFamily.semi_bold,
    color: Color.primary,
  },
});
