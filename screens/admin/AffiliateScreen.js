import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  TouchableOpacity, 
  StyleSheet, 
  SafeAreaView, 
  StatusBar, 
  FlatList, 
  Alert, 
  ActivityIndicator, 
  Image, 
  TextInput 
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import firebase from '../../firebase';
import SubscriptionModal from './SubscriptionModal';

const CustomHeader = ({ title }) => (
  <SafeAreaView style={styles.safeArea}>
    <StatusBar barStyle="dark-content" backgroundColor={'white'} />
    <View style={styles.header}>
      <Text style={styles.title}>{title}</Text>
    </View>
  </SafeAreaView>
);

const AffiliateScreen = () => {
  const navigation = useNavigation();
  const [affiliates, setAffiliates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedSubscription, setSelectedSubscription] = useState(null);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [filter, setFilter] = useState('Resort');
  const [view360Links, setView360Links] = useState({});

  useEffect(() => {
    const fetchAffiliates = async () => {
      try {
        const affiliatesRef = firebase.database().ref('affiliates');
        affiliatesRef.on('value', (snapshot) => {
          const data = snapshot.val();
          if (data) {
            const affiliatesList = Object.entries(data).map(([affiliateId, affiliateData]) => ({
              affiliateId,
              ...affiliateData,
            }));
            setAffiliates(affiliatesList);
            setLoading(false);
          }
        });
      } catch (error) {
        console.error('Error fetching affiliates:', error);
        setLoading(false);
      }
    };

    fetchAffiliates();

    return () => {
      firebase.database().ref('affiliates').off('value');
    };
  }, []);

  useEffect(() => {
    const fetchSubscriptions = async () => {
      try {
        const subscriptionsRef = firebase.database().ref('subscription');
        subscriptionsRef.on('value', (snapshot) => {
          const data = snapshot.val();
          if (data) {
            const pendingSubscriptions = Object.entries(data)
              .filter(([subscriptionId, subscriptionData]) => subscriptionData.status === 'pending')
              .map(([subscriptionId, subscriptionData]) => ({
                id: subscriptionId,
                ...subscriptionData,
              }));
  
            const affiliateSubscriptionsMap = {};
            pendingSubscriptions.forEach((subscription) => {
              if (!affiliateSubscriptionsMap[subscription.affiliateId]) {
                affiliateSubscriptionsMap[subscription.affiliateId] = [subscription];
              } else {
                affiliateSubscriptionsMap[subscription.affiliateId].push(subscription);
              }
            });
  
            setAffiliates((prevAffiliates) => {
              return prevAffiliates.map((affiliate) => ({
                ...affiliate,
                subscriptions: affiliateSubscriptionsMap[affiliate.affiliateId] || [],
              }));
            });
          }
        });
      } catch (error) {
        console.error('Error fetching subscriptions:', error);
      }
    };
  
    fetchSubscriptions();
  
    return () => {
      firebase.database().ref('subscription').off('value');
    };
  }, []);  

  const handleSendBillReminder = (affiliateId, affiliateData) => {
    console.log('Sending bill reminder to affiliate with ID:', affiliateId);
    Alert.alert(
      'Send Bill Reminder',
      `Send a bill reminder to ${affiliateData.username}?`,
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Send',
          onPress: () => sendBillReminder(affiliateId),
        },
      ],
      { cancelable: false }
    );
  };
  const handleDisableAffiliate = async (affiliateId) => {
    try {
      await firebase.database().ref(`nosubscription/${affiliateId}`).set({
        disabledAt: firebase.database.ServerValue.TIMESTAMP
      });
  
      Alert.alert('Success', 'Affiliate disabled successfully!');
    } catch (error) {
      console.error('Error disabling affiliate:', error);
      Alert.alert('Error', 'Failed to disable affiliate. Please try again later.');
    }
  };

