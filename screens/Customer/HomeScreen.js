import React, { useState, useEffect, useRef } from "react";
import {
  View,
  Text,
  Image,
  SafeAreaView,
  StyleSheet,
  TouchableOpacity,
  StatusBar,
  ScrollView,
  ActivityIndicator,
  TextInput,
  Modal,
  Animated,
  Easing,
} from "react-native";
import firebase from "../../firebase";
import { Ionicons } from "@expo/vector-icons";
import { useNavigation, useIsFocused } from "@react-navigation/native";

const HomeScreen = () => {
  const [affiliateAccounts, setAffiliateAccounts] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigation = useNavigation();
  const [filter, setFilter] = useState("Resort");
  const [searchQuery, setSearchQuery] = useState("");
  const [user, setUser] = useState(null);
  const [modalVisible, setModalVisible] = useState(false);
  const [unregisteredBookings, setUnregisteredBookings] = useState([]);
  const [bookingSearchQuery, setBookingSearchQuery] = useState("");
  const [showBookings, setShowBookings] = useState(false);
  const [showMessage, setShowMessage] = useState(false);
  const messageOpacity = useRef(new Animated.Value(1)).current;
  const isFocused = useIsFocused();

  useEffect(() => {
    const unsubscribe = firebase.auth().onAuthStateChanged((user) => {
      if (user) {
        setUser(user);
      } else {
        setUser(null);
      }
    });

    return unsubscribe;
  }, []);

  useEffect(() => {
    const affiliatesRef = firebase.database().ref("affiliates");
    const nosubscriptionRef = firebase.database().ref("nosubscription");

    const handleAffiliatesChange = (snapshot) => {
      const affiliatesData = snapshot.val();
      if (affiliatesData) {
        const affiliatesArray = Object.entries(affiliatesData).map(
          ([key, value]) => ({
            ...value,
            id: key,
            key: key,
          })
        );
        setAffiliateAccounts(affiliatesArray);
      }
    };

    const handleNosubscriptionChange = (snapshot) => {
      const nosubscriptionData = snapshot.val() || {};
      setAffiliateAccounts((prevAffiliates) =>
        prevAffiliates.filter((affiliate) => !nosubscriptionData[affiliate.id])
      );
    };

    affiliatesRef.on("value", handleAffiliatesChange);
    nosubscriptionRef.on("value", handleNosubscriptionChange);

    return () => {
      affiliatesRef.off("value", handleAffiliatesChange);
      nosubscriptionRef.off("value", handleNosubscriptionChange);
    };
  }, []);

  useEffect(() => {
    const dbRef = firebase.database().ref("bookings");

    const handleBookingDataChange = (snapshot) => {
      const data = snapshot.val();
      if (data) {
        const bookingsArray = Object.entries(data).map(([key, value]) => ({
          ...value,
          id: key,
          key: key,
        }));
        setUnregisteredBookings(
          bookingsArray.filter((booking) => !booking.customerID)
        );

        bookingsArray.forEach((booking) => {
          firebase
            .database()
            .ref(`facilities/${booking.facilityID}`)
            .once("value")
            .then((facilitySnapshot) => {
              const facilityData = facilitySnapshot.val();
              booking.facilityDetails = facilityData;
              setUnregisteredBookings((prevBookings) =>
                prevBookings.map((prevBooking) => {
                  if (prevBooking.id === booking.id) {
                    return booking;
                  }
                  return prevBooking;
                })
              );
            })
            .catch((error) => {
              console.error("Error fetching facility details:", error);
            });
        });
      }
      setLoading(false);
    };

    dbRef.on("value", handleBookingDataChange);

    return () => {
      dbRef.off("value", handleBookingDataChange);
    };
  }, []);

  useEffect(() => {
    const showDelayTimer = setTimeout(() => {
      setShowMessage(true);
      Animated.timing(messageOpacity, {
        toValue: 1,
        duration: 500,
        easing: Easing.ease,
        useNativeDriver: true,
      }).start();
    }, 1500);

    return () => {
      clearTimeout(showDelayTimer);
    };
  }, []);

  useEffect(() => {
    if (showMessage) {
      const hideTimer = setTimeout(() => {
        setShowMessage(false);
        Animated.timing(messageOpacity, {
          toValue: 0,
          duration: 500,
          easing: Easing.ease,
          useNativeDriver: true,
        }).start();
      }, 10000);

      return () => {
        clearTimeout(hideTimer);
      };
    } else {
      messageOpacity.setValue(0);
    }
  }, [showMessage]);

  useEffect(() => {
    if (isFocused) {
      setShowMessage(true);
      messageOpacity.setValue(1);
    }
  }, [isFocused]);

  const handleAffiliatePress = (affiliate) => {
    navigation.navigate("AffiliateDetails", {
      affiliate: { ...affiliate, affiliateId: affiliate.id },
    });
  };

  const renderAffiliateItem = (item) => {
    if (filter && item.affiliateType !== filter) {
      return null;
    }

    if (
      searchQuery &&
      !item.username.toLowerCase().includes(searchQuery.toLowerCase())
    ) {
      return null;
    }

    return (
      <TouchableOpacity
        style={styles.affiliateContainer}
        onPress={() => handleAffiliatePress(item)}
        key={item.id}
      >
        <View style={styles.touchableContentContainer}>
          <View style={styles.leftContainer}>
            {item.profilePicture ? (
              <Image
                source={{ uri: item.profilePicture }}
                style={styles.profilePicture}
              />
            ) : (
              <Image
                source={require("../../assets/image-.png")}
                style={styles.defaultProfilePicture}
              />
            )}
            <View>
              <Text style={styles.username}>{item.username}</Text>
              {item.address ? (
                <View style={styles.addressContainer}>
                  <Ionicons
                    name="location-outline"
                    size={13}
                    color="#888"
                    style={styles.locationIcon}
                  />
                  <Text style={styles.affiliateAddress}>{item.address}</Text>
                </View>
              ) : (
                <Text style={styles.noAddressMessage}>
                  No address available
                </Text>
              )}
            </View>
          </View>
          <View style={styles.rightContainer}>
            <Ionicons name="chevron-forward" size={15} color="black" />
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  const handleSearch = (text) => {
    setSearchQuery(text);
  };

  const handleBellPress = () => {
    if (!user) {
      setModalVisible(true);
    }
  };

  const closeModal = () => {
    setModalVisible(false);
    setBookingSearchQuery("");
    setShowBookings(false);
  };

  const handleBookingSearch = (text) => {
    setBookingSearchQuery(text);
  };

  const handleSearchIconPress = () => {
    if (bookingSearchQuery.trim() !== "") {
      setShowBookings(!showBookings);
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case "pending":
        return "#e25f5f";
      case "approved":
      case "checked-in":
      case "completed":
        return "#6dc072";
      case "checked-out":
      case "declined":
        return "#e25f5f";
      default:
        return "#000";
    }
  };

  const formatDate = (timestamp) => {
    const date = new Date(timestamp);
    return date.toLocaleDateString("en-US", {
      weekday: "short",
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor={"white"} />
      <View style={styles.container}>
        <View style={styles.header}>
          <Image
            source={require("../../assets/vista-logo.png")}
            style={styles.headerImage}
          />
          <View style={styles.searchContainer}>
            <TextInput
              style={styles.searchInput}
              placeholder="Search..."
              placeholderTextColor="#888"
              onChangeText={handleSearch}
            />
            <View style={styles.searchIconContainer}>
              <Ionicons name="search" size={15} color="#fff" />
            </View>
          </View>
        </View>
        <ScrollView>
          <View style={styles.flatListContainer}>
            <View style={styles.filterContainer}>
              <TouchableOpacity
                style={[
                  styles.filterButton,
                  filter === "Resort" && styles.activeFilterButton,
                ]}
                onPress={() => setFilter("Resort")}
              >
                <Text
                  style={[
                    styles.filterButtonText,
                    filter === "Resort" && styles.activeFilterButtonText,
                  ]}
                >
                  Resorts
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[
                  styles.filterButton,
                  filter === "Hotel" && styles.activeFilterButton,
                ]}
                onPress={() => {
                  setFilter("Hotel");
                }}
              >
                <Text
                  style={[
                    styles.filterButtonText,
                    filter === "Hotel" && styles.activeFilterButtonText,
                  ]}
                >
                  Hotels
                </Text>
              </TouchableOpacity>
            </View>
            <View style={styles.affiliateFlatListContainer}>
              {loading ? (
                <View style={styles.loadingContainer}>
                  <ActivityIndicator size="large" color="#088B9C" />
                </View>
              ) : affiliateAccounts.length === 0 ||
                affiliateAccounts.filter(
                  (item) => item.affiliateType === filter
                ).length === 0 ? (
                <View style={styles.centeredMessageContainer}>
                  <Ionicons name="warning" size={50} color="#FF6347" />
                  <Text>
                    {filter === "Resort"
                      ? "No Resort affiliate available"
                      : "No Hotel affiliate available"}
                  </Text>
                </View>
              ) : (
                affiliateAccounts
                  .filter((item) => item.affiliateType === filter)
                  .map(renderAffiliateItem)
              )}
            </View>
          </View>
        </ScrollView>
      </View>
      <Modal
        animationType="slide"
        transparent={true}
        visible={modalVisible}
        onRequestClose={closeModal}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.heading}>Bookings</Text>
              <TouchableOpacity style={styles.closeButton} onPress={closeModal}>
                <Ionicons name="close-outline" size={18} color="black" />
              </TouchableOpacity>
            </View>
            <TouchableOpacity onPress={handleSearchIconPress}>
              <View style={styles.modalSearchContainer}>
                <TextInput
                  style={styles.modalSearchInput}
                  placeholder="Search booking by Booking ID"
                  placeholderTextColor="#888"
                  onChangeText={handleBookingSearch}
                />
                <Ionicons name="search" size={20} color="#888" />
              </View>
            </TouchableOpacity>
            {showBookings && (
              <ScrollView style={styles.scrollContainer}>
                <View>
                  {bookingSearchQuery &&
                    unregisteredBookings
                      .filter(
                        (booking) =>
                          booking.id === bookingSearchQuery &&
                          [
                            "pending",
                            "approved",
                            "checked-in",
                            "checked-out",
                          ].includes(booking.status)
                      )
                      .map((booking) => (
                        <View key={booking.id} style={styles.bookingItem}>
                          <View style={styles.section}>
                            <View style={styles.sectionHeader}>
                              <Ionicons
                                name="person-outline"
                                size={16}
                                color="black"
                                style={styles.icon}
                              />
                              <Text style={styles.sectionTitle}>
                                Customer Details
                              </Text>
                            </View>
                            <View style={styles.bookingDetail}>
                              <Text>{booking.customerDetails.username}</Text>
                              <Text style={styles.customerDetailText}>
                                {booking.customerDetails.contactNo}
                              </Text>
                              <Text style={styles.customerDetailText}>
                                {booking.customerDetails.email}
                              </Text>
                              <Text style={styles.customerDetailText}>
                                {booking.customerDetails.address}
                              </Text>
                            </View>
                          </View>
                          <View style={styles.section}>
                            <View style={styles.sectionHeader}>
                              <Ionicons
                                name="people-outline"
                                size={16}
                                color="black"
                                style={styles.icon}
                              />
                              <Text style={styles.sectionTitle}>
                                Affiliate Details
                              </Text>
                            </View>
                            <View style={styles.bookingDetail}>
                              <Text>{booking.affiliateDetails.username}</Text>
                              <Text style={styles.customerDetailText}>
                                {booking.affiliateDetails.contactNo}
                              </Text>
                              <Text style={styles.customerDetailText}>
                                {booking.affiliateDetails.email}
                              </Text>
                              <Text style={styles.customerDetailText}>
                                {booking.affiliateDetails.address}
                              </Text>
                            </View>
                          </View>
                          <View style={styles.section}>
                            <View style={styles.sectionHeader}>
                              <Ionicons
                                name="calendar-outline"
                                size={16}
                                color="black"
                                style={styles.icon}
                              />
                              <Text style={styles.sectionTitle}>
                                Booking Details
                              </Text>
                            </View>
                            <View style={styles.bookingDetail}>
                              <Text style={styles.detailTitle}>
                                Facility Name:
                              </Text>
                              <Text style={styles.detailText}>
                                {booking.facilityName}
                              </Text>
                            </View>
                            <View style={styles.bookingDetail}>
                              <Text style={styles.detailTitle}>
                                Adult Guests:
                              </Text>
                              <Text style={styles.detailText}>
                                {booking.adultGuests}
                              </Text>
                            </View>
                            <View style={styles.bookingDetail}>
                              <Text style={styles.detailTitle}>
                                Child Guests:
                              </Text>
                              <Text style={styles.detailText}>
                                {booking.childGuests}
                              </Text>
                            </View>
                            <View style={styles.bookingDetail}>
                              <Text style={styles.detailTitle}>Tour Time:</Text>
                              <Text style={styles.detailText}>
                                {booking.tourTime}
                              </Text>
                            </View>
                            <View style={styles.bookingDetail}>
                              <Text style={styles.detailTitle}>
                                Check-In Date:
                              </Text>
                              <Text style={styles.detailText}>
                                {formatDate(booking.checkInDate)}
                              </Text>
                            </View>
                            <View style={styles.bookingDetail}>
                              <Text style={styles.detailTitle}>
                                Check-Out Date:
                              </Text>
                              <Text style={styles.detailText}>
                                {formatDate(booking.checkOutDate)}
                              </Text>
                            </View>
                            <View style={styles.bookingDetail}>
                              <Text style={styles.detailTitle}>Status:</Text>
                              <Text
                                style={[
                                  styles.detailText,
                                  { color: getStatusColor(booking.status) },
                                ]}
                              >
                                {booking.status.charAt(0).toUpperCase() +
                                  booking.status.slice(1)}
                              </Text>
                            </View>
                            <View style={styles.bookingDetail}>
                              <Text style={styles.detailTitle}>
                                Total Amount:
                              </Text>
                              <Text style={styles.detailText}>
                                {booking.totalAmount}
                              </Text>
                            </View>
                          </View>
                          <View style={styles.paymentSection}>
                            <View style={styles.sectionHeader}>
                              <Ionicons
                                name="card-outline"
                                size={16}
                                color="black"
                                style={styles.icon}
                              />
                              <Text style={styles.sectionTitle}>
                                Payment Details
                              </Text>
                            </View>
                            <View style={styles.bookingDetail}>
                              <Text style={styles.detailTitle}>
                                Reference Number:
                              </Text>
                              <Text style={styles.detailText}>
                                {booking.referenceNumber}
                              </Text>
                            </View>
                            <View style={styles.bookingDetail}>
                              <Text style={styles.detailTitle}>
                                Amount Paid:
                              </Text>
                              <Text style={styles.detailText}>
                                ₱ {booking.amountPaid}
                              </Text>
                            </View>
                          </View>
                        </View>
                      ))}
                </View>
              </ScrollView>
            )}
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "white",
  },
  containerweather: { alignItems: "center", margin: 20 },
  temp: { fontSize: 40, fontWeight: "bold" },
  city: { fontSize: 20, color: "gray" },
  desc: { fontSize: 18, textTransform: "capitalize" },
  error: { color: "red", textAlign: "center" },
  header: {
    flexDirection: "column",
    backgroundColor: "white",
    padding: 10,
    alignItems: "center",
  },
  headerImage: {
    width: 120,
    height: 30,
  },
  searchContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    width: "80%",
    height: 50,
    backgroundColor: "#f2f2f2",
    borderRadius: 25,
    paddingHorizontal: 15,
    marginTop: 20,
  },
  searchInput: {
    flex: 1,

  },
  searchIconContainer: {
    width: 25,
    height: 25,
    borderRadius: 18,
    backgroundColor: "#088b9c",
    justifyContent: "center",
    alignItems: "center",
    marginLeft: 10,
  },
  flatListContainer: {
    flex: 1,
  },
  touchableContentContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 15,
  },
  leftContainer: {
    flexDirection: "row",
    alignItems: "center",
  },
  centeredMessageContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  filterContainer: {
    flexDirection: "row",
    paddingHorizontal: 10,
    paddingBottom: 10,
    backgroundColor: "white",
  },
  filterButton: {
    flex: 1,
    paddingVertical: 8,
    paddingHorizontal: 15,
    marginHorizontal: 5,
    borderRadius: 20,
    alignItems: "center",
  },
  filterButtonText: {
    color: "black",
    fontSize: 14,
  },
  activeFilterButton: {
    backgroundColor: "#E8FCFF",
  },
  activeFilterButtonText: {
    color: "#088B9C",
  },
  affiliateFlatListContainer: {
    flex: 1,
    backgroundColor: "white",
  },
  defaultProfilePicture: {
    width: 50,
    height: 50,
    borderRadius: 25,
    marginRight: 15,
    backgroundColor: "#ddd",
  },
  profilePicture: {
    width: 50,
    height: 50,
    borderRadius: 25,
    marginRight: 15,
  },
  username: {
    fontSize: 15,
    fontWeight: "bold",
  },
  affiliateAddress: {
    fontSize: 12,
    color: "#888",
  },
  addressContainer: {
    flexDirection: "row",
    alignItems: "center",
  },
  locationIcon: {
    marginRight: 3,
  },
  noAddressMessage: {
    fontSize: 12,
    color: "#888",
    fontStyle: "italic",
  },
  affiliateContainer: {
    marginBottom: 10,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  bellButtonContainer: {
    position: "absolute",
    bottom: 20,
    right: 20,
    backgroundColor: "#088b9c",
    width: 50,
    height: 50,
    borderRadius: 25,
    justifyContent: "center",
    alignItems: "center",
    elevation: 3,
    zIndex: 999,
  },
  modalSearchContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    width: "100%",
    height: 50,
    backgroundColor: "#f2f2f2",
    borderRadius: 25,
    paddingHorizontal: 15,
    marginTop: 10,
    marginBottom: 10,
  },
  modalSearchInput: {
    flex: 1,
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
    borderRadius: 20,
    padding: 10,
    width: "100%",
    maxHeight: "93%",
  },
  bookingItem: {
    marginTop: 5,
    padding: 10,
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 10,
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 5,
  },
  modalBody: {
    paddingTop: 10,
    paddingHorizontal: 20,
  },
  heading: {
    fontSize: 20,
    fontWeight: "bold",
  },
  section: {
    marginBottom: 20,
    borderBottomWidth: 1,
    borderBottomColor: "#ccc",
    paddingBottom: 10,
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
    marginBottom: 5,
    marginLeft: 25,
  },
  customerDetailText: {
    fontSize: 14,
    color: "#888",
  },
  bookingDetail: {
    marginBottom: 5,
    marginLeft: 25,
  },
  detailTitle: {
    marginBottom: 5,
    color: "#888",
  },
  detailText: {
    fontSize: 14,
  },
  closeButton: {
    backgroundColor: "#f0f0f0",
    borderRadius: 50,
    padding: 5,
  },
  messageContainer: {
    position: "absolute",
    backgroundColor: "#E8FCFF",
    borderRadius: 20,
    padding: 10,
    paddingRight: 30,
    bottom: 25,
    right: 45,
  },
  messageText: {
    color: "#088b9c",
  },
  noBookingFoundContainer: {
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 20,
    paddingVertical: 10,
  },
  noBookingFoundTitle: {
    fontSize: 14,
    color: "#888",
  },
  bookingSearchQuery: {
    fontSize: 16,
    fontWeight: "bold",
    marginBottom: 5,
  },
});

export default HomeScreen;
