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

const handleLogin = async (email, password, onLoginSuccess, setLoading) => {
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
      "Verification email sent. Please check your email and verify your account."
    );
    onLoginSuccess(user.uid);
  } catch (error) {
    Alert.alert("Error", error.message);
  } finally {
    setLoading(false);
  }
};

const handleExistingLogin = async (email, password, onLoginSuccess, setLoading) => {
  setLoading(true);

  try {
    const userCredential = await signInWithEmailAndPassword(auth, email, password);
    const user = userCredential.user;

    if (!user.emailVerified) {
      Alert.alert("Error", "Your email is not verified. Please verify before logging in.");
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
