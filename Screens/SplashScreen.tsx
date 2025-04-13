import React, { useEffect } from "react";
import { View, Text, Image, Animated, StyleSheet } from "react-native";

interface SplashScreenProps {
  onComplete: () => void;
}

const SplashScreen: React.FC<SplashScreenProps> = ({ onComplete }) => {
  const fadeAnim = new Animated.Value(0);

  useEffect(() => {
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 1500,
      useNativeDriver: true,
    }).start();

    // Move to Login Screen after 2 seconds
    setTimeout(() => {
      onComplete();
    }, 2000);
  }, [onComplete]);

  return (
    <View style={styles.splashContainer}>
      <Animated.View style={[styles.logoWrapper, { opacity: fadeAnim }]}>
        <View style={styles.circleBg}>
          <Image source={require("../assets/logo2.png")} style={styles.splashLogo} />
          <View style={[styles.blush, styles.leftBlush]} />
          <View style={[styles.blush, styles.rightBlush]} />
        </View>
      </Animated.View>
      <Text style={styles.splashTitle}>UniWhisper</Text>
      <Text style={styles.splashSubtitle}>Your voice, your thoughts, anonymously.</Text>
      <View style={styles.progressBar}>
        <Animated.View style={styles.progress} />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  splashContainer: {
    flex: 1,
    backgroundColor: "#fdf7f1",
    justifyContent: "center",
    alignItems: "center",
    overflow: "hidden",
  },
  logoWrapper: {
    justifyContent: "center",
    alignItems: "center",
    position: "relative",
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
  },
  splashLogo: {
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
  splashTitle: {
    fontSize: 28,
    fontWeight: "bold",
    color: "#4a2c2a",
    marginTop: 20,
    textAlign: "center",
    textShadowColor: "rgba(0, 0, 0, 0.3)",
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 5,
  },
  splashSubtitle: {
    fontSize: 16,
    color: "#715b56",
    marginBottom: 20,
    textAlign: "center",
    textShadowColor: "rgba(255, 255, 255, 0.5)",
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 5,
  },
  progressBar: {
    width: "60%",
    height: 15,
    backgroundColor: "rgba(255, 255, 255, 0.6)",
    borderRadius: 12,
    overflow: "hidden",
    marginTop: 40,
    shadowColor: "rgba(0, 0, 0, 0.1)",
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 1,
    shadowRadius: 10,
  },
  progress: {
    height: "100%",
    backgroundColor: "#f3b27a",
    borderRadius: 12,
  },
});

export default SplashScreen;