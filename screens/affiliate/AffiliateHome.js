import React, { useState, useEffect, useCallback } from "react";
import { View, Text, TouchableOpacity, StyleSheet, Image, Modal, Alert } from "react-native";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import firebase from "../../firebase";
import HomeScreen from "./HomeScreen";
import BookingScreen from "./BookingScreen";
import FacilityScreen from "./FacilityScreen";
import ProfileScreen from "./ProfileScreen";
import { useNavigation, useFocusEffect } from "@react-navigation/native";

const Tab = createBottomTabNavigator();

const CustomTabBarIcon = ({ route, color, size }) => {
  let iconName;

  if (route.name === "Home") {
    iconName = require("../../assets/icons/home-icon.png");
  } else if (route.name === "Bookings") {
    iconName = require("../../assets/icons/bookings-icon.png");
  } else if (route.name === "Facilities") {
    iconName = require("../../assets/icons/facilities-icon.png");
  } else if (route.name === "Profile") {
    iconName = require("../../assets/icons/profile-icon.png");
  }

  return (
    <View style={styles.tabBarIconContainer}>
      <View style={styles.iconContainer}>
        <Image
          source={iconName}
          style={{ tintColor: color, width: size, height: size }}
        />
      </View>
      <Text style={{ color, fontSize: 10, textAlign: "center" }}>
        {route.name}
      </Text>
    </View>
  );
};

const CustomTabBar = ({ state, descriptors, navigation }) => {
  return (
    <View style={styles.tabBarContainer}>
      {state.routes.map((route, index) => {
        const { options } = descriptors[route.key];
        const label =
          options.tabBarLabel !== undefined
            ? options.tabBarLabel
            : options.title !== undefined
              ? options.title
              : route.name;

        const isFocused = state.index === index;

        const onPress = () => {
          const event = navigation.emit({
            type: "tabPress",
            target: route.key,
            canPreventDefault: true,
          });

          if (!isFocused && !event.defaultPrevented) {
            navigation.navigate(route.name);
          }
        };

        const onLongPress = () => {
          navigation.emit({
            type: "tabLongPress",
            target: route.key,
          });
        };

        return (
          <TouchableOpacity
            key={index}
            accessibilityRole="button"
            accessibilityStates={isFocused ? ["selected"] : []}
            accessibilityLabel={options.tabBarAccessibilityLabel}
            testID={options.tabBarTestID}
            onPress={onPress}
            onLongPress={onLongPress}
            style={styles.tabBarItem}
          >
            <CustomTabBarIcon
              route={route}
              color={isFocused ? "#283618" : "#606c38"}
              size={24}
            />
          </TouchableOpacity>
        );
      })}
    </View>
  );
};

const AffiliateHome = () => {
  const [isModalVisible, setIsModalVisible] = useState(false);
  const navigation = useNavigation();

  const checkSubscriptionStatus = useCallback(() => {
    const user = firebase.auth().currentUser;
    if (user) {
      const nosubscriptionRef = firebase.database().ref(`nosubscription/${user.uid}`);
      const subscriptionListener = nosubscriptionRef.on('value', (snapshot) => {
        if (snapshot.exists()) {
          setIsModalVisible(true);
        } else {
          setIsModalVisible(false);
        }
      });

      return () => {
        nosubscriptionRef.off('value', subscriptionListener);
      };
    }
  }, []);

  useEffect(() => {
    checkSubscriptionStatus();
  }, [checkSubscriptionStatus]);

  useFocusEffect(
    useCallback(() => {
      checkSubscriptionStatus();
    }, [checkSubscriptionStatus])
  );

  return (
    <View style={{ flex: 1 }}>
      <Tab.Navigator
        tabBar={(props) => <CustomTabBar {...props} />}
        initialRouteName="Home"
      >
        <Tab.Screen
          name="Home"
          component={HomeScreen}
          options={{ headerShown: false }}
        />
        <Tab.Screen
          name="Bookings"
          component={BookingScreen}
          options={{ headerShown: false }}
        />
        <Tab.Screen
          name="Facilities"
          component={FacilityScreen}
          options={{ headerShown: false }}
        />
        <Tab.Screen
          name="Profile"
          component={ProfileScreen}
          options={{ headerShown: false }}
        />
      </Tab.Navigator>

      <Modal
        visible={isModalVisible}
        transparent={true}
        animationType="slide"
        onRequestClose={() => {
          Alert.alert("Subscription Required", "You need to subscribe first.");
        }}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Subscription Required</Text>
            <Text style={styles.modalMessage}>You need to subscribe first to access this content.</Text>
            <TouchableOpacity
              style={styles.modalButton}
              onPress={() => {
                setIsModalVisible(false);
                navigation.navigate("AffiliateSubscription");
              }}
            >
              <Text style={styles.modalButtonText}>Subscribe Now</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  tabBarIconContainer: {
    alignItems: "center",
  },
  iconContainer: {
    marginBottom: 4,
  },
  tabBarContainer: {
    flexDirection: "row",
    backgroundColor: "#fefae0",
    paddingTop: 10,
    paddingBottom: 20,
    justifyContent: "space-around",
    borderTopColor: "#dda15e",
    borderTopWidth: 1,
  },
  tabBarItem: {
    flex: 1,
    alignItems: "center",
  },
  modalContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(0, 0, 0, 0.5)",
  },
  modalContent: {
    width: 300,
    padding: 20,
    backgroundColor: "#fefae0",
    borderRadius: 10,
    alignItems: "center",
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 10,
    color: "#606c38",
  },
  modalMessage: {
    fontSize: 14,
    textAlign: "center",
    marginBottom: 20,
    color: "#606c38",
  },
  modalButton: {
    backgroundColor: "#dda15e",
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 5,
  },
  modalButtonText: {
    color: "#fefae0",
    fontSize: 16,
  },
});

export default AffiliateHome;