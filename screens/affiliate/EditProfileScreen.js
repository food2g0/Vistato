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

const EditProfileScreen = () => {
  const navigation = useNavigation();
  const [username, setUsername] = useState("");
  const [originalUsername, setOriginalUsername] = useState("");
  const [email, setEmail] = useState("");
  const [originalEmail, setOriginalEmail] = useState("");
  const [contactNo, setContactNo] = useState("");
  const [originalContactNo, setOriginalContactNo] = useState("");
  const [address, setAddress] = useState("");
  const [originalAddress, setOriginalAddress] = useState("");
  const [latitude, setLatitude] = useState("");
  const [originalLatitude, setOriginalLatitude] = useState("");
  const [longitude, setLongitude] = useState("");
  const [originalLongitude, setOriginalLongitude] = useState("");
  const [profilePictureUri, setProfilePictureUri] = useState("");
  const [originalProfilePictureUri, setOriginalProfilePictureUri] =
    useState("");
  const [accountDescription, setAccountDescription] = useState("");
  const [originalAccountDescription, setOriginalAccountDescription] =
    useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingUserData, setIsLoadingUserData] = useState(true);

  const fetchAffiliateData = async () => {
    const user = firebase.auth().currentUser;

    console.log("User object in fetchAffiliateData:", user);

    if (user) {
      try {
        const affiliateSnapshot = await firebase
          .database()
          .ref(`affiliates/${user.uid}`)
          .once("value");
        console.log(
          "Affiliate snapshot in fetchAffiliateData:",
          affiliateSnapshot.val(),
        );

        const affiliateData = affiliateSnapshot.val();

        setOriginalUsername(affiliateData.username || "");
        setOriginalEmail(affiliateData.email || "");
        setOriginalContactNo(affiliateData.contactNo || "");
        setOriginalAddress(affiliateData.address || "");
        setOriginalLatitude(affiliateData.latitude || "");
        setOriginalLongitude(affiliateData.longitude || "");
        setOriginalProfilePictureUri(affiliateData.profilePicture || "");
        setOriginalAccountDescription(affiliateData.accountDescription || "");

        setUsername(affiliateData.username || "");
        setEmail(affiliateData.email || "");
        setContactNo(affiliateData.contactNo || "");
        setAddress(affiliateData.address || "");
        setLatitude(affiliateData.latitude || "");
        setLongitude(affiliateData.longitude || "");
        setProfilePictureUri(affiliateData.profilePicture || "");
        setAccountDescription(affiliateData.accountDescription || "");

        setIsLoadingUserData(false);
      } catch (error) {
        console.error("Error fetching affiliate data:", error);
        setIsLoadingUserData(false);
      }
    }
  };

  useEffect(() => {
    const unsubscribe = firebase.auth().onAuthStateChanged((user) => {
      console.log("onAuthStateChanged - User:", user);

      if (user) {
        fetchAffiliateData();
      } else {
        console.log("No user is signed in");
      }
    });

    return unsubscribe;
  }, []);

  const handleSaveChanges = async () => {
    const user = firebase.auth().currentUser;

    if (user) {
      try {
        setIsLoading(true);

        const uploadedDownloadURL = await uploadProfilePicture(
          profilePictureUri,
          user,
        );

        if (profilePictureUri) {
          const downloadURL = await uploadProfilePicture(
            profilePictureUri,
            user,
          );

          await firebase
            .database()
            .ref(`affiliates/${user.uid}`)
            .update({
              profilePicture: uploadedDownloadURL || "",
            });
        }

        await firebase
          .database()
          .ref(`affiliates/${user.uid}`)
          .update({
            username,
            email,
            contactNo,
            address,
            latitude,
            longitude,
            accountDescription:
              accountDescription || originalAccountDescription,
          });

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
    console.log("User object in uploadProfilePicture:", user);

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
        const result = await ImagePicker.launchImageLibraryAsync({
          mediaTypes: ImagePicker.MediaTypeOptions.Images,
          allowsEditing: true,
          aspect: [4, 4],
          quality: 1,
        });

        console.log("ImagePicker result:", result);

        if (result.cancelled) {
          console.log("Image picking cancelled");
          return;
        }

        const { uri, height, width, type } = result.assets[0];

        if (!uri || uri === "") {
          throw new Error("Image URI is undefined or empty");
        }

        console.log("Selected image info:", { uri, height, width, type });
        setIsLoading(true);

        const downloadURL = await uploadProfilePicture(uri, user);

        console.log("Download URL:", downloadURL);

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
      latitude !== originalLatitude ||
      longitude !== originalLongitude ||
      accountDescription !== originalAccountDescription ||
      (profilePictureUri !== "" &&
        profilePictureUri !== originalProfilePictureUri) ||
      (profilePictureUri === "" && originalProfilePictureUri !== "")
    );
  };

  return (
    <SafeAreaView style={styles.container}>
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
            showsVerticalScrollIndicator={true}
            showsHorizontalScrollIndicator={true}
          >
            <View style={styles.profilePictureContainer}>
              <Image
                source={
                  profilePictureUri
                    ? { uri: profilePictureUri }
                    : require("../../assets/profile-picture.jpg")
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

            <View style={styles.contentContainer}>
              <View style={styles.formContainer}>
                <View style={styles.multilineInputContainer}>
                  <Text style={styles.placeholder}>Account Description</Text>
                  <TextInput
                    style={[styles.input, styles.multilineInput]}
                    placeholder="Enter your account description"
                    multiline={true}
                    textAlignVertical="top"
                    value={accountDescription}
                    onChangeText={(text) => setAccountDescription(text)}
                  />
                </View>

                <View style={styles.separator}></View>

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
                    keyboardType="numeric"
                    maxLength={11}
                  />
                </View>

                <View style={styles.separator}></View>

                <View style={styles.inputContainer}>
                  <Text style={styles.placeholder}>Address</Text>
                  <TextInput
                    style={[styles.input, styles.inputBackground]}
                    placeholder="Enter your address"
                    value={address}
                    onChangeText={(text) => setAddress(text)}
                  />
                </View>

                <View style={styles.inputContainer}>
                  <Text style={styles.placeholder}>Latitude</Text>
                  <TextInput
                    style={[styles.input, styles.inputBackground]}
                    placeholder="Enter Latitude (° N)"
                    value={latitude}
                    onChangeText={(text) => setLatitude(text)}
                  />
                </View>

                <View style={styles.inputContainer}>
                  <Text style={styles.placeholder}>Longitude</Text>
                  <TextInput
                    style={[styles.input, styles.inputBackground]}
                    placeholder="Enter Longitude (° E)"
                    value={longitude}
                    onChangeText={(text) => setLongitude(text)}
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
  headerTitleContainer: {
    alignItems: "center",
    justifyContent: "center",
    flex: 1,
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
  descriptionInputContainer: {
    marginBottom: 20,
    height: 150,
  },
  descriptionInput: {
    marginBottom: 20,
    height: 150,
  },
  placeholder: {
    color: "#8d8d8d",
    fontSize: 14,
    marginBottom: 10,
  },
  inputBackground: {
    backgroundColor: "white",
    borderRadius: 20,
    paddingLeft: 15,
    borderColor: "#b3b3b3",
    borderWidth: 1,
  },
  input: {
    
    fontSize: 15,
    color: "black", // Ensure the text color is visible
    padding: 10, // Add padding for better visibility
  },
  separator: {
    borderBottomColor: "#ddd",
    borderBottomWidth: 1,
    marginBottom: 20,
  },
  multilineInputContainer: {
    marginBottom: 20,
    minHeight: 150,
  },
  multilineInput: {
    flex: 1,
    height: 200,
    textAlignVertical: "top",
    padding: 10,
    paddingTop: 10,
    backgroundColor: "white",
    borderRadius: 20,
    borderColor: "#b3b3b3",
    borderWidth: 1,
    color: "black", // Ensure the text color is visible
  },
});

export default EditProfileScreen;