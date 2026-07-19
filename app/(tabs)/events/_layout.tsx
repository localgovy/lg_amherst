/**
 * Events Tab Stack Navigator
 *
 * Defines navigation structure for Events tab screens (list + detail).
 * Enables back button navigation from event detail back to events list.
 * Configures consistent header styling across all Events screens.
 */

import { Stack } from 'expo-router';
import { View, StyleSheet, Text } from 'react-native';
import { TownSeal } from '../../../components/TownSeal';
import { theme } from '../../../theme';

function HeaderTitleList() {
  return (
    <View style={styles.headerContainer} pointerEvents="none">
      <TownSeal size="small" />
      <Text style={styles.headerText}>Local Events</Text>
    </View>
  );
}

function HeaderTitleDetail() {
  return (
    <View style={styles.headerContainer} pointerEvents="none">
      <TownSeal size="small" />
      <Text style={styles.headerText}>Event Details</Text>
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
    fontWeight: '700',
    color: theme.colors.primary,
    letterSpacing: -0.2,
  },
});

export default function EventsLayout() {
  return (
    <Stack>
      <Stack.Screen
        name="index"
        options={{
          headerTitle: () => <HeaderTitleList />,
          headerStyle: {
            backgroundColor: theme.colors.backgroundLight,
          },
          headerTintColor: theme.colors.text,
          headerShadowVisible: true,
          headerTransparent: false,
          headerBackTitle: ' ',
        }}
      />
      <Stack.Screen
        name="[id]"
        options={{
          headerTitle: () => <HeaderTitleDetail />,
          headerStyle: {
            backgroundColor: theme.colors.backgroundLight,
          },
          headerTintColor: theme.colors.text,
          headerShadowVisible: true,
          headerTransparent: false,
          headerBackTitle: 'Events',
        }}
      />
    </Stack>
  );
}

