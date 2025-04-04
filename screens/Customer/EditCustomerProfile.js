import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Image,
  TextInput,
  StatusBar,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";
import { SafeAreaView } from "react-native-safe-area-context";
import * as ImagePicker from "expo-image-picker";

import firebase from "../../firebase.js";

const EditCustomerProfile = () => {
  const navigation = useNavigation();
  const [username, setUsername] = useState("");
  const [originalUsername, setOriginalUsername] = useState("");
  const [email, setEmail] = useState("");
  const [originalEmail, setOriginalEmail] = useState("");
  const [contactNo, setContactNo] = useState("");
  const [originalContactNo, setOriginalContactNo] = useState("");
  const [address, setAddress] = useState("");
  const [originalAddress, setOriginalAddress] = useState("");
  const [profilePictureUri, setProfilePictureUri] = useState("");
  const [originalProfilePictureUri, setOriginalProfilePictureUri] =
    useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingUserData, setIsLoadingUserData] = useState(true);

  const fetchUserData = async () => {
    const user = firebase.auth().currentUser;

    if (user) {
      try {
        const userSnapshot = await firebase
          .database()
          .ref(`customers/${user.uid}`)
          .once("value");
        const userData = userSnapshot.val();

        setOriginalUsername(userData.username || "");
        setOriginalEmail(userData.email || "");
        setOriginalContactNo(userData.contactNo || "");
        setOriginalAddress(userData.address || "");
        setOriginalProfilePictureUri(userData.profilePicture || "");

        setUsername(userData.username || "");
        setEmail(userData.email || "");
        setContactNo(userData.contactNo || "");
        setAddress(userData.address || "");
        setProfilePictureUri(userData.profilePicture || "");

        setIsLoadingUserData(false);
      } catch (error) {
        console.error("Error fetching user data:", error);
        setIsLoadingUserData(false);
      }
    }
  };

  useEffect(() => {
    const unsubscribe = firebase.auth().onAuthStateChanged((user) => {
      if (user) {
        fetchUserData();
      }
    });

    return unsubscribe;
  }, []);

  const handleSaveChanges = async () => {
    const user = firebase.auth().currentUser;

    if (user) {
      try {
        setIsLoading(true);

        if (profilePictureUri !== originalProfilePictureUri) {
          const downloadURL = await uploadProfilePicture(
            profilePictureUri,
            user,
          );

          await firebase
            .database()
            .ref(`customers/${user.uid}`)
            .update({
              profilePicture: downloadURL || "",
            });
        }

        await firebase.database().ref(`customers/${user.uid}`).update({
          username,
          email,
          contactNo,
          address,
        });

        setOriginalUsername(username);
        setOriginalEmail(email);
        setOriginalContactNo(contactNo);
        setOriginalAddress(address);
        setOriginalProfilePictureUri(profilePictureUri);

        setIsLoading(false);

        Alert.alert("Success", "Profile updated successfully!", [
          { text: "OK", onPress: () => navigation.goBack() },
        ]);
      } catch (error) {
        console.error("Error updating profile:", error);

        Alert.alert("Error", "Failed to update profile. Please try again.", [
          { text: "OK" },
        ]);
        setIsLoading(false);
      }
    }
  };

  const uploadProfilePicture = async (uri, user) => {
    if (!user || !user.uid) {
      console.error("User object or UID is undefined");
      return;
    }

    try {
      const response = await fetch(uri);

      if (!response.ok) {
        throw new Error(
          `Network response was not ok. Status: ${response.status}`,
        );
      }
      const blob = await response.blob();

      const storageRef = firebase.storage().ref();
      const profilePictureRef = storageRef.child(
        `profilePictures/${user.uid}.jpg`,
      );

      await profilePictureRef.put(blob);
      const downloadURL = await profilePictureRef.getDownloadURL();

      return downloadURL;
    } catch (error) {
      console.error("Error uploading profile picture:", error);
      throw error;
    }
  };

  const handleCancel = () => {
    navigation.goBack();
  };

  const handlePickProfilePicture = async () => {
    const permissionResult =
      await ImagePicker.requestMediaLibraryPermissionsAsync();

    if (permissionResult.granted === false) {
      alert("Permission to access camera roll is required!");
      return;
    }

    const user = firebase.auth().currentUser;

    if (user) {
      try {
        setIsLoading(true);

        const result = await ImagePicker.launchImageLibraryAsync({
          mediaTypes: ImagePicker.MediaTypeOptions.Images,
          allowsEditing: true,
          aspect: [4, 4],
          quality: 1,
        });

        if (result.cancelled) {
          return;
        }

        const { uri } = result.assets[0];

        if (!uri || uri === "") {
          throw new Error("Image URI is undefined or empty");
        }

        setIsLoading(true);

        const downloadURL = await uploadProfilePicture(uri, user);

        setProfilePictureUri(downloadURL || uri);

        setIsLoading(false);
      } catch (error) {
        // console.error('Error picking profile picture:', error);
        setIsLoading(false);
      }
    } else {
      console.error("User object is undefined");
    }
  };

  const checkIsChanged = () => {
    return (
      username !== originalUsername ||
      email !== originalEmail ||
      contactNo !== originalContactNo ||
      address !== originalAddress ||
      (profilePictureUri !== "" &&
        profilePictureUri !== originalProfilePictureUri) ||
      (profilePictureUri === "" && originalProfilePictureUri !== "")
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="white" />

      <View style={styles.header}>
        <TouchableOpacity onPress={handleCancel} style={styles.headerIcon}>
          <Ionicons name="close" size={24} color="black" />
        </TouchableOpacity>
        <View style={styles.headerTitleContainer}>
          <Text style={styles.headerTitle}>Edit Profile</Text>
        </View>
        <TouchableOpacity
          onPress={() => {
            if (checkIsChanged()) {
              handleSaveChanges();
            }
          }}
          style={[
            styles.headerSaveButton,
            { opacity: checkIsChanged() ? 1 : 0.5 },
          ]}
          disabled={!checkIsChanged()}
        >
          {isLoading ? (
            <ActivityIndicator
              size="small"
              color="#088b9c"
              style={{ marginRight: 12 }}
            />
          ) : (
            <Text
              style={[
                styles.headerSaveButtonText,
                { color: checkIsChanged() ? "#088b9c" : "#bdc3c7" },
              ]}
            >
              Save
            </Text>
          )}
        </TouchableOpacity>
      </View>

      {isLoadingUserData ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#088b9c" />
        </View>
      ) : (
        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : "height"}
          style={{ flex: 1 }}
        >
          <ScrollView
            contentContainerStyle={styles.scrollContainer}
            showsVerticalScrollIndicator={false}
            showsHorizontalScrollIndicator={false}
          >
            <View style={styles.contentContainer}>
              <View style={styles.profilePictureContainer}>
                <Image
                  source={
                    profilePictureUri
                      ? { uri: profilePictureUri }
                      : require("../../assets/user.png")
                  }
                  style={styles.profilePicture}
                />
                <TouchableOpacity
                  style={styles.changePictureButton}
                  onPress={handlePickProfilePicture}
                >
                  <Text style={styles.changePictureButtonText}>
                    Change Picture
                  </Text>
                </TouchableOpacity>
              </View>

              <View style={styles.formContainer}>
                <View style={styles.inputContainer}>
                  <Text style={styles.placeholder}>Username</Text>
                  <TextInput
                    style={[styles.input, styles.inputBackground]}
                    placeholder="Enter your username"
                    value={username}
                    onChangeText={(text) => setUsername(text)}
                  />
                </View>

                <View style={styles.inputContainer}>
                  <Text style={styles.placeholder}>Email Address</Text>
                  <TextInput
                    style={[styles.input, styles.inputBackground]}
                    placeholder="Enter your email"
                    value={email}
                    onChangeText={(text) => setEmail(text)}
                    editable={false}
                  />
                </View>

                <View style={styles.inputContainer}>
                  <Text style={styles.placeholder}>Contact No.</Text>
                  <TextInput
                    style={[styles.input, styles.inputBackground]}
                    placeholder="Enter your contact number"
                    value={contactNo}
                    onChangeText={(text) => setContactNo(text)}
                    maxLength={11}
                    keyboardType="numeric"
                  />
                </View>

                <View style={styles.inputContainer}>
                  <Text style={styles.placeholder}>Address</Text>
                  <TextInput
                    style={[styles.input, styles.inputBackground]}
                    placeholder="Enter your address"
                    value={address}
                    onChangeText={(text) => setAddress(text)}
                  />
                </View>
              </View>
            </View>
          </ScrollView>
        </KeyboardAvoidingView>
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "white",
  },
  scrollContainer: {
    flexGrow: 1,
    justifyContent: "space-between",
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 15,
    paddingVertical: 10,
    backgroundColor: "white",
    borderBottomColor: "#ddd",
    borderBottomWidth: 1,
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: "bold",
    flex: 1,
  },
  headerSaveButtonText: {
    color: "#088b9c",
    fontSize: 15,
  },
  profilePictureContainer: {
    alignItems: "center",
    padding: 20,
  },
  profilePicture: {
    width: 150,
    height: 150,
    borderRadius: 75,
  },
  changePictureButton: {
    marginTop: 10,
  },
  changePictureButtonText: {
    color: "#088b9c",
    fontWeight: "bold",
  },
  contentContainer: {
    width: "100%",
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  formContainer: {
    backgroundColor: "#f5f5f5",
    borderRadius: 20,
    padding: 20,
  },
  inputContainer: {
    marginBottom: 20,
    height: 65,
  },
  placeholder: {
    color: "#8d8d8d",
    fontSize: 14,
    marginBottom: 5,
  },
  inputBackground: {
    backgroundColor: "white",
    borderRadius: 20,
    paddingLeft: 15,
    borderColor: "#b3b3b3",
    borderWidth: 1,
  },
  input: {

    fontSize: 16, // Increase font size for better visibility
    color: "black", // Ensure the text color is visible
    padding: 15, // Add padding for better visibility
  },
});

export default EditCustomerProfile;