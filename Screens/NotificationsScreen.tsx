import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  FlatList,
  StyleSheet,
  Alert,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import {
  deletePost,
  fetchUserPosts,
  addNotification,
  fetchComments,
  fetchPosts,
} from "../handle/firestore";
import { formatDistanceToNow } from "date-fns";
import { doc, updateDoc, arrayUnion } from "firebase/firestore";
import { db } from "../handle/firebase";

interface Notification {
  id: string;
  type: string;
  text: string;
  timestamp: number;
  groupId?: string;
  requesterId?: string;
  muted?: boolean;
}

interface Post {
  id: string;
  text: string;
  community?: string;
  authorId: string;
  timestamp: number;
}

interface NotificationsScreenProps {
  notifications: Notification[];
  posts: Post[];
  onNavigate: (screen: string, data?: any) => void;
  onToggleMute: (id: string) => void;
  onEditPost: (postId: string, newText: string) => void;
  onLeaveCommunity: (community: string) => void;
  userId: string;
  initialTab?: string;
}

const NotificationsScreen: React.FC<NotificationsScreenProps> = ({
  notifications,
  posts,
  onNavigate,
  onToggleMute,
  onEditPost,
  onLeaveCommunity,
  userId,
  initialTab,
}) => {
  const [selectedTab, setSelectedTab] = useState<string>(initialTab || "notifications");
  const [userPosts, setUserPosts] = useState<Post[]>([]);
  const [postsRepliedTo, setPostsRepliedTo] = useState<Post[]>([]);
  const [pinnedPosts, setPinnedPosts] = useState<Post[]>([]);

  useEffect(() => {
    if (initialTab && ["notifications", "posts", "replies", "pinned"].includes(initialTab)) {
      setSelectedTab(initialTab);
    }
  }, [initialTab]);

  useEffect(() => {
    const fetchData = async () => {
      if (!userId) return;

      try {
        const allPosts = await fetchPosts(userId);
        const userCreatedPosts = allPosts.filter((p) => p.authorId === userId);
        setUserPosts(userCreatedPosts);
        setPinnedPosts(userCreatedPosts.filter((p) => p.isPinned));

        const repliedPostIds = new Set<string>();
        for (const post of allPosts) {
          const comments = await fetchComments(post.id);
          for (const comment of comments) {
            if (comment.authorId === userId) repliedPostIds.add(post.id);
            comment.replies?.forEach((reply: any) => {
              if (reply.authorId === userId) repliedPostIds.add(post.id);
            });
          }
        }

        const postsUserRepliedTo = allPosts.filter((post) =>
          repliedPostIds.has(post.id)
        );
        setPostsRepliedTo(postsUserRepliedTo);
      } catch (error) {
        console.error("Error fetching data:", error);
      }
    };

    fetchData();
  }, [userId]);

  const handleDeletePost = async (postId: string) => {
    try {
      await deletePost(postId);
      Alert.alert("Success", "Post deleted permanently.");
      setUserPosts((prev) => prev.filter((p) => p.id !== postId));
    } catch (error) {
      Alert.alert("Error", "Failed to delete post.");
    }
  };

  const handleAcceptJoinRequest = async (groupId: string, requesterId: string) => {
    try {
      await updateDoc(doc(db, "groups", groupId), {
        members: arrayUnion(requesterId),
      });

      await addNotification(
        requesterId,
        "requestGranted",
        "Your request to join the group was accepted."
      );
      Alert.alert("Accepted", "User has been added.");
    } catch (error) {
      Alert.alert("Error", "Could not accept join request.");
    }
  };

  const handleDenyJoinRequest = async (requesterId: string) => {
    try {
      await addNotification(
        requesterId,
        "requestDenied",
        "Your request to join the group was denied."
      );
      Alert.alert("Denied", "User has been notified.");
    } catch (error) {
      Alert.alert("Error", "Could not deny join request.");
    }
  };

  const sortPostsByOldest = (posts: Post[]) =>
    [...posts].sort((a, b) => b.timestamp - a.timestamp);

  const renderPost = (post: Post) => (
    <TouchableOpacity
      onPress={() =>
        onNavigate("commentsPost", { ...post, fromTab: selectedTab })
      }
    >
      <View style={styles.postCard}>
        <View style={styles.postHeader}>
          <Text style={styles.postUser}>
            {post.authorId === userId ? "You" : "Anonymous"}
          </Text>
          {post.authorId === userId && (
            <TouchableOpacity
              style={styles.deleteButton}
              onPress={() => handleDeletePost(post.id)}
            >
              <Ionicons name="trash-outline" size={18} color="red" />
            </TouchableOpacity>
          )}
        </View>
        <Text style={styles.postText}>{post.text}</Text>
        <Text
          style={[
            styles.subjectTag,
            { backgroundColor: getSubjectTagColor(post.community) },
          ]}
        >
          {post.community && post.community.trim() !== "" ? post.community : "General"}
        </Text>
        <View style={styles.postFooter}>
          <Text style={styles.timestamp}>
            {formatDistanceToNow(new Date(post.timestamp), { addSuffix: true })}
          </Text>
        </View>
      </View>
    </TouchableOpacity>
  );

  const renderTabContent = () => {
    const dataMap: { [key: string]: Post[] } = {
      posts: userPosts,
      replies: postsRepliedTo,
      pinned: pinnedPosts,
    };

    if (selectedTab === "notifications") {
      return (
        <FlatList
          data={notifications}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <View style={styles.notificationItem}>
              <Text style={styles.notificationText}>{item.text}</Text>
              {item.type === "joinRequest" && item.groupId && item.requesterId && (
                <View style={{ flexDirection: "row", marginTop: 10 }}>
                  <TouchableOpacity
                    style={[styles.button, { backgroundColor: "#5cb85c" }]}
                    onPress={() => handleAcceptJoinRequest(item.groupId!, item.requesterId!)}
                  >
                    <Text style={{ color: "white" }}>Accept</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.button, { backgroundColor: "#d9534f", marginLeft: 10 }]}
                    onPress={() => handleDenyJoinRequest(item.requesterId!)}
                  >
                    <Text style={{ color: "white" }}>Deny</Text>
                  </TouchableOpacity>
                </View>
              )}
            </View>
          )}
          ListEmptyComponent={<Text style={styles.emptyText}>No notifications yet.</Text>}
        />
      );
    }

    return (
      <FlatList
        data={sortPostsByOldest(dataMap[selectedTab] || [])}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => renderPost(item)}
        ListEmptyComponent={<Text style={styles.emptyText}>No items yet.</Text>}
      />
    );
  };

  return (
    <View style={styles.container}>
      <View style={styles.spacer} />
      <View style={styles.header}>
        {["notifications", "posts", "replies", "pinned"].map((tab) => (
          <TouchableOpacity
            key={tab}
            style={[styles.tab, selectedTab === tab && styles.activeTab]}
            onPress={() => setSelectedTab(tab)}
          >
            <Text style={styles.tabText}>
              {tab === "notifications"
                ? "Notifications"
                : tab === "posts"
                ? "My Posts"
                : tab === "replies"
                ? "My Replies"
                : "Pinned"}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {renderTabContent()}

      <View style={styles.bottomNav}>
        <TouchableOpacity onPress={() => onNavigate("publicChat")} style={styles.navItem}>
          <Ionicons name="chatbubbles-outline" size={24} color="#4a2c2a" />
          <Text style={styles.navText}>Public Chat</Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={() => onNavigate("communityGroups")} style={styles.navItem}>
          <Ionicons name="people-outline" size={24} color="#4a2c2a" />
          <Text style={styles.navText}>Community Groups</Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={() => onNavigate("notifications")} style={styles.navItem}>
          <Ionicons name="notifications-outline" size={24} color="#4a2c2a" />
          <Text style={styles.navText}>Notifications</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const getSubjectTagColor = (tag: string | undefined) => {
  const tagColors: { [key: string]: string } = {
    Mathematics: "#FFD700",
    Physics: "#1E90FF",
    Chemistry: "#FF4500",
    Biology: "#32CD32",
    "Computer Science": "#8A2BE2",
    Engineering: "#FF6347",
    Other: "#A9A9A9",
  };
  return tagColors[tag || "Other"] || "#D3D3D3";
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#fdf7f1" },
  spacer: { height: 50 },
  header: { flexDirection: "row", justifyContent: "space-around", padding: 10 },
  tab: { paddingVertical: 10 },
  activeTab: { borderBottomWidth: 2, borderBottomColor: "#4a2c2a" },
  tabText: { fontSize: 14, fontWeight: "bold", color: "#4a2c2a" },
  notificationItem: {
    backgroundColor: "#e8d7c2",
    padding: 15,
    borderRadius: 10,
    margin: 10,
  },
  notificationText: { color: "#4a2c2a" },
  postCard: {
    backgroundColor: "#ffffff",
    borderRadius: 10,
    padding: 15,
    marginHorizontal: 15,
    marginVertical: 10,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 5,
    elevation: 3,
  },
  postHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 10,
  },
  postUser: {
    fontWeight: "bold",
    color: "#4a2c2a",
    fontSize: 16,
  },
  deleteButton: { padding: 5 },
  postText: {
    fontSize: 18,
    color: "#4a2c2a",
    marginBottom: 10,
    fontWeight: "bold",
  },
  subjectTag: {
    fontSize: 14,
    color: "#ffffff",
    fontWeight: "bold",
    paddingVertical: 5,
    paddingHorizontal: 10,
    borderRadius: 5,
    alignSelf: "flex-start",
    marginBottom: 10,
  },
  postFooter: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: 10,
  },
  timestamp: { fontSize: 12, color: "gray" },
  emptyText: {
    textAlign: "center",
    fontSize: 16,
    color: "gray",
    marginTop: 20,
  },
  bottomNav: {
    flexDirection: "row",
    justifyContent: "space-around",
    paddingVertical: 20,
    backgroundColor: "#d5b89f",
    position: "absolute",
    bottom: 0,
    width: "100%",
  },
  navItem: {
    alignItems: "center",
  },
  navText: {
    fontSize: 12,
    color: "#4a2c2a",
    marginTop: 4,
  },
  button: {
    paddingVertical: 6,
    paddingHorizontal: 15,
    borderRadius: 6,
  },
});

export default NotificationsScreen;
