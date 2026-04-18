import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Modal,
  TouchableWithoutFeedback,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { Color } from '@src/styles/colors';
import { FontFamily, FontSize } from '@src/styles/fonts';
import { Spacing } from '@src/styles/spacings';
import { Border } from '@src/styles/borders';
import { shadowStyles } from '@src/styles/shadow';
import { MemberSortOption, SortDirection } from '@src/types/InstitutionSortOption';
import { useTranslation } from '@src/localization/hooks/useTranslation';

interface SortModalProps {
  visible: boolean;
  currentSort: MemberSortOption;
  currentDirection: SortDirection;
  onClose: () => void;
  onSelectSort: (option: MemberSortOption) => void;
  allowedOptions?: MemberSortOption[];
}

export const SortModal: React.FC<SortModalProps> = ({
  visible,
  currentSort,
  currentDirection,
  onClose,
  onSelectSort,
  allowedOptions,
}) => {
  const { t } = useTranslation();

  const allSortOptions = [
    {
      value: MemberSortOption.NAME,
      label: t('members.sortName'),
      icon: 'sort-by-alpha' as const,
    },
    {
      value: MemberSortOption.AGE,
      label: t('members.sortAge'),
      icon: 'event' as const,
    },
    {
      value: MemberSortOption.ROLE,
      label: t('members.sortRole'),
      icon: 'badge' as const,
    },
    {
      value: MemberSortOption.FALL_RISK,
      label: t('members.sortFallRisk'),
      icon: 'warning' as const,
    },
    {
      value: MemberSortOption.FLOOR,
      label: t('members.sortFloor'),
      icon: 'layers' as const,
    },
  ];

  const sortOptions = allowedOptions
    ? allSortOptions.filter((o) => allowedOptions.includes(o.value))
    : allSortOptions;

  const handleSelect = (option: MemberSortOption) => {
    onSelectSort(option);
    onClose();
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <TouchableWithoutFeedback onPress={onClose}>
        <View style={styles.overlay}>
          <TouchableWithoutFeedback>
            <View style={styles.container}>
              <View style={styles.header}>
                <Text style={styles.title}>{t('members.sortBy')}</Text>
                <TouchableOpacity onPress={onClose} style={styles.closeButton}>
                  <MaterialIcons name="close" size={24} color={Color.Gray.v400} />
                </TouchableOpacity>
              </View>

              <View style={styles.optionsList}>
                {sortOptions.map((option) => {
                  const isSelected = currentSort === option.value;
                  const showArrow = isSelected;
                  const arrowIcon = currentDirection === SortDirection.ASC ? 'arrow-upward' : 'arrow-downward';

                  return (
                    <TouchableOpacity
                      key={option.value}
                      style={[
                        styles.option,
                        isSelected && styles.selectedOption,
                      ]}
                      onPress={() => handleSelect(option.value)}
                    >
                      <MaterialIcons
                        name={option.icon}
                        size={24}
                        color={isSelected ? Color.primary : Color.Gray.v400}
                      />
                      <Text
                        style={[
                          styles.optionText,
                          isSelected && styles.selectedOptionText,
                        ]}
                      >
                        {option.label}
                      </Text>
                      {showArrow && (
                        <MaterialIcons
                          name={arrowIcon}
                          size={24}
                          color={Color.primary}
                          style={styles.arrowIcon}
                        />
                      )}
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>
          </TouchableWithoutFeedback>
        </View>
      </TouchableWithoutFeedback>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  container: {
    backgroundColor: Color.white,
    borderRadius: Border.lg_16,
    width: '85%',
    maxWidth: 400,
    ...shadowStyles.cardShadow,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: Spacing.md_16,
    borderBottomWidth: 1,
    borderBottomColor: Color.Gray.v100,
  },
  title: {
    fontSize: FontSize.bodylarge_18,
    fontFamily: FontFamily.bold,
    color: Color.Gray.v500,
  },
  closeButton: {
    padding: Spacing.xs_4,
  },
  optionsList: {
    padding: Spacing.sm_8,
  },
  option: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: Spacing.md_16,
    borderRadius: Border.sm_8,
    marginVertical: Spacing.xs_4,
  },
  selectedOption: {
    backgroundColor: Color.Background.subtle,
  },
  optionText: {
    fontSize: FontSize.bodymedium_16,
    fontFamily: FontFamily.regular,
    color: Color.Gray.v400,
    marginLeft: Spacing.md_16,
    flex: 1,
  },
  selectedOptionText: {
    fontFamily: FontFamily.medium,
    color: Color.primary,
  },
  arrowIcon: {
    marginLeft: Spacing.sm_8,
  },
});
