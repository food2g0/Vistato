import React, { useState, useEffect, useRef } from "react";
import { View, Text, TextInput, TouchableOpacity, FlatList, KeyboardAvoidingView, Platform, StyleSheet } from "react-native";
import firebase from "../firebase";
import { Ionicons } from "@expo/vector-icons";

const AffiliateChatScreen = ({ route }) => {
  const { currentId } = route.params; // ✅ Correctly get currentId
  const [messages, setMessages] = useState([]);
  const [message, setMessage] = useState("");
  const flatListRef = useRef(null);

  useEffect(() => {
    if (!currentId) {
      console.error("Error: currentId is undefined");
      return;
    }

    console.log("Fetching messages for currentId:", currentId); // 🔥 Debugging Log

    const chatRef = firebase.database().ref(`chats/${currentId}`);
    chatRef.on("value", (snapshot) => {
      const data = snapshot.val();
      console.log("Chat data:", data); // 🔥 Debugging Log

      if (data) {
        const sortedMessages = Object.values(data).sort((a, b) => a.timestamp - b.timestamp);
        setMessages(sortedMessages);
      } else {
        setMessages([]); // ✅ Ensure it doesn't crash if no messages exist
      }
    });

    return () => chatRef.off();
  }, [currentId]);

  const sendMessage = async () => {
    if (message.trim()) {
      const chatRef = firebase.database().ref(`chats/${currentId}`);
      const currentUser = firebase.auth().currentUser;

      if (!currentUser) {
        console.error("No user is logged in.");
        return;
      }

      const newMessage = {
        text: message,
        timestamp: Date.now(),
        sender: currentUser.uid, // ✅ Set sender ID
      };

      console.log("Sending message:", newMessage); // 🔥 Debugging Log

      await chatRef.push(newMessage);
      setMessage("");
    }
  };

  const renderItem = ({ item }) => {
    const currentUser = firebase.auth().currentUser;
    const isCurrentUser = item.sender === currentUser?.uid;

    return (
      <View style={[styles.messageContainer, isCurrentUser ? styles.sentMessage : styles.receivedMessage]}>
        <Text style={styles.messageText}>{item.text}</Text>
        <Text style={styles.timestamp}>{new Date(item.timestamp).toLocaleTimeString()}</Text>
      </View>
    );
  };

  return (
    <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : "height"} style={styles.container}>
      <FlatList
        ref={flatListRef}
        data={messages}
        keyExtractor={(item, index) => index.toString()}
        renderItem={renderItem}
        onContentSizeChange={() => flatListRef.current?.scrollToEnd({ animated: true })}
        onLayout={() => flatListRef.current?.scrollToEnd({ animated: true })}
      />
      <View style={styles.inputContainer}>
        <TextInput value={message} onChangeText={setMessage} placeholder="Type a message..." style={styles.input} />
        <TouchableOpacity onPress={sendMessage} style={styles.sendButton}>
          <Ionicons name="send" size={24} color="white" />
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f4f4f4",
  },
  messageContainer: {
    padding: 10,
    marginVertical: 5,
    borderRadius: 8,
    maxWidth: "80%",
    alignSelf: "flex-start",
  },
  sentMessage: {
    backgroundColor: "#bb3e03",
    alignSelf: "flex-end",
  },
  receivedMessage: {
    backgroundColor: "#006d77",
  },
  messageText: {
    fontSize: 16,
    color: "white",
  },
  timestamp: {
    fontSize: 10,
    color: "#ddd",
    alignSelf: "flex-end",
    marginTop: 5,
  },
  inputContainer: {
    flexDirection: "row",
    alignItems: "center",
    padding: 10,
    backgroundColor: "white",
    borderTopWidth: 1,
    borderColor: "#ddd",
  },
  input: {
    flex: 1,
    padding: 10,
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 20,
    marginRight: 10,
  },
  sendButton: {
    backgroundColor: "#0084FF",
    padding: 10,
    borderRadius: 50,
  },
});

export default AffiliateChatScreen;
