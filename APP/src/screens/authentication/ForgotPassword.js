import * as React from "react";
import { StyleSheet, View, Text, Pressable } from "react-native";
import { Image } from "expo-image";
import { useNavigation } from "@react-navigation/native";
import { Color } from "@src/styles/colors";
import { FontSize, FontFamily } from "@src/styles/fonts";
import { Border } from "@src/styles/borders";

const ForgotPassword = () => {
  const navigation = useNavigation();

  return (
    <View style={styles.forgotPassword}>
      <View style={styles.sendCodeButton}>
        <View style={styles.sendCodeButtonChild} />
        <Text style={[styles.sendCode, styles.text1Typo]}>Send Code</Text>
      </View>
      <View style={[styles.enterYourEmailInput, styles.enterLayout]}>
        <View style={[styles.enterYourEmailInputChild, styles.childBorder]} />
        <Text style={[styles.enterYourEmail, styles.dontWorryItFlexBox]}>
          Enter your email
        </Text>
      </View>
      <View style={styles.text}>
        <Text style={[styles.welcomeBackGlad, styles.loginTypo]}>
          Forgot Password?
        </Text>
        <Text style={[styles.dontWorryIt, styles.dontWorryItFlexBox]}>
          Don't worry! It occurs. Please enter the email address linked with
          your account.
        </Text>
      </View>
      <Pressable
        style={[styles.back, styles.backLayout]}
        onPress={() => navigation.navigate("Login")}
      >
        <View style={[styles.backChild, styles.backLayout]} />
        <Image
          style={styles.backArrowIcon}
          contentFit="cover"
          source={require("@assets/back-arrow.png")}
        />
      </Pressable>
      <Pressable
        style={styles.rememberPasswordLoginContainer}
        onPress={() => navigation.navigate("Login")}
      >
        <Text style={[styles.text1, styles.text1Typo]}>
          <Text style={styles.rememberPassword}>{`Remember Password? `}</Text>
          <Text style={[styles.login, styles.loginTypo]}>Login</Text>
        </Text>
      </Pressable>
    </View>
  );
};

const styles = StyleSheet.create({
  text1Typo: {
    textAlign: "center",
    fontSize: FontSize.size_mini,
  },
  enterLayout: {
    height: 56,
    width: 348,
    position: "absolute",
  },
  childBorder: {
    borderWidth: 1,
    borderColor: Color.colorAliceblue,
    borderStyle: "solid",
    left: 0,
    top: 0,
  },
  dontWorryItFlexBox: {
    textAlign: "left",
    position: "absolute",
  },
  loginTypo: {
    fontFamily: FontFamily.urbanistBold,
    fontWeight: "700",
  },
  backLayout: {
    height: 41,
    width: 41,
    position: "absolute",
  },
  sendCodeButtonChild: {
    height: "100%",
    top: "0%",
    right: "0%",
    bottom: "0%",
    left: "0%",
    backgroundColor: Color.primary,
    borderRadius: Border.br_5xs,
    position: "absolute",
    width: "100%",
  },
  sendCode: {
    top: 21,
    left: 127,
    fontWeight: "800",
    fontFamily: FontFamily.urbanistExtraBold,
    color: Color.white,
    position: "absolute",
  },
  sendCodeButton: {
    height: "6.9%",
    width: "88.27%",
    top: "42.84%",
    right: "5.85%",
    bottom: "50.26%",
    left: "5.88%",
    position: "absolute",
  },
  enterYourEmailInputChild: {
    backgroundColor: Color.colorWhitesmoke,
    height: 56,
    width: 348,
    position: "absolute",
    borderRadius: Border.br_5xs,
  },
  enterYourEmail: {
    top: 18,
    left: 19,
    lineHeight: 19,
    display: "flex",
    alignItems: "flex-end",
    width: 114,
    color: Color.gray1,
    textAlign: "left",
    fontFamily: FontFamily.urbanistMedium,
    fontWeight: "500",
    fontSize: FontSize.size_mini,
  },
  enterYourEmailInput: {
    top: 254,
    left: 22,
  },
  welcomeBackGlad: {
    fontSize: FontSize.size_11xl,
    letterSpacing: -0.3,
    lineHeight: 39,
    color: Color.dark,
    width: 252,
    textAlign: "left",
    position: "absolute",
    left: 0,
    top: 0,
    fontWeight: "700",
  },
  dontWorryIt: {
    top: 49,
    fontSize: FontSize.size_base,
    lineHeight: 24,
    width: 331,
    color: Color.gray1,
    textAlign: "left",
    fontFamily: FontFamily.urbanistMedium,
    fontWeight: "500",
    left: 0,
  },
  text: {
    top: 125,
    right: 40,
    height: 97,
    left: 22,
    position: "absolute",
  },
  backChild: {
    borderRadius: Border.br_xs,
    borderWidth: 1,
    borderColor: Color.colorAliceblue,
    borderStyle: "solid",
    left: 0,
    top: 0,
    backgroundColor: Color.white,
  },
  backArrowIcon: {
    height: "48.54%",
    width: "48.54%",
    top: "34.88%",
    right: "23.41%",
    bottom: "16.59%",
    left: "28.05%",
    maxWidth: "100%",
    maxHeight: "100%",
    position: "absolute",
    overflow: "hidden",
  },
  back: {
    top: 56,
    left: 22,
  },
  rememberPassword: {
    color: Color.colorGray_100,
    fontFamily: FontFamily.urbanistMedium,
    fontWeight: "500",
  },
  login: {
    color: Color.primary,
  },
  text1: {
    letterSpacing: 0.2,
    lineHeight: 21,
  },
  rememberPasswordLoginContainer: {
    left: 91,
    top: 765,
    position: "absolute",
  },
  forgotPassword: {
    flex: 1,
    height: 852,
    overflow: "hidden",
    width: "100%",
    backgroundColor: Color.white,
  },
});

export default ForgotPassword;
