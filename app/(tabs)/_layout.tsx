/**
 * Bottom Tabs Layout — "Amherst Civic"
 *
 * Main navigation structure with 6 tabs: Home, Directory, Events, Polls, Chat, School.
 * Uses a custom floating, rounded civic-blue nav bar with a green "pill" highlight
 * behind the active tab, matching the Town of Amherst's official brand colors.
 * Each tab contains its own nested stack navigation for detail screens.
 */

import { Tabs } from 'expo-router';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { theme } from '../../theme';

type TabBarProps = {
  state: {
    index: number;
    routes: { key: string; name: string }[];
  };
  navigation: {
    emit: (event: { type: 'tabPress'; target: string; canPreventDefault: boolean }) => {
      defaultPrevented: boolean;
    };
    navigate: (name: string) => void;
  };
};

type IconName = keyof typeof MaterialCommunityIcons.glyphMap;

const TAB_META: Record<string, { label: string; icon: IconName; activeIcon: IconName }> = {
  news: { label: 'Home', icon: 'home-variant-outline', activeIcon: 'home-variant' },
  directory: { label: 'Directory', icon: 'storefront-outline', activeIcon: 'storefront' },
  events: { label: 'Events', icon: 'calendar-blank-outline', activeIcon: 'calendar-month' },
  polls: { label: 'Polls', icon: 'poll', activeIcon: 'poll' },
  chat: { label: 'Chat', icon: 'chat-outline', activeIcon: 'chat-processing' },
  school: { label: 'School', icon: 'school-outline', activeIcon: 'school' },
};

function FloatingTabBar({ state, navigation }: TabBarProps) {
  const insets = useSafeAreaInsets();

  return (
    <View style={[styles.wrapper, { paddingBottom: Math.max(insets.bottom, 12) }]} pointerEvents="box-none">
      <View style={styles.bar}>
        {state.routes.map((route, index) => {
          const meta = TAB_META[route.name];
          if (!meta) return null;

          const focused = state.index === index;

          const onPress = () => {
            const event = navigation.emit({
              type: 'tabPress',
              target: route.key,
              canPreventDefault: true,
            });
            if (!focused && !event.defaultPrevented) {
              navigation.navigate(route.name);
            }
          };

          return (
            <Pressable
              key={route.key}
              onPress={onPress}
              accessibilityRole="button"
              accessibilityState={{ selected: focused }}
              accessibilityLabel={meta.label}
              style={styles.tab}
            >
              <View style={[styles.tabInner, focused && styles.tabInnerActive]}>
                <MaterialCommunityIcons
                  name={focused ? meta.activeIcon : meta.icon}
                  size={22}
                  color={focused ? theme.colors.brandDark : 'rgba(255,255,255,0.75)'}
                />
                <Text
                  numberOfLines={1}
                  style={[styles.label, focused ? styles.labelActive : styles.labelInactive]}
                >
                  {meta.label}
                </Text>
              </View>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

export default function TabsLayout() {
  return (
    <Tabs
      tabBar={(props) => <FloatingTabBar {...(props as unknown as TabBarProps)} />}
      screenOptions={{ headerShown: false }}
    >
      <Tabs.Screen name="news" options={{ title: 'Home' }} />
      <Tabs.Screen name="directory" options={{ title: 'Directory' }} />
      <Tabs.Screen name="events" options={{ title: 'Events' }} />
      <Tabs.Screen name="polls" options={{ title: 'Polls' }} />
      <Tabs.Screen name="chat" options={{ title: 'Chat' }} />
      <Tabs.Screen name="school" options={{ title: 'School' }} />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    paddingHorizontal: 12,
    backgroundColor: 'transparent',
  },
  bar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: theme.colors.brand,
    borderRadius: theme.borderRadius.full,
    paddingHorizontal: 6,
    paddingVertical: 8,
    ...theme.shadows.large,
  },
  tab: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tabInner: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 6,
    paddingHorizontal: 4,
    borderRadius: theme.borderRadius.full,
    width: '100%',
  },
  tabInnerActive: {
    backgroundColor: theme.colors.accentLight,
  },
  label: {
    fontFamily: theme.typography.small.fontFamily,
    fontSize: 10,
    marginTop: 3,
    letterSpacing: 0.2,
  },
  labelActive: {
    color: theme.colors.brandDark,
    fontFamily: theme.typography.bodyBold.fontFamily,
  },
  labelInactive: {
    color: 'rgba(255,255,255,0.75)',
  },
});
