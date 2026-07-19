/**
 * News Tab Stack Navigator
 * 
 * Defines navigation structure for News tab screens (list + detail).
 * Enables back button navigation from article detail back to list.
 * Configures consistent header styling across all News screens.
 */

import { Stack } from 'expo-router';
import { View, StyleSheet, Text } from 'react-native';
import { TownSeal } from '../../../components/TownSeal';
import { theme } from '../../../theme';

function HeaderTitle() {
  return (
    <View style={styles.headerContainer} pointerEvents="none">
      <TownSeal size="small" />
      <Text style={styles.headerText}>Home</Text>
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

export default function NewsLayout() {
  return (
    <Stack>
      <Stack.Screen
        name="index"
        options={{
          headerTitle: () => <HeaderTitle />,
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
          headerTitle: () => <HeaderTitle />,
          headerStyle: {
            backgroundColor: theme.colors.backgroundLight,
          },
          headerTintColor: theme.colors.text,
          headerShadowVisible: true,
          headerTransparent: false,
          headerBackTitle: 'News',
        }}
      />
    </Stack>
  );
}

