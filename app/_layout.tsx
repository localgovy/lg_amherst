/**
 * Root Layout Component
 *
 * Top-level navigation structure for the entire app.
 * Loads the brand fonts (Libre Caslon Text + Work Sans), sets Work Sans as the
 * default font for all Text/TextInput, keeps the splash screen up until fonts
 * are ready, then configures the main Stack navigator. The (tabs) route is nested here.
 */

import { useEffect } from 'react';
import { Text, TextInput } from 'react-native';
import { Stack } from 'expo-router';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import * as SplashScreen from 'expo-splash-screen';
import {
  useFonts,
  LibreCaslonText_400Regular,
  LibreCaslonText_400Regular_Italic,
  LibreCaslonText_700Bold,
} from '@expo-google-fonts/libre-caslon-text';
import {
  WorkSans_400Regular,
  WorkSans_500Medium,
  WorkSans_600SemiBold,
  WorkSans_700Bold,
} from '@expo-google-fonts/work-sans';
import { fonts } from '../theme';

SplashScreen.preventAutoHideAsync().catch(() => {});

// Default all text to Work Sans so even un-tokenized text stays on-brand.
const TextAny = Text as unknown as { defaultProps?: { style?: unknown } };
const TextInputAny = TextInput as unknown as { defaultProps?: { style?: unknown } };
TextAny.defaultProps = { ...(TextAny.defaultProps || {}), style: { fontFamily: fonts.sans } };
TextInputAny.defaultProps = { ...(TextInputAny.defaultProps || {}), style: { fontFamily: fonts.sans } };

export default function RootLayout() {
  const [fontsLoaded, fontError] = useFonts({
    LibreCaslonText_400Regular,
    LibreCaslonText_400Regular_Italic,
    LibreCaslonText_700Bold,
    WorkSans_400Regular,
    WorkSans_500Medium,
    WorkSans_600SemiBold,
    WorkSans_700Bold,
  });

  useEffect(() => {
    if (fontsLoaded || fontError) {
      SplashScreen.hideAsync().catch(() => {});
    }
  }, [fontsLoaded, fontError]);

  if (!fontsLoaded && !fontError) {
    return null;
  }

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="(tabs)" />
      </Stack>
    </GestureHandlerRootView>
  );
}
