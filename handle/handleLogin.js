import {
  auth,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  sendEmailVerification,
} from "./firebase";
import { Alert } from "react-native";
import { createUserDocument } from "./firestore";

const sendVerificationEmail = async (user) => {
  try {
    await sendEmailVerification(user);
    console.log("Verification email sent successfully!");
  } catch (error) {
    console.error("Error sending verification email:", error);
    throw new Error("Failed to send verification email.");
  }
};

const isValidCityEmail = (email) => {
  return email.toLowerCase().endsWith("@city.ac.uk");
};

const handleLogin = async (email, password, onLoginSuccess, setLoading) => {
  if (!isValidCityEmail(email)) {
    Alert.alert("Error", "Only @city.ac.uk email addresses are allowed.");
    return;
  }

  setLoading(true);

  try {
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    const user = userCredential.user;

    await sendVerificationEmail(user);

    await createUserDocument(user.uid, {
      email: user.email,
      name: user.displayName || "Anonymous",
    });

    Alert.alert(
      "Success",
      "Verification email sent. Please check your City email and verify your account."
    );
    onLoginSuccess(user.uid);
  } catch (error) {
    Alert.alert("Error", error.message);
  } finally {
    setLoading(false);
  }
};

const handleExistingLogin = async (email, password, onLoginSuccess, setLoading) => {
  if (!isValidCityEmail(email)) {
    Alert.alert("Error", "Only @city.ac.uk email addresses are allowed.");
    return;
  }

  setLoading(true);

  try {
    const userCredential = await signInWithEmailAndPassword(auth, email, password);
    const user = userCredential.user;

    if (!user.emailVerified) {
      Alert.alert("Error", "Your City email is not verified. Please verify before logging in.");
      return;
    }

    await createUserDocument(user.uid, {
      email: user.email,
      name: user.displayName || "Anonymous",
    });

    Alert.alert("Success", "Login successful!");
    onLoginSuccess(user.uid);
  } catch (error) {
    Alert.alert("Error", error.message);
  } finally {
    setLoading(false);
  }
};

export { handleLogin, handleExistingLogin };
