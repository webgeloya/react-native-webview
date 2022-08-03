import React, { useState, useEffect, useRef } from 'react';
import { StatusBar } from 'expo-status-bar';
import { StyleSheet, BackHandler, Alert } from 'react-native';
// import { Linking, StyleSheet } from 'react-native';
import WebView from 'react-native-webview';
import * as Device from 'expo-device';
// import * as Linking from 'expo-linking';
import * as Notifications from 'expo-notifications';

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: false,
    shouldSetBadge: false,
  }),
});

export default function App() {
  const [startURL, setstartURL] = useState('http://fotolenta.online/');
  const [expoPushToken, setExpoPushToken] = useState('');
  const [notification, setNotification] = useState(false);
  const webViewRef = useRef(null);
  const notificationListener = useRef();
  const responseListener = useRef();

  useEffect(() => {
    registerForPushNotificationsAsync().then((token) => {
      setExpoPushToken(token);
    });

    const backAction = () => {
      // webViewRef.current.goBack();
      // console.log(webViewRef.current.goBack());
      // webViewRef.current.postMessage('go back');
      Alert.alert('Выход', 'Уверены, что хотите закрыть приложение?', [
        {
          text: 'Отмена',
          onPress: () => null,
          style: 'cancel',
        },
        { text: 'Да', onPress: () => BackHandler.exitApp() },
      ]);
      return true;
    };

    // This listener is fired whenever a notification is received while the app is foregrounded
    notificationListener.current = Notifications.addNotificationReceivedListener((notification) => {
      setNotification(notification);
    });

    // This listener is fired whenever a user taps on or interacts with a notification (works when app is foregrounded, backgrounded, or killed)
    responseListener.current = Notifications.addNotificationResponseReceivedListener((response) => {
      // console.log(response);
      setstartURL(`${startURL}events`);
    });

    // Linking.makeUrl('/');

    // Linking.getInitialURL().then((url) => {
    //   alert(url);
    //   // setstartURL(url);
    // });

    const backHandler = BackHandler.addEventListener('hardwareBackPress', backAction);

    return () => {
      Notifications.removeNotificationSubscription(notificationListener.current);
      Notifications.removeNotificationSubscription(responseListener.current);
      backHandler.remove();
    };
  }, []);

  return (
    <>
      <StatusBar hidden={false} />
      <WebView
        ref={webViewRef}
        source={{ uri: `${startURL}?platform=android&token=${expoPushToken}` }}
        style={{ marginTop: 30 }}
      />
      {/* ${startURL}?platform=android&token=${expoPushToken} */}
      {/* onNavigationStateChange={(state) => console.log(state)} */}
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
  },
});

// получение токена для push уведомлений
async function registerForPushNotificationsAsync() {
  let token;
  if (Device.isDevice) {
    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;
    if (existingStatus !== 'granted') {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }
    if (finalStatus !== 'granted') {
      Alert('Не удалось получить разрешение на отправку уведомлений!');
      return;
    }
    token = (await Notifications.getExpoPushTokenAsync()).data;
    // console.log(token);
  } else {
    Alert('Для получения уведомлений нужно физическое устройство');
  }

  if (Platform.OS === 'android') {
    Notifications.setNotificationChannelAsync('default', {
      name: 'default',
      importance: Notifications.AndroidImportance.MAX,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: '#FF231F7C',
    });
  }

  return token;
}
