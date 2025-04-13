import React, { useState, useEffect } from "react";
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
  RefreshControl,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import EmojiSelector, { Categories } from "react-native-emoji-selector";
import { addComment, fetchComments, addReply } from "../handle/firestore";

const CommentsPostScreen = ({ post, userId, onBack }) => {
  const [commentText, setCommentText] = useState("");
  const [comments, setComments] = useState([]);
  const [refreshing, setRefreshing] = useState(false);
  const [replyingTo, setReplyingTo] = useState(null);
  const [replyText, setReplyText] = useState("");
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [userMap, setUserMap] = useState({});

  useEffect(() => {
    loadComments();
  }, [post.id]);

  const loadComments = async () => {
    try {
      const fetchedComments = await fetchComments(post.id);

      const map = {};
      let counter = 1;

      for (const comment of fetchedComments) {
        if (comment.authorId && !map[comment.authorId]) {
          map[comment.authorId] = `Anonymous #${counter++}`;
        }
        if (comment.replies?.length > 0) {
          for (const reply of comment.replies) {
            if (reply.authorId && !map[reply.authorId]) {
              map[reply.authorId] = `Anonymous #${counter++}`;
            }
          }
        }
      }

      setUserMap(map);
      setComments(fetchedComments);
    } catch (error) {
      console.error("Error loading comments:", error);
      Alert.alert("Error", "Failed to load comments. Please try again.");
    }
  };

  const refreshComments = async () => {
    setRefreshing(true);
    try {
      await loadComments();
    } catch (error) {
      console.error("Error refreshing comments:", error);
      Alert.alert("Error", "Failed to refresh comments. Please try again.");
    } finally {
      setRefreshing(false);
    }
  };

  const handleSendComment = async () => {
    if (!commentText.trim()) {
      Alert.alert("Error", "Comment cannot be empty.");
      return;
    }

    try {
      await addComment(post.id, commentText.trim(), userId);
      setCommentText("");
      Keyboard.dismiss();
      refreshComments();
    } catch (error) {
      console.error("Error adding comment:", error);
      Alert.alert("Error", "Failed to add comment. Please try again.");
    }
  };

  const handleSendReply = async () => {
    if (!replyText.trim()) {
      Alert.alert("Error", "Reply cannot be empty.");
      return;
    }

    try {
      await addReply(post.id, replyingTo, replyText.trim(), userId);
      setReplyText("");
      setReplyingTo(null);
      refreshComments();
    } catch (error) {
      console.error("Error sending reply:", error);
      Alert.alert("Error", "Failed to send reply.");
    }
  };

  const handleEmojiSelect = (emoji) => {
    if (replyingTo) {
      setReplyText((prev) => prev + emoji);
    } else {
      setCommentText((prev) => prev + emoji);
    }
  };

  const renderComment = ({ item }) => (
    <View style={styles.comment}>
      <Text style={styles.commentUser}>{userMap[item.authorId] || "Anonymous"}</Text>
      <Text style={styles.commentText}>{item.text || "No content available"}</Text>

      {item.replies?.length > 0 && (
        <View style={styles.repliesSection}>
          {item.replies.map((reply) => (
            <View key={reply.id} style={styles.replyBox}>
              <Text style={styles.replyUser}>{userMap[reply.authorId] || "Anonymous"}</Text>
              <Text style={styles.replyText}>{reply.text}</Text>
              <Text style={styles.replyTimeAgo}>{reply.timeAgo}</Text>
            </View>
          ))}
        </View>
      )}

      <View style={styles.commentFooter}>
        <Text style={styles.commentTimeAgo}>{item.timeAgo || "1 second ago"}</Text>
        <TouchableOpacity
          onPress={() => setReplyingTo(replyingTo === item.id ? null : item.id)}
          style={styles.replyButton}
        >
          <Text style={styles.replyButtonText}>
            {replyingTo === item.id ? "Cancel Reply" : "Reply"}
          </Text>
        </TouchableOpacity>
      </View>

      {replyingTo === item.id && (
        <View style={styles.replyInputContainer}>
          <TextInput
            style={styles.input}
            placeholder="Write a reply..."
            value={replyText}
            onChangeText={setReplyText}
          />
          <TouchableOpacity style={styles.sendButton} onPress={handleSendReply}>
            <Ionicons name="send" size={24} color="white" />
          </TouchableOpacity>
        </View>
      )}
    </View>
  );

  return (
    <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        keyboardVerticalOffset={Platform.OS === "ios" ? 90 : 110}
        style={styles.container}
      >
        <View style={styles.header}>
          <TouchableOpacity onPress={onBack} style={styles.backButton}>
            <Ionicons name="arrow-back" size={24} color="#4a2c2a" />
          </TouchableOpacity>
          <Text style={styles.headerTitle} numberOfLines={2} ellipsizeMode="tail">
            {post.text || post.content || "Post"}
          </Text>
        </View>

        <FlatList
          data={comments}
          keyExtractor={(item) => item.id}
          renderItem={renderComment}
          keyboardShouldPersistTaps="handled"
          keyboardDismissMode="on-drag"
          contentContainerStyle={{
            paddingBottom: showEmojiPicker ? 300 : 150,
            paddingHorizontal: 10,
          }}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={refreshComments} />
          }
        />

        {showEmojiPicker && (
          <View style={styles.emojiWrapper}>
            <EmojiSelector
              category={Categories.all}
              onEmojiSelected={handleEmojiSelect}
              showSearchBar={false}
              showTabs={true}
              showHistory={true}
              columns={9}
            />
          </View>
        )}

        <View style={styles.inputContainer}>
          <TouchableOpacity
            style={styles.emojiButton}
            onPress={() => {
              Keyboard.dismiss();
              setShowEmojiPicker((prev) => !prev);
            }}
          >
            <Ionicons name="happy-outline" size={24} color="#4a2c2a" />
          </TouchableOpacity>

          <TextInput
            style={styles.input}
            placeholder="Write a comment..."
            value={commentText}
            onChangeText={setCommentText}
          />
          <TouchableOpacity style={styles.sendButton} onPress={handleSendComment}>
            <Ionicons name="send" size={24} color="white" />
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </TouchableWithoutFeedback>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, paddingTop: 40, backgroundColor: "#fdf7f1" },
  header: { flexDirection: "row", alignItems: "center", padding: 15, backgroundColor: "#f4e9df" },
  backButton: { marginRight: 10 },
  headerTitle: { fontSize: 18, fontWeight: "bold", color: "#4a2c2a", flex: 1 },
  comment: { marginBottom: 10, padding: 10, backgroundColor: "#ffffff", borderRadius: 10 },
  commentUser: { fontWeight: "bold", color: "#4a2c2a" },
  commentText: { color: "#4a2c2a" },
  commentFooter: {
    flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginTop: 5,
  },
  commentTimeAgo: { fontSize: 12, color: "gray" },
  replyButton: {
    backgroundColor: "#d5b89f", padding: 6, borderRadius: 10, marginLeft: 10,
  },
  replyButtonText: { color: "#4a2c2a", fontWeight: "bold", fontSize: 14 },
  replyInputContainer: { flexDirection: "row", alignItems: "center", marginTop: 8 },
  repliesSection: {
    marginTop: 10, marginLeft: 10, paddingLeft: 10,
    borderLeftWidth: 2, borderLeftColor: "#e0d6cc",
  },
  replyBox: { marginBottom: 6 },
  replyUser: { fontWeight: "bold", color: "#6e4c2e" },
  replyText: { color: "#4a2c2a", marginLeft: 4 },
  replyTimeAgo: { fontSize: 11, color: "gray", marginLeft: 4 },
  inputContainer: {
    flexDirection: "row", alignItems: "center", padding: 10,
    backgroundColor: "#d5b89f", position: "absolute", bottom: 0, width: "100%",
  },
  emojiButton: { padding: 6, marginRight: 5 },
  input: { flex: 1, backgroundColor: "#ffffff", padding: 10, borderRadius: 20, marginHorizontal: 5 },
  sendButton: { backgroundColor: "#4a2c2a", padding: 10, borderRadius: 20 },
  emojiWrapper: { position: "absolute", bottom: 60, width: "100%", height: 250, backgroundColor: "#fff" },
});

export default CommentsPostScreen;
