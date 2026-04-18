import React from 'react';
import { StyleSheet, Pressable } from "react-native";
import { useNavigation } from '@react-navigation/native';
import { Color } from "@styles/colors";
import BackIcon from '@icons/generic-back-arrow.svg';

export const CustomBackButton = ({ navigation, tintColor, onPress }: {
  navigation?: any;
  tintColor?: string;
  onPress?: () => void;
}) => {
  const navigationHook = useNavigation();

  const handlePress = () => {
    if (onPress) {
      onPress();
    } else if (navigation) {
      navigation.goBack();
    } else {
      navigationHook.goBack();
    }
  };

  return (
    <Pressable
      style={styles.backButton}
      onPress={handlePress}
      hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
    >
      <BackIcon height={24} width={24} fill={tintColor || Color.Gray.v500} />
    </Pressable>
  );
};

const styles = StyleSheet.create({
  backButton: {
    height: 44,
    width: 44,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: -8,
  },
});
