import { Stack } from 'expo-router';
import { useEffect } from 'react';
import { SplashScreen } from 'expo-splash-screen';
import { StatusBar } from 'react-native';

// Keep splash screen visible until we're ready
SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  useEffect(() => {
    // Hide splash screen after first render
    SplashScreen.hideAsync();
    
    // Status bar config
    StatusBar.setBarStyle('light-content');
    StatusBar.setBackgroundColor('transparent');
  }, []);

  return (
    <Stack
      screenOptions={{
        headerShown: false,
        cardStyle: { backgroundColor: '#000' },
      }}
    >
      <Stack.Screen name="(tabs)" options={{ presentation: 'transparentModal' }} />
    </Stack>
  );
}