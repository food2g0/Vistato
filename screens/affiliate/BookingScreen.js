import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  StatusBar,
  FlatList,
  Image,
  ScrollView,
  TextInput,
  ActivityIndicator,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import firebase from "../../firebase.js";
import { useNavigation, useFocusEffect } from "@react-navigation/native";
import BookingModal from "./BookingModal.js";

const CustomHeader = ({ title, onAddPress }) => (
  <SafeAreaView style={styles.safeArea}>
    <StatusBar barStyle="dark-content" backgroundColor="#606c38" />
    <View style={styles.header}>
      <Text style={styles.title}>{title}</Text>
    </View>
  </SafeAreaView>
);

const BookingItem = ({ item, onPress }) => {
  const checkInDate = new Date(item.checkInDate);
  const formattedCheckInDate = checkInDate.toLocaleDateString("en-US", {
    weekday: "short",
    year: "numeric",
    month: "short",
    day: "numeric",
  });

  return (
    <TouchableOpacity
      style={styles.facilityItemContainer}
      onPress={() => onPress(item)}
    >
      <View style={styles.facilityLeft}>
        <View style={styles.leftContent}>
          <Image
            source={{ uri: item.facilityImage }}
            style={styles.facilityImage}
          />
          <View style={styles.facilityDetails}>
            <Text style={styles.facilityName}>{item.facilityName}</Text>
            {item.customerData ? (
              <View>
                <Text style={styles.customerName}>
                  {item.customerData.username}
                </Text>
              </View>
            ) : (
              <Text style={styles.customerName}>
                {item.customerDetails.username}
              </Text>
            )}
            <Text style={styles.bookingDate}>
              {item.status === "declined" ? item.status : formattedCheckInDate}
            </Text>
          </View>
        </View>
      </View>
      <Ionicons name="chevron-forward" size={15} color="#888" />
    </TouchableOpacity>
  );
};

