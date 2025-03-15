import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';

//puro import to na under sa screens folder
import AdminRegistration from './screens/AdminRegistration';
import AffiliateDetailsScreen from './screens/AffiliateDetailsScreen';
import AffiliateRegistration from './screens/AffiliateRegistration';
import AmenityBookingScreen from './screens/AmenityBookingScreen';
import CustomerRegistration from './screens/CustomerRegistration';
import LoginScreen from './screens/LoginScreen';
import PasswordRecovery from './screens/PasswordRecovery';
import WelcomeScreen from './screens/WelcomeScreen';

//admin folder
import AdminHome from './screens/admin/AdminHome';
import AdminLogsScreen from './screens/admin/AdminLogsScreen';
import AdminPaymentDetailsScreen from './screens/admin/AdminPaymentDetailsScreen';
import EditAdminProfile from './screens/admin/EditAdminProfile';
import SubscriptionScreen from './screens/admin/SubscriptionScreen';

//sa customer folder to goiz
import BookingHistoryScreen from './screens/Customer/BookingHistoryScreen';
import CustomerHome from './screens/Customer/CustomerHome';
import EditCustomerProfile from './screens/Customer/EditCustomerProfile';

// affilliate folder to
import AffiliateHome from './screens/affiliate/AffiliateHome';
import AddFacilityScreen from './screens/affiliate/AddFacilityScreen';
import EditFacilityScreen from './screens/affiliate/EditFacilityScreen';
import FacilityDetailsScreen from './screens/affiliate/FacilityDetailsScreen';
import PaymentDetailsScreen from './screens/affiliate/PaymentDetailsScreen';
import AffiliateSubscriptionScreen from './screens/affiliate/AffiliateSubscriptionScreen';
import SalesReportScreen from './screens/affiliate/SalesReportScreen';
import LogsScreen from './screens/affiliate/AffiliateLogsScreen';
import FacilityReviewsScreen from './screens/affiliate/FacilityReviewsScreen';
import EditProfileScreen from './screens/affiliate/EditProfileScreen';
import FacilityBookingScreen from './screens/Customer/FacilityBookingScreen';
import PanoramaViewer from "./screens/PanoramaViewer";
import ChatScreen from "./screens/ChatScreen"
import ChatListScreen  from "./screens/ChatListScreen"
import AffiliateChatScreen  from "./screens/affiliateChatScreen"
// guest folder to
import GuestHome from './screens/guest/GuestHome'; 

const Stack = createStackNavigator();

const App = () => {


  return (
    <NavigationContainer>

{/* files na under sa screen folder  */}    
      <Stack.Navigator initialRouteName="welcomeScreen">                    
        <Stack.Screen
          name="Welcome"
          component={WelcomeScreen}
          options={{ 
            headerShown: false }}
        />

       
        <Stack.Screen
          name="Login"
          component={LoginScreen}
          options={{ 
            headerShown: false }}
        />

    
        <Stack.Screen
          name="CustomerRegistration"
          component={CustomerRegistration}
          options={{
            headerShown: false,
          }}
        />

      
        <Stack.Screen
          name="PasswordRecovery"
          component={PasswordRecovery}
          options={{
            headerShown: false,
          }}
        />

        
        <Stack.Screen
          name="AmenityBookingScreen"
          component={AmenityBookingScreen}
          options={{
            headerShown: false, // Show header for navigation
          }}
          />

       
        <Stack.Screen
          name="AffiliateRegistration"
          component={AffiliateRegistration}
          options={{
            headerShown: false,
          }}
        />

        <Stack.Screen
          name="AdminRegistration"
          component={AdminRegistration}
          options={{ headerShown: false }}
        />

        <Stack.Screen
          name="AffiliateDetails"
          component={AffiliateDetailsScreen}
          options={{ headerShown: false }}
        />
               <Stack.Screen name="PanoramaViewer" component={PanoramaViewer}      options={{ headerShown: false }}/>

{/* UNDER CUSTOMEEEEEEEERRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRR FOLDER NA ITO GUYS*/}


        <Stack.Screen
          name="CustomerHome"
          component={CustomerHome}
          options={{ headerShown: false }}
        />

         
        <Stack.Screen
          name="BookingHistory"
          component={BookingHistoryScreen}
          options={{ headerShown: false }}
        />

        <Stack.Screen
          name="EditCustomerProfile"
          component={EditCustomerProfile}
          options={{ headerShown: false }}
        />

{/* UNDER GUESTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTT FOLDER NA ITO GUYS*/}

        <Stack.Screen
          name="GuestHome"
          component={GuestHome}
          options={{ headerShown: false }}
        />

{/* UNDER AFFILIATEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEE FOLDER NA ITO GUYS*/}

<Stack.Screen                        //puro affilliate to 
          name="AffiliateHome"
          component={AffiliateHome}
          options={{ headerShown: false }}
        />
 
        <Stack.Screen
          name="AddFacility"
          component={AddFacilityScreen}
          options={{ headerShown: false }}
        />

       <Stack.Screen
          name="EditProfile"
          component={EditProfileScreen}
          options={{ headerShown: false }}
        />

<Stack.Screen
          name="EditFacility"
          component={EditFacilityScreen}
          options={{ headerShown: false }}
        />

        <Stack.Screen
          name="SalesReport"
          component={SalesReportScreen}
          options={{ headerShown: false }}
        />

        <Stack.Screen
          name="AffiliateSubscription"
          component={AffiliateSubscriptionScreen}
          options={{ headerShown: false }}
        />

        <Stack.Screen
          name="AffiliateLogs"
          component={LogsScreen}
          options={{ headerShown: false }}
        />

        <Stack.Screen
          name="FacilityDetails"
          component={FacilityDetailsScreen}
          options={{ headerShown: false }}
        />
        
        <Stack.Screen
          name="FacilityReviews"
          component={FacilityReviewsScreen}
          options={{ headerShown: false }}
        />

        <Stack.Screen
          name="PaymentDetails"
          component={PaymentDetailsScreen}
          options={{ headerShown: false }}
        />
            <Stack.Screen
          name="ChatScreen"
          component={ChatScreen}
          options={{ headerShown: false }}
        />
            <Stack.Screen
          name="ChatListScreen"
          component={ChatListScreen }
          options={{ headerShown: false }}
        />
           <Stack.Screen
          name="AffiliateChatScreen"
          component={AffiliateChatScreen }
          options={{ headerShown: false }}
        />
        
{/* UNDER ADMINNNNNNNNNNNNNNNNNNNNNNNN FOLDER NA ITO GUYS*/}
<Stack.Screen
          name="AdminHome"
          component={AdminHome}
          options={{ headerShown: false }}
        />

<Stack.Screen
          name="AdminLogs"
          component={AdminLogsScreen}
          options={{ headerShown: false }}
        />

<Stack.Screen
          name="AdminPaymentDetails"
          component={AdminPaymentDetailsScreen}
          options={{ headerShown: false }}
        />

<Stack.Screen
          name="EditAdminProfile"
          component={EditAdminProfile}
          options={{ headerShown: false }}
        />
                <Stack.Screen
          name="FacilityBooking"
          component={FacilityBookingScreen}
          options={{ headerShown: false }}
        />


<Stack.Screen
          name="Subscription"
          component={SubscriptionScreen}
          options={{ headerShown: false }}
        />
      </Stack.Navigator>
    </NavigationContainer>
  );
};

export default App;
