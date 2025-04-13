import { db } from "./firebase";
import { moderateContent } from "./perspective_ai";
import {
  collection,
  addDoc,
  getDocs,
  query,
  orderBy,
  serverTimestamp,
  doc,
  updateDoc,
  increment,
  getDoc,
  arrayUnion,
  setDoc,
  deleteDoc,
} from "firebase/firestore";
import { formatDistanceToNow } from "date-fns";
;

// Fetch all posts from Firestore
const fetchPosts = async (userId) => {
  try {
    const userRef = doc(db, "users", userId);
    const userSnapshot = await getDoc(userRef);

    // Ensure hiddenPosts is an array or default to an empty array
    const hiddenPosts = userSnapshot.exists()
      ? Array.isArray(userSnapshot.data().hiddenPosts)
        ? userSnapshot.data().hiddenPosts
        : []
      : [];

    const postsSnapshot = await getDocs(collection(db, "posts"));

  const posts = postsSnapshot.docs
  .map((doc) => {
    const data = doc.data();
    const timestamp = data.timestamp?.toDate() || new Date();
    return {
      id: doc.id,
      text: data.text || "", // ensure text is defined
      authorId: data.authorId || "unknown", // ensure authorId is defined
      ...data,
      isPinned: data.isPinned || false,
      timestamp,
      timeAgo: formatDistanceToNow(timestamp, { addSuffix: true }),
    };
  })
      .filter((post) => !hiddenPosts.includes(post.id)); // Exclude hidden posts

    console.log("Fetched posts:", posts);
    return posts;
  } catch (error) {
    console.error("Error fetching posts:", error);
    throw error;
  }
};

const updatePostText = async (postId, newText) => {
  try {
    const postRef = doc(db, "posts", postId);
    await updateDoc(postRef, {
      text: newText,
    });
    console.log(`Post ${postId} text updated successfully.`);
  } catch (error) {
    console.error("Error updating post text:", error);
    throw error;
  }
};

// Add a new post with text, authorId, and subjectTag
const addPost = async (text, authorId, subjectTag) => {
  try {
    await addDoc(collection(db, "posts"), {
      text,
      authorId, // Ensure the authorId is saved
      subjectTag,
      isPinned: false,
      timestamp: serverTimestamp(),
      upvotes: 0,
      downvotes: 0,
      commentsCount: 0,
      voters: [],
    });
    console.log("Post added to Firestore with subject tag:", subjectTag);
  } catch (error) {
    console.error("Error adding post to Firestore:", error);
    throw error;
  }
};

const pinPost = async (postId) => {
  try {
    const postRef = doc(db, "posts", postId);
    const postSnap = await getDoc(postRef);

    if (!postSnap.exists()) {
      throw new Error("Post not found");
    }

    const data = postSnap.data();
    const text = data.text || "";

    const alreadyPinnedText = text.startsWith("[PIN]") ? text : `[PIN] ${text}`;

    await updateDoc(postRef, {
      isPinned: true,
      text: alreadyPinnedText,
    });

    console.log(`Post ${postId} pinned successfully.`);
  } catch (error) {
    console.error("Error pinning post:", error);
    throw error;
  }
};

// Add a new comment to a post
const addComment = async (postId, text, authorId) => {
  try {
    const commentRef = await addDoc(collection(db, `posts/${postId}/comments`), {
      text,
      authorId,
      timestamp: serverTimestamp(),
    });

    // Update the post's comment count
    const postRef = doc(db, "posts", postId);
    await updateDoc(postRef, { commentsCount: increment(1) });

    // Notify the post author
    const postSnapshot = await getDoc(postRef);
    const postData = postSnapshot.data();
    if (postData.authorId !== authorId) {
      await addNotification(
        postData.authorId,
        "comment",
        "Someone commented on your post."
      );
    }

    console.log("Comment added successfully");
    return commentRef.id; // 👈 Return the actual Firestore ID

  } catch (error) {
    console.error("Error adding comment:", error);
    throw error;
  }
};


// Fetch comments for a specific post
const fetchComments = async (postId) => {
  try {
    const q = query(collection(db, `posts/${postId}/comments`), orderBy("timestamp", "asc"));
    const querySnapshot = await getDocs(q);

    const fetchedComments = querySnapshot.docs.map((doc) => {
      const data = doc.data();
      const timestamp = data.timestamp?.toDate() || new Date();

      const repliesWithTimeAgo = (Array.isArray(data.replies) ? data.replies : []).map((reply) => ({
        id: reply.id,
        text: reply.text,
        authorId: reply.authorId,
        timestamp: reply.timestamp?.toDate() || new Date(),
        timeAgo: formatDistanceToNow(reply.timestamp?.toDate() || new Date(), { addSuffix: true }),
      }));

      return {
        id: doc.id,
        text: data.text || "",
        authorId: data.authorId || "", // ✅ ensures authorId is present
        timestamp,
        timeAgo: formatDistanceToNow(timestamp, { addSuffix: true }),
        replies: repliesWithTimeAgo,
      };
    });

    return fetchedComments;
  } catch (error) {
    console.error("Error fetching comments:", error);
    return [];
  }
};

