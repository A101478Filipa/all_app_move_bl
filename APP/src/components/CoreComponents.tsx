import React from 'react';
import { View, StyleSheet, ViewStyle, FlexStyle, FlexAlignType } from 'react-native';
import { FC } from 'react';

interface StackProps {
  children: React.ReactNode,
  style?: ViewStyle,
  spacing?: number,
  align?: FlexAlignType
}

export const VStack: FC<StackProps> = ({ children, style, spacing = 0, align = 'center', ...props }) => {
  return (
    <View
      onStartShouldSetResponder={() => false}
  onStartShouldSetResponderCapture={() => false}
      style={[
        {
          flexDirection: 'column',
          alignItems: align
        },
        style,
        { gap: spacing }
      ]}
      {...props}
    >
      {children}
    </View>
  );
};

export const HStack: FC<StackProps> = ({ children, style, spacing = 0, align = 'center', ...props }) => {
  return (
    <View
      style={[
        {
          flexDirection: 'row',
          alignItems: align
        },
        style,
        { gap: spacing }
      ]}
      {...props}
    >
      {children}
    </View>
  );
};

export const ZStack = ({ children, style, ...props }) => {
  return (
    <View
      style={[
        StyleSheet.absoluteFillObject,
        { position: 'relative' },
        style
      ]}
      {...props}
    >
      {React.Children.map(children, (child, index) =>
        React.cloneElement(child, {
          style: [
            child.props.style,
            { position: 'absolute', top: 0, left: 0 }
          ]
        })
      )}
    </View>
  );
};

export const Spacer = ({ flex = 1 }) => <View style={{ flex }}/>;

interface SpacedProps {
  height?: number;
  width?: number;
}

export const Spaced: FC<SpacedProps> = ({ height, width }) => {
  return <View style={{ height, width }} />;
};