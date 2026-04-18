import * as React from "react";
import { StyleSheet, View, Text, Pressable } from "react-native";
import { Image } from "expo-image";
import { useNavigation } from "@react-navigation/native";
import { Color } from "@src/styles/colors";
import { FontSize, FontFamily } from "@src/styles/fonts";
import { Border } from "@src/styles/borders";

const PasswordChanged = () => {
  const navigation = useNavigation();

  return (
    <View style={styles.passwordChanged}>
      <Pressable
        style={[styles.backToLoginButton, styles.backLayout]}
        onPress={() => navigation.navigate("Login")}
      >
        <View
          style={[
            styles.backToLoginButtonChild,
            styles.passwordChanged1Position,
          ]}
        />
        <Text style={[styles.backToLogin, styles.passwordFlexBox]}>
          Back to Login
        </Text>
      </Pressable>
      <View style={styles.text}>
        <Text style={[styles.yourPasswordHas, styles.passwordFlexBox]}>
          Your password has been changed successfully.
        </Text>
        <Text style={[styles.passwordChanged1, styles.passwordFlexBox]}>
          Password Changed!
        </Text>
      </View>
      <Image
        style={styles.successmarkIcon}
        contentFit="cover"
        source={require("@assets/successmark.png")}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  backLayout: {
    height: 56,
    width: 331,
    position: "absolute",
  },
  passwordChanged1Position: {
    left: 0,
    top: 0,
  },
  passwordFlexBox: {
    textAlign: "center",
    position: "absolute",
  },
  backToLoginButtonChild: {
    borderRadius: Border.br_5xs,
    backgroundColor: Color.primary,
    height: 56,
    width: 331,
    position: "absolute",
  },
  backToLogin: {
    top: 19,
    left: 120,
    fontWeight: "800",
    fontFamily: FontFamily.urbanistExtraBold,
    color: Color.white,
    fontSize: FontSize.size_mini,
    textAlign: "center",
  },
  backToLoginButton: {
    top: 508,
    left: 22,
  },
  yourPasswordHas: {
    top: 39,
    left: 3,
    lineHeight: 23,
    fontWeight: "500",
    fontFamily: FontFamily.urbanistMedium,
    color: Color.gray1,
    width: 226,
    fontSize: FontSize.size_mini,
    textAlign: "center",
  },
  passwordChanged1: {
    fontSize: 26,
    fontWeight: "700",
    fontFamily: FontFamily.urbanistBold,
    color: Color.dark,
    left: 0,
    top: 0,
  },
  text: {
    top: 383,
    left: 81,
    width: 232,
    height: 85,
    position: "absolute",
  },
  successmarkIcon: {
    top: 232,
    left: 138,
    width: 100,
    height: 100,
    position: "absolute",
    overflow: "hidden",
  },
  passwordChanged: {
    backgroundColor: Color.white,
    flex: 1,
    width: "100%",
    height: 852,
    overflow: "hidden",
  },
});

export default PasswordChanged;