// Update votes for a post
const updateVotes = async (postId, incrementValue) => {
  try {
    const postRef = doc(db, "posts", postId);
    await updateDoc(postRef, {
      votes: increment(incrementValue),
    });
    console.log("Votes updated successfully");
  } catch (error) {
    console.error("Error updating votes:", error);
  }
};

// Update upvotes for a post
const updateUpvotes = async (postId, userId) => {
  try {
    const postRef = doc(db, "posts", postId);
    const postSnapshot = await getDoc(postRef);

    if (postSnapshot.exists()) {
      const postData = postSnapshot.data();

      // Check if the user has already voted
      if (postData.voters && postData.voters.some((voter) => voter.userId === userId)) {
        console.log("User has already voted on this post.");
        return;
      }

      // Increment upvotes and add user to voters array
      await updateDoc(postRef, {
        upvotes: increment(1),
        voters: [...postData.voters, { userId, type: "upvote" }],
      });

      console.log(`Upvotes updated for post ID: ${postId}`);
    }
  } catch (error) {
    console.error("Error updating upvotes:", error);
  }
};

// Update downvotes for a post
const updateDownvotes = async (postId, userId) => {
  try {
    const postRef = doc(db, "posts", postId);
    const postSnapshot = await getDoc(postRef);

    if (postSnapshot.exists()) {
      const postData = postSnapshot.data();

      // Check if the user has already voted
      if (postData.voters && postData.voters.some((voter) => voter.userId === userId)) {
        console.log("User has already voted on this post.");
        return;
      }

      // Increment downvotes and add user to voters array
      await updateDoc(postRef, {
        downvotes: increment(1),
        voters: [...postData.voters, { userId, type: "downvote" }],
      });

      console.log(`Downvotes updated for post ID: ${postId}`);
    }
  } catch (error) {
    console.error("Error updating downvotes:", error);
  }
};

const updateVote = async (postId, userId, type) => {
  try {
    console.log("Updating vote for post:", postId, "User:", userId, "Type:", type);

    const postRef = doc(db, "posts", postId);
    const postSnapshot = await getDoc(postRef);

    if (!postSnapshot.exists()) {
      console.error("Post not found:", postId);
      throw new Error("Post not found.");
    }

    const postData = postSnapshot.data();
    console.log("Post data:", postData);

    const voters = postData.voters || [];
    const userVote = voters.find((voter) => voter.userId === userId);

    if (userVote) {
      if (userVote.type === type) {
        console.log("Resetting vote for user:", userId);
        const updatedVoters = voters.filter((voter) => voter.userId !== userId);
        const voteField = type === "upvote" ? "upvotes" : "downvotes";

        await updateDoc(postRef, {
          [voteField]: increment(-1),
          voters: updatedVoters,
        });
      } else {
        console.log("Switching vote for user:", userId);
        const updatedVoters = voters.map((voter) =>
          voter.userId === userId ? { userId, type } : voter
        );

        await updateDoc(postRef, {
          upvotes: type === "upvote" ? increment(1) : increment(-1),
          downvotes: type === "downvote" ? increment(1) : increment(-1),
          voters: updatedVoters,
        });
      }
    } else {
      console.log("Adding new vote for user:", userId);
      await updateDoc(postRef, {
        [type === "upvote" ? "upvotes" : "downvotes"]: increment(1),
        voters: [...voters, { userId, type }],
      });
    }

    console.log("Vote updated successfully for post:", postId);
  } catch (error) {
    console.error("Error updating vote:", error);
    throw error;
  }
};

const addHiddenPost = async (userId, postId) => {
  try {
    const userRef = doc(db, "users", userId);
    const userSnapshot = await getDoc(userRef);

    if (!userSnapshot.exists()) {
      // If the user document doesn't exist, create it with an empty hiddenPosts array
      await setDoc(userRef, { hiddenPosts: [] });
    }

    // Add the post ID to the hiddenPosts array
    await updateDoc(userRef, {
      hiddenPosts: arrayUnion(postId),
    });

    console.log(`Post ${postId} hidden for user ${userId}`);
  } catch (error) {
    console.error("Error hiding post:", error);
    throw error;
  }
};

const fetchHiddenPosts = async (userId) => {
  try {
    const userRef = doc(db, "users", userId);
    const userSnapshot = await getDoc(userRef);
    if (userSnapshot.exists()) {
      const userData = userSnapshot.data();
      return userData.hiddenPosts || []; // Return the hiddenPosts array or an empty array
    }
    return [];
  } catch (error) {
    console.error("Error fetching hidden posts:", error);
    return [];
  }
};

