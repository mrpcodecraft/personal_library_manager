import React from 'react';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { Colors } from '../constants/theme';

export default function RootLayout() {
  return (
    <SafeAreaProvider>
      <StatusBar style="dark" />
      <Stack
        screenOptions={{
          headerShown: false,
          contentStyle: { backgroundColor: Colors.bgCream },
          animation: 'fade',
        }}
      >
        <Stack.Screen name="index" options={{ title: 'Splash' }} />
        <Stack.Screen name="library" options={{ title: 'Library Manager' }} />
      </Stack>
    </SafeAreaProvider>
  );
}

