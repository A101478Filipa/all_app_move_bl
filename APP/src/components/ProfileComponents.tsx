import React, { useEffect, useRef, useState } from 'react';
import { Color } from '@src/styles/colors';
import { View, Text, TouchableOpacity, Animated, StyleSheet } from 'react-native';
import { HStack, Spacer, VStack } from '@components/CoreComponents';
import { FontFamily, FontSize } from '@src/styles/fonts';
import { Spacing } from '@src/styles/spacings';
import { Border } from '@src/styles/borders';
import { shadowStyles } from '../styles/shadow';
import { MaterialIcons } from '@expo/vector-icons';

// MARK: ExpandableRow
export const ExpandableRow: React.FC<{
  Icon?: React.FC<React.SVGProps<SVGSVGElement>>;
  title: string;
  description?: string;
  paddingHorizontal?: number;
  paddingBottom?: number;
  headerSpacing?: number;
  children: any;
}> = ({
  Icon,
  title,
  description,
  children,
  paddingHorizontal = Spacing.md_16,
  paddingBottom = Spacing.md_16,
  headerSpacing = Spacing.md_16,
}) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const rotation = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(rotation, {
      toValue: isExpanded ? 1 : 0,
      duration: 300,
      useNativeDriver: true,
    }).start();
  }, [isExpanded]);

  const rotate = rotation.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '180deg'],
  });

  const toggleIsExpanded = () => setIsExpanded(!isExpanded);

  return (
    <View style={styles.container}>
      <TouchableOpacity onPress={toggleIsExpanded} activeOpacity={0.8}>
        <HStack spacing={Spacing.md_16}>
          { Icon && <View style={styles.iconBackground}>
            <Icon width={36} height={36} fill={Color.Gray.v400} />
          </View> }

          <VStack align='flex-start' spacing={Spacing.xs_4}>
            <Text style={styles.title}>{title}</Text>
            { description && <Text style={styles.description}>{description}</Text> }
          </VStack>

          <Spacer/>

          <Animated.View style={{ transform: [{ rotate }] }}>
            <MaterialIcons name="keyboard-arrow-down" size={24} color={Color.Gray.v400} />
          </Animated.View>
        </HStack>
      </TouchableOpacity>

      {isExpanded && <View style={{
        paddingHorizontal,
        paddingBottom,
        paddingTop: headerSpacing,
      }} >{ children }</View> }
    </View>
  );
};

// MARK: PressableRow
export const PressableRow: React.FC<{
  Icon?: React.FC<React.SVGProps<SVGSVGElement>>;
  title: string;
  description?: string;
  onPress: () => void;
}> = ({ Icon, title, description, onPress }) => {
  return (
    <TouchableOpacity
      style={{ alignSelf: 'stretch' }}
      onPress={onPress}
    >
      <HStack spacing={Spacing.md_16} style={styles.container} >
        <View style={styles.iconBackground} >
          <Icon width={36} height={36} fill={Color.Gray.v400} />
        </View>

        <VStack align='flex-start' spacing={Spacing.xs_4}>
          <Text style={styles.title}>{title}</Text>
          { description && <Text style={styles.description}>{description}</Text> }
        </VStack>

        <Spacer/>

        <MaterialIcons name="chevron-right" size={24} color={Color.Gray.v400}/>
      </HStack>
    </TouchableOpacity>
  );
};

// MARK: Styles
const styles = StyleSheet.create({
  container: {
    ...shadowStyles.cardShadow,
    backgroundColor: Color.white,
    padding: Spacing.md_16,
    borderRadius: Border.lg_16,
    borderWidth: 1,
    borderColor: Color.Gray.v100,
    alignSelf: 'stretch',
  },
  iconBackground: {
    backgroundColor: Color.Cyan.v100,
    padding: Spacing.sm_8,
    borderRadius: Border.full,
  },
  title: {
    fontSize: FontSize.bodylarge_18,
    fontFamily: FontFamily.bold,
    color: Color.Gray.v500,
  },
  description: {
    fontSize: FontSize.bodymedium_16,
    fontFamily: FontFamily.regular,
    color: Color.Gray.v400,
  },
});