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
import { Swipeable } from "react-native-gesture-handler";
import { fetchGroups } from "../handle/firestore";
import { doc, updateDoc, arrayRemove, deleteDoc } from "firebase/firestore";
import { db } from "../handle/firebase";

interface JoinRequest {
  userId: string;
  status: "requested" | "accepted" | "denied";
}

interface GroupMessage {
  id: string;
  senderId: string;
  text: string;
}

interface CommunityGroup {
  id: string;
  name: string;
  members: string[];
  isPrivate: boolean;
  adminId: string;
  joinRequests: JoinRequest[];
  messages?: GroupMessage[];
}

interface CommunityGroupsScreenProps {
  groups: CommunityGroup[];
  setGroups: (groups: CommunityGroup[]) => void;
  userId: string;
  onNavigate: (screen: string, data?: any) => void;
  onCreateGroup: () => void;
  onJoinGroup: (groupId: string, userId: string) => void;
  onRequestToJoinGroup: (groupId: string, userId: string) => Promise<void>;
}

const CommunityGroupsScreen: React.FC<CommunityGroupsScreenProps> = ({
  groups,
  setGroups,
  userId,
  onNavigate,
  onCreateGroup,
  onJoinGroup,
  onRequestToJoinGroup,
}) => {
  const [selectedTab, setSelectedTab] = useState("public");

  useEffect(() => {
    const loadGroups = async () => {
      try {
        const fetchedGroups = await fetchGroups();
        setGroups(fetchedGroups);
      } catch (error) {
        Alert.alert("Error", "Failed to load groups. Please try again.");
      }
    };
    loadGroups();
  }, [setGroups]);  const handleLeaveGroup = async (groupId: string) => {
    try {
      await updateDoc(doc(db, "groups", groupId), {
        members: arrayRemove(userId),
      });
      Alert.alert("Left Group", "You have left the group.");
      const updatedGroups = await fetchGroups();
      setGroups(updatedGroups);
    } catch (error) {
      Alert.alert("Error", "Could not leave the group.");
    }
  };

  const handleDeleteGroup = async (groupId: string) => {
    try {
      await deleteDoc(doc(db, "groups", groupId));
      Alert.alert("Deleted", "Group has been deleted.");
      const updatedGroups = await fetchGroups();
      setGroups(updatedGroups);
    } catch (error) {
      Alert.alert("Error", "Could not delete the group.");
    }
  };

  const renderRightActions = (item: CommunityGroup) => {
    const isAdmin = item.adminId === userId;
    return (
      <View style={{ flexDirection: "row" }}>
        {isAdmin ? (
          <TouchableOpacity
            onPress={() => handleDeleteGroup(item.id)}
            style={{ backgroundColor: "red", justifyContent: "center", padding: 20 }}
          >
            <Text style={{ color: "white" }}>Delete</Text>
          </TouchableOpacity>
        ) : (
          <>
            <TouchableOpacity
              onPress={() => handleLeaveGroup(item.id)}
              style={{ backgroundColor: "#d9534f", justifyContent: "center", padding: 20 }}
            >
              <Text style={{ color: "white" }}>Leave</Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => Alert.alert("Muted", "You muted this group.")}
              style={{ backgroundColor: "#f0ad4e", justifyContent: "center", padding: 20 }}
            >
              <Text style={{ color: "white" }}>Mute</Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => Alert.alert("Reported", "You reported this group.")}
              style={{ backgroundColor: "#5bc0de", justifyContent: "center", padding: 20 }}
            >
              <Text style={{ color: "white" }}>Report</Text>
            </TouchableOpacity>
          </>
        )}
      </View>
    );
  };
  const renderGroupItem = ({ item }: { item: CommunityGroup }) => {
    const userRequest = item.joinRequests?.find((req) => req.userId === userId);
    const isMember = item.members.includes(userId);
    const hasAccess = item.isPrivate ? isMember || userRequest?.status === "accepted" : true;

 const handleJoin = async () => {
  try {
    if (item.isPrivate) {
      await onRequestToJoinGroup(item.id, userId);
      Alert.alert("Request Sent", "Your request to join the group has been sent.");
    } else {
      await onJoinGroup(item.id, userId);
Alert.alert("Joined Group", `You have joined the group: ${item.name}`);
const updatedGroups = await fetchGroups();
setGroups(updatedGroups);

    }
  } catch (err) {
    Alert.alert("Error", "Something went wrong. Please try again.");
  }
};

    return (
      <Swipeable renderRightActions={() => renderRightActions(item)}>
        <View style={styles.groupItem}>
          <TouchableOpacity
            style={{ flex: 1 }}
            onPress={() => {
              if (hasAccess) {
                onNavigate("commentCommunityGroup", {
                  ...item,
                  messages: item.messages ?? [],
                });
              } else {
                Alert.alert("Access Denied", "Please join the group first.");
              }
            }}
          >
            <Text style={styles.groupName}>{item.name}</Text>
            <Text style={styles.membersText}>{item.members.length} members</Text>
            {item.isPrivate && <Text style={styles.privateTag}>Private</Text>}
            {selectedTab === "myGroups" && userRequest && (
              <Text
                style={[
                  styles.statusTag,
                  userRequest.status === "requested" && styles.requestedTag,
                  userRequest.status === "accepted" && styles.acceptedTag,
                  userRequest.status === "denied" && styles.deniedTag,
                ]}
              >
                {userRequest.status.charAt(0).toUpperCase() + userRequest.status.slice(1)}
              </Text>
            )}
          </TouchableOpacity>

          {!isMember && selectedTab !== "myGroups" && (
            <TouchableOpacity style={styles.joinButton} onPress={handleJoin}>
              <Text style={styles.joinButtonText}>
                {item.isPrivate ? "Request to Join" : "Join"}
              </Text>
            </TouchableOpacity>
          )}

          {selectedTab === "myGroups" && isMember && (
            <TouchableOpacity
              style={[styles.joinButton, { backgroundColor: "#d9534f" }]}
              onPress={() => handleLeaveGroup(item.id)}
            >
              <Text style={styles.joinButtonText}>Leave</Text>
            </TouchableOpacity>
          )}
        </View>
      </Swipeable>
    );
  };

  const filteredGroups =
    selectedTab === "public"
      ? groups.filter(
          (group) =>
            !group.isPrivate &&
            !group.members.includes(userId) &&
            group.adminId !== userId &&
            !group.joinRequests.some((req) => req.userId === userId)
        )
      : selectedTab === "private"
      ? groups.filter(
          (group) =>
            group.isPrivate &&
            !group.members.includes(userId) &&
            group.adminId !== userId &&
            !group.joinRequests.some((req) => req.userId === userId)
        )
      : selectedTab === "joined"
      ? groups.filter((group) => group.members.includes(userId))
      : groups.filter(
          (group) =>
            group.members.includes(userId) ||
            group.adminId === userId ||
            group.joinRequests.some((req) => req.userId === userId)
        );
 return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => onNavigate("publicChat")} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="#4a2c2a" />
        </TouchableOpacity>
        <Text style={styles.title}>Community Groups</Text>
      </View>

      <View style={styles.tabs}>
        {["public", "private", "myGroups", "joined"].map((tabKey) => (
          <TouchableOpacity
            key={tabKey}
            style={[styles.tab, selectedTab === tabKey && styles.activeTab]}
            onPress={() => setSelectedTab(tabKey)}
          >
            <Text style={styles.tabText}>
              {tabKey === "public"
                ? "Public Groups"
                : tabKey === "private"
                ? "Private Groups"
                : tabKey === "myGroups"
                ? "My Groups"
                : "Joined Groups"}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <FlatList
        data={filteredGroups}
        keyExtractor={(item) => item.id}
        renderItem={renderGroupItem}
        contentContainerStyle={{ paddingBottom: 100 }}
      />

      <TouchableOpacity
        style={styles.addButton}
        onPress={() => onNavigate("createCommunityGroup")}
      >
        <Text style={styles.plus}>+</Text>
      </TouchableOpacity>

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

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#fdf7f1", paddingTop: 50 },
  header: { alignItems: "center", marginBottom: 20, position: "relative" },
  backButton: { position: "absolute", left: 15, top: 15, padding: 10 },
  title: { fontSize: 24, fontWeight: "bold", color: "#4a2c2a" },
  tabs: {
    flexDirection: "row",
    justifyContent: "space-around",
    paddingHorizontal: 10,
    marginBottom: 20,
  },
  tab: {
    flex: 1,
    alignItems: "center",
    paddingVertical: 10,
    paddingHorizontal: 5,
  },
  activeTab: {
    borderBottomWidth: 2,
    borderBottomColor: "#4a2c2a",
  },
  tabText: {
    fontSize: 14,
    color: "#4a2c2a",
    textAlign: "center",
    flexWrap: "wrap",
  },
  groupItem: {
    backgroundColor: "#e8d7c2",
    padding: 15,
    borderRadius: 10,
    marginHorizontal: 15,
    marginVertical: 10,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  groupName: { fontSize: 18, fontWeight: "bold", color: "#4a2c2a" },
  membersText: { fontSize: 14, color: "#4a2c2a" },
  privateTag: { fontSize: 12, color: "red", fontStyle: "italic" },
  joinButton: {
    backgroundColor: "#a4c3d2",
    padding: 10,
    borderRadius: 10,
  },
  joinButtonText: { color: "white", fontWeight: "bold" },
  addButton: {
    position: "absolute",
    bottom: 120,
    alignSelf: "center",
    backgroundColor: "#a4c3d2",
    width: 70,
    height: 70,
    borderRadius: 35,
    justifyContent: "center",
    alignItems: "center",
    elevation: 5,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 5,
  },
  plus: { fontSize: 36, color: "white", fontWeight: "bold" },
  bottomNav: {
    flexDirection: "row",
    justifyContent: "space-around",
    paddingVertical: 20,
    backgroundColor: "#d5b89f",
    position: "absolute",
    bottom: 0,
    width: "100%",
  },
  navItem: { alignItems: "center" },
  navText: { fontSize: 12, color: "#4a2c2a", marginTop: 4 },
  statusTag: {
    marginTop: 5,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 5,
    fontSize: 12,
    fontWeight: "bold",
    textAlign: "center",
  },
  requestedTag: { backgroundColor: "#f0ad4e", color: "white" },
  acceptedTag: { backgroundColor: "#5cb85c", color: "white" },
  deniedTag: { backgroundColor: "#d9534f", color: "white" },
});

export default CommunityGroupsScreen;
