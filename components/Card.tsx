/**
 * Card Component
 * 
 * Reusable card container with multiple style variants.
 * Supports optional gradient backgrounds, elevation shadows, and outlined styles.
 * Can be tappable (with onPress) or static. Used throughout the app for content cards.
 */

import { View, StyleSheet, TouchableOpacity, ViewStyle } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { theme } from '../theme';

interface CardProps {
  children: React.ReactNode;
  onPress?: () => void;
  style?: ViewStyle;
  variant?: 'default' | 'elevated' | 'outlined';
  gradient?: boolean;
  /** Optional accessible name for screen readers when the card is tappable. */
  accessibilityLabel?: string;
}

export function Card({ children, onPress, style, variant = 'elevated', gradient = false, accessibilityLabel }: CardProps) {
  const cardStyle = [
    styles.card,
    variant === 'elevated' && styles.cardElevated,
    variant === 'outlined' && styles.cardOutlined,
    style,
  ];

  const content = gradient ? (
    <LinearGradient
      colors={[theme.colors.backgroundLight, theme.colors.surface]}
      style={cardStyle}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
    >
      {children}
    </LinearGradient>
  ) : (
    <View style={cardStyle}>{children}</View>
  );

  if (onPress) {
    return (
      <TouchableOpacity
        onPress={onPress}
        activeOpacity={0.85}
        accessibilityRole="button"
        accessibilityLabel={accessibilityLabel}
      >
        {content}
      </TouchableOpacity>
    );
  }

  return content;
}

const styles = StyleSheet.create({
  card: {
    borderRadius: theme.borderRadius.lg,
    padding: theme.spacing.lg,
    marginBottom: theme.spacing.md,
  },
  cardElevated: {
    backgroundColor: theme.colors.surfaceElevated,
    ...theme.shadows.small,
    borderWidth: 1,
    borderColor: theme.colors.borderLight,
  },
  cardOutlined: {
    backgroundColor: theme.colors.backgroundLight,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
});