const addReply = async (postId, commentId, text, authorId) => {
  try {
    const commentRef = doc(db, `posts/${postId}/comments`, commentId);

    // Ensure the comment document exists
    const commentSnapshot = await getDoc(commentRef);
    if (!commentSnapshot.exists()) {
      throw new Error(`Comment with ID ${commentId} does not exist.`);
    }

    // Create the reply object
    const reply = {
      id: Date.now().toString(),
      text,
      authorId,
      timestamp: new Date(), // Use a JavaScript Date object
    };

    // Update the comment document with the new reply
    await updateDoc(commentRef, {
      replies: arrayUnion(reply),
    });

    console.log("Reply added successfully");
  } catch (error) {
    console.error("Error adding reply:", error);
    throw error;
  }
};

// Add a new group to Firestore
const addGroup = async (groupName, isPrivate, adminId) => {
  try {
    const groupRef = await addDoc(collection(db, "groups"), {
      name: groupName,
      isPrivate,
      adminId,
      members: [adminId], // Add the admin as the first member
      joinRequests: [], // Initialize with no join requests
      messages: [], // Initialize with no messages
      createdAt: serverTimestamp(), // Add a timestamp
    });

    console.log("Group added with ID:", groupRef.id);
    return groupRef.id;
  } catch (error) {
    console.error("Error adding group:", error);
    throw error;
  }
};

// Fetch all groups from Firestore
const fetchGroups = async () => {
  try {
    const q = query(collection(db, "groups"), orderBy("createdAt", "desc"));
    const querySnapshot = await getDocs(q);

    const groups = querySnapshot.docs.map((doc) => ({
      id: doc.id,
      name: doc.data().name || "Unnamed Group",
      members: Array.isArray(doc.data().members) ? doc.data().members : [], // Ensure members is an array
      isPrivate: doc.data().isPrivate || false,
      adminId: doc.data().adminId || "",
      joinRequests: doc.data().joinRequests || [], // Default to an empty array if joinRequests is missing
     messages: Array.isArray(doc.data().messages) ? doc.data().messages : [], // Ensure messages is an array
    }));

    console.log("Fetched groups:", groups);
    return groups;
  } catch (error) {
    console.error("Error fetching groups:", error);
    throw error;
  }
};
const onJoinGroup = async (groupId, userId) => {
  try {
    const groupRef = doc(db, "groups", groupId);
    await updateDoc(groupRef, {
      members: arrayUnion(userId),
    });

    console.log(`User ${userId} joined group ${groupId}`);
  } catch (error) {
    console.error("Error joining group:", error);
    throw error;
  }
};

const onSendMessage = async (groupId, messageText) => {
  const message = {
    id: Date.now().toString(),
    senderId: userId,
    text: messageText,
    timestamp: new Date(),
  };

  try {
    const groupRef = doc(db, "groups", groupId);
    await updateDoc(groupRef, {
      messages: arrayUnion(message),
    });
  } catch (err) {
    console.error("Error saving message:", err);
  }
};


const reportContent = async (contentId, contentType, authorId, reporterId) => {
  try {
    console.log("Reporting content:", { contentId, contentType, authorId, reporterId });

    const contentRef = doc(db, contentType === "post" ? "posts" : "comments", contentId);
    const contentSnapshot = await getDoc(contentRef);

    if (!contentSnapshot.exists()) {
      console.error("Content not found:", contentId);
      throw new Error("Content not found.");
    }

    console.log("Content found:", contentSnapshot.data());

    const contentData = contentSnapshot.data();
    const isHarmful = await moderateContent(contentData.text);

    console.log("Content moderation result:", isHarmful);

    if (isHarmful) {
      const authorRef = doc(db, "users", authorId);
      const authorSnapshot = await getDoc(authorRef);

      if (!authorSnapshot.exists()) {
        console.error("Author not found:", authorId);
        throw new Error("Author not found.");
      }

      console.log("Author data:", authorSnapshot.data());

      const authorData = authorSnapshot.data();
      const warnings = authorData.warnings || 0;

      if (warnings >= 2) {
        console.log("Permanently suspending user:", authorId);
        await updateDoc(authorRef, { suspensionEnd: null });
        await addNotification(authorId, "suspension", "Your account has been permanently suspended.");
      } else if (warnings === 1) {
        console.log("Banning user for 3 days:", authorId);
        const suspensionEnd = new Date();
        suspensionEnd.setDate(suspensionEnd.getDate() + 3);
        await updateDoc(authorRef, { warnings: increment(1), suspensionEnd });
        await addNotification(authorId, "ban", "You have been banned for 3 days.");
      } else {
        console.log("Issuing a warning to user:", authorId);
        await updateDoc(authorRef, { warnings: increment(1) });
        await addNotification(authorId, "warning", "You have received a warning for harmful content.");
      }

      console.log("Deleting harmful content:", contentId);
      await deleteDoc(contentRef);
    }
  } catch (error) {
    console.error("Error reporting content:", error);
    throw error;
  }
};

