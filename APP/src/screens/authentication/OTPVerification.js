import * as React from "react";
import { Text, StyleSheet, View } from "react-native";
import { Image } from "expo-image";
import { Color } from "@src/styles/colors";
import { FontSize, FontFamily } from "@src/styles/fonts";
import { Border } from "@src/styles/borders";

const OTPVerification = () => {
  return (
    <View style={styles.otpVerification}>
      <Text style={[styles.didntReceivedCodeContainer, styles.verifyTypo]}>
        <Text
          style={[styles.didntReceivedCode, styles.didntReceivedCodeTypo]}
        >{`Didn’t received code? `}</Text>
        <Text style={styles.resend}>Resend</Text>
      </Text>
      <View style={styles.verifyButton}>
        <View style={styles.verifyButtonChild} />
        <Text style={[styles.verify, styles.verifyTypo]}>Verify</Text>
      </View>
      <View style={styles.enterOtpInput}>
        <View style={[styles.blank, styles.viewLayout]} />
        <View style={[styles.view, styles.viewLayout]}>
          <View style={[styles.blank1, styles.childBorder]} />
          <Text style={[styles.text, styles.textFlexBox]}>3</Text>
        </View>
        <View style={[styles.view1, styles.viewLayout]}>
          <View style={[styles.child, styles.childBorder]} />
          <Text style={[styles.text1, styles.textFlexBox]}>5</Text>
        </View>
        <View style={[styles.view2, styles.viewLayout]}>
          <View style={[styles.child, styles.childBorder]} />
          <Text style={[styles.text2, styles.textFlexBox]}>1</Text>
        </View>
      </View>
      <View style={styles.text3}>
        <Text style={[styles.welcomeBackGlad, styles.textFlexBox]}>
          OTP Verification
        </Text>
        <Text style={[styles.enterTheVerification, styles.textFlexBox]}>
          Enter the verification code we just sent on your email address.
        </Text>
      </View>
      <View style={[styles.back, styles.backLayout]}>
        <View style={[styles.backChild, styles.backLayout]} />
        <Image
          style={styles.backArrowIcon}
          contentFit="cover"
          source={require("@assets/back-arrow.png")}
        />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  verifyTypo: {
    textAlign: "center",
    fontSize: FontSize.size_mini,
    position: "absolute",
  },
  didntReceivedCodeTypo: {
    fontFamily: FontFamily.urbanistMedium,
    fontWeight: "500",
  },
  viewLayout: {
    width: 74,
    top: 0,
    height: 60,
    position: "absolute",
  },
  childBorder: {
    borderColor: Color.primary,
    left: 0,
    width: 74,
    borderStyle: "solid",
    top: 0,
    height: 60,
    borderRadius: Border.br_5xs,
    position: "absolute",
    backgroundColor: Color.white,
  },
  textFlexBox: {
    textAlign: "left",
    position: "absolute",
  },
  backLayout: {
    height: 41,
    width: 41,
    position: "absolute",
  },
  didntReceivedCode: {
    color: Color.colorGray_100,
  },
  resend: {
    color: Color.primary,
    fontFamily: FontFamily.urbanistBold,
    fontWeight: "700",
  },
  didntReceivedCodeContainer: {
    top: 765,
    left: 87,
    letterSpacing: 0.2,
    lineHeight: 21,
  },
  verifyButtonChild: {
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
  verify: {
    top: 21,
    left: 143,
    fontWeight: "800",
    fontFamily: FontFamily.urbanistExtraBold,
    color: Color.white,
  },
  verifyButton: {
    height: "6.9%",
    width: "88.27%",
    top: "43.31%",
    right: "5.85%",
    bottom: "49.79%",
    left: "5.88%",
    position: "absolute",
  },
  blank: {
    left: 274,
    backgroundColor: Color.colorWhitesmoke,
    borderWidth: 1,
    borderColor: Color.colorAliceblue,
    borderStyle: "solid",
    borderRadius: Border.br_5xs,
  },
  blank1: {
    borderWidth: 1,
  },
  text: {
    width: 13,
    color: Color.dark,
    textAlign: "left",
    fontFamily: FontFamily.urbanistBold,
    fontWeight: "700",
    fontSize: FontSize.size_3xl,
    top: 17,
    left: 31,
  },
  view: {
    left: 183,
  },
  child: {
    borderWidth: 1.2,
  },
  text1: {
    width: 14,
    color: Color.dark,
    textAlign: "left",
    fontFamily: FontFamily.urbanistBold,
    fontWeight: "700",
    fontSize: FontSize.size_3xl,
    top: 17,
    left: 31,
  },
  view1: {
    left: 0,
  },
  text2: {
    left: 33,
    width: 8,
    color: Color.dark,
    textAlign: "left",
    fontFamily: FontFamily.urbanistBold,
    fontWeight: "700",
    fontSize: FontSize.size_3xl,
    top: 17,
  },
  view2: {
    left: 92,
  },
  enterOtpInput: {
    top: 254,
    width: 348,
    height: 60,
    left: 22,
    position: "absolute",
  },
  welcomeBackGlad: {
    fontSize: FontSize.size_11xl,
    letterSpacing: -0.3,
    lineHeight: 39,
    width: 234,
    color: Color.dark,
    textAlign: "left",
    fontFamily: FontFamily.urbanistBold,
    fontWeight: "700",
    left: 0,
    top: 0,
  },
  enterTheVerification: {
    top: 49,
    fontSize: FontSize.size_base,
    lineHeight: 24,
    color: Color.gray,
    width: 331,
    left: 0,
    fontFamily: FontFamily.urbanistMedium,
    fontWeight: "500",
  },
  text3: {
    top: 125,
    right: 40,
    height: 97,
    left: 22,
    position: "absolute",
  },
  backChild: {
    borderRadius: Border.br_xs,
    left: 0,
    borderWidth: 1,
    borderColor: Color.colorAliceblue,
    borderStyle: "solid",
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
  otpVerification: {
    flex: 1,
    height: 852,
    overflow: "hidden",
    width: "100%",
    backgroundColor: Color.white,
  },
});

export default OTPVerification;
