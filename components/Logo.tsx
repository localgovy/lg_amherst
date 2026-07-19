/**
 * Logo Component
 *
 * LocalGovy brand logo (the platform powering this app).
 * Displays a solid brand-color square alongside the wordmark.
 * Available in three sizes (small, medium, large) for different contexts
 * (headers, splash screen, etc.).
 */

import { View, Text, StyleSheet } from 'react-native';
import { theme } from '../theme';

interface LogoProps {
  size?: 'small' | 'medium' | 'large';
  showText?: boolean;
}

export function Logo({ size = 'medium', showText = true }: LogoProps) {
  const dimensions = {
    small: { square: 32, fontSize: 14 },
    medium: { square: 48, fontSize: 18 },
    large: { square: 80, fontSize: 28 },
  };

  const { square, fontSize } = dimensions[size];

  return (
    <View style={styles.container}>
      <View style={[styles.square, { width: square, height: square }]}>
        {/* LocalGovy brand square */}
      </View>
      {showText && (
        <Text style={[styles.text, { fontSize, marginLeft: size === 'small' ? 8 : 12 }]}>
          localgovy
        </Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  square: {
    backgroundColor: theme.colors.brand,
    borderRadius: theme.borderRadius.sm,
  },
  text: {
    fontWeight: '700',
    color: theme.colors.text,
    letterSpacing: -0.5,
  },
});

