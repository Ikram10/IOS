import React, { useState } from "react";
import { View, Text, TextInput, TouchableOpacity, Image, StyleSheet } from "react-native";
import { handleLogin, handleExistingLogin } from "../handle/handleLogin";

interface LoginScreenProps {
  onLoginSuccess: () => void;
  onForgotPassword: () => void;
}

const LoginScreen: React.FC<LoginScreenProps> = ({ onLoginSuccess, onForgotPassword }) => {
  const [loading, setLoading] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isNewUser, setIsNewUser] = useState(true);

  const handlePress = () => {
    if (isNewUser) {
      handleLogin(email, password, onLoginSuccess, setLoading);
    } else {
      handleExistingLogin(email, password, onLoginSuccess, setLoading);
    }
  };

  return (
    <View style={styles.loginContainer}>
      {/* Logo Wrapper */}
      <View style={styles.logoWrapper}>
        <View style={styles.circleBg}>
          <Image source={require("../assets/logo2.png")} style={styles.loginLogo} />
          <View style={[styles.blush, styles.leftBlush]} />
          <View style={[styles.blush, styles.rightBlush]} />
        </View>
      </View>

      {/* Title */}
      <Text style={styles.loginTitle}>
        {isNewUser ? "Sign Up for UniWhisper" : "Log In to UniWhisper"}
      </Text>

      {/* Input Fields */}
      <View style={styles.inputGroup}>
        <TextInput
          style={styles.input}
          value={email}
          onChangeText={setEmail}
          placeholder="Enter email"
          keyboardType="email-address"
          autoCapitalize="none"
        />
        <TextInput
          style={styles.input}
          value={password}
          onChangeText={setPassword}
          placeholder="Enter password"
          secureTextEntry
        />

        {/* Forgot Password Button (only for login) */}
        {!isNewUser && (
          <TouchableOpacity onPress={onForgotPassword}>
            <Text style={styles.forgotText}>Forgot Password?</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* Login/Sign-Up Button */}
      <TouchableOpacity style={styles.loginButton} onPress={handlePress} disabled={loading}>
        <Text style={styles.buttonText}>
          {loading ? "Processing..." : isNewUser ? "Sign Up" : "Log In"}
        </Text>
      </TouchableOpacity>

      {/*  Sign-Up and Login */}
      <TouchableOpacity onPress={() => setIsNewUser(!isNewUser)}>
        <Text style={styles.toggleText}>
          {isNewUser ? "Already have an account? Log In" : "Don't have an account? Sign Up"}
        </Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  loginContainer: {
    flex: 1,
    backgroundColor: "#fdf7f1",
    justifyContent: "center",
    alignItems: "center",
  },
  logoWrapper: {
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 20,
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
  loginLogo: {
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
  loginTitle: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#4a2c2a",
    marginBottom: 20,
  },
  inputGroup: {
    width: "85%",
    maxWidth: 350,
    marginBottom: 15,
  },
  input: {
    width: "100%",
    padding: 15,
    fontSize: 18,
    borderRadius: 25,
    borderWidth: 1,
    borderColor: "#ccc",
    backgroundColor: "white",
    textAlign: "center",
    shadowColor: "rgba(0, 0, 0, 0.1)",
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 1,
    shadowRadius: 5,
    marginBottom: 10,
  },
  forgotText: {
    fontSize: 14,
    color: "#4a2c2a",
    textDecorationLine: "underline",
    marginBottom: 10,
    alignSelf: "center",
  },
  loginButton: {
    width: "85%",
    maxWidth: 350,
    padding: 15,
    borderRadius: 30,
    backgroundColor: "#a4c3d2",
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "rgba(0, 0, 0, 0.1)",
    shadowOffset: { width: 3, height: 3 },
    shadowOpacity: 1,
    shadowRadius: 10,
  },
  buttonText: {
    fontSize: 20,
    color: "white",
    fontWeight: "bold",
  },
  toggleText: {
    marginTop: 20,
    fontSize: 16,
    color: "#4a2c2a",
    textDecorationLine: "underline",
  },
});

export default LoginScreen;
