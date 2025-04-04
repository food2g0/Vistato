import React, { useState, useRef, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  Image,
  ScrollView,
  TouchableOpacity,
  SafeAreaView,
  Dimensions,
  TextInput,
  Alert,
} from "react-native";
import { Ionicons, FontAwesome, MaterialIcons } from "@expo/vector-icons";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import DateTimePickerModal from "react-native-modal-datetime-picker";
import firebase from "../firebase";
import PaymentWindow from "./PaymentWindow";

const AmenityBookingScreen = ({ route, navigation }) => {
  const { selectedFacility, affiliate } = route.params;
  const [isFavorite, setIsFavorite] = useState(false);
  const [updatedAvailability, setUpdatedAvailability] = useState(
    selectedFacility.availability,
  );
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const scrollViewRef = useRef(null);
  const [totalAmount, setTotalAmount] = useState(0);
  const [isCheckInPickerVisible, setCheckInPickerVisible] = useState(false);
  const [checkInDate, setCheckInDate] = useState(null);
  const [isCheckOutPickerVisible, setCheckOutPickerVisible] = useState(false);
  const [checkOutDate, setCheckOutDate] = useState(null);
  const [adultGuests, setAdultGuests] = useState(0);
  const [childGuests, setChildGuests] = useState(0);
  const [tourTime, setTourTime] = useState("dayTourTime");
  const facilityId = selectedFacility.id;
  const [reviews, setReviews] = useState([]);
  const [displayedReviews, setDisplayedReviews] = useState([]);
  const [showAllReviews, setShowAllReviews] = useState(false);
  const [customerData, setCustomerData] = useState(null);
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [contactNo, setContactNo] = useState("");
  const [address, setAddress] = useState("");
  const [isPaymentWindowVisible, setPaymentWindowVisible] = useState(false);
  const [paymentDetails, setPaymentDetails] = useState({
    referenceNumber: "",
    amountPaid: "",
  });

  useEffect(() => {
    const user = firebase.auth().currentUser;
    if (user) {
      const customerId = user.uid;
      const customersRef = firebase
        .database()
        .ref("customers")
        .child(customerId);
      customersRef.once("value", (snapshot) => {
        if (snapshot.exists()) {
          setCustomerData(snapshot.val());
        }
      });
    }
  }, []);

  const listenForAvailabilityChanges = () => {
    const facilityRef = firebase
      .database()
      .ref(`facilities/${affiliate.key}/${facilityId}`);
    facilityRef.on("value", (snapshot) => {
      const updatedFacility = snapshot.val();
      if (updatedFacility) {
        setUpdatedAvailability(updatedFacility.availability);
      }
    });
  };

  useEffect(() => {
    listenForAvailabilityChanges();
    return () => {
      const facilityRef = firebase
        .database()
        .ref(`facilities/${affiliate.key}/${facilityId}`);
      facilityRef.off();
    };
  }, []);

  const toggleFavorite = async () => {
    const user = firebase.auth().currentUser;

    if (!user) {
      Alert.alert(
        "Login Required",
        "You need to sign in to add this facility to favorites.",
        [{ text: "OK" }],
        { cancelable: false },
      );
      return;
    }

    try {
      const favoritesRef = firebase
        .database()
        .ref(`favorites/${user.uid}/${selectedFacility.id}`);
      if (isFavorite) {
        Alert.alert(
          "Already Added",
          "This facility is already added to favorites.",
          [{ text: "OK" }],
          { cancelable: false },
        );
        return;
      } else {
        const facilityData = {
          ...selectedFacility,
          affiliateId: affiliate.id,
        };
        await favoritesRef.set(facilityData);
      }
      setIsFavorite(!isFavorite);
    } catch (error) {
      console.error("Toggle favorite failed:", error);
    }
  };

  const isFacilityInFavorites = async () => {
    const user = firebase.auth().currentUser;

    if (!user) {
      return false;
    }

    try {
      const favoritesRef = firebase
        .database()
        .ref(`favorites/${user.uid}/${selectedFacility.id}`);
      const snapshot = await favoritesRef.once("value");
      return snapshot.exists();
    } catch (error) {
      console.error("Error checking favorite status:", error);
      return false;
    }
  };

  useEffect(() => {
    const fetchFavoriteStatus = async () => {
      const favoriteStatus = await isFacilityInFavorites();
      setIsFavorite(favoriteStatus);
    };

    fetchFavoriteStatus();
  }, []);

  const handleScroll = (event) => {
    const contentOffsetX = event.nativeEvent.contentOffset.x;
    const currentIndex = Math.round(
      contentOffsetX / Dimensions.get("window").width,
    );
    setCurrentImageIndex(currentIndex);
  };

  const StarRating = ({ rating, size }) => {
    const renderStar = (index) => {
      const isHalf = index - 0.5 === rating;
      const isFilled = index <= rating;

      return (
        <View key={index} style={styles.starContainer}>
          <MaterialCommunityIcons
            name={isHalf ? "star-half" : isFilled ? "star" : "star"}
            size={size}
            color={isHalf ? "#FFB800" : isFilled ? "#FFB800" : "white"}
            style={styles.starIcon}
          />
          {index === Math.ceil(rating) && (
            <Text style={styles.ratingText}>{rating}</Text>
          )}
        </View>
      );
    };

    return (
      <View style={styles.starRatingContainer}>
        {[1, 2, 3, 4, 5].map((index) => renderStar(index))}
      </View>
    );
  };

  const calculateAverageRating = () => {
    if (reviews.length === 0) {
      return { rating: 0, icon: "star" };
    }

    const totalRating = reviews.reduce((acc, curr) => acc + curr.rating, 0);

    const averageRating = totalRating / reviews.length;

    console.log("Total rating:", totalRating);
    console.log("Number of reviews:", reviews.length);
    console.log("Average rating:", averageRating.toFixed(1));

    return { rating: averageRating.toFixed(1), icon: "star" };
  };

  useEffect(() => {
    const fetchReviews = async () => {
      try {
        const reviewsRef = firebase.database().ref("reviews");
        const snapshot = await reviewsRef.once("value");
        const reviewsData = snapshot.val();

        if (reviewsData) {
          const filteredReviews = Object.entries(reviewsData)
            .filter(([_, review]) => review.facilityID === facilityId)
            .map(([reviewId, reviewData]) => ({
              id: reviewId,
              ...reviewData,
            }));

          for (const review of filteredReviews) {
            const customerData = await fetchCustomerData(review.customerID);
            review.customerData = customerData;
          }

          setReviews(filteredReviews);
        }
      } catch (error) {
        console.error("Error fetching reviews:", error);
      }
    };

    fetchReviews();
  }, [facilityId]);

  const fetchCustomerData = async (customerId) => {
    try {
      const customerRef = firebase.database().ref(`customers/${customerId}`);
      const snapshot = await customerRef.once("value");
      return snapshot.val();
    } catch (error) {
      console.error("Error fetching customer data:", error);
      return null;
    }
  };

  useEffect(() => {
    if (reviews.length > 0) {
      setDisplayedReviews(reviews.slice(0, 2));
      setShowAllReviews(reviews.length > 2);
    }
  }, [reviews]);

  const handleSeeMore = () => {
    setDisplayedReviews(reviews);
    setShowAllReviews(false);
  };

  const handleSeeLess = () => {
    setDisplayedReviews(reviews.slice(0, 2));
    setShowAllReviews(true);
  };

  const showCheckInPicker = () => {
    setCheckInPickerVisible(true);
  };

  const hideCheckInPicker = () => {
    setCheckInPickerVisible(false);
  };

  const showCheckOutPicker = () => {
    setCheckOutPickerVisible(true);
  };

  const hideCheckOutPicker = () => {
    setCheckOutPickerVisible(false);
  };

  const handleCheckInConfirm = (date) => {
    if (checkOutDate && date > checkOutDate) {
      resetDatesAndPickers();
      Alert.alert(
        "Invalid Dates",
        "Check-in date cannot be later than check-out date",
      );
    } else {
      setCheckInDate(date);
      hideCheckInPicker();
    }
  };

  const handleCheckOutConfirm = (date) => {
    if (checkInDate && date < checkInDate) {
      resetDatesAndPickers();
      Alert.alert(
        "Invalid Dates",
        "Check-out date cannot be earlier than check-in date",
      );
    } else {
      setCheckOutDate(date);
      hideCheckOutPicker();
    }
  };

  const resetDatesAndPickers = () => {
    setCheckInDate(null);
    setCheckOutDate(null);
    hideCheckInPicker();
    hideCheckOutPicker();
    setTourTime("dayTourTime");
    setAdultGuests(0);
    setChildGuests(0);
    setTotalAmount(0);
  };

  const handleAdultGuestChange = (value) => {
    setAdultGuests(value);
  };

  const handleChildGuestChange = (value) => {
    setChildGuests(value);
  };

  const handleTourTimeChange = (time) => {
    setTourTime(time);
    calculateTotalAmount();
  };

  const calculateTotalAmount = () => {
    if (checkInDate && checkOutDate && (adultGuests || childGuests)) {
      const adultEntranceFee =
        parseFloat(selectedFacility.adultEntranceFee) || 0;
      const childEntranceFee =
        parseFloat(selectedFacility.childEntranceFee) || 0;
      const adultTotalEntranceFee = adultGuests * adultEntranceFee;
      const childTotalEntranceFee = childGuests * childEntranceFee;

      const checkIn = new Date(checkInDate);
      const checkOut = new Date(checkOutDate);
      const timeDifference = checkOut.getTime() - checkIn.getTime();
      const daysDifference = Math.ceil(timeDifference / (1000 * 3600 * 24)) + 1;

      let selectedTourPrice =
        tourTime === "dayTourTime"
          ? parseFloat(selectedFacility.dayTourPrice.price) || 0
          : parseFloat(selectedFacility.nightTourPrice.price) || 0;
      selectedTourPrice *= daysDifference;

      const total =
        selectedTourPrice + adultTotalEntranceFee + childTotalEntranceFee;

      console.log("Days Difference:", daysDifference);
      console.log("Adult Total Entrance Fee:", adultTotalEntranceFee);
      console.log("Child Total Entrance Fee:", childTotalEntranceFee);
      console.log("Selected Tour Price:", selectedTourPrice);
      console.log("Total Amount:", total);

      setTotalAmount(total);
    }
  };

  useEffect(() => {
    calculateTotalAmount();
  }, [checkInDate, checkOutDate, adultGuests, childGuests, tourTime]);

  function formatDate(date) {
    const options = {
      weekday: "short",
      month: "short",
      day: "2-digit",
      year: "numeric",
    };
    return date.toLocaleDateString("en-US", options);
  }

  const handleBooking = () => {
    const user = firebase.auth().currentUser;
  
    if (!user) {
      if (!username) {
        Alert.alert("Oops!", "Please enter your full name.");
        return;
      }
  
      if (!email) {
        Alert.alert("Oops!", "Please enter your email address.");
        return;
      }
  
      if (!validateEmail(email)) {
        Alert.alert("Invalid Email", "Please enter a valid email address.");
        return;
      }
  
      if (!contactNo) {
        Alert.alert("Oops!", "Please enter your contact number.");
        return;
      }
  
      if (!address) {
        Alert.alert("Oops!", "Please enter your address.");
        return;
      }
    }
  
    if (!checkInDate) {
      Alert.alert("Oops!", "Please select check-in dates.");
      return;
    }
  
    if (!checkOutDate) {
      Alert.alert("Oops!", "Please select check-out dates.");
      return;
    }
  
    if (adultGuests <= 0 && childGuests <= 0) {
      Alert.alert("Oops!", "Please specify the number of guests.");
      return;
    }
  
    if (!tourTime) {
      const currentTime = new Date().getHours();
      tourTime =
        currentTime >= dayTourStartTime && currentTime < nightTourStartTime
          ? "dayTourTime"
          : "nightTourTime";
    }
  
    checkForOverlappingBookings();
  };
  
  const validateEmail = (email) => {
    const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return regex.test(email);
  };

  const handlePaymentSubmit = (data, callback) => {
    setPaymentDetails(data);
    saveBooking(data, callback);
  };

  const saveBooking = async (paymentDetails, callback) => {
    try {
      if (!paymentDetails.referenceNumber || !paymentDetails.amountPaid) {
        Alert.alert(
          "Oops!",
          "Please enter the reference number and the total amount.",
        );
        return;
      }

      const total = totalAmount;

      const user = firebase.auth().currentUser;
      let customerID = null;
      let customerDetails = null;

      if (user) {
        customerID = user.uid;
      } else {
        customerDetails = {
          username: username,
          email: email,
          contactNo: contactNo,
          address: address,
        };
      }

      const bookingsRef = firebase.database().ref("bookings");
      const newBookingRef = bookingsRef.push();

      const checkInTimestamp = checkInDate.getTime();
      const checkOutTimestamp = checkOutDate.getTime();

      const bookingData = {
        affiliateID: affiliate.key,
        customerID: customerID,
        facilityID: facilityId,
        facilityName: selectedFacility.facilityName,
        checkInDate: checkInTimestamp,
        checkOutDate: checkOutTimestamp,
        adultGuests: adultGuests,
        childGuests: childGuests,
        referenceNumber: paymentDetails.referenceNumber,
        amountPaid: paymentDetails.amountPaid,
        tourTime: tourTime,
        totalAmount: total,
        status: "pending",
        affiliateDetails: {
          username: affiliate.username,
          contactNo: affiliate.contactNo || "",
          email: affiliate.email || "",
          address: affiliate.address || "",
        },
      };

      if (customerDetails) {
        bookingData.customerDetails = customerDetails;
      }

      console.log("Booking Data:", bookingData);

      await newBookingRef.set(bookingData);

      const alertTitle = user ? "Booking Submitted" : "Booking Submitted";
      let alertMessage = user
        ? "Your booking has been successfully submitted! Please wait for the affiliate to process it."
        : `Your booking has been successfully submitted!\n\nTake a screenshot of this ID for accessing your booking details.\n\nYour booking ID is ${newBookingRef.key}`;

      Alert.alert(
        alertTitle,
        alertMessage,
        [
          {
            text: "OK",
            onPress: () => {
              setPaymentDetails({ referenceNumber: "", amountPaid: "" });
              setCheckInDate(null);
              setCheckOutDate(null);
              setAdultGuests(0);
              setChildGuests(0);
              setTourTime("dayTourTime");
              setUsername("");
              setEmail("");
              setContactNo("");
              setAddress("");
              setTotalAmount(0);

              callback();
            },
          },
        ],
        { cancelable: false },
      );
    } catch (error) {
      console.error("Error during booking:", error.message);
      Alert.alert("Error", error.message);
    }
  };

  const checkForOverlappingBookings = async () => {
    try {
      const overlappingBookingsSnapshot = await firebase
        .database()
        .ref("bookings")
        .orderByChild("facilityID")
        .equalTo(facilityId)
        .once("value");

      if (overlappingBookingsSnapshot.exists()) {
        const overlappingBookings = overlappingBookingsSnapshot.val();
        const checkInTimestamp = checkInDate.getTime();
        const checkOutTimestamp = checkOutDate.getTime();

        for (const bookingKey in overlappingBookings) {
          const existingBooking = overlappingBookings[bookingKey];
          const existingCheckInTimestamp = existingBooking.checkInDate;
          const existingCheckOutTimestamp = existingBooking.checkOutDate;

          if (
            (checkInTimestamp <= existingCheckOutTimestamp &&
              checkOutTimestamp >= existingCheckInTimestamp) ||
            (existingCheckInTimestamp === checkInTimestamp &&
              existingCheckOutTimestamp === checkOutTimestamp)
          ) {
            Alert.alert(
              "Oops!",
              "This facility is already booked for the selected dates. Please choose different dates.",
            );
            return;
          }
        }
      }

      setPaymentWindowVisible(true);
    } catch (error) {
      console.error("Error checking overlapping bookings:", error.message);
      Alert.alert(
        "Error",
        "An error occurred while checking overlapping bookings.",
      );
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={styles.headerButton}
        >
          <Ionicons name="chevron-back" size={24} color="black" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{selectedFacility.facilityName}</Text>
        <TouchableOpacity
          style={styles.favoriteButton}
          onPress={toggleFavorite}
        >
          <Ionicons
            name={isFavorite ? "heart" : "heart-outline"}
            size={24}
            color={isFavorite ? "red" : "black"}
          />
        </TouchableOpacity>
      </View>

      <ScrollView
        style={styles.scrollContainer}
        contentContainerStyle={styles.screen}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.imageContainer}>
          <ScrollView
            ref={scrollViewRef}
            horizontal
            pagingEnabled
            showsHorizontalScrollIndicator={false}
            onScroll={handleScroll}
            scrollEventThrottle={200}
          >
            {selectedFacility.images.map((image, index) => (
              <Image
                key={index}
                source={{ uri: image }}
                style={styles.facilityImage}
              />
            ))}
          </ScrollView>

          <View style={styles.imageIndicatorContainer}>
            {selectedFacility.images.map((_, index) => (
              <View
                key={index}
                style={[
                  styles.imageIndicator,
                  {
                    backgroundColor:
                      index === currentImageIndex ? "#088B9C" : "white",
                  },
                ]}
              />
            ))}
          </View>
        </View>

        <View style={styles.affiliateFacilityContainer}>
          <Text style={styles.affiliateUsername}>{affiliate.username}</Text>
          <Text style={styles.facilityName}>
            {selectedFacility.facilityName}
          </Text>
          {calculateAverageRating().rating > 0 ? (
            <StarRating rating={calculateAverageRating().rating} size={20} />
          ) : (
            <Text style={styles.noRatingMessage}>No ratings yet</Text>
          )}
          <Text
            style={[
              styles.availabilityText,
              { color: updatedAvailability === "Available" ? "green" : "red" },
            ]}
          >
            {updatedAvailability}
          </Text>
        </View>

        <View style={styles.descriptionContainer}>
          <Text style={styles.descriptionTitle}>Description</Text>
          <Text style={styles.facilityDescription}>
            {selectedFacility.description}
          </Text>
        </View>

        <View style={styles.reviewsContainer}>
          <Text style={styles.reviewsTitle}>Reviews</Text>
          {displayedReviews.length > 0 ? (
            displayedReviews.map((review, index) => (
              <View
                key={index}
                style={[
                  styles.reviewItem,
                  index !== displayedReviews.length - 1 &&
                    styles.reviewSeparator,
                ]}
              >
                <View style={styles.customerContainer}>
                  <View style={styles.customerInfo}>
                    <Image
                      source={
                        review.customerData.profilePicture
                          ? { uri: review.customerData.profilePicture }
                          : require("../assets/profile-picture.jpg")
                      }
                      style={styles.profilePicture}
                    />
                    <View style={styles.customerNameRating}>
                      <Text style={styles.customerName}>
                        {review.customerData.username}
                      </Text>
                      <StarRating rating={review.rating} size={15} />
                    </View>
                  </View>
                </View>
                <View style={styles.reviewTextContainer}>
                  <Text style={styles.reviewText}>{review.review}</Text>
                </View>
              </View>
            ))
          ) : (
            <Text style={styles.noReviewsText}>No reviews available</Text>
          )}
          {reviews.length > 2 && (
            <>
              {showAllReviews ? (
                <TouchableOpacity
                  onPress={handleSeeMore}
                  style={styles.iconButton}
                >
                  <Text style={styles.iconText}>See More</Text>
                  <Ionicons name="chevron-down" size={20} color="#088b9c" />
                </TouchableOpacity>
              ) : (
                <TouchableOpacity
                  onPress={handleSeeLess}
                  style={styles.iconButton}
                >
                  <Text style={styles.iconText}>See Less</Text>
                  <Ionicons name="chevron-up" size={20} color="#088b9c" />
                </TouchableOpacity>
              )}
            </>
          )}
        </View>

        <View style={styles.amenitiesContainer}>
          <Text style={styles.amenitiesTitle}>Amenities</Text>
          <View style={styles.amenitiesList}>
            {selectedFacility.amenities.split("\n").map((amenity, index) => (
              <View key={index} style={styles.amenity}>
                <Text style={styles.amenityText}>{amenity}</Text>
              </View>
            ))}
          </View>
        </View>

        <View style={styles.pricesContainer}>
          <Text style={styles.pricesTitle}>Prices</Text>
          <View style={styles.priceItemContainer}>
            <View style={styles.priceContainer}>
              <MaterialCommunityIcons
                name="human-male-female"
                size={30}
                color="#6dc072"
                style={styles.iconStyle}
              />
              <Text style={styles.priceLabel}> Adult</Text>
            </View>
            <View style={styles.priceDetails}>
              <Text style={styles.priceValue}>
                ₱ {selectedFacility.adultEntranceFee}
              </Text>
            </View>
          </View>
          <View style={styles.priceItemContainer}>
            <View style={styles.priceContainer}>
              <MaterialCommunityIcons
                name="account-child"
                size={30}
                color="#ff0000"
                style={styles.iconStyle}
              />
              <Text style={styles.priceLabel}> Child</Text>
            </View>
            <View style={styles.priceDetails}>
              <Text style={styles.priceValue}>
                ₱ {selectedFacility.childEntranceFee}
              </Text>
            </View>
          </View>
          <View style={styles.priceItemContainer}>
            <View style={styles.priceContainer}>
              <MaterialCommunityIcons
                name="weather-sunny"
                size={30}
                color="#fea219"
                style={styles.iconStyle}
              />
              <Text style={styles.priceLabel}> Day Tour Price</Text>
            </View>
            <View style={styles.priceDetails}>
              <Text style={styles.priceValue}>
                ₱ {selectedFacility.dayTourPrice.price}
              </Text>
              <Text style={styles.startTime}>
                {selectedFacility.dayTourPrice.startTime}
              </Text>
            </View>
          </View>
          <View style={styles.priceItemContainer}>
            <View style={styles.priceContainer}>
              <MaterialCommunityIcons
                name="weather-night"
                size={30}
                color="#2ba6c7"
                style={styles.iconStyle}
              />
              <Text style={styles.priceLabel}> Night Tour Price</Text>
            </View>
            <View style={styles.priceDetails}>
              <Text style={styles.priceValue}>
                ₱ {selectedFacility.nightTourPrice.price}
              </Text>
              <Text style={styles.startTime}>
                {selectedFacility.nightTourPrice.startTime}
              </Text>
            </View>
          </View>
        </View>

        <View style={styles.customerDetailsContainer}>
          <Text style={styles.customerDetailsTitle}>Customer Details</Text>
          {customerData ? (
            <View style={styles.inputWrapper}>
              <View style={styles.customerDetails}>
                <Text style={styles.placeholder}>Full Name:</Text>
                <TextInput
                  style={[styles.customerDetailText, styles.input]}
                  value={customerData.username}
                  editable={false}
                />
                <Text style={styles.placeholder}>Email:</Text>
                <TextInput
                  style={[styles.customerDetailText, styles.input]}
                  value={customerData.email}
                  editable={false}
                />
                <Text style={styles.placeholder}>Contact Number:</Text>
                <TextInput
                  style={[styles.customerDetailText, styles.input]}
                  value={customerData.contactNo}
                  editable={false}
                />
                <Text style={styles.placeholder}>Address:</Text>
                <TextInput
                  style={[styles.customerDetailText, styles.input]}
                  value={customerData.address}
                  editable={false}
                />
              </View>
            </View>
          ) : (
            <View style={styles.inputWrapper}>
              <View>
                <Text style={styles.placeholder}>Full Name:</Text>
                <TextInput
                  style={styles.input}
                  placeholder=""
                  onChangeText={setUsername}
                  value={username}
                />
              </View>
              <View>
                <Text style={styles.placeholder}>Email:</Text>
                <TextInput
                  style={styles.input}
                  placeholder=""
                  onChangeText={setEmail}
                  value={email}
                  keyboardType="email-address"
                />
              </View>
              <View>
                <Text style={styles.placeholder}>Contact Number:</Text>
                <TextInput
                  style={styles.input}
                  placeholder=""
                  onChangeText={setContactNo}
                  value={contactNo}
                  keyboardType="phone-pad"
                  maxLength={11}
                />
              </View>
              <View>
                <Text style={styles.placeholder}>Address:</Text>
                <TextInput
                  style={styles.input}
                  placeholder=""
                  onChangeText={setAddress}
                  value={address}
                />
              </View>
            </View>
          )}
        </View>

        <View style={styles.inputContainer}>
          <Text style={styles.pricesTitle}>Your Booking Details</Text>
          <View style={styles.inputWrapper}>
            <Text style={styles.inputLabel}>Check-In Date:</Text>
            <TouchableOpacity style={styles.input} onPress={showCheckInPicker}>
              <Text style={styles.inputText}>
                {checkInDate
                  ? checkInDate.toDateString()
                  : "Select Check In Date"}
              </Text>
            </TouchableOpacity>
            <DateTimePickerModal
              isVisible={isCheckInPickerVisible}
              mode="date"
              date={checkInDate || new Date()}
              onConfirm={handleCheckInConfirm}
              onCancel={hideCheckInPicker}
              minimumDate={new Date()}
            />
            <Text style={styles.inputLabel}>Check-Out Date:</Text>
            <TouchableOpacity style={styles.input} onPress={showCheckOutPicker}>
              <Text style={styles.inputText}>
                {checkOutDate
                  ? checkOutDate.toDateString()
                  : "Select Check Out Date"}
              </Text>
            </TouchableOpacity>
            <DateTimePickerModal
              isVisible={isCheckOutPickerVisible}
              mode="date"
              date={checkOutDate || new Date()}
              onConfirm={handleCheckOutConfirm}
              onCancel={hideCheckOutPicker}
              minimumDate={new Date()}
            />
            <Text style={styles.inputLabel}>Select Tour Time:</Text>
            <View style={styles.tourTimeContainer}>
              <TouchableOpacity
                style={[
                  styles.tourTimeButton,
                  tourTime === "dayTourTime" && styles.selectedTourTime,
                ]}
                onPress={() => handleTourTimeChange("dayTourTime")}
              >
                <Text
                  style={[
                    styles.tourTimeButtonText,
                    tourTime === "dayTourTime" && styles.selectedTourTimeText,
                  ]}
                >
                  Day Tour
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[
                  styles.tourTimeButton,
                  tourTime === "nightTourTime" && styles.selectedTourTime,
                ]}
                onPress={() => handleTourTimeChange("nightTourTime")}
              >
                <Text
                  style={[
                    styles.tourTimeButtonText,
                    tourTime === "nightTourTime" && styles.selectedTourTimeText,
                  ]}
                >
                  Night Tour
                </Text>
              </TouchableOpacity>
            </View>
            <View style={styles.guestsContainer}>
              <Text style={[styles.inputLabel, styles.guestsLabel]}>
                Adult Guests:
              </Text>
              <TextInput
                style={[styles.input, styles.guestsInput]}
                value={adultGuests.toString()}
                onChangeText={handleAdultGuestChange}
                keyboardType="numeric"
                placeholder="Number of Adults"
              />
            </View>
            <View style={styles.guestsContainer}>
              <Text style={[styles.inputLabel, styles.guestsLabel]}>
                Children Guests:
              </Text>
              <TextInput
                style={[styles.input, styles.guestsInput]}
                value={childGuests.toString()}
                onChangeText={handleChildGuestChange}
                keyboardType="numeric"
                placeholder="Number of Children"
              />
            </View>
          </View>
        </View>

        <PaymentWindow
          isVisible={isPaymentWindowVisible}
          onClose={() => setPaymentWindowVisible(false)}
          onSubmit={handlePaymentSubmit}
          affiliate={affiliate}
          totalAmount={totalAmount}
        />
      </ScrollView>

      <View style={styles.footer}>
        <View>
          <Text style={styles.priceText}>₱ {totalAmount}</Text>
          <Text style={styles.totalAmountText}>Total Amount</Text>
        </View>

        <View style={styles.footerButtons}>
          <TouchableOpacity
            style={[
              styles.bookButton,
              updatedAvailability === "Available"
                ? null
                : styles.disabledButton,
            ]}
            onPress={handleBooking}
            disabled={updatedAvailability !== "Available"}
          >
            <Text style={styles.footerButtonText}>Book Now</Text>
          </TouchableOpacity>
        </View>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 15,
    paddingVertical: 13,
    backgroundColor: "white",
    borderBottomColor: "#ddd",
    borderBottomWidth: 1,
  },
  headerTitle: {
    fontSize: 16,
    flex: 1,
    textAlign: "center",
  },
  scrollContainer: {
    flexGrow: 1,
  },
  imageContainer: {
    position: "relative",
  },
  facilityImage: {
    width: Dimensions.get("window").width,
    height: 250,
  },
  imageIndicatorContainer: {
    flexDirection: "row",
    justifyContent: "center",
    position: "absolute",
    bottom: 10,
    width: "100%",
  },
  imageIndicator: {
    width: 17,
    height: 5,
    borderRadius: 5,
    marginHorizontal: 2,
  },
  affiliateFacilityContainer: {
    flexDirection: "column",
    alignItems: "flex-start",
    paddingVertical: 20,
    paddingHorizontal: 20,
    backgroundColor: "white",
    marginBottom: 5,
  },
  affiliateUsername: {
    fontSize: 14,
    color: "#5B5B5B",
  },
  facilityName: {
    fontSize: 30,
    fontWeight: "bold",
  },
  starRatingContainer: {
    flexDirection: "row",
    marginTop: 5,
  },
  starContainer: {
    flexDirection: "row",
    alignItems: "center",
  },
  starIcon: {
    marginRight: 2,
  },
  ratingText: {
    marginLeft: 5,
    fontSize: 12,
    color: "#5B5B5B",
  },
  descriptionContainer: {
    backgroundColor: "white",
    padding: 20,
    marginBottom: 5,
  },
  availabilityText: {
    fontSize: 15,
    color: "#5B5B5B",
    marginTop: 15,
  },
  descriptionTitle: {
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 10,
  },
  facilityDescription: {
    fontSize: 15,
    textAlign: "justify",
    lineHeight: 20,
    color: "#111111",
  },
  reviewsContainer: {
    backgroundColor: "white",
    padding: 20,
    marginBottom: 5,
  },
  reviewsTitle: {
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 10,
  },
  reviewItem: {
    marginBottom: 10,
  },
  iconButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    marginTop: 10,
  },
  iconText: {
    marginRight: 5,
    fontSize: 14,
    fontWeight: "bold",
    color: "#088b9c",
  },
  customerContainer: {
    marginBottom: 5,
  },
  profilePicture: {
    width: 40,
    height: 40,
    borderRadius: 25,
    marginRight: 10,
  },
  customerInfo: {
    flexDirection: "row",
    alignItems: "center",
  },
  customerNameRating: {
    flexDirection: "column",
  },
  customerName: {
    fontSize: 15,
    fontWeight: "bold",
    marginBottom: -5,
  },
  reviewItem: {
    marginBottom: 10,
  },
  reviewSeparator: {
    borderBottomWidth: 1,
    borderBottomColor: "#CCCCCC",
    paddingBottom: 10,
  },
  reviewTextContainer: {
    marginTop: 5,
    marginLeft: 50,
  },
  noReviewsText: {
    fontSize: 15,
    color: "#5B5B5B",
  },
  noRatingMessage: {
    marginTop: 5,
    color: "#5B5B5B",
  },
  amenitiesContainer: {
    backgroundColor: "white",
    padding: 20,
  },
  amenitiesTitle: {
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 10,
  },
  amenitiesList: {
    flexDirection: "row",
    flexWrap: "wrap",
  },
  amenity: {
    backgroundColor: "#088B9C",
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 20,
    margin: 5,
  },
  amenityText: {
    fontSize: 15,
    lineHeight: 20,
    color: "white",
  },
  iconStyle: {
    marginRight: 10,
  },
  pricesContainer: {
    backgroundColor: "white",
    padding: 20,
    marginTop: 5,
  },
  pricesTitle: {
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 10,
  },
  priceItemContainer: {
    backgroundColor: "transparent",
    borderWidth: 1,
    padding: 10,
    borderRadius: 10,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 10,
  },
  priceContainer: {
    flexDirection: "row",
    alignItems: "center",
  },
  priceLabel: {
    fontSize: 16,
  },
  priceValue: {
    fontSize: 16,
    color: "#088B9C",
  },
  startTime: {
    fontSize: 12,
    color: "#777",
  },
  priceDetails: {
    flexDirection: "column",
    alignItems: "flex-end",
  },

  customerDetailsContainer: {
    backgroundColor: "white",
    padding: 20,
    marginTop: 5,
  },
  customerDetailsTitle: {
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 10,
  },
  customerDetails: {
    flexDirection: "column",
  },
  customerDetailLabel: {
    fontSize: 14,
    color: "#8d8d8d",
    marginTop: 10,
  },
  customerDetailText: {
    fontSize: 15,
    color: "black",
  },
  customerInputContainer: {
    marginTop: 10,
  },
  customerInput: {
    height: 40,
    borderColor: "#ccc",
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 10,
    marginBottom: 10,
  },
  placeholder: {
    color: "#aaa",
    marginBottom: 5,
  },

  inputWrapper: {
    backgroundColor: "#f5f5f5",
    borderRadius: 15,
    padding: 10,
    marginTop: 5,
  },
  inputContainer: {
    backgroundColor: "white",
    padding: 20,
    marginTop: 5,
  },
  input: {
    borderWidth: 1,
    borderColor: "#f0f0f0",
    borderRadius: 20,
    paddingHorizontal: 10,
    paddingVertical: 10,
    backgroundColor: "white",
    height: 40,
    marginBottom: 10,
    color: "black",
  },
  inputText: {
    color: "black",
  },
  inputLabel: {
    fontSize: 14,
    marginBottom: 5,
    color: "#8d8d8d",
  },
  guestsContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  guestsLabel: {
    flex: 1,
    marginRight: 10,
    paddingBottom: 10,
  },
  guestsInput: {
    flex: 1,
  },
  paymentDetailsContainer: {
    backgroundColor: "white",
    padding: 20,
    marginTop: 5,
  },
  paymentDetailsTitle: {
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 10,
  },
  paymentDetails: {
    flexDirection: "column",
    borderRadius: 15,
    backgroundColor: "#f0f0f0",
    padding: 10,
  },
  paymentLogoContainer: {
    width: 100,
    height: 30,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 15,
  },
  paymentLogo: {
    width: 100,
    height: 30,
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
  dayTourTime: {
    fontSize: 14,
    color: "#5B5B5B",
  },
  nightTourTime: {
    fontSize: 14,
    color: "#5B5B5B",
  },
  tourTimeContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 10,
  },
  tourTimeButton: {
    flex: 1,
    borderRadius: 20,
    paddingVertical: 5,
    alignItems: "center",
    borderWidth: 1,
    marginHorizontal: 5,
    borderColor: "#f0f0f0",
    backgroundColor: "white",
  },
  selectedTourTime: {
    backgroundColor: "#088B9C",
  },
  selectedTourTimeText: {
    color: "white",
  },
  tourTimeButtonText: {
    color: "black",
    fontSize: 14,
  },
  footer: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 10,
    paddingHorizontal: 20,
    paddingBottom: 20,
    backgroundColor: "white",
    borderTopColor: "#ddd",
    borderTopWidth: 1,
  },
  priceText: {
    fontSize: 20,
    color: "#088B9C",
  },
  totalAmountText: {
    fontSize: 12,
    color: "#5B5B5B",
    textAlign: "center",
  },
  footerButtons: {
    flexDirection: "row",
  },
  bookButton: {
    backgroundColor: "#fea219",
    paddingVertical: 10,
    paddingHorizontal: 50,
    borderRadius: 8,
    marginLeft: 5,
  },
  footerButtonText: {
    color: "white",
    fontSize: 16,
  },
  disabledButton: {
    backgroundColor: "#ccc",
  },
});

export default AmenityBookingScreen;