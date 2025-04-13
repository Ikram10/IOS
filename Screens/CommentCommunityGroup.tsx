import React, { useState, useEffect, useRef } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  FlatList,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  Keyboard,
  TouchableWithoutFeedback,
  Alert,
} from "react-native";
import {
  collection,
  addDoc,
  query,
  orderBy,
  onSnapshot,
  serverTimestamp,
} from "firebase/firestore";
import { db } from "../handle/firebase";

interface Message {
  id: string;
  senderId: string;
  text: string;
  timestamp?: any;
}

interface Group {
  id: string;
  name: string;
  adminId: string;
}

interface CommentCommunityGroupProps {
  group: Group;
  userId: string;
  onBack: () => void;
}

const CommentCommunityGroupScreen: React.FC<CommentCommunityGroupProps> = ({
  group,
  userId,
  onBack,
}) => {
  const [newMessage, setNewMessage] = useState("");
  const [messages, setMessages] = useState<Message[]>([]);
  const flatListRef = useRef<FlatList>(null);
  const isAdmin = userId === group.adminId;

  // 🔁 Real-time message listener
  useEffect(() => {
    if (!group?.id) return;

    const q = query(
      collection(db, "groups", group.id, "messages"),
      orderBy("timestamp", "asc")
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const msgs = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      })) as Message[];

      setMessages(msgs);

      setTimeout(() => {
        flatListRef.current?.scrollToEnd({ animated: true });
      }, 100);
    });

    return () => unsubscribe();
  }, [group.id]);

  const handleSendMessage = async () => {
    if (!newMessage.trim()) {
      Alert.alert("Error", "Message cannot be empty.");
      return;
    }

    try {
      await addDoc(collection(db, "groups", group.id, "messages"), {
        text: newMessage,
        senderId: userId,
        timestamp: serverTimestamp(),
      });
      setNewMessage("");
    } catch (error) {
      console.error("Error sending message:", error);
    }
  };

  // 🔢 Create consistent Anonymous labels
  const anonymousMap = new Map<string, number>();
  messages.forEach((msg) => {
    if (msg.senderId !== userId && !anonymousMap.has(msg.senderId)) {
      anonymousMap.set(msg.senderId, anonymousMap.size + 1);
    }
  });

  return (
    <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
      <View style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity style={styles.backButton} onPress={onBack}>
            <Text style={styles.backText}>← Back</Text>
          </TouchableOpacity>
          <Text style={styles.groupName}>{group?.name || "Community Group"}</Text>
          {isAdmin && <Text style={styles.adminBadge}>Admin</Text>}
        </View>

        <FlatList
          ref={flatListRef}
          data={messages}
          keyExtractor={(item, index) => item.id || index.toString()}
          renderItem={({ item }) => {
            const isMe = item.senderId === userId;
            const anonNum = anonymousMap.get(item.senderId);
            return (
              <View style={[styles.message, isMe && styles.myMessage]}>
                <Text style={styles.messageSender}>
                  {isMe ? "You" : `Anonymous #${anonNum}`}
                </Text>
                <Text style={styles.messageText}>{item.text}</Text>
              </View>
            );
          }}
          contentContainerStyle={styles.flatListContent}
          keyboardShouldPersistTaps="handled"
        />

        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : "height"}
          keyboardVerticalOffset={Platform.OS === "ios" ? 90 : 110}
          style={styles.inputContainer}
        >
          <TextInput
            style={styles.input}
            value={newMessage}
            onChangeText={setNewMessage}
            placeholder="Write a message..."
            returnKeyType="send"
            onSubmitEditing={handleSendMessage}
          />
          <TouchableOpacity style={styles.sendButton} onPress={handleSendMessage}>
            <Text style={styles.sendText}>Send</Text>
          </TouchableOpacity>
        </KeyboardAvoidingView>
      </View>
    </TouchableWithoutFeedback>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#fdf7f1", paddingTop: 50 },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: 15,
    backgroundColor: "#d5b89f",
  },
  backButton: { marginRight: 10 },
  backText: { fontSize: 16, color: "blue" },
  groupName: { fontSize: 20, fontWeight: "bold", color: "#4a2c2a", textAlign: "center", flex: 1 },
  adminBadge: { backgroundColor: "#e74c3c", color: "white", padding: 5, borderRadius: 8 },
  flatListContent: { paddingBottom: 20, flexGrow: 1 },
  message: {
    backgroundColor: "#e8d7c2",
    padding: 15,
    borderRadius: 10,
    marginHorizontal: 15,
    marginVertical: 5,
    maxWidth: "80%",
  },
  myMessage: {
    backgroundColor: "#a4c3d2",
    alignSelf: "flex-end",
  },
  messageSender: { fontWeight: "bold", color: "#4a2c2a" },
  messageText: { fontSize: 16, color: "#4a2c2a" },
  inputContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#fff",
    padding: 10,
    borderRadius: 20,
    marginHorizontal: 10,
    marginBottom: Platform.OS === "ios" ? 20 : 10,
  },
  input: { flex: 1, padding: 10, borderRadius: 15, backgroundColor: "#fff", fontSize: 16 },
  sendButton: { marginLeft: 10, padding: 10, backgroundColor: "#a4c3d2", borderRadius: 15 },
  sendText: { color: "white", fontWeight: "bold" },
});

export default CommentCommunityGroupScreen;
