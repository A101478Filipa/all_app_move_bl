import React from 'react';
import { CustomBackButton } from '@components/CustomBackButton';
import { Color } from '@styles/colors';
import { NativeStackNavigationOptions } from '@react-navigation/native-stack';

export const getDefaultStackScreenOptions = (): NativeStackNavigationOptions => ({
  headerShadowVisible: false,
  headerBackVisible: false,
  headerLeft: ({ canGoBack, tintColor }) =>
    canGoBack ? (
      <CustomBackButton
        navigation={{ goBack: () => {} }}
        tintColor={tintColor}
      />
    ) : undefined,
  headerTintColor: Color.Gray.v500,
  headerStyle: {
    backgroundColor: Color.Background.subtle,
  },
  headerTitleStyle: {
    fontFamily: 'Urbanist-SemiBold',
    fontSize: 18,
    color: Color.Gray.v500,
  },
});

export const getScreenOptionsWithNavigation = (navigation: any): NativeStackNavigationOptions => ({
  ...getDefaultStackScreenOptions(),
  headerLeft: ({ canGoBack, tintColor }) =>
    canGoBack ? (
      <CustomBackButton
        navigation={navigation}
        tintColor={tintColor}
      />
    ) : undefined,
});
