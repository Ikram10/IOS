import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  FlatList,
  StyleSheet,
  Alert,
} from "react-native";
import { fetchJoinRequests, acceptJoinRequest, rejectJoinRequest } from "../handle/firestore";

const ManageJoinRequestsScreen = ({ groupId, onBack }) => {
  const [joinRequests, setJoinRequests] = useState([]);

  useEffect(() => {
    const loadJoinRequests = async () => {
      try {
        const requests = await fetchJoinRequests(groupId);
        setJoinRequests(requests);
      } catch (error) {
        Alert.alert("Error", "Failed to load join requests.");
      }
    };

    loadJoinRequests();
  }, [groupId]);

  const handleAccept = async (userId) => {
    try {
      await acceptJoinRequest(groupId, userId);
      setJoinRequests((prev) =>
        prev.filter((request) => request.userId !== userId)
      );
      Alert.alert("Success", "User has been added to the group.");
    } catch (error) {
      Alert.alert("Error", "Failed to accept the request.");
    }
  };

  const handleReject = async (userId) => {
    try {
      await rejectJoinRequest(groupId, userId);
      setJoinRequests((prev) =>
        prev.filter((request) => request.userId !== userId)
      );
      Alert.alert("Success", "Request has been rejected.");
    } catch (error) {
      Alert.alert("Error", "Failed to reject the request.");
    }
  };

  const renderRequest = ({ item }) => (
    <View style={styles.requestCard}>
      <Text style={styles.requestText}>User ID: {item.userId}</Text>
      <View style={styles.actions}>
        <TouchableOpacity
          style={[styles.actionButton, { backgroundColor: "#4caf50" }]}
          onPress={() => handleAccept(item.userId)}
        >
          <Text style={styles.actionText}>Accept</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.actionButton, { backgroundColor: "#f44336" }]}
          onPress={() => handleReject(item.userId)}
        >
          <Text style={styles.actionText}>Reject</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Manage Join Requests</Text>
      <FlatList
        data={joinRequests}
        keyExtractor={(item) => item.userId}
        renderItem={renderRequest}
        ListEmptyComponent={
          <Text style={styles.emptyText}>No join requests at the moment.</Text>
        }
      />
      <TouchableOpacity style={styles.backButton} onPress={onBack}>
        <Text style={styles.backButtonText}>Back</Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20, backgroundColor: "#fdf7f1" },
  title: { fontSize: 20, fontWeight: "bold", marginBottom: 20 },
  requestCard: {
    backgroundColor: "#ffffff",
    padding: 15,
    borderRadius: 10,
    marginBottom: 10,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 5,
    elevation: 3,
  },
  requestText: { fontSize: 16, marginBottom: 10 },
  actions: { flexDirection: "row", justifyContent: "space-between" },
  actionButton: {
    padding: 10,
    borderRadius: 5,
    flex: 1,
    alignItems: "center",
    marginHorizontal: 5,
  },
  actionText: { color: "white", fontWeight: "bold" },
  emptyText: { textAlign: "center", color: "#777", marginTop: 20 },
  backButton: {
    marginTop: 20,
    padding: 15,
    backgroundColor: "#a4c3d2",
    borderRadius: 10,
    alignItems: "center",
  },
  backButtonText: { color: "white", fontWeight: "bold" },
});

export default ManageJoinRequestsScreen;