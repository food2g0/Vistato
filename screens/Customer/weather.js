import React, { useState, useEffect } from "react";
import { View, Text, Image, ActivityIndicator, StyleSheet, Modal, TouchableOpacity } from "react-native";
import axios from "axios";
import { getDatabase, ref as dbRef, get } from "firebase/database";

const WeatherModal = ({ affiliateId }) => {
  const [weather, setWeather] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [modalVisible, setModalVisible] = useState(false);
  const [latitude, setLatitude] = useState(null);
  const [longitude, setLongitude] = useState(null);

  const API_KEY = "c2bf65bde1944a54977140057252202"; 
  const BASE_URL = "http://api.weatherapi.com/v1/current.json";

  useEffect(() => {
    if (!affiliateId) {
      setError("No affiliate ID provided");
      setLoading(false);
      return;
    }

    const fetchLocation = async () => {
      try {
        const database = getDatabase();
        const affiliateRef = dbRef(database, `affiliates/${affiliateId}`);

        const snapshot = await get(affiliateRef);
        if (snapshot.exists()) {
          const data = snapshot.val();
          if (data.latitude && data.longitude) {
            setLatitude(data.latitude);
            setLongitude(data.longitude);
            fetchWeather(data.latitude, data.longitude);
          } else {
            setError("Latitude or longitude is missing");
          }
        } else {
          setError("Affiliate not found");
        }
      } catch (err) {
        setError("Failed to fetch location");
        console.error("Error fetching location:", err);
      } finally {
        setLoading(false);
      }
    };

    const fetchWeather = async (lat, lon) => {
      try {
        const response = await axios.get(`${BASE_URL}?key=${API_KEY}&q=${lat},${lon}`);
        setWeather(response.data);
      } catch (err) {
        setError("Could not fetch weather");
        console.error("Weather API error:", err);
      }
    };

    fetchLocation();
  }, [affiliateId]);

  return (
    <View style={styles.container}>
      <TouchableOpacity style={styles.weatherButton} onPress={() => setModalVisible(true)}>
        <Text style={styles.weatherButtonText}>Weather</Text>
      </TouchableOpacity>

      <Modal transparent={true} visible={modalVisible} animationType="slide">
        <View style={styles.modalBackground}>
          <View style={styles.modalContainer}>
            {loading ? (
              <ActivityIndicator size="large" color="gray" />
            ) : error ? (
              <>
                <Text style={styles.error}>{error}</Text>
                <TouchableOpacity style={styles.closeButton} onPress={() => setModalVisible(false)}>
                  <Text style={styles.closeButtonText}>Close</Text>
                </TouchableOpacity>
              </>
            ) : (
              <>
                <Text style={styles.city}>{weather?.location?.name}, {weather?.location?.country}</Text>
                <Image source={{ uri: `https:${weather?.current?.condition?.icon}` }} style={styles.icon} />
                <Text style={styles.temp}>{weather?.current?.temp_c}°C</Text>
                <Text style={styles.desc}>{weather?.current?.condition?.text}</Text>
                <Text style={styles.extra}>Humidity: {weather?.current?.humidity}%</Text>
                <Text style={styles.extra}>Wind: {weather?.current?.wind_kph} kph</Text>

                <TouchableOpacity style={styles.closeButton} onPress={() => setModalVisible(false)}>
                  <Text style={styles.closeButtonText}>Close</Text>
                </TouchableOpacity>
              </>
            )}
          </View>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { alignItems: "center",  },
  weatherButton: { backgroundColor: "#007AFF", padding: 8, borderRadius: 6, alignItems: "center", justifyContent: "center", width: 90 },
  weatherButtonText: { color: "white", fontSize: 12, fontWeight: "bold" },
  modalBackground: { flex: 1, backgroundColor: "rgba(0,0,0,0.5)", justifyContent: "center", alignItems: "center" },
  modalContainer: { backgroundColor: "white", padding: 25, borderRadius: 12, alignItems: "center", width: 300, shadowColor: "#000", shadowOpacity: 0.2, shadowOffset: { width: 0, height: 3 } },
  city: { fontSize: 20, fontWeight: "bold", marginBottom: 10 },
  temp: { fontSize: 40, fontWeight: "bold", marginVertical: 10 },
  desc: { fontSize: 18, textTransform: "capitalize", marginBottom: 10 },
  extra: { fontSize: 16, color: "gray", marginBottom: 5 },
  icon: { width: 64, height: 64, marginBottom: 10 },
  closeButton: { backgroundColor: "#ff3b30", paddingVertical: 10, paddingHorizontal: 20, borderRadius: 8, marginTop: 15 },
  closeButtonText: { color: "#fff", fontSize: 16, fontWeight: "bold" },
  error: { color: "red", fontSize: 14, marginBottom: 10, textAlign: "center" },
});

export default WeatherModal;
