import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  Image,
  ActivityIndicator,
  TouchableOpacity,
  Alert,
} from "react-native";
import { auth } from "../handle/firebase";
import { sendEmailVerification } from "firebase/auth";

const WaitingForVerificationScreen = ({ onVerifySuccess }) => {
  const [user, setUser] = useState(null);
  const [secondsElapsed, setSecondsElapsed] = useState(0);
  const [resending, setResending] = useState(false);

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged(async (currentUser) => {
      if (currentUser) {
        setUser(currentUser);

        if (!currentUser.emailVerified) {
          try {
            await sendEmailVerification(currentUser);
          } catch (err) {
            console.log("Error sending verification email:", err.message);
          }
        }
      }
    });

    return () => unsubscribe();
  }, []);

  useEffect(() => {
    const timer = setInterval(() => {
      setSecondsElapsed((prev) => prev + 1);

      if (user && secondsElapsed % 3 === 0) {
        user.reload().then(() => {
          if (user.emailVerified) {
            onVerifySuccess();
          }
        });
      }
    }, 1000);

    return () => clearInterval(timer);
  }, [user, secondsElapsed]);

  const handleResend = async () => {
    if (!user) return;
    try {
      setResending(true);
      await sendEmailVerification(user);
      Alert.alert("Sent", "Verification email has been resent.");
    } catch (error) {
      Alert.alert("Error", error.message);
    } finally {
      setResending(false);
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.logoWrapper}>
        <View style={styles.circleBg}>
          <Image source={require("../assets/logo2.png")} style={styles.logo} />
          <View style={[styles.blush, styles.leftBlush]} />
          <View style={[styles.blush, styles.rightBlush]} />
        </View>
      </View>

      <Text style={styles.title}>Check your email</Text>
      <Text style={styles.subtitle}>
        We’ve sent a secure sign-in link to{"\n"}
        <Text style={styles.bold}>{user?.email || "your email"}</Text>
      </Text>

      <ActivityIndicator size="large" color="#a4c3d2" style={{ marginTop: 30 }} />

      <Text style={styles.waiting}>Waiting... {secondsElapsed}s</Text>

      <Text style={styles.footer}>
        Please check your inbox and click the link to continue.
      </Text>

      <TouchableOpacity style={styles.resendButton} onPress={handleResend} disabled={resending}>
        <Text style={styles.resendButtonText}>
          {resending ? "Resending..." : "Resend Verification Email"}
        </Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fdf7f1",
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 20,
  },
  logoWrapper: {
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 30,
  },
  circleBg: {
    width: 300,
    height: 300,
    backgroundColor: "#e8d7c2",
    borderRadius: 150,
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "rgba(0, 0, 0, 0.1)",
    shadowOffset: { width: 10, height: 10 },
    shadowOpacity: 1,
    shadowRadius: 20,
    position: "relative",
  },
  logo: {
    width: 400,
    height: 400,
    marginTop: 70,
    opacity: 0.9,
    marginLeft: -20,
  },
  blush: {
    position: "absolute",
    width: 15,
    height: 15,
    backgroundColor: "rgba(255, 150, 150, 0.6)",
    borderRadius: 50,
  },
  leftBlush: {
    left: 55,
    top: 160,
  },
  rightBlush: {
    right: 55,
    top: 160,
  },
  title: {
    fontSize: 22,
    fontWeight: "bold",
    color: "#4a2c2a",
    marginBottom: 10,
  },
  subtitle: {
    fontSize: 16,
    color: "#4a2c2a",
    textAlign: "center",
    marginBottom: 10,
    lineHeight: 24,
  },
  bold: {
    fontWeight: "bold",
  },
  waiting: {
    marginTop: 20,
    fontSize: 16,
    color: "#7a6b66",
  },
  footer: {
    marginTop: 30,
    fontSize: 14,
    color: "#7a6b66",
    textAlign: "center",
  },
  resendButton: {
    marginTop: 20,
    backgroundColor: "#a4c3d2",
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 8,
  },
  resendButtonText: {
    color: "white",
    fontWeight: "bold",
    fontSize: 16,
  },
});

export default WaitingForVerificationScreen;