const sendBillReminder = async (affiliateId) => {
  console.log('Sending bill reminder to affiliate with ID:', affiliateId);
  try {
    await firebase.database().ref(`billReminders/${affiliateId}`).push({
      reminderMessage: 'Please remember to pay your monthly subscription fee of ₱ 1000.',
      sentAt: firebase.database.ServerValue.TIMESTAMP
    });

    const user = firebase.auth().currentUser;
    if (user) {
      const adminSnapshot = await firebase.database().ref(`admins/${user.uid}`).once('value');
      const adminData = adminSnapshot.val();
      const adminUsername = adminData ? adminData.username : user.email;

      const logMessage = `${adminUsername} sent a bill reminder to affiliate with ID: ${affiliateId}`;

      await firebase.database().ref(`logs/${user.uid}`).push({
        userId: user.uid,
        message: logMessage,
        timestamp: firebase.database.ServerValue.TIMESTAMP
      });
    }

    Alert.alert('Success', `Bill reminder sent to affiliate successfully!`);
  } catch (error) {
    console.error('Error sending bill reminder:', error);
    Alert.alert('Error', 'Failed to send bill reminder. Please try again later.');
  }
};

const handleUpload360View = async (affiliateId) => {
  const link = view360Links[affiliateId];
  if (!link) {
    Alert.alert('Error', 'Please enter a valid 360 view link.');
    return;
  }

  try {
    await firebase.database().ref(`affiliates/${affiliateId}/360view`).set({
      link,
    });

    Alert.alert('Success', '360 view link uploaded successfully!');
    setView360Links((prevLinks) => ({ ...prevLinks, [affiliateId]: '' }));
  } catch (error) {
    console.error('Error uploading 360 view link:', error);
    Alert.alert('Error', 'Failed to upload 360 view link. Please try again later.');
  }
};

  const filteredAffiliates = affiliates.filter(affiliate =>
    affiliate.username.toLowerCase().includes(searchQuery.toLowerCase()) &&
    (!filter || affiliate.affiliateType === filter)
  );

  const handleFilterChange = (newFilter) => {
    setFilter(newFilter);
  };

  return (
    <View style={styles.container}>
      <CustomHeader title="Affiliates" />

      <View style={styles.searchContainer}>
        <View style={styles.searchBar}>
          <Ionicons name="search" size={20} color="gray" style={styles.searchIcon} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search..."
            onChangeText={setSearchQuery}
            value={searchQuery}
          />
        </View>
      </View>

      <View style={styles.filterContainer}>
        <TouchableOpacity
            style={[
              styles.filterButton,
              filter === 'Resort' ? styles.activeFilterButton : styles.inactiveFilterButton,
            ]}
            onPress={() => handleFilterChange('Resort')}
          >
            <Text style={filter === 'Resort' ? styles.activeFilterButtonText : styles.inactiveFilterButtonText}>
              Resorts
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[
              styles.filterButton,
              filter === 'Hotel' ? styles.activeFilterButton : styles.inactiveFilterButton,
            ]}
            onPress={() => handleFilterChange('Hotel')}
          >
            <Text style={filter === 'Hotel' ? styles.activeFilterButtonText : styles.inactiveFilterButtonText}>
              Hotels
            </Text>
          </TouchableOpacity>
      </View>
      
      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#088B9C" />
        </View>
      ) : (
        <FlatList
  style={styles.affiliateContainer}
  contentContainerStyle={{ paddingBottom: 10 }}
  data={filteredAffiliates}
  renderItem={({ item }) => {
    return (
      <View style={styles.affiliateItem}>
        <TouchableOpacity
          style={styles.affiliateDetailsContainer}
          onPress={() => {
            if (item.subscriptions && item.subscriptions.length > 0) {
              setSelectedSubscription(item.subscriptions[0]);
              setIsModalVisible(true);
            } else {
              Alert.alert('No Subscriptions', 'This affiliate has no subscriptions.');
            }
          }}
        >
          {item.profilePicture ? (
            <Image source={{ uri: item.profilePicture }} style={styles.profilePicture} />
          ) : (
            <Ionicons name="person-circle-outline" size={50} color="#ccc" />
          )}
          <View style={styles.affiliateDetails}>
            <View style={styles.usernameContainer}>
              <Text style={styles.affiliateName}>{item.username}</Text>
              {item.subscriptions && item.subscriptions.length > 0 && (
                <View style={styles.notificationCircle} />
              )}
            </View>
            <Text style={styles.affiliateContact}>{item.contactNo}</Text>
            <Text style={styles.affiliateEmail}>{item.email}</Text>
          </View>
        </TouchableOpacity>
        <View style={styles.actionsContainer}>
          {!item.affiliate360view ? (
            <>
              <TextInput
                style={styles.linkInput}
                placeholder="Enter 360 view link"
                value={view360Links[item.affiliateId] || ''}
                onChangeText={(text) => setView360Links((prevLinks) => ({ ...prevLinks, [item.affiliateId]: text }))}
              />
              <TouchableOpacity style={styles.uploadButton} onPress={() => handleUpload360View(item.affiliateId)}>
                <Ionicons name="cloud-upload-outline" size={24} color="#088B9C" />
              </TouchableOpacity>
            </>
          ) : (
            <Text>360 view link uploaded</Text>
          )}
          <TouchableOpacity style={styles.billButton} onPress={() => handleSendBillReminder(item.affiliateId, item)}>
            <Ionicons name="receipt" size={24} color="#088B9C" />
          </TouchableOpacity>
          <TouchableOpacity style={styles.disableButton} onPress={() => handleDisableAffiliate(item.affiliateId)}>
            <Ionicons name="close-circle-outline" size={24} color="red" />
          </TouchableOpacity>
        </View>
      </View>
    );
  }}
  keyExtractor={(item) => item.username}
/>
      )}
      <SubscriptionModal
        visible={isModalVisible}
        onClose={() => setIsModalVisible(false)}
        subscription={selectedSubscription}
        subscriptionId={selectedSubscription ? selectedSubscription.id : null}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  safeArea: {
    backgroundColor: 'white',
  },
  disableButton: {
    padding: 10,
    borderRadius: 50,
    backgroundColor: '#f0f0f0',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 15,
    backgroundColor: 'white',
  },
  title: {
    color: 'black',
    fontSize: 30,
    fontWeight: 'bold',
  },
  addButton: {
    padding: 10,
    borderRadius: 50,
    backgroundColor: '#f0f0f0',
  },
  affiliateContainer: {
    padding: 10,
  },
  affiliateItem: {
    marginBottom: 10,
    backgroundColor: 'white',
    padding: 15,
    borderRadius: 10,
  },
  affiliateDetailsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  profilePicture: {
    width: 50,
    height: 50,
    borderRadius: 25,
  },
  usernameContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  notificationCircle: {
    width: 7,
    height: 7,
    borderRadius: 5,
    backgroundColor: 'orange',
    marginLeft: 10,
    marginBottom: 5,
  },
  affiliateName: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 5,
  },
  affiliateDetails: {
    flex: 1,
    marginLeft: 10,
  },
  affiliateContact: {
    fontSize: 12,
    color: '#888',
  },
  affiliateEmail: {
    fontSize: 12,
    color: '#888',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  searchContainer: {
    backgroundColor: 'white',
    paddingHorizontal: 10,
    paddingBottom: 10,
    flexDirection: 'row',
    alignItems: 'center',
  },
  searchBar: {
    flex: 1,
    paddingHorizontal: 15,
    paddingVertical: 8,
    borderRadius: 25,
    backgroundColor: '#f0f0f0',
    flexDirection: 'row',
    alignItems: 'center',
  },
  searchInput: {
    flex: 1,
  },
  searchIcon: {
    marginRight: 10,
  },
  filterContainer: {
    flexDirection: 'row',
    backgroundColor: 'white',
    paddingHorizontal: 10,
    paddingBottom: 10,
  },
  filterButton: {
    paddingVertical: 8,
    paddingHorizontal: 15,
    borderRadius: 20,
    alignItems: 'center',
  },
  activeFilterButton: {
    backgroundColor: '#E8FCFF',
  },
  activeFilterButtonText: {
    color: '#088B9C',
  },
  filterButtonText: {
    color: 'white',
  },
  inactiveFilterButton: {
    backgroundColor: 'white',
  },
  inactiveFilterButtonText: {
    color: 'black',
  },
  actionsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 10,
  },
  linkInput: {
    flex: 1,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 5,
    backgroundColor: '#f0f0f0',
    marginRight: 10,
  },
  billButton: {
    padding: 10,
    borderRadius: 50,
    backgroundColor: '#f0f0f0',
    marginRight: 10,
  },
  uploadButton: {
    padding: 10,
    borderRadius: 50,
    backgroundColor: '#f0f0f0',
  },
});

export default AffiliateScreen;