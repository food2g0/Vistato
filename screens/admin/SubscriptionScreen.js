import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  StatusBar,
  SafeAreaView,
  TouchableOpacity,
  Image,
  Modal,
  Alert,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";
import firebase from "../../firebase.js";

const SubscriptionHeader = ({ onBackPress }) => (
  <View style={styles.header}>
    <TouchableOpacity onPress={onBackPress} style={styles.headerIcon}>
      <Ionicons name="chevron-back" size={24} color="black" />
    </TouchableOpacity>
    <Text style={styles.headerTitle}>Affiliate Subscription</Text>
  </View>
);

const SubscriptionScreen = () => {
  const navigation = useNavigation();
  const [isLoading, setIsLoading] = useState(true);
  const [paymentDetails, setPaymentDetails] = useState([]);
  const [selectedPayment, setSelectedPayment] = useState(null);

  useEffect(() => {
    const fetchSubscriptionDetails = async () => {
      try {
        const subscriptionSnapshot = await firebase
          .database()
          .ref("subscription")
          .once("value");
        const subscriptionData = subscriptionSnapshot.val();

        if (subscriptionData) {
          const paymentDetailsArray = Object.entries(subscriptionData).map(
            ([id, payment]) => ({ id, ...payment })
          );
          const promises = paymentDetailsArray.map(async (payment) => {
            const affiliateSnapshot = await firebase
              .database()
              .ref(`affiliates/${payment.affiliateId}`)
              .once("value");
            const affiliateData = affiliateSnapshot.val();
            const affiliateUsername = affiliateData
              ? affiliateData.username
              : "Unknown";
            const profilePicture = affiliateData
              ? affiliateData.profilePicture
              : null;
            return { ...payment, affiliateUsername, profilePicture };
          });
          const updatedPaymentDetails = await Promise.all(promises);
          setPaymentDetails(updatedPaymentDetails);
        } else {
          console.log("No payment details found in the database");
        }
      } catch (error) {
        console.error("Error fetching subscription details:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchSubscriptionDetails();
  }, []);

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

  const handlePaymentPress = (payment) => {
    setSelectedPayment(payment);
  };

  const closeModal = () => {
    setSelectedPayment(null);
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

  const handleAcceptSubscription = async () => {
    if (selectedPayment) {
      try {
        const { id, affiliateId } = selectedPayment;

        // Update the subscription status to "accepted"
        await firebase
          .database()
          .ref(`subscription/${id}`)
          .update({ status: "accepted" });

        // Remove the user from the nosubscription collection
        await firebase.database().ref(`nosubscription/${affiliateId}`).remove();

        Alert.alert("Success", "Subscription accepted successfully.");
        closeModal();
      } catch (error) {
        console.error("Error accepting subscription:", error);
        Alert.alert("Error", "Failed to accept subscription. Please try again.");
      }
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" />
      <SubscriptionHeader onBackPress={() => navigation.goBack()} />
      {isLoading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#088b9c" />
        </View>
      ) : paymentDetails.length === 0 ? (
        <View style={styles.noSubscriptionContainer}>
          <Ionicons name="warning" size={50} color="#FF6347" />
          <Text style={styles.noSubscriptionText}>
            No subscription available
          </Text>
        </View>
      ) : (
        <ScrollView contentContainerStyle={styles.contentContainer}>
          <View style={styles.paymentDetailsContainer}>
            {paymentDetails.map((payment, index) => (
              <TouchableOpacity
                key={index}
                style={styles.paymentDetails}
                onPress={() => handlePaymentPress(payment)}
              >
                <View style={styles.profileContainer}>
                  {payment.profilePicture ? (
                    <Image
                      source={{ uri: payment.profilePicture }}
                      style={styles.profilePicture}
                    />
                  ) : (
                    <Ionicons
                      name="person-circle-outline"
                      size={50}
                      color="#ccc"
                    />
                  )}
                </View>
                <View style={styles.detailsContainer}>
                  <Text style={styles.username}>
                    {payment.affiliateUsername}
                  </Text>
                  <Text style={{ color: getStatusTextColor(payment.status) }}>
                    {payment.status.charAt(0).toUpperCase() +
                      payment.status.slice(1)}
                  </Text>
                </View>
                <TouchableOpacity style={styles.forwardIconContainer}>
                  <Ionicons name="chevron-forward" size={15} color="black" />
                </TouchableOpacity>
              </TouchableOpacity>
            ))}
          </View>
        </ScrollView>
      )}
      <Modal
        animationType="slide"
        transparent={true}
        visible={!!selectedPayment}
        onRequestClose={closeModal}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.heading}>Subscription Details</Text>
              <TouchableOpacity style={styles.closeButton} onPress={closeModal}>
                <Ionicons name="close-outline" size={18} color="black" />
              </TouchableOpacity>
            </View>
            <View style={styles.section}>
              <View style={styles.sectionHeader}>
                <Ionicons
                  name="card-outline"
                  size={16}
                  color="black"
                  style={styles.icon}
                />
                <Text style={styles.sectionTitle}>Payment Details</Text>
              </View>
              <View style={styles.bookingDetail}>
                <Text style={styles.detailTitle}>Reference Number:</Text>
                <View style={styles.detailTextContainer}>
                  <Text style={styles.detailText}>
                    {selectedPayment?.referenceNumber}
                  </Text>
                </View>
              </View>
              <View style={styles.bookingDetail}>
                <Text style={styles.detailTitle}>Amount Paid:</Text>
                <View style={styles.detailTextContainer}>
                  <Text style={styles.detailText}>
                    ₱ {selectedPayment?.amountPaid}
                  </Text>
                </View>
              </View>
              <View style={styles.bookingDetail}>
                <Text style={styles.detailTitle}>Status:</Text>
                <View style={styles.detailTextContainer}>
                  <Text
                    style={[
                      styles.detailText,
                      { color: getStatusTextColor(selectedPayment?.status) },
                    ]}
                  >
                    {selectedPayment && selectedPayment.status
                      ? capitalizeFirstLetter(selectedPayment.status)
                      : ""}
                  </Text>
                </View>
              </View>
              <View style={styles.bookingDetail}>
                <Text style={styles.detailTitle}>Date:</Text>
                <View style={styles.detailTextContainer}>
                  <Text style={styles.detailText}>
                    {formatTimestamp(selectedPayment?.timestamp)}
                  </Text>
                </View>
              </View>
              <TouchableOpacity
                style={styles.acceptButton}
                onPress={handleAcceptSubscription}
              >
                <Text style={styles.acceptButtonText}>Accept</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f0f0f0",
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  contentContainer: {
    flexGrow: 1,
    padding: 10,
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
  paymentDetails: {
    flexDirection: "row",
    alignItems: "center",
    borderRadius: 15,
    backgroundColor: "white",
    padding: 15,
    marginBottom: 10,
  },
  profileContainer: {
    marginRight: 10,
  },
  profilePicture: {
    width: 50,
    height: 50,
    borderRadius: 25,
  },
  detailsContainer: {
    flex: 1,
  },
  username: {
    fontSize: 16,
    fontWeight: "bold",
  },
  noSubscriptionContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  noSubscriptionText: {
    marginTop: 10,
    fontSize: 16,
  },
  modalContainer: {
    flex: 1,
    justifyContent: "flex-end",
    backgroundColor: "rgba(0, 0, 0, 0.1)",
    paddingBottom: 20,
    paddingLeft: 10,
    paddingRight: 10,
  },
  modalContent: {
    backgroundColor: "white",
    padding: 20,
    borderRadius: 20,
    width: "100%",
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 5,
  },
  heading: {
    fontSize: 20,
    fontWeight: "bold",
  },
  modalBody: {
    padding: 20,
  },
  closeButton: {
    backgroundColor: "#f0f0f0",
    borderRadius: 50,
    padding: 5,
  },
  section: {
    marginTop: 10,
  },
  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 10,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "bold",
    marginLeft: 5,
  },
  icon: {
    marginRight: 4,
  },
  bookingDetail: {
    marginBottom: 10,
    marginLeft: 25,
  },
  detailTitle: {
    marginBottom: 5,
    color: "#888",
  },
  detailText: {
    fontSize: 14,
  },
  acceptButton: {
    backgroundColor: "#088B9C",
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 5,
    marginTop: 20,
    alignItems: "center",
  },
  acceptButtonText: {
    color: "white",
    fontSize: 16,
  },
});

export default SubscriptionScreen;