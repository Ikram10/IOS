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
  Animated,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import {
  collection,
  addDoc,
  query,
  orderBy,
  onSnapshot,
  serverTimestamp,
} from "firebase/firestore";
import { formatDistanceToNowStrict } from "date-fns";
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
  const [isTyping, setIsTyping] = useState(false);
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
      setIsTyping(false);
    } catch (error) {
      console.error("Error sending message:", error);
    }
  };

  const handleTyping = (text: string) => {
    setNewMessage(text);
    setIsTyping(text.length > 0);
  };

  const renderMessage = ({ item }: { item: Message }) => {
    const isMe = item.senderId === userId;

    return (
      <View
        style={[
          styles.messageContainer,
          isMe ? styles.myMessageContainer : styles.otherMessageContainer,
        ]}
      >
        <View
          style={[
            styles.messageBubble,
            isMe ? styles.myMessageBubble : styles.otherMessageBubble,
          ]}
        >
          <Text style={styles.messageText}>{item.text}</Text>
          <Text style={styles.messageTimestamp}>
            {item.timestamp?.toDate
              ? formatDistanceToNowStrict(new Date(item.timestamp.toDate()), { addSuffix: true })
              : "Just now"}
          </Text>
        </View>
      </View>
    );
  };

  return (
    <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
      <View style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity style={styles.backButton} onPress={onBack}>
            <Ionicons name="arrow-back" size={24} color="#4a2c2a" />
          </TouchableOpacity>
          <Text style={styles.groupName}>{group?.name || "Community Group"}</Text>
          {isAdmin && <Text style={styles.adminBadge}>Admin</Text>}
        </View>

        {/* Messages List */}
        <FlatList
          ref={flatListRef}
          data={messages}
          keyExtractor={(item) => item.id}
          renderItem={renderMessage}
          contentContainerStyle={styles.messagesContainer}
          ListEmptyComponent={
            <Text style={styles.emptyMessage}>No messages yet. Start the conversation!</Text>
          }
        />

        {/* Typing Indicator */}
        {isTyping && <Text style={styles.typingIndicator}>Typing...</Text>}

        {/* Input Field */}
        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : "height"}
          keyboardVerticalOffset={Platform.OS === "ios" ? 90 : 110}
          style={styles.inputContainer}
        >
          <TouchableOpacity style={styles.attachmentButton}>
            <Ionicons name="attach-outline" size={24} color="#4a2c2a" />
          </TouchableOpacity>
          <TextInput
            style={styles.input}
            value={newMessage}
            onChangeText={handleTyping}
            placeholder="Write a message..."
            returnKeyType="send"
            onSubmitEditing={handleSendMessage}
          />
          <TouchableOpacity style={styles.sendButton} onPress={handleSendMessage}>
            <Ionicons name="send" size={24} color="white" />
          </TouchableOpacity>
        </KeyboardAvoidingView>
      </View>
    </TouchableWithoutFeedback>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#fdf7f1" },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: 15,
    backgroundColor: "#d5b89f",
  },
  backButton: { marginRight: 10 },
  groupName: { fontSize: 20, fontWeight: "bold", color: "#4a2c2a", flex: 1 },
  adminBadge: { backgroundColor: "#e74c3c", color: "white", padding: 5, borderRadius: 8 },
  messagesContainer: { padding: 10, flexGrow: 1 },
  messageContainer: {
    marginVertical: 10,
  },
  myMessageContainer: {
    alignItems: "flex-end",
  },
  otherMessageContainer: {
    alignItems: "flex-start",
  },
  messageBubble: {
    maxWidth: "75%",
    padding: 15,
    borderRadius: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 5,
  },
  myMessageBubble: {
    backgroundColor: "#a4c3d2",
  },
  otherMessageBubble: {
    backgroundColor: "#e8d7c2",
  },
  messageText: { fontSize: 16, color: "#4a2c2a", marginBottom: 5 },
  messageTimestamp: {
    fontSize: 12,
    color: "#777",
    textAlign: "right",
  },
  emptyMessage: { textAlign: "center", color: "#777", marginTop: 20 },
  typingIndicator: { fontSize: 14, color: "#777", marginLeft: 15, marginBottom: 5 },
  inputContainer: {
    flexDirection: "row",
    alignItems: "center",
    padding: 10,
    backgroundColor: "#fff",
    borderTopWidth: 1,
    borderTopColor: "#ddd",
  },
  input: {
    flex: 1,
    padding: 10,
    borderRadius: 20,
    backgroundColor: "#f0f0f0",
    marginHorizontal: 10,
  },
  sendButton: {
    backgroundColor: "#4a2c2a",
    padding: 10,
    borderRadius: 20,
  },
  attachmentButton: {
    padding: 10,
  },
});

export default CommentCommunityGroupScreen;
