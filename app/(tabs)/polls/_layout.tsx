/**
 * Polls Tab Stack Navigator
 * 
 * Defines navigation structure for Polls tab.
 * Currently single-screen but structured as stack for future expansion
 * (e.g., poll history, results archive). Configures header styling.
 */

import { Stack } from 'expo-router';
import { View, StyleSheet, Text } from 'react-native';
import { TownSeal } from '../../../components/TownSeal';
import { theme } from '../../../theme';

function HeaderTitle() {
  return (
    <View style={styles.headerContainer} pointerEvents="none">
      <TownSeal size="small" />
      <Text style={styles.headerText}>Community Poll</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  headerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    pointerEvents: 'none',
  },
  headerText: {
    fontFamily: theme.typography.heading.fontFamily,
    fontSize: 20,
    color: theme.colors.primary,
    letterSpacing: -0.2,
  },
});

export default function PollsLayout() {
  return (
    <Stack
      screenOptions={{
        headerStyle: {
          backgroundColor: theme.colors.backgroundLight,
        },
        headerTintColor: theme.colors.text,
        headerShadowVisible: true,
        headerTransparent: false,
      }}
    >
      <Stack.Screen
        name="index"
        options={{
          headerTitle: () => <HeaderTitle />,
        }}
      />
    </Stack>
  );
}

