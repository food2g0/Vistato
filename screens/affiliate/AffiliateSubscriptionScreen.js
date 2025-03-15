import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Alert,
  StatusBar,
  SafeAreaView,
  KeyboardAvoidingView,
  ActivityIndicator,
  Platform,
  Image,
  Keyboard,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";
import firebase from "../../firebase.js";

const SubscriptionHeader = ({ onBackPress }) => (
  <View style={styles.header}>
    <TouchableOpacity onPress={onBackPress} style={styles.headerIcon}>
      <Ionicons name="chevron-back" size={24} color="black" />
    </TouchableOpacity>
    <Text style={styles.headerTitle}>Subscription</Text>
  </View>
);

const AffiliateSubscriptionScreen = () => {
  const navigation = useNavigation();
  const [isLoading, setIsLoading] = useState(true);
  const [gcashAccountName, setGcashAccountName] = useState("");
  const [gcashAccountNumber, setGcashAccountNumber] = useState("");
  const [referenceNumber, setReferenceNumber] = useState("");
  const [amountPaid, setAmountPaid] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [reminder, setReminder] = useState("");
  const [subscriptionData, setSubscriptionData] = useState(null);

  useEffect(() => {
    const fetchSubscriptionData = async () => {
      try {
        const currentUser = firebase.auth().currentUser;

        if (currentUser) {
          const affiliateId = currentUser.uid;

          const subscriptionRef = firebase.database().ref("subscription");
          subscriptionRef.on("value", (snapshot) => {
            const data = snapshot.val();
            if (data) {
              const subscriptionArray = Object.keys(data)
                .map((key) => ({ id: key, ...data[key] }))
                .filter((item) => item.affiliateId === affiliateId);
              setSubscriptionData(subscriptionArray);
            }
            setIsLoading(false);
          });
        } else {
          console.log("No user is currently logged in");
        }
      } catch (error) {
        console.error("Error fetching subscription data:", error);
        Alert.alert(
          "Error",
          "Failed to fetch subscription data. Please try again.",
        );
        setIsLoading(false);
      }
    };

    fetchSubscriptionData();

    return () => {
      firebase.database().ref("subscription").off("value");
    };
  }, []);

  const renderSubscriptionData = () => {
    if (!subscriptionData) {
      return null;
    }

    const reversedData = [...subscriptionData].reverse();

    return reversedData.map((data, index) => (
      <View key={index} style={styles.subscriptionItem}>
        <Text style={styles.subscriptionLabel}>Reference Number:</Text>
        <Text style={styles.subscriptionText}>{data.referenceNumber}</Text>

        <Text style={styles.subscriptionLabel}>Amount Paid:</Text>
        <Text style={styles.subscriptionText}>₱ {data.amountPaid}</Text>

        <Text style={styles.subscriptionLabel}>Status:</Text>
        <Text
          style={[
            styles.subscriptionText,
            { color: getStatusTextColor(data.status) },
          ]}
        >
          {capitalizeFirstLetter(data.status)}
        </Text>

        <Text style={styles.subscriptionLabel}>Date:</Text>
        <Text style={styles.subscriptionText}>
          {formatTimestamp(data.timestamp)}
        </Text>
      </View>
    ));
  };

  const formatTimestamp = (timestamp) => {
    const date = new Date(timestamp);
    const monthNames = [
      "January",
      "February",
      "March",
      "April",
      "May",
      "June",
      "July",
      "August",
      "September",
      "October",
      "November",
      "December",
    ];
    const day = date.getDate();
    const monthIndex = date.getMonth();
    const year = date.getFullYear();
    const formattedDate = `${monthNames[monthIndex]} ${day}, ${year}`;
    return formattedDate;
  };

  const capitalizeFirstLetter = (string) => {
    return string.charAt(0).toUpperCase() + string.slice(1);
  };

  const getStatusTextColor = (status) => {
    switch (status) {
      case "pending":
      case "declined":
        return "#e25f5f";
      case "approved":
        return "#6dc072";
      default:
        return "#000";
    }
  };

  useEffect(() => {
    const fetchAdminGcashDetails = async () => {
      try {
        const adminsSnapshot = await firebase
          .database()
          .ref("admins")
          .once("value");
        const adminsData = adminsSnapshot.val();

        if (adminsData) {
          const adminId = Object.keys(adminsData)[0];

          const adminSnapshot = await firebase
            .database()
            .ref(`admins/${adminId}`)
            .once("value");
          const adminData = adminSnapshot.val();

          if (adminData) {
            setGcashAccountName(adminData.gcashAccountName || "");
            setGcashAccountNumber(adminData.gcashAccountNumber || "");
          } else {
            console.log("No data found for the admin GCash details");
          }
        } else {
          console.log("No admins found in the database");
        }
      } catch (error) {
        console.error("Error fetching admin GCash details:", error);
      } finally {
        setIsLoading(false);
      }
    };

    const fetchReminder = async () => {
      try {
        const currentUser = firebase.auth().currentUser;

        if (currentUser) {
          const userId = currentUser.uid;

          const billRemindersRef = firebase
            .database()
            .ref(`billReminders/${userId}`);
          billRemindersRef.on("value", (snapshot) => {
            const reminderData = snapshot.val();

            if (reminderData) {
              const reminderKeys = Object.keys(reminderData);
              const latestReminderKey = reminderKeys[reminderKeys.length - 1];
              const latestReminder = reminderData[latestReminderKey];
              setReminder(latestReminder.reminderMessage || "");
            } else {
              console.log("No reminder found for the current user");
            }
          });
        } else {
          console.log("No user is currently logged in");
        }
      } catch (error) {
        console.error("Error fetching reminder:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchAdminGcashDetails();
    fetchReminder();
  }, []);

  const handleSaveSubscription = async () => {
    setIsSaving(true);
    try {
      const currentUser = firebase.auth().currentUser;
  
      if (currentUser) {
        const affiliateId = currentUser.uid;
  
        const adminsSnapshot = await firebase
          .database()
          .ref("admins")
          .once("value");
        const adminsData = adminsSnapshot.val();
        const adminId = Object.keys(adminsData)[0];
  
        const subscriptionRef = firebase.database().ref("subscription").push();
  
        await subscriptionRef.set({
          affiliateId,
          adminId,
          gcashAccountName,
          gcashAccountNumber,
          referenceNumber,
          amountPaid,
          status: "pending",
          timestamp: firebase.database.ServerValue.TIMESTAMP,
        });
  
        await firebase.database().ref(`nosubscription/${affiliateId}`).remove();
  
        setReminder("");
  
        const logMessage = `Subscription Sent: Reference Number - ${referenceNumber}, Amount Paid - ${amountPaid}`;
        console.log(logMessage);
  
        const logsRef = firebase.database().ref(`logs/${affiliateId}`);
        const newLogRef = logsRef.push();
        newLogRef.set({
          message: logMessage,
          timestamp: firebase.database.ServerValue.TIMESTAMP,
        });
  
        Alert.alert(
          "Subscription Sent!",
          "Subscription sent successfully. Please wait for approval from the admin.",
        );
  
        setReferenceNumber("");
        setAmountPaid("");
      } else {
        console.log("No user is currently logged in");
      }
    } catch (error) {
      console.error("Error saving subscription details:", error);
      Alert.alert(
        "Error",
        "Failed to save subscription details. Please try again.",
      );
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      style={styles.container}
    >
      <SafeAreaView style={styles.container}>
        <StatusBar barStyle="dark-content" />
        <SubscriptionHeader onBackPress={() => navigation.goBack()} />

        {isLoading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#088b9c" />
          </View>
        ) : (
          <ScrollView contentContainerStyle={styles.contentContainer}>
            <View style={styles.paymentDetails}>
              <View style={styles.paymentLogoContainer}>
                <Image
                  source={require("../../assets/gcash-logo.png")}
                  style={styles.paymentLogo}
                />
              </View>
              <View style={styles.paymentDetailsTextContainer}>
                <Text style={styles.paymentDetailsLabel}>
                  Admin GCash Account:
                </Text>
                <Text style={styles.paymentDetailsValue}>
                  {gcashAccountName}
                </Text>
                <Text style={styles.paymentDetailsValue}>
                  {gcashAccountNumber}
                </Text>
              </View>

              <View style={styles.paymentDetailsTextContainer}>
                <Text style={styles.paymentDetailsLabel}>Reference No.:</Text>
                <TextInput
                  style={styles.paymentDetailsInput}
                  placeholder="Enter Reference No."
                  onChangeText={setReferenceNumber}
                  keyboardType="numeric"
                  value={referenceNumber}
                  maxLength={13}
                />
              </View>

              <View style={styles.paymentDetailsTextContainer}>
                <Text style={styles.paymentDetailsLabel}>Amount Paid:</Text>
                <TextInput
                  style={styles.paymentDetailsInput}
                  placeholder="Enter amount paid"
                  onChangeText={setAmountPaid}
                  keyboardType="numeric"
                  value={amountPaid}
                />
              </View>

              <TouchableOpacity
                style={[
                  styles.saveButton,
                  {
                    backgroundColor:
                      !referenceNumber || !amountPaid || isSaving
                        ? "#d3d3d3"
                        : "#088b9c",
                  },
                ]}
                onPress={handleSaveSubscription}
                disabled={!referenceNumber || !amountPaid || isSaving}
              >
                {isSaving ? (
                  <ActivityIndicator color="white" />
                ) : (
                  <Text style={styles.saveButtonText}>Subscribe</Text>
                )}
              </TouchableOpacity>
            </View>

            {reminder ? (
              <View style={styles.reminderContainer}>
                <Text style={styles.reminderLabel}>Reminder:</Text>
                <Text style={styles.reminderMessage}>{reminder}</Text>
              </View>
            ) : null}

            {subscriptionData && subscriptionData.length > 0 && (
              <View style={styles.subscriptionContainer}>
                {renderSubscriptionData()}
              </View>
            )}
          </ScrollView>
        )}
      </SafeAreaView>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "white",
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  contentContainer: {
    flexGrow: 1,
    padding: 20,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "white",
    paddingVertical: 13,
    paddingHorizontal: 15,
    borderBottomWidth: 1,
    borderBottomColor: "#ddd",
  },
  headerTitle: {
    color: "black",
    fontSize: 16,
    marginLeft: 10,
  },
  headerIcon: {
    position: "absolute",
    left: 15,
  },
  subscriptionContainer: {
    marginTop: 10,
    borderTopWidth: 1,
    borderTopColor: "#ccc",
    paddingTop: 10,
  },
  paymentDetails: {
    flexDirection: "column",
    borderRadius: 15,
    backgroundColor: "#f0f0f0",
    padding: 20,
  },
  paymentLogoContainer: {
    width: 100,
    height: 30,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 15,
  },
  paymentLogo: {
    width: 150,
    height: 50,
    marginLeft: 50,
  },
  paymentDetailsTextContainer: {
    flex: 1,
  },
  paymentDetailsLabel: {
    fontSize: 14,
    color: "#8d8d8d",
    marginTop: 10,
  },
  paymentDetailsValue: {
    fontSize: 15,
    color: "black",
  },
  paymentDetailsInput: {
    borderWidth: 1,
    borderColor: "#f0f0f0",
    borderRadius: 20,
    paddingHorizontal: 10,
    paddingVertical: 10,
    marginTop: 5,
    height: 40,
    backgroundColor: "white",
  },
  saveButton: {
    backgroundColor: "#088b9c",
    borderRadius: 20,
    paddingVertical: 10,
    paddingHorizontal: 20,
    alignItems: "center",
    marginTop: 15,
    alignSelf: "flex-end",
  },
  saveButtonText: {
    color: "white",
    fontSize: 14,
  },
  reminderContainer: {
    marginTop: 20,
    borderTopWidth: 1,
    borderTopColor: "#ccc",
    paddingTop: 10,
  },
  reminderLabel: {
    fontSize: 15,
    fontWeight: "bold",
    color: "#088b9c",
  },
  reminderMessage: {
    fontSize: 13,
    color: "#444",
  },
  subscriptionLabel: {
    fontSize: 14,
    color: "#8d8d8d",
  },
  subscriptionItem: {
    backgroundColor: "#f0f0f0",
    borderRadius: 10,
    padding: 15,
    marginBottom: 10,
  },
  subscriptionText: {
    fontSize: 15,
    marginBottom: 5,
  },
});

export default AffiliateSubscriptionScreen;
