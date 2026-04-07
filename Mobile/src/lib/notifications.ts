import { Platform } from 'react-native';
import * as Device from 'expo-device';
import * as Notifications from 'expo-notifications';
import Constants from 'expo-constants';

// Handle incoming notifications while app is in foreground
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

/**
 * Solicita los permisos nativos del OS y recupera un token push nativo de Expo.
 */
export async function setupPushNotifications(): Promise<string | null> {
  let token = null;
  // Push Notifications only work on physical devices or Android emulators.
  if (Device.isDevice || Platform.OS === 'android') {
    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;

    if (existingStatus !== 'granted') {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }

    if (finalStatus !== 'granted') {
      console.log('Failed to get push token for push notification (permissions not granted)');
      return null;
    }

    try {
      const projectId = Constants?.expoConfig?.extra?.eas?.projectId ?? Constants?.easConfig?.projectId;
      
      if (!projectId) {
        // Fallback or use standard local project configuration
        token = (await Notifications.getExpoPushTokenAsync()).data;
      } else {
        token = (await Notifications.getExpoPushTokenAsync({ projectId })).data;
      }
      
      console.log('Obtained Expo Push Token:', token);
    } catch (e) {
      console.log('Failed to generate push token:', e);
    }
  } else {
    console.log('Must use physical device for Push Notifications on iOS (Apple restriction)');
  }

  // Necessary for Android 8+
  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync('default', {
      name: 'Default',
      importance: Notifications.AndroidImportance.MAX,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: '#D35400',
    });
  }

  return token;
}
