import React, { useState } from "react";
import { View, StatusBar, Alert } from "react-native";
import { GestureHandlerRootView } from "react-native-gesture-handler"; // ✅ REQUIRED FOR SWIPE
import SplashScreen from "./Screens/SplashScreen";
import LoginScreen from "./Screens/LoginScreen";
import PublicChatScreen from "./Screens/PublicChatScreen";
import CreatePostScreen from "./Screens/CreatePostScreen";
import CommentsPostScreen from "./Screens/CommentsPostScreen";
import CommunityGroupsScreen from "./Screens/CommunityGroupsScreen";
import CreateCommunityGroupScreen from "./Screens/CreateCommunityGroupScreen";
import CommentCommunityGroupScreen from "./Screens/CommentCommunityGroup";
import NotificationsScreen from "./Screens/NotificationsScreen";
import WaitingForVerificationScreen from "./Screens/WaitingForVerificationScreen";
import ForgotPasswordScreen from "./Screens/ForgotPasswordScreen";
import { doc, updateDoc, arrayUnion, getDoc } from "firebase/firestore";
import { db } from "./handle/firebase";
import { addNotification } from "./handle/firestore";

export default function App() {
  const [screen, setScreen] = useState("splash");
  const [posts, setPosts] = useState([]);
  const [groups, setGroups] = useState([]);
  const [selectedPost, setSelectedPost] = useState(null);
  const [selectedGroup, setSelectedGroup] = useState(null);
  const [userId, setUserId] = useState(null);
  const [notifications, setNotifications] = useState([]);
  const [fromTab, setFromTab] = useState(null);

  const handleLoginSuccess = (uid) => {
    if (!uid) {
      Alert.alert("Error", "Failed to retrieve user ID. Please try again.");
      return;
    }
    setUserId(uid);
    setScreen("verification");
  };

  const onRequestToJoinGroup = async (groupId, userId) => {
    try {
      const groupRef = doc(db, "groups", groupId);
      const groupSnap = await getDoc(groupRef);
      const groupData = groupSnap.data();

      const alreadyRequested = (groupData?.joinRequests || []).some(
        (req) => req.userId === userId
      );
      if (alreadyRequested) return;

      await updateDoc(groupRef, {
        joinRequests: arrayUnion({ userId, status: "requested" }),
      });

      await addNotification(
        groupData.adminId,
        "joinRequest",
        `User ${userId} has requested to join your group.`,
        { groupId, requesterId: userId }
      );
    } catch (error) {
      console.error("Join request error:", error);
    }
  };

  const onNavigate = (nextScreen, data) => {
    if (nextScreen === "commentsPost" && data) {
      setFromTab(data.fromTab || null);
      setSelectedPost(data);
      setScreen("commentsPost");
    } else if (nextScreen === "commentCommunityGroup" && data) {
      setSelectedGroup(data);
      setScreen("commentCommunityGroup");
    } else if (nextScreen === "notifications") {
      setFromTab(data?.initialTab || null);
      setScreen("notifications");
    } else {
      setScreen(nextScreen);
    }
  };

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <View style={{ flex: 1 }}>
        <StatusBar style="auto" />

        {screen === "splash" ? (
          <SplashScreen onComplete={() => setScreen("login")} />
        ) : screen === "login" ? (
          <LoginScreen
            onLoginSuccess={handleLoginSuccess}
            onForgotPassword={() => setScreen("forgotPassword")}
          />
        ) : screen === "forgotPassword" ? (
          <ForgotPasswordScreen onBack={() => setScreen("login")} />
        ) : screen === "verification" ? (
          <WaitingForVerificationScreen onVerifySuccess={() => setScreen("publicChat")} />
        ) : screen === "publicChat" ? (
          <PublicChatScreen userId={userId} onNavigate={onNavigate} />
        ) : screen === "notifications" ? (
          <NotificationsScreen
            notifications={notifications}
            posts={posts}
            onNavigate={onNavigate}
            onToggleMute={(id) => console.log(`Muted ${id}`)}
            onEditPost={(postId, newText) => console.log(`Edited post ${postId}`)}
            onLeaveCommunity={(community) => console.log(`Left ${community}`)}
            userId={userId}
            initialTab={fromTab || "notifications"}
          />
        ) : screen === "commentsPost" && selectedPost ? (
          <CommentsPostScreen
            post={selectedPost}
            userId={userId}
            onBack={() => {
              if (["replies", "posts", "pinned"].includes(fromTab)) {
                onNavigate("notifications", { initialTab: fromTab });
              } else {
                setScreen("publicChat");
              }
            }}
          />
        ) : screen === "communityGroups" ? (
          <CommunityGroupsScreen
            groups={groups}
            setGroups={setGroups}
            userId={userId}
            onNavigate={onNavigate}
            onCreateGroup={() => setScreen("createCommunityGroup")}
            onJoinGroup={() => {}}
            onRequestToJoinGroup={onRequestToJoinGroup}
          />
        ) : screen === "createPost" ? (
          <CreatePostScreen userId={userId} onBack={() => setScreen("publicChat")} onNavigate={onNavigate} />
        ) : screen === "createCommunityGroup" ? (
          <CreateCommunityGroupScreen
            userId={userId}
            onCreateGroup={(groupId, name, isPrivate) => {
              setGroups((prev) => [
                ...prev,
                {
                  id: groupId,
                  name,
                  isPrivate,
                  adminId: userId,
                  members: [userId],
                  joinRequests: [],
                  messages: [],
                },
              ]);
            }}
            onBack={() => setScreen("communityGroups")}
          />
        ) : screen === "commentCommunityGroup" && selectedGroup ? (
          <CommentCommunityGroupScreen
            group={selectedGroup}
            userId={userId}
            onBack={() => {
              setSelectedGroup(null);
              setScreen("communityGroups");
            }}
            onSendMessage={(groupId, message) => {
              setGroups((prevGroups) =>
                prevGroups.map((group) =>
                  group.id === groupId
                    ? {
                        ...group,
                        messages: [
                          ...(group.messages || []),
                          { id: Date.now().toString(), senderId: userId, text: message },
                        ],
                      }
                    : group
                )
              );
            }}
          />
        ) : null}
      </View>
    </GestureHandlerRootView>
  );
}
