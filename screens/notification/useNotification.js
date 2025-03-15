// import { useEffect } from "react";
// import { PermissionsAndroid } from "react-native";
// import { messaging, getToken, onMessage } from "../../firebase";

// const requestNotificationPermission = async () => {
//     try {
//         const granted = await PermissionsAndroid.request(
//             PermissionsAndroid.PERMISSIONS.POST_NOTIFICATIONS
//         );
//         if (granted === PermissionsAndroid.RESULTS.GRANTED) {
//             console.log("Notification permission granted");
//         } else {
//             console.log("Notification permission denied");
//         }
//     } catch (err) {
//         console.warn(err);
//     }
// }

// const fetchToken = async () => {
//     try {
//         const token = await getToken(messaging, { vapidKey: 'YOUR_VAPID_KEY' });
//         console.log("FCM Token: ", token);
//     } catch (error) {
//         console.error("FCM Token Error: ", error);
//     }
// }

// export const useNotification = () => {
//     useEffect(() => {
//         requestNotificationPermission();
//         fetchToken();

//         const unsubscribe = onMessage(messaging, (payload) => {
//             console.log('Message received. ', payload);
//         });

//         return () => unsubscribe();
//     }, []);
// }