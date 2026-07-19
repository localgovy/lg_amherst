/**
 * Splash Screen / Entry Point
 * 
 * Initial screen shown when app launches. Displays Amherst seal and LocalGovy logo
 * with fade-in and scale effects, then automatically navigates to the main
 * tabs after a 2-second delay. Creates a professional first impression.
 */

import { useEffect } from 'react';
import { View, Text, StyleSheet, Animated, Image } from 'react-native';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { Logo } from '../components/Logo';
import { theme } from '../theme';

export default function Index() {
  const router = useRouter();
  const fadeAnim = new Animated.Value(0);
  const scaleAnim = new Animated.Value(0.9);

  useEffect(() => {
    // Animate logo entrance
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 800,
        useNativeDriver: true,
      }),
      Animated.spring(scaleAnim, {
        toValue: 1,
        tension: 50,
        friction: 7,
        useNativeDriver: true,
      }),
    ]).start();

    // Navigate to main app after delay
    const timer = setTimeout(() => {
      router.replace('/(tabs)/news');
    }, 2000);

    return () => clearTimeout(timer);
  }, []);

  return (
    <LinearGradient
      colors={[theme.colors.backgroundLight, theme.colors.background]}
      style={styles.container}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
    >
          <Animated.View
            style={[
              styles.content,
              {
                opacity: fadeAnim,
                transform: [{ scale: scaleAnim }],
              },
            ]}
          >
            <Image 
              source={require('../assets/amherst-crest.jpg')} 
              style={styles.seal}
              resizeMode="contain"
            />
            <Text style={styles.cityName}>Town of Amherst</Text>
            <Text style={styles.motto}>Gateway to Nova Scotia</Text>
            <View style={styles.divider} />
            <Logo size="medium" />
            <Text style={styles.tagline}>Empowering Local Governance</Text>
          </Animated.View>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  content: {
    alignItems: 'center',
  },
  seal: {
    width: 180,
    height: 180,
    marginBottom: theme.spacing.lg,
  },
  cityName: {
    ...theme.typography.title,
    color: theme.colors.primary,
    marginBottom: theme.spacing.xs,
  },
  motto: {
    fontFamily: 'LibreCaslonText_400Regular_Italic',
    fontSize: 16,
    color: theme.colors.accentDark,
    marginBottom: theme.spacing.sm,
  },
  divider: {
    width: 64,
    height: 2,
    backgroundColor: theme.colors.accent,
    marginVertical: theme.spacing.xl,
    borderRadius: 1,
  },
  tagline: {
    ...theme.typography.caption,
    color: theme.colors.textSecondary,
    marginTop: theme.spacing.sm,
    letterSpacing: 1.5,
    textTransform: 'uppercase',
    fontSize: 11,
  },
});


