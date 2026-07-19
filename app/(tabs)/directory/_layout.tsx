/**
 * Directory Tab Stack Navigator
 * 
 * Defines navigation structure for Business Directory screens (list + detail).
 * Enables back button navigation from business detail back to directory list.
 * Configures consistent header styling across all Directory screens.
 */

import { Stack } from 'expo-router';
import { View, StyleSheet, Text } from 'react-native';
import { TownSeal } from '../../../components/TownSeal';
import { theme } from '../../../theme';

function HeaderTitle() {
  return (
    <View style={styles.headerContainer} pointerEvents="none">
      <TownSeal size="small" />
      <Text style={styles.headerText}>Business Directory</Text>
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

export default function DirectoryLayout() {
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
          headerBackTitle: 'Businesses',
        }}
      />
    </Stack>
  );
}

