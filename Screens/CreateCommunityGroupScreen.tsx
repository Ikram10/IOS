import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import { addGroup } from "../handle/firestore";

interface CreateCommunityGroupScreenProps {
  onCreateGroup: (groupId: string, groupName: string, isPrivate: boolean) => void;
  onBack: () => void;
  userId: string;
}

const CreateCommunityGroupScreen: React.FC<CreateCommunityGroupScreenProps> = ({
  onCreateGroup,
  onBack,
  userId,
}) => {
  const [groupName, setGroupName] = useState("");
  const [isPrivate, setIsPrivate] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleCreateGroup = async () => {
    const trimmedName = groupName.trim();
    if (!trimmedName) {
      Alert.alert("Group Name Required", "Please enter a group name.");
      return;
    }

    try {
      setLoading(true);
      const groupId = await addGroup(trimmedName, isPrivate, userId);
      onCreateGroup(groupId, trimmedName, isPrivate);
      setGroupName("");
      setLoading(false);
      Alert.alert("Success", "Community group created successfully.");
      onBack();
    } catch (error) {
      console.error("Failed to create group:", error);
      setLoading(false);
      Alert.alert("Error", "Could not create group. Please try again.");
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <Text style={styles.title}>Create a Community Group</Text>

      <TextInput
        style={styles.input}
        placeholder="Enter group name..."
        value={groupName}
        onChangeText={setGroupName}
        editable={!loading}
      />

      <View style={styles.typeContainer}>
        <TouchableOpacity
          style={[styles.typeButton, !isPrivate && styles.selectedType]}
          onPress={() => setIsPrivate(false)}
          disabled={loading}
        >
          <Text style={[styles.typeText, !isPrivate && styles.selectedTypeText]}>Public</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.typeButton, isPrivate && styles.selectedType]}
          onPress={() => setIsPrivate(true)}
          disabled={loading}
        >
          <Text style={[styles.typeText, isPrivate && styles.selectedTypeText]}>Private</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.buttonContainer}>
        <TouchableOpacity
          style={[styles.createButton, loading && { opacity: 0.6 }]}
          onPress={handleCreateGroup}
          disabled={loading}
        >
          <Text style={styles.createButtonText}>
            {loading ? "Creating..." : "Create"}
          </Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.cancelButton} onPress={onBack} disabled={loading}>
          <Text style={styles.cancelButtonText}>Cancel</Text>
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
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
  title: { fontSize: 22, fontWeight: "bold", marginBottom: 20 },
  input: {
    width: "100%",
    backgroundColor: "#fff",
    padding: 15,
    borderRadius: 10,
    fontSize: 16,
    textAlign: "center",
    marginBottom: 20,
  },
  typeContainer: {
    flexDirection: "row",
    marginBottom: 20,
  },
  typeButton: {
    flex: 1,
    padding: 15,
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 10,
    alignItems: "center",
    marginHorizontal: 5,
  },
  selectedType: {
    backgroundColor: "#a4c3d2",
    borderColor: "#4a2c2a",
  },
  typeText: {
    fontSize: 16,
    color: "#4a2c2a",
  },
  selectedTypeText: {
    fontWeight: "bold",
    color: "white",
  },
  buttonContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    width: "100%",
  },
  createButton: {
    backgroundColor: "#a4c3d2",
    padding: 15,
    borderRadius: 10,
    flex: 1,
    alignItems: "center",
    marginRight: 10,
  },
  createButtonText: { color: "white", fontSize: 18, fontWeight: "bold" },
  cancelButton: {
    backgroundColor: "#ccc",
    padding: 15,
    borderRadius: 10,
    flex: 1,
    alignItems: "center",
  },
  cancelButtonText: { color: "#333", fontSize: 18, fontWeight: "bold" },
});

export default CreateCommunityGroupScreen;