const BookingScreen = () => {
  const [bookings, setBookings] = useState([]);
  const [filter, setFilter] = useState("pending");
  const [selectedBooking, setSelectedBooking] = useState(null);
  const navigation = useNavigation();
  const [affiliateId, setAffiliateId] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchUserData = async () => {
      try {
        const user = firebase.auth().currentUser;

        if (!user) {
          console.error("No authenticated user.");
          return;
        }

        setAffiliateId(user.uid);
      } catch (error) {
        console.error("Error fetching user data: ", error);
      }
    };

    fetchUserData();
  }, []);

  useEffect(() => {
    const fetchBookings = async () => {
      try {
        const user = firebase.auth().currentUser;
        if (!user) {
          console.error("No authenticated user.");
          return;
        }
        const db = firebase.database();
        const bookingsRef = db.ref("bookings");
        bookingsRef.on("value", async (snapshot) => {
          const data = snapshot.val();
          if (data) {
            const fetchedBookings = [];
            for (const key in data) {
              if (data.hasOwnProperty(key)) {
                const booking = { id: key, ...data[key] };
                if (booking.affiliateID === user.uid && !booking.isDeleted) {
                  const {
                    facilityID,
                    customerID,
                    customerDetails,
                    ...bookingDetails
                  } = booking;
                  const facilitySnapshot = await db
                    .ref(`facilities/${user.uid}/${facilityID}`)
                    .once("value");
                  const facilityData = facilitySnapshot.val();
                  if (facilityData) {
                    const facilityImage = facilityData.images?.[0] || null;
                    const facilityName =
                      facilityData.facilityName || "Unknown Facility";
                    let customerData = null;
                    if (customerID) {
                      const customerSnapshot = await db
                        .ref(`customers/${customerID}`)
                        .once("value");
                      customerData = customerSnapshot.val();
                    }
                    fetchedBookings.push({
                      ...bookingDetails,
                      facilityName,
                      facilityImage,
                      customerData,
                      customerDetails,
                    });
                  }
                }
              }
            }
            const filteredBookings = fetchedBookings.filter((booking) => {
              const statusFilter = booking.status === filter;
              const searchFilter =
                searchQuery.trim() === "" ||
                booking.customerData?.username
                  .toLowerCase()
                  .includes(searchQuery.toLowerCase());
              return statusFilter && searchFilter;
            });
            setBookings(filteredBookings);
          } else {
            setBookings([]);
          }
          setLoading(false);
        });
      } catch (error) {
        console.error("Error fetching bookings: ", error);
        setLoading(false);
      }
    };

    fetchBookings();
  }, [filter, searchQuery]);

  const handleAddPress = () => {
    navigation.navigate("AddBooking");
  };

  const handleFilterChange = (newFilter) => {
    setFilter(newFilter);
  };

  const handleBookingPress = (booking) => {
    setSelectedBooking(booking);
  };

  const handleSearch = (text) => {
    setSearchQuery(text);
  };

  const clearSearch = () => {
    setSearchQuery("");
  };

  const filteredBookings = bookings.filter((booking) => {
    return booking.status === filter;
  });

  return (
    <View style={styles.screen}>
      <CustomHeader title="Bookings" onAddPress={handleAddPress} />

      <View style={styles.searchContainer}>
        <View style={styles.searchBar}>
          <Ionicons
            name="search"
            size={20}
            color="gray"
            style={styles.searchIcon}
          />
          <TextInput
            style={styles.searchInput}
            placeholder="Search..."
            onChangeText={handleSearch}
            value={searchQuery}
            onClear={clearSearch}
          />
        </View>
      </View>

      <View style={styles.filterButtonsContainer}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          <TouchableOpacity
            style={[
              styles.filterButton,
              filter === "pending"
                ? styles.activeFilterButton
                : styles.inactiveFilterButton,
            ]}
            onPress={() => handleFilterChange("pending")}
          >
            <Text
              style={
                filter === "pending"
                  ? styles.activeFilterButtonText
                  : styles.inactiveFilterButtonText
              }
            >
              Pending
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[
              styles.filterButton,
              filter === "approved"
                ? styles.activeFilterButton
                : styles.inactiveFilterButton,
            ]}
            onPress={() => handleFilterChange("approved")}
          >
            <Text
              style={
                filter === "approved"
                  ? styles.activeFilterButtonText
                  : styles.inactiveFilterButtonText
              }
            >
              Approved
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[
              styles.filterButton,
              filter === "checked-in"
                ? styles.activeFilterButton
                : styles.inactiveFilterButton,
            ]}
            onPress={() => handleFilterChange("checked-in")}
          >
            <Text
              style={
                filter === "checked-in"
                  ? styles.activeFilterButtonText
                  : styles.inactiveFilterButtonText
              }
            >
              Checked In
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[
              styles.filterButton,
              filter === "checked-out"
                ? styles.activeFilterButton
                : styles.inactiveFilterButton,
            ]}
            onPress={() => handleFilterChange("checked-out")}
          >
            <Text
              style={
                filter === "checked-out"
                  ? styles.activeFilterButtonText
                  : styles.inactiveFilterButtonText
              }
            >
              Checked Out
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[
              styles.filterButton,
              filter === "completed"
                ? styles.activeFilterButton
                : styles.inactiveFilterButton,
            ]}
            onPress={() => handleFilterChange("completed")}
          >
            <Text
              style={
                filter === "completed"
                  ? styles.activeFilterButtonText
                  : styles.inactiveFilterButtonText
              }
            >
              Completed
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[
              styles.filterButton,
              filter === "declined"
                ? styles.activeFilterButton
                : styles.inactiveFilterButton,
            ]}
            onPress={() => handleFilterChange("declined")}
          >
            <Text
              style={
                filter === "declined"
                  ? styles.activeFilterButtonText
                  : styles.inactiveFilterButtonText
              }
            >
              Declined
            </Text>
          </TouchableOpacity>
        </ScrollView>
      </View>

      <View style={styles.contentContainer}>
        {loading ? (
          <ActivityIndicator size="large" color="#0000ff" />
        ) : filteredBookings.length > 0 ? (
          <FlatList
            data={filteredBookings}
            keyExtractor={(item) => item.id}
            renderItem={({ item }) => (
              <BookingItem item={item} onPress={handleBookingPress} />
            )}
          />
        ) : (
          <View style={styles.centeredMessageContainer}>
            <Ionicons name="warning" size={50} color="#FF6347" />
            <Text>No {filter} bookings found.</Text>
          </View>
        )}
      </View>

      {selectedBooking && (
        <BookingModal
          visible={!!selectedBooking}
          onClose={() => setSelectedBooking(null)}
          booking={selectedBooking}
          status={selectedBooking ? selectedBooking.status : null}
          affiliateId={affiliateId}
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    backgroundColor: "white",
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 10,
    paddingHorizontal: 15,
  },
  title: {
    color: "black",
    fontSize: 30,
    fontWeight: "bold",
  },
  addButton: {
    padding: 5,
    borderRadius: 50,
    backgroundColor: "#f0f0f0",
  },
  screen: {
    flex: 1,
  },
  contentContainer: {
    flex: 1,
    padding: 10,
  },
  centeredMessageContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  facilityItemContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 16,
    borderRadius: 15,
    marginBottom: 10,
    backgroundColor: "white",
  },
  facilityLeft: {
    flexDirection: "row",
    alignItems: "center",
  },
  leftContent: {
    flexDirection: "row",
    alignItems: "center",
  },
  facilityImage: {
    width: 80,
    height: 50,
    borderRadius: 10,
    marginRight: 15,
  },
  facilityDetails: {
    flexDirection: "column",
  },
  facilityName: {
    fontSize: 16,
    fontWeight: "bold",
  },
  customerName: {
    fontSize: 12,
    color: "#666",
  },
  bookingDate: {
    fontSize: 12,
    marginTop: 5,
    color: "#088b9c",
  },
  searchContainer: {
    backgroundColor: "white",
    paddingHorizontal: 10,
    paddingBottom: 10,
    flexDirection: "row",
    alignItems: "center",
  },
  searchBar: {
    flex: 1,
    paddingHorizontal: 15,
    paddingVertical: 8,
    borderRadius: 25,
    backgroundColor: "#f0f0f0",
    flexDirection: "row",
    alignItems: "center",
  },
  searchInput: {
    flex: 1,
  },
  searchIcon: {
    marginRight: 10,
  },
  filterButtonsContainer: {
    flexDirection: "row",
    backgroundColor: "white",
    paddingHorizontal: 10,
    paddingBottom: 10,
  },
  filterButton: {
    paddingVertical: 8,
    paddingHorizontal: 15,
    borderRadius: 20,
    alignItems: "center",
  },
  activeFilterButton: {
    backgroundColor: "#E8FCFF",
  },
  activeFilterButtonText: {
    color: "#088B9C",
  },
  filterButtonText: {
    color: "white",
  },
  inactiveFilterButton: {
    backgroundColor: "white",
  },
  inactiveFilterButtonText: {
    color: "black",
  },
});

export default BookingScreen;