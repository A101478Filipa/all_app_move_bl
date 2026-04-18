import * as React from "react";
import { Image } from "expo-image";
import { StyleSheet, View, Text } from 'react-native';
import { FontFamily } from '@src/styles/fonts';

export const LogoWithName = () => (
  <View style={styles.container}>
    <Image
      style={styles.logo}
      contentFit="cover"
      source={require("@assets/logo.png")}
    />
  <View style={styles.textContainer}>
    <Text style={styles.textMove}>Move</Text>
    <Text style={styles.textPlus}>+</Text>
  </View>
</View>
);

const styles = StyleSheet.create({
  container: {
    justifyContent: 'center',
    alignItems: 'center'
  },
  logo: {
    width: 48,
    height: 48,
    resizeMode: 'contain'
  },
  textContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 8,
  },
  textMove: {
    fontSize: 24,
    fontFamily: FontFamily.regular,
    color: "#000"
  },
  textPlus: {
    fontSize: 24,
    fontFamily: FontFamily.extraBold,
    color: "#000"
  },
});