import '@src/localization';
import React from 'react';
import { Text, StatusBar } from 'react-native';
import { useFonts } from 'expo-font';
import AppNavigator from '@navigation/AppNavigator';
import { AuthManager } from '@providers/AuthManager';
import { ToastProvider } from '@providers/ToastProvider';
import { NotificationProvider } from '@providers/NotificationProvider';
import Toast from 'react-native-toast-message';
import { toastConfig } from '@src/config/toastConfig';
import UrbanistRegular from './assets/fonts/Urbanist-Regular.ttf'
import UrbanistMedium from './assets/fonts/Urbanist-Medium.ttf'
import UrbanistSemiBold from './assets/fonts/Urbanist-SemiBold.ttf'
import UrbanistBold from './assets/fonts/Urbanist-Bold.ttf'
import UrbanistExtraBold from './assets/fonts/Urbanist-ExtraBold.ttf'
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { Color } from '@styles/colors';

const App = () => {
  const [fontsLoaded] = useFonts({
    "Urbanist-Regular": UrbanistRegular,
    "Urbanist-Medium": UrbanistMedium,
    "Urbanist-SemiBold": UrbanistSemiBold,
    "Urbanist-Bold": UrbanistBold,
    "Urbanist-ExtraBold": UrbanistExtraBold,
  });

  if (!fontsLoaded) {
    return <Text>Loading...</Text>;
  }

  return (
    <ToastProvider>
      <AuthManager>
        <NotificationProvider>
          <GestureHandlerRootView style={{ flex: 1 }}>
            <StatusBar barStyle="dark-content" backgroundColor={Color.Background.subtle} translucent={false} />
            <AppNavigator />
            <Toast config={toastConfig} />
          </GestureHandlerRootView>
        </NotificationProvider>
      </AuthManager>
    </ToastProvider>
  );
};

export default App;