const createUserDocument = async (userId, userData) => {
  try {
    const userRef = doc(db, "users", userId); // Reference to the user's document
    const userSnapshot = await getDoc(userRef);

    if (!userSnapshot.exists()) {
      // Create a new user document if it doesn't exist
      await setDoc(userRef, {
        warnings: 0, // Initialize warnings
        suspensionEnd: null, // No suspension initially
        ...userData, // Add additional user data (e.g., name, email)
      });
      console.log(`User document created for userId: ${userId}`);
    } else {
      console.log(`User document already exists for userId: ${userId}`);
    }
  } catch (error) {
    console.error("Error creating/updating user document:", error);
    throw error;
  }
};

// Add a notification for a user
const addNotification = async (userId, type, message) => {
  try {
    await addDoc(collection(db, "notifications"), {
      userId,
      type,
      message,
      timestamp: serverTimestamp(),
      read: false, // Mark as unread by default
    });
    console.log(`Notification added for user ${userId}: ${message}`);
  } catch (error) {
    console.error("Error adding notification:", error);
    throw error;
  }
};

const onRequestToJoinGroup = async (groupId, userId) => {
  try {
    const groupRef = doc(db, "groups", groupId);
    const groupSnapshot = await getDoc(groupRef);
    const groupData = groupSnapshot.data();

    // Add the join request
    await updateDoc(groupRef, {
      joinRequests: arrayUnion({ userId, status: "requested" }),
    });

    // Notify the group admin
    await addNotification(
      groupData.adminId,
      "joinRequest",
      `User ${userId} has requested to join your group.`
    );

    console.log("Join request sent successfully");
  } catch (error) {
    console.error("Error sending join request:", error);
    throw error;
  }
};

// Delete a post permanently
export const deletePost = async (postId) => {
  try {
    await deleteDoc(doc(db, "posts", postId));
    console.log(`Post ${postId} deleted successfully.`);
  } catch (error) {
    console.error("Error deleting post:", error);
    throw error;
  }
};
// Fetch notifications for a specific user
/**
 * @typedef {Object} Notification
 * @property {string} id
 * @property {"upvote"|"downvote"|"reply"|"communityComment"|"joinRequest"} type
 * @property {string} text
 * @property {number} timestamp
 * @property {string} [groupId]
 * @property {string} [requesterId]
 * @property {boolean} [muted]
 */

/**
 * @param {string} userId
 * @returns {Promise<Notification[]>}
 */
const fetchUserNotifications = async (userId) => {
  try {
    const snapshot = await getDocs(
      query(collection(db, "notifications"), orderBy("timestamp", "desc"))
    );

    const notifications = snapshot.docs
      .map((doc) => {
        const data = doc.data();
        return {
          id: doc.id,
          userId: data.userId, // ✅ include userId in each notification
          text: data.message || "",
          timestamp: data.timestamp?.toDate()?.getTime() || Date.now(),
          type: data.type || "reply",
          groupId: data.groupId,
          requesterId: data.requesterId,
          muted: data.muted ?? false,
        };
      })
      .filter((notif) => notif.userId === userId); // ✅ now filter works properly

    return notifications;
  } catch (err) {
    console.error("Error fetching notifications:", err);
    return [];
  }
};

// Fetch posts created by a specific user
const fetchUserPosts = async (userId) => {
  try {
    const postsSnapshot = await getDocs(collection(db, "posts"));
    const userPosts = postsSnapshot.docs
      .map((doc) => {
        const data = doc.data();
        return {
          id: doc.id,
          text: data.text || "",
          authorId: data.authorId || "",
          community: data.community || null,
          isPinned: data.isPinned || false,
          timestamp: data.timestamp?.toDate() || new Date(),
        };
      })
      .filter((post) => post.authorId === userId);

    console.log("Filtered user posts:", userPosts);
    return userPosts;
  } catch (error) {
    console.error("Error fetching user posts:", error);
    throw error;
  }
};



export {
  fetchPosts,
  addPost,
  addComment,
  fetchComments,
  updateVotes,
  updateUpvotes,
  updateDownvotes,
  updateVote,
  addHiddenPost,
  fetchHiddenPosts,
  addReply,
  addGroup,
  fetchGroups,
  reportContent,
  createUserDocument,
  addNotification,
  onRequestToJoinGroup,
  fetchUserNotifications,
  fetchUserPosts,
    pinPost,
    updatePostText,
      onJoinGroup,



};