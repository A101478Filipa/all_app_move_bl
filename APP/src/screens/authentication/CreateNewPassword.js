import * as React from "react";
import { StyleSheet, View, Text, Pressable } from "react-native";
import { Image } from "expo-image";
import { useNavigation } from "@react-navigation/native";
import { Color } from "@src/styles/colors";
import { FontSize, FontFamily } from "@src/styles/fonts";
import { Border } from "@src/styles/borders";

const CreateNewPassword = () => {
  const navigation = useNavigation();

  return (
    <View style={styles.createNewPassword}>
      <View style={styles.resetPasswordButton}>
        <View style={styles.resetPasswordButtonChild} />
        <Text style={styles.resetPassword}>Reset Password</Text>
      </View>
      <View style={[styles.confirmPasswordInput, styles.passwordLayout]}>
        <View style={[styles.confirmPasswordInputChild, styles.childBorder]} />
        <Text style={[styles.confirmPassword, styles.passwordTypo]}>
          Confirm Password
        </Text>
      </View>
      <View style={[styles.newPasswordInput, styles.passwordLayout]}>
        <View style={[styles.confirmPasswordInputChild, styles.childBorder]} />
        <Text style={[styles.newPassword, styles.passwordTypo]}>
          New Password
        </Text>
      </View>
      <View style={styles.text}>
        <Text style={[styles.welcomeBackGlad, styles.welcomeBackGladPosition]}>
          Create new password
        </Text>
        <Text style={[styles.yourNewPassword, styles.welcomeBackGladPosition]}>
          Your new password must be unique from those previously used.
        </Text>
      </View>
      <Pressable
        style={[styles.back, styles.backLayout]}
        onPress={() => navigation.navigate("ForgotPassword")}
      >
        <View style={[styles.backChild, styles.backLayout]} />
        <Image
          style={styles.backArrowIcon}
          contentFit="cover"
          source={require("@assets/back-arrow.png")}
        />
      </Pressable>
    </View>
  );
};

const styles = StyleSheet.create({
  passwordLayout: {
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
  passwordTypo: {
    alignItems: "flex-end",
    display: "flex",
    lineHeight: 19,
    left: 19,
    top: 18,
    textAlign: "left",
    color: Color.gray1,
    fontFamily: FontFamily.urbanistMedium,
    fontWeight: "500",
    fontSize: FontSize.size_mini,
    position: "absolute",
  },
  welcomeBackGladPosition: {
    textAlign: "left",
    left: 0,
    position: "absolute",
  },
  backLayout: {
    height: 41,
    width: 41,
    position: "absolute",
  },
  resetPasswordButtonChild: {
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
  resetPassword: {
    top: 20,
    left: 111,
    fontWeight: "800",
    fontFamily: FontFamily.urbanistExtraBold,
    color: Color.white,
    textAlign: "center",
    fontSize: FontSize.size_mini,
    position: "absolute",
  },
  resetPasswordButton: {
    height: "6.9%",
    width: "88.27%",
    top: "51.53%",
    right: "5.85%",
    bottom: "41.57%",
    left: "5.88%",
    position: "absolute",
  },
  confirmPasswordInputChild: {
    backgroundColor: Color.colorWhitesmoke,
    height: 56,
    width: 348,
    position: "absolute",
    borderRadius: Border.br_5xs,
  },
  confirmPassword: {
    width: 127,
  },
  confirmPasswordInput: {
    top: 325,
    left: 22,
  },
  newPassword: {
    width: 102,
  },
  newPasswordInput: {
    top: 254,
    left: 22,
  },
  welcomeBackGlad: {
    fontSize: FontSize.size_11xl,
    letterSpacing: -0.3,
    lineHeight: 39,
    fontWeight: "700",
    fontFamily: FontFamily.urbanistBold,
    color: Color.dark,
    width: 310,
    textAlign: "left",
    top: 0,
  },
  yourNewPassword: {
    top: 49,
    fontSize: FontSize.size_base,
    lineHeight: 24,
    width: 331,
    color: Color.gray1,
    fontFamily: FontFamily.urbanistMedium,
    fontWeight: "500",
    textAlign: "left",
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
  createNewPassword: {
    flex: 1,
    height: 852,
    overflow: "hidden",
    width: "100%",
    backgroundColor: Color.white,
  },
});

export default CreateNewPassword;
