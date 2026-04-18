import * as React from "react";
import { Image } from "expo-image";
import { StyleSheet, View } from "react-native";
import { Color } from "@src/styles/colors";
import { PrimaryButton, SecondaryButton } from "@components/ButtonComponents";
import { LogoWithName } from "@components/BrandingComponents";
import { VStack } from "@components/CoreComponents";

const WelcomeScreen = ({ navigation }) => {
  return (
    <View style={styles.root}>
      <Image
        style={styles.backgroundImage}
        contentFit="cover"
        source={require("@assets/img.png")}
      />

      <LogoWithName/>

      <VStack spacing={16} style={styles.buttonsContainer}>
        <PrimaryButton
          title= "Login"
          onPress= {() => navigation.push("Login")}
        />
        <SecondaryButton
          title="Register"
          onPress= {() => navigation.push("Register")}
        />
      </VStack>
    </View>
  );
};

const styles = StyleSheet.create({
  root: {
    flex: 1,
    width: '100%',
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
    backgroundColor: Color.white,
    marginTop: -10,
    gap: 16
  },
  backgroundImage: {
    flex: 2,
    width: '100%',
  },
  buttonsContainer: {
    flex: 1,
    width: '100%',
    paddingHorizontal: 24
  }
});

export default WelcomeScreen;