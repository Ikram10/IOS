import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  Keyboard,
  TouchableWithoutFeedback,
  Alert,
} from "react-native";
import { addPost } from "../handle/firestore";
import { moderateContent } from "../handle/perspective_ai";

interface CreatePostScreenProps {
  userId: string;
  onBack: () => void;
  onNavigate: (screen: string) => void;
}

const CreatePostScreen: React.FC<CreatePostScreenProps> = ({ userId, onBack, onNavigate }) => {
  const [postText, setPostText] = useState("");
  const [selectedTag, setSelectedTag] = useState("");
  const [customTag, setCustomTag] = useState("");

  const predefinedTags = [
    "Mathematics", "Physics", "Chemistry", "Biology", "Computer Science", "Engineering",
    "Economics", "Psychology", "Sociology", "History", "Philosophy", "Literature", "Art",
    "Law", "Medicine", "Business", "Education", "Political Science", "Environmental Science", "Other"
  ];

  const handlePost = async () => {
    if (!postText.trim()) {
      Alert.alert("Error", "Post content cannot be empty.");
      return;
    }

    const tag = selectedTag === "Other" ? customTag.trim() : selectedTag;
    if (!tag) {
      Alert.alert("Error", "Please select or enter a subject tag.");
      return;
    }

    try {
      const isSensitive = await moderateContent(postText.trim());
      if (isSensitive) {
        Alert.alert(
          "Sensitive Content Warning",
          "The content you are about to post contains harmful material. Posting such content could risk having your account suspended or permanently banned.",
          [
            { text: "Cancel", style: "cancel" },
            {
              text: "Proceed Anyway",
              onPress: async () => {
                await addPost(postText.trim(), userId, tag);
                Alert.alert("Success", "Your post has been published.");
                onBack();
              },
            },
          ]
        );
      } else {
        await addPost(postText.trim(), userId, tag);
        Alert.alert("Success", "Your post has been published.");
        onBack();
      }
    } catch (error) {
      console.error("Error saving post:", error);
      Alert.alert("Error", "Failed to save post. Please try again.");
    }
  };

  return (
    <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={styles.container}
      >
        <Text style={styles.title}>Create a Post</Text>

        <TextInput
          style={styles.input}
          placeholder="Write something..."
          value={postText}
          onChangeText={setPostText}
          multiline
          returnKeyType="done"
        />

        <Text style={styles.subtitle}>Select a Subject Tag:</Text>
        <View style={styles.tagContainer}>
          {predefinedTags.map((tag) => (
            <TouchableOpacity
              key={tag}
              style={[
                styles.tagButton,
                selectedTag === tag && styles.selectedTagButton,
              ]}
              onPress={() => setSelectedTag(tag)}
            >
              <Text
                style={[
                  styles.tagText,
                  selectedTag === tag && styles.selectedTagText,
                ]}
              >
                {tag}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {selectedTag === "Other" && (
          <TextInput
            style={styles.input}
            placeholder="Enter a custom subject..."
            value={customTag}
            onChangeText={setCustomTag}
            returnKeyType="done"
          />
        )}

        <View style={styles.buttons}>
          <TouchableOpacity style={styles.postButton} onPress={handlePost}>
            <Text style={styles.postButtonText}>Post</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.cancelButton} onPress={onBack}>
            <Text style={styles.cancelButtonText}>Cancel</Text>
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </TouchableWithoutFeedback>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: "#fdf7f1",
    marginTop: 60,
  },
  title: { fontSize: 22, fontWeight: "bold", marginBottom: 20 },
  input: {
    width: "100%",
    backgroundColor: "#fff",
    padding: 15,
    borderRadius: 10,
    fontSize: 16,
    marginBottom: 20,
  },
  subtitle: { fontSize: 18, fontWeight: "bold", marginBottom: 10 },
  tagContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    marginBottom: 20,
  },
  tagButton: {
    backgroundColor: "#e8d7c2",
    padding: 10,
    borderRadius: 20,
    margin: 5,
  },
  selectedTagButton: { backgroundColor: "#a4c3d2" },
  tagText: { color: "#4a2c2a", fontWeight: "bold" },
  selectedTagText: { color: "white" },
  buttons: { flexDirection: "row", justifyContent: "space-between" },
  postButton: {
    backgroundColor: "#a4c3d2",
    padding: 15,
    borderRadius: 10,
    flex: 1,
    alignItems: "center",
    marginRight: 10,
  },
  postButtonText: { color: "white", fontSize: 18, fontWeight: "bold" },
  cancelButton: {
    backgroundColor: "#ccc",
    padding: 15,
    borderRadius: 10,
    flex: 1,
    alignItems: "center",
  },
  cancelButtonText: { color: "#333", fontSize: 18, fontWeight: "bold" },
});

export default CreatePostScreen;
