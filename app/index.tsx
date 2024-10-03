import WebView from "react-native-webview";
import Constants from 'expo-constants';
import {Platform, StyleSheet} from 'react-native';

import * as Device from 'expo-device';
import * as Notifications from 'expo-notifications';
import {useEffect, useRef, useState} from "react";


Notifications.setNotificationHandler({
    handleNotification: async () => ({
        shouldShowAlert: true,
        shouldPlaySound: false,
        shouldSetBadge: false,
    }),
});

function handleRegistrationError(errorMessage: string) {
    alert(errorMessage);
    throw new Error(errorMessage);
}

async function registerForPushNotificationsAsync() {
    if (Platform.OS === 'android') {
        void Notifications.setNotificationChannelAsync('default', {
            name: 'default',
            importance: Notifications.AndroidImportance.MAX,
            vibrationPattern: [0, 250, 250, 250],
            lightColor: '#FF231F7C',
        });
    }

    if (Device.isDevice) {
        const { status: existingStatus } = await Notifications.getPermissionsAsync();
        let finalStatus = existingStatus;
        if (existingStatus !== 'granted') {
            const { status } = await Notifications.requestPermissionsAsync();
            finalStatus = status;
        }
        if (finalStatus !== 'granted') {
            handleRegistrationError('Permission not granted to get push token for push notification!');
            return;
        }
        const projectId =
            Constants?.expoConfig?.extra?.eas?.projectId ?? Constants?.easConfig?.projectId;
        if (!projectId) {
            handleRegistrationError('Project ID not found');
        }
        try {
            const pushTokenString = (
                await Notifications.getExpoPushTokenAsync({
                    projectId,
                })
            ).data;
            console.log(pushTokenString);
            return pushTokenString;
        } catch (e: unknown) {
            handleRegistrationError(`${e}`);
        }
    } else {
        handleRegistrationError('Must use physical device for push notifications');
    }
}

async function sendTokenToServer(token: string, header: string) {
  return fetch('https://stophwan.com/api/v1', {
      method: "POST",
      headers: {
          "Authorization": `Bearer ${header}`,
      },
      body: JSON.stringify({
          deviceToken: token,
      })
  })
}

const Home = () => {
    const [notification, setNotification] = useState<Notifications.Notification | undefined>(
        undefined
    );

    const notificationListener = useRef<Notifications.Subscription>();
    const responseListener = useRef<Notifications.Subscription>();

    useEffect(() => {

        notificationListener.current = Notifications.addNotificationReceivedListener(notification => {
            setNotification(notification);
        });

        responseListener.current = Notifications.addNotificationResponseReceivedListener(response => {
            void Notifications.scheduleNotificationAsync({
                content: {
                    title: response.notification.request.content.title ?? "",
                    body: response.notification.request.content.body ?? "",
                },
                trigger: {
                    seconds: 0,
                }
            })
        });

        return () => {
            notificationListener.current &&
            Notifications.removeNotificationSubscription(notificationListener.current);
            responseListener.current &&
            Notifications.removeNotificationSubscription(responseListener.current);
        };
    }, []);



    return <WebView
        style={styles.container}
        originWhitelist={['*']}
        source={{ uri: 'https://dnd-11th-8-frontend.vercel.app/' }}
        javaScriptEnabled={true}
        sharedCookiesEnabled
        domStorageEnabled
        allowFileAccess
        allowFileAccessFromFileURLs
        allowUniversalAccessFromFileURLs
        webviewDebuggingEnabled
        onMessage={async (event) => {
            const header = event.nativeEvent.data;
            const token = await registerForPushNotificationsAsync()
            if (token) {
                await sendTokenToServer(token, header);
            }
        }}
    />
}

export default Home;

const styles = StyleSheet.create({
    container: {
        flex: 1,
        marginTop: Constants.statusBarHeight,
    },
});