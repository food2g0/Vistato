import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Image,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import HomeScreen from "./HomeScreen";
import BookingScreen from "./BookingScreen";
import FavoritesScreen from "./FavoritesScreen";
import ProfileScreen from "./ProfileScreen";
import firebase from "../../firebase";

const Tab = createBottomTabNavigator();

const CustomTabBarIcon = ({ route, color, size }) => {
  let iconName;

  if (route.name === "Home") {
    iconName = require("../../assets/icons/home-icon.png");
  } else if (route.name === "Bookings") {
    iconName = require("../../assets/icons/bookings-icon.png");
  } else if (route.name === "Favorites") {
    iconName = require("../../assets/icons/favourite.png");
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

const CustomerHome = () => {
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  useEffect(() => {
    const unsubscribe = firebase.auth().onAuthStateChanged((user) => {
      setIsLoggedIn(!!user);
    });

    return unsubscribe;
  }, []);

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === "ios" ? "padding" : null}
    >
      <View style={styles.container}>
        {isLoggedIn ? (
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
              name="Favorites"
              component={FavoritesScreen}
              options={{ headerShown: false }}
            />
            <Tab.Screen
              name="Profile"
              component={ProfileScreen}
              options={{ headerShown: false }}
            />
          </Tab.Navigator>
        ) : (
          <HomeScreen />
        )}
      </View>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fefae0",
  },
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
});

export default CustomerHome;