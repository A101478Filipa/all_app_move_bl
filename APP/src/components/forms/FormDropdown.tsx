import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Modal, FlatList, Animated, Dimensions, Platform } from 'react-native';
import { Color } from '@src/styles/colors';
import { FontFamily, FontSize } from '@src/styles/fonts';
import { Spacing } from '@src/styles/spacings';
import { Border } from '@src/styles/borders';
import { useTranslation } from 'react-i18next';

const { height: screenHeight } = Dimensions.get('window');

export interface DropdownOption<T> {
  label: string;
  value: T;
}

interface FormDropdownProps<T> {
  title: string;
  placeholder: string;
  value: T;
  onValueChange: (value: T) => void;
  options: DropdownOption<T>[];
  required?: boolean;
}

export const FormDropdown = <T,>({
  title,
  placeholder,
  value,
  onValueChange,
  options,
  required = false,
}: FormDropdownProps<T>) => {
  const [isVisible, setIsVisible] = useState(false);
  const [slideAnim] = useState(new Animated.Value(screenHeight));
  const { t } = useTranslation();

  const selectedOption = options.find(option => option.value === value);

  const showModal = () => {
    setIsVisible(true);
    Animated.spring(slideAnim, {
      toValue: 0,
      useNativeDriver: true,
      tension: 65,
      friction: 11,
    }).start();
  };

  const hideModal = () => {
    Animated.timing(slideAnim, {
      toValue: screenHeight,
      duration: 250,
      useNativeDriver: true,
    }).start(() => {
      setIsVisible(false);
    });
  };

  const handleOptionSelect = (optionValue: T) => {
    onValueChange(optionValue);
    hideModal();
  };

  const renderOption = ({ item, index }: { item: DropdownOption<T>; index: number }) => (
    <TouchableOpacity
      style={[
        styles.option,
        item.value === value && styles.selectedOption,
        index === 0 && styles.firstOption,
        index === options.length - 1 && styles.lastOption,
      ]}
      onPress={() => handleOptionSelect(item.value)}
      activeOpacity={0.7}
    >
      <Text style={[
        styles.optionText,
        item.value === value && styles.selectedOptionText
      ]}>
        {item.label}
      </Text>
      {item.value === value && (
        <Text style={styles.checkmark}>✓</Text>
      )}
    </TouchableOpacity>
  );

  return (
    <View style={styles.inputGroup}>
      <Text style={styles.label}>
        {title}
        {required && <Text style={styles.required}> *</Text>}
      </Text>

      <TouchableOpacity
        style={styles.input}
        onPress={showModal}
        activeOpacity={0.7}
      >
        <Text style={[
          styles.inputText,
          !selectedOption && styles.placeholderText
        ]}>
          {selectedOption ? selectedOption.label : placeholder}
        </Text>

        <Text style={styles.arrow}>▼</Text>
      </TouchableOpacity>

      <Modal
        visible={isVisible}
        transparent={true}
        animationType="none"
        onRequestClose={hideModal}
        statusBarTranslucent={true}
      >
        <View style={styles.modalOverlay}>
          <TouchableOpacity
            style={styles.backdrop}
            activeOpacity={1}
            onPress={hideModal}
          />

          <Animated.View
            style={[
              styles.bottomSheet,
              {
                transform: [{ translateY: slideAnim }]
              }
            ]}
          >
            <View style={styles.handle} />

            <View style={styles.sheetHeader}>
              <Text style={styles.sheetTitle}>{title}</Text>
              <TouchableOpacity
                style={styles.doneButton}
                onPress={hideModal}
              >
                <Text style={styles.doneButtonText}>{t('common.done')}</Text>
              </TouchableOpacity>
            </View>

            <FlatList
              data={options}
              renderItem={renderOption}
              keyExtractor={(item) => String(item.value)}
              extraData={value}
              style={styles.optionsList}
              showsVerticalScrollIndicator={false}
              bounces={false}
            />
          </Animated.View>
        </View>
      </Modal>
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
    backgroundColor: Color.Background.white,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  inputText: {
    fontSize: FontSize.bodymedium_16,
    fontFamily: FontFamily.regular,
    color: Color.dark,
    flex: 1,
  },
  placeholderText: {
    color: Color.Gray.v400,
  },
  arrow: {
    fontSize: FontSize.bodysmall_14,
    color: Color.Gray.v400,
    marginLeft: Spacing.sm_8,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.4)',
    justifyContent: 'flex-end',
  },
  backdrop: {
    flex: 1,
  },
  bottomSheet: {
    backgroundColor: Color.Background.white,
    borderTopLeftRadius: Border.lg_16,
    borderTopRightRadius: Border.lg_16,
    maxHeight: screenHeight * 0.6,
    paddingBottom: Platform.OS === 'ios' ? 34 : Spacing.md_16,
  },
  handle: {
    width: 40,
    height: 4,
    backgroundColor: Color.Gray.v300,
    borderRadius: 2,
    alignSelf: 'center',
    marginTop: Spacing.sm_8,
    marginBottom: Spacing.md_16,
  },
  sheetHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: Spacing.lg_24,
    paddingBottom: Spacing.md_16,
    borderBottomWidth: 1,
    borderBottomColor: Color.Gray.v100,
  },
  sheetTitle: {
    fontSize: FontSize.bodylarge_18,
    fontFamily: FontFamily.semi_bold,
    color: Color.dark,
  },
  doneButton: {
    paddingHorizontal: Spacing.md_16,
    paddingVertical: Spacing.sm_8,
  },
  doneButtonText: {
    fontSize: FontSize.bodymedium_16,
    fontFamily: FontFamily.medium,
    color: Color.primary,
  },
  optionsList: {
    paddingHorizontal: Spacing.lg_24,
  },
  option: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: Spacing.md_16,
    borderBottomWidth: 1,
    borderBottomColor: Color.Gray.v100,
  },
  firstOption: {
    borderTopWidth: 0,
  },
  lastOption: {
    borderBottomWidth: 0,
  },
  selectedOption: {
    backgroundColor: 'transparent',
  },
  optionText: {
    fontSize: FontSize.bodymedium_16,
    fontFamily: FontFamily.regular,
    color: Color.dark,
    flex: 1,
  },
  selectedOptionText: {
    color: Color.primary,
    fontFamily: FontFamily.medium,
  },
  checkmark: {
    fontSize: FontSize.bodymedium_16,
    fontFamily: FontFamily.medium,
    color: Color.primary,
    marginLeft: Spacing.sm_8,
  },
});
