import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  FlatList,
  StyleSheet,
  Image,
  Alert,
  RefreshControl,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import {
  fetchPosts,
  updateVote,
  addPost,
  addHiddenPost,
  reportContent,
  pinPost,
  updatePostText
} from "../handle/firestore";
import { moderateContent } from "../handle/perspective_ai";
import {doc, getDoc, updateDoc} from "firebase/firestore";
import {db} from "../handle/firebase";

const PublicChatScreen = ({ onNavigate, userId }) => {
  const [posts, setPosts] = useState([]);
  const [refreshing, setRefreshing] = useState(false);
  const [filter, setFilter] = useState("All");
  const [sort, setSort] = useState("Most Recent");


  const predefinedTags = [
    "All",
    "Mathematics",
    "Physics",
    "Chemistry",
    "Biology",
    "Computer Science",
    "Engineering",
    "Economics",
    "Psychology",
    "Sociology",
    "History",
    "Philosophy",
    "Literature",
    "Art",
    "Law",
    "Medicine",
    "Business",
    "Education",
    "Political Science",
    "Environmental Science",
  ];


  useEffect(() => {
    const loadPosts = async () => {
      try {
        const fetchedPosts = await fetchPosts(userId);
        console.log("Fetched posts:", fetchedPosts);
        setPosts(fetchedPosts);
      } catch (error) {
        console.error("Error loading posts:", error);
      }
    };
    loadPosts();
  }, [userId]);


  const refreshPosts = async () => {
    setRefreshing(true);
    try {
      const fetchedPosts = await fetchPosts(userId);
      setPosts(fetchedPosts);
    } catch (error) {
      console.error("Error refreshing posts:", error);
      Alert.alert("Error", "Failed to refresh posts. Please try again.");
    } finally {
      setRefreshing(false);
    }
  };

  const handleVote = async (postId, type) => {
    if (!userId) {
      Alert.alert("Error", "User ID is missing. Please log in again.");
      return;
    }

    try {
      await updateVote(postId, userId, type);


      const updatedPosts = posts.map((post) => {
        if (post.id === postId) {
          const userVote = post.voters.find((voter) => voter.userId === userId);

          if (userVote) {
            if (userVote.type === type) {

              return {
                ...post,
                [type === "upvote" ? "upvotes" : "downvotes"]: post[type === "upvote" ? "upvotes" : "downvotes"] - 1,
                voters: post.voters.filter((voter) => voter.userId !== userId),
              };
            } else {

              return {
                ...post,
                upvotes: post.upvotes + (type === "upvote" ? 1 : -1),
                downvotes: post.downvotes + (type === "downvote" ? 1 : -1),
                voters: post.voters.map((voter) =>
                  voter.userId === userId ? { userId, type } : voter
                ),
              };
            }
          } else {

            return {
              ...post,
              [type === "upvote" ? "upvotes" : "downvotes"]: post[type === "upvote" ? "upvotes" : "downvotes"] + 1,
              voters: [...post.voters, { userId, type }],
            };
          }
        }
        return post;
      });

      setPosts(updatedPosts);
    } catch (error) {
      console.error("Error handling vote:", error);
    }
  };

  const handleReport = async (postId, authorId) => {
    try {
      console.log("Reporting post:", { postId, authorId });
      await reportContent(postId, "post", authorId, userId);
      Alert.alert("Report Submitted", "The post has been reported and will be reviewed.");
      refreshPosts();
    } catch (error) {
      console.error("Error reporting post:", error);
      Alert.alert("Error", "Failed to report the post. Please try again.");
    }
  };

  const handleHidePost = async (postId) => {
    try {

      await addHiddenPost(userId, postId);


      setPosts((prevPosts) => prevPosts.filter((post) => post.id !== postId));

      Alert.alert("Post Hidden", "This post has been hidden from your feed.", [
        { text: "OK" },
      ]);
    } catch (error) {
      console.error("Error hiding post:", error);
      Alert.alert("Error", "Failed to hide the post. Please try again.");
    }
  };
  const handlePinPost = async (postId) => {
  try {
    const postToPin = posts.find((p) => p.id === postId);
    if (!postToPin) return;

    // Avoid double pinning
    if (postToPin.text.toLowerCase().includes("[pin]")) {
      Alert.alert("Already Pinned", "This post is already pinned.");
      return;
    }

    const updatedText = `[pin] ${postToPin.text}`;
    await updatePostText(postId, updatedText); // <-- You'll add this in firestore
    refreshPosts();
    Alert.alert("Post Pinned", "This post has been pinned and appears in your profile.");
  } catch (error) {
    console.error("Error pinning post:", error);
    Alert.alert("Error", "Failed to pin post. Please try again.");
  }
};


  // Function to handle posting a new post
  const handlePost = async (postText) => {
    if (!postText.trim()) {
      Alert.alert("Error", "Post content cannot be empty.");
      return;
    }

    try {

      const isSensitive = await moderateContent(postText.trim());
      if (isSensitive) {
        Alert.alert(
          "Sensitive Content Warning",
          "The content you are about to post contains sensitive material. Posting such content could risk having your account suspended or permanently banned.",
          [
            {
              text: "Cancel",
              style: "cancel",
            },
            {
              text: "Proceed Anyway",
              onPress: async () => {
                await addPost(postText.trim(), userId);
                Alert.alert("Success", "Your post has been published.");
                refreshPosts();
              },
            },
          ]
        );
      } else {

        await addPost(postText.trim(), userId);
        Alert.alert("Success", "Your post has been published.");
        refreshPosts();
      }
    } catch (error) {
      console.error("Error saving post:", error);
      Alert.alert("Error", "Failed to save post. Please try again.");
    }
  };

const handleMoreOptions = (postId, authorId) => {
  const selectedPost = posts.find((post) => post.id === postId);
  const isPinned = selectedPost?.isPinned;

  Alert.alert(
    "Post Options",
    "What would you like to do?",
    [
      {
        text: isPinned ? "Unpin" : "Pin",
        onPress: async () => {
          try {
            const postRef = doc(db, "posts", postId);
            await updateDoc(postRef, {
              isPinned: !isPinned, // ✅ only update pin flag
            });

            // Optional: Show confirmation
            Alert.alert(
              "Success",
              isPinned ? "Post unpinned." : "Post pinned."
            );

            refreshPosts(); // ✅ reload to reflect changes
          } catch (error) {
            console.error("Error pinning/unpinning post:", error);
            Alert.alert("Error", "Failed to update pin status.");
          }
        },
      },
      {
        text: "Report",
        onPress: () => handleReport(postId, authorId),
      },
      {
        text: "Hide",
        onPress: () => handleHidePost(postId),
      },
      {
        text: "Cancel",
        style: "cancel",
      },
    ],
    { cancelable: true }
  );
};


  const filteredPosts = Array.isArray(posts)
    ? posts.filter((post) => filter === "All" || post.subjectTag === filter)
    : [];

  const sortedPosts = [...filteredPosts].sort((a, b) => {
    if (sort === "Most Upvotes") return b.upvotes - a.upvotes;
    if (sort === "Most Downvotes") return b.downvotes - a.downvotes;
    if (sort === "Most Recent") return b.timestamp - a.timestamp;
    if (sort === "Oldest") return a.timestamp - b.timestamp;
    return 0;
  });

  const getSubjectTagColor = (tag) => {
    const tagColors = {
      Mathematics: "#FFD700",
      Physics: "#1E90FF",
      Chemistry: "#FF4500",
      Biology: "#32CD32",
      "Computer Science": "#8A2BE2",
      Engineering: "#FF6347",
      Economics: "#4682B4",
      Psychology: "#FF69B4",
      Sociology: "#20B2AA",
      History: "#D2691E",
      Philosophy: "#708090",
      Literature: "#6A5ACD",
      Art: "#FF1493",
      Law: "#2E8B57",
      Medicine: "#DC143C",
      Business: "#FFA500",
      Education: "#00CED1",
      "Political Science": "#8B0000",
      "Environmental Science": "#228B22",
      Other: "#A9A9A9",
    };

    return tagColors[tag] || "#D3D3D3";
  };

  return (
    <View style={styles.container}>
      {/* Header with Logo */}
      <View style={styles.header}>
        <View style={styles.circleBg}>
          <Image source={require("../assets/logo2.png")} style={styles.logo} />
        </View>
        <Text style={styles.title}>Public Chat</Text>
      </View>

      {/* Filter Options */}
      <View style={styles.filterSortContainer}>
        <Text style={styles.label}>Filter:</Text>
        <FlatList
          data={predefinedTags}
          horizontal
          keyExtractor={(item) => item}
          renderItem={({ item }) => (
            <TouchableOpacity onPress={() => setFilter(item)}>
              <Text
                style={filter === item ? styles.activeOption : styles.option}
              >
                {item}
              </Text>
            </TouchableOpacity>
          )}
          showsHorizontalScrollIndicator={false}
        />
      </View>

      {/* Sort Options */}
      <View style={styles.filterSortContainer}>
        <Text style={styles.label}>Sort:</Text>
        <TouchableOpacity onPress={() => setSort("Most Recent")}>
          <Text
            style={sort === "Most Recent" ? styles.activeOption : styles.option}
          >
            Most Recent
          </Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={() => setSort("Most Upvotes")}>
          <Text
            style={sort === "Most Upvotes" ? styles.activeOption : styles.option}
          >
            Most Upvotes
          </Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={() => setSort("Most Downvotes")}>
          <Text
            style={
              sort === "Most Downvotes" ? styles.activeOption : styles.option
            }
          >
            Most Downvotes
          </Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={() => setSort("Oldest")}>
          <Text style={sort === "Oldest" ? styles.activeOption : styles.option}>
            Oldest
          </Text>
        </TouchableOpacity>
      </View>

      {/* List of Anonymous Posts */}
      <FlatList
        data={sortedPosts}
        keyExtractor={(item) => item.id?.toString() || Math.random().toString()}
        renderItem={({ item }) => (
          <TouchableOpacity
            onPress={() => onNavigate("commentsPost", item)} // Pass the selected post data
          >
            <View style={styles.postCard}>
              {/* Header Section */}
             <View style={styles.postHeader}>
  <View style={{ flexDirection: "row", alignItems: "center" }}>
    {item.isPinned && (
      <Ionicons name="pin" size={20} color="red" style={{ marginRight: 5 }} />
    )}
  </View>
  <TouchableOpacity
    style={styles.moreOptions}
    onPress={() => handleMoreOptions(item.id, item.authorId)}
  >
    <Ionicons name="ellipsis-vertical" size={24} color="#4a2c2a" />
  </TouchableOpacity>
</View>

              {/* Post Content */}
              <Text style={styles.postText}>{item.text || "No content available"}</Text>

              {/* Subject Tag */}
              <Text
                style={[
                  styles.subjectTag,
                  { backgroundColor: getSubjectTagColor(item.subjectTag) },
                ]}
              >
                {item.subjectTag || "No Tag"}
              </Text>

              {/* Footer Section */}
              <View style={styles.postFooter}>
                <Text style={styles.timestamp}>{item.timeAgo || "Unknown time"}</Text>
                <View style={styles.voteContainer}>
                  <TouchableOpacity onPress={() => handleVote(item.id, "upvote")}>
                    <Ionicons
                      name="arrow-up"
                      size={20}
                      color={
                        item.voters?.some(
                          (voter) =>
                            voter.userId === userId && voter.type === "upvote"
                        )
                          ? "green"
                          : "#4a2c2a"
                      }
                    />
                  </TouchableOpacity>
                  <Text style={styles.voteCount}>{item.upvotes || 0}</Text>
                  <TouchableOpacity onPress={() => handleVote(item.id, "downvote")}>
                    <Ionicons
                      name="arrow-down"
                      size={20}
                      color={
                        item.voters?.some(
                          (voter) =>
                            voter.userId === userId && voter.type === "downvote"
                        )
                          ? "red"
                          : "#4a2c2a"
                      }
                    />
                  </TouchableOpacity>
                  <Text style={styles.voteCount}>{item.downvotes || 0}</Text>
                </View>
                <Text style={styles.commentCount}>
                  {item.commentsCount || 0}{" "}
                  {item.commentsCount === 1 ? "comment" : "comments"}
                </Text>
              </View>
            </View>
          </TouchableOpacity>
        )}
        contentContainerStyle={styles.flatListContent}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={refreshPosts} />
        }
      />

      {/* Floating Plus Button - Navigates to Create Post Screen */}
      <TouchableOpacity
        style={styles.addButton}
        onPress={() => onNavigate("createPost")}
      >
        <Text style={styles.plus}>+</Text>
      </TouchableOpacity>

      {/* Bottom Navigation */}
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
  container: {
    flex: 1,
    backgroundColor: "#fdf7f1",
    paddingTop: 80,
  },
  header: {
    alignItems: "center",
    marginBottom: 30,
    marginTop: 20,
  },
  circleBg: {
    width: 100,
    height: 100,
    backgroundColor: "#e8d7c2",
    borderRadius: 50,
    justifyContent: "center",
    alignItems: "center",
  },
  logo: {
    width: 150,
    height: 150,
    marginLeft: -10,
    marginTop: 30,
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#4a2c2a",
    marginTop: 20,
  },
  flatListContent: {
    paddingBottom: 200,
  },
  filterSortContainer: {
    flexDirection: "row",
    marginBottom: 10,
    alignItems: "center",
    paddingHorizontal: 15,
  },
  label: { fontWeight: "bold", marginRight: 10 },
  option: { marginRight: 10, color: "gray" },
  activeOption: { marginRight: 10, color: "blue" },
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
  moreOptions: {
    padding: 10,
  },
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
  timestamp: {
    fontSize: 12,
    color: "gray",
  },
  voteContainer: {
    flexDirection: "row",
    alignItems: "center",
  },
  voteCount: {
    fontSize: 16,
    fontWeight: "bold",
    marginHorizontal: 5,
    color: "#4a2c2a",
  },
  commentCount: {
    fontSize: 14,
    color: "#777",
  },
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
  },
  plus: {
    fontSize: 36,
    color: "white",
    fontWeight: "bold",
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
});

export default PublicChatScreen;
