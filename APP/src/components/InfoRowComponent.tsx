import React from 'react';
import { Color } from '@src/styles/colors';
import { View, Text } from 'react-native';
import { HStack, VStack } from '@components/CoreComponents';
import { Spacing } from '@src/styles/spacings';
import { FontFamily, FontSize } from '../styles/fonts';
import { MaterialIcons } from '@expo/vector-icons';

interface InfoRowComponentProps {
  iconName: keyof typeof MaterialIcons.glyphMap;
  title: string;
  value: string;
  isLast?: boolean;
  iconColor?: string;
  iconSize?: number;
}

const InfoRowComponent: React.FC<InfoRowComponentProps> = ({
  iconName,
  title,
  value,
  isLast = false,
  iconColor = Color.Gray.v400,
  iconSize = 20
}) => {
  return (
    <VStack style={{ alignSelf: 'stretch' }}>
      <HStack spacing={Spacing.sm_8} align='flex-start' style={{
        alignSelf: 'stretch',
        paddingHorizontal: Spacing.sm_8,
        paddingVertical: Spacing.sm_8,
      }}>
        <MaterialIcons name={iconName} size={iconSize} color={iconColor} />
        <VStack spacing={Spacing.xs_4} style={{ flex: 1 }}>
          <Text style={{
            fontFamily: FontFamily.bold,
            fontSize: FontSize.bodylarge_18,
            color: Color.Gray.v500,
            alignSelf: 'flex-start',
          }}>{title}</Text>
          <Text style={{
            fontFamily: FontFamily.medium,
            fontSize: FontSize.bodymedium_16,
            color: Color.Gray.v500,
            alignSelf: 'flex-start',
          }}>{value}</Text>
        </VStack>
      </HStack>

      {!isLast && <View style={{
        alignSelf: 'stretch',
        height: 1,
        flex: 1,
        backgroundColor: Color.Gray.v200
      }}/>}
    </VStack>
  );
};

export default InfoRowComponent