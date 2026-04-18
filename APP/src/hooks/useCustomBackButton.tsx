import React, { useLayoutEffect } from 'react';
import { useNavigation } from '@react-navigation/native';
import { CustomBackButton } from '../components/CustomBackButton';

/**
 * Hook to set up custom back button for a screen
 * Usage: useCustomBackButton(); in any screen component
 */
export const useCustomBackButton = (onPress?: () => void) => {
  const navigation = useNavigation();

  useLayoutEffect(() => {
    navigation.setOptions({
      headerLeft: ({ tintColor, canGoBack }) => 
        canGoBack ? <CustomBackButton tintColor={tintColor} onPress={onPress} /> : undefined,
      headerBackVisible: false,
    });
  }, [navigation, onPress]);
};
