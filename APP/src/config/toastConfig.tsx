import React from 'react';
import { BaseToast, ErrorToast, InfoToast } from 'react-native-toast-message';
import { Color } from '@src/styles/colors';
import { FontFamily, FontSize } from '@src/styles/fonts';
import { Border } from '@src/styles/borders';

export const toastConfig = {
  success: (props: any) => (
    <BaseToast
      {...props}
      style={{
        borderLeftColor: Color.Cyan.v300,
        borderLeftWidth: 5,
        backgroundColor: Color.white,
        borderRadius: Border.md_12,
        marginHorizontal: 16,
        paddingVertical: 12,
      }}
      contentContainerStyle={{
        paddingHorizontal: 15,
      }}
      text1Style={{
        fontSize: FontSize.bodymedium_16,
        fontFamily: FontFamily.bold,
        color: Color.black,
        lineHeight: 20,
      }}
      text2Style={{
        fontSize: FontSize.bodysmall_14,
        fontFamily: FontFamily.regular,
        color: Color.Gray.v500,
        lineHeight: 18,
      }}
      text2NumberOfLines={2}
    />
  ),

  error: (props: any) => (
    <ErrorToast
      {...props}
      style={{
        borderLeftColor: Color.Error.default,
        borderLeftWidth: 5,
        backgroundColor: Color.white,
        borderRadius: Border.md_12,
        marginHorizontal: 16,
        paddingVertical: 12,
      }}
      contentContainerStyle={{
        paddingHorizontal: 15,
      }}
      text1Style={{
        fontSize: FontSize.bodymedium_16,
        fontFamily: FontFamily.bold,
        color: Color.black,
        lineHeight: 20,
      }}
      text2Style={{
        fontSize: FontSize.bodysmall_14,
        fontFamily: FontFamily.regular,
        color: Color.Gray.v500,
        lineHeight: 18,
      }}
      text2NumberOfLines={2}
    />
  ),

  info: (props: any) => (
    <InfoToast
      {...props}
      style={{
        borderLeftColor: Color.Orange.v300,
        borderLeftWidth: 5,
        backgroundColor: Color.white,
        borderRadius: Border.md_12,
        marginHorizontal: 16,
        paddingVertical: 12,
      }}
      contentContainerStyle={{
        paddingHorizontal: 15,
      }}
      text1Style={{
        fontSize: FontSize.bodymedium_16,
        fontFamily: FontFamily.bold,
        color: Color.black,
        lineHeight: 20,
      }}
      text2Style={{
        fontSize: FontSize.bodysmall_14,
        fontFamily: FontFamily.regular,
        color: Color.Gray.v500,
        lineHeight: 18,
      }}
      text2NumberOfLines={2}
    />
  ),
};