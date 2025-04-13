import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
} from "react-native";
import { sendPasswordResetEmail } from "firebase/auth";
import { auth } from "../handle/firebase";

const ForgotPasswordScreen = ({ onBack }) => {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);

  const handleReset = async () => {
    if (!email.trim()) {
      Alert.alert("Error", "Please enter your email address.");
      return;
    }
    try {
      setLoading(true);
      await sendPasswordResetEmail(auth, email);
      Alert.alert("Success", "Password reset email sent. Check your inbox.");
      setEmail("");
    } catch (error) {
      Alert.alert("Error", error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Reset Password</Text>
      <Text style={styles.subtitle}>Enter your email to receive a reset link.</Text>

      <TextInput
        style={styles.input}
        value={email}
        onChangeText={setEmail}
        placeholder="Enter your email"
        keyboardType="email-address"
        autoCapitalize="none"
      />

      <TouchableOpacity style={styles.button} onPress={handleReset} disabled={loading}>
        <Text style={styles.buttonText}>{loading ? "Sending..." : "Send Reset Link"}</Text>
      </TouchableOpacity>

      <TouchableOpacity onPress={onBack}>
        <Text style={styles.backText}>Back to Login</Text>
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
  title: {
    fontSize: 26,
    fontWeight: "bold",
    color: "#4a2c2a",
    marginBottom: 10,
  },
  subtitle: {
    fontSize: 16,
    color: "#4a2c2a",
    textAlign: "center",
    marginBottom: 20,
  },
  input: {
    width: "100%",
    padding: 15,
    fontSize: 16,
    borderRadius: 25,
    borderWidth: 1,
    borderColor: "#ccc",
    backgroundColor: "white",
    textAlign: "center",
    marginBottom: 15,
  },
  button: {
    backgroundColor: "#a4c3d2",
    padding: 15,
    borderRadius: 30,
    width: "100%",
    alignItems: "center",
    marginBottom: 15,
  },
  buttonText: {
    color: "white",
    fontSize: 16,
    fontWeight: "bold",
  },
  backText: {
    color: "#4a2c2a",
    fontSize: 16,
    textDecorationLine: "underline",
  },
});

export default ForgotPasswordScreen;