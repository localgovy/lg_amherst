/**
 * Chip Component
 * 
 * Selectable filter button used for category filtering.
 * Shows selected/unselected states with different colors and shadows.
 * Used in Business Directory for category filters (Dining, Shops, etc.).
 */

import { TouchableOpacity, Text, StyleSheet, View } from 'react-native';
import { ReactNode } from 'react';
import { theme } from '../theme';

interface ChipProps {
  label: string;
  selected?: boolean;
  onPress: () => void;
  icon?: ReactNode;
}

export function Chip({ label, selected = false, onPress, icon }: ChipProps) {
  return (
    <TouchableOpacity
      style={[styles.chip, selected && styles.chipSelected]}
      onPress={onPress}
      activeOpacity={0.7}
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityState={{ selected }}
    >
      <View style={styles.chipContent}>
        {icon && <View style={styles.iconContainer}>{icon}</View>}
        <Text style={[styles.chipText, selected && styles.chipTextSelected]}>
          {label}
        </Text>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  chip: {
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.sm + 1,
    borderRadius: theme.borderRadius.full,
    backgroundColor: theme.colors.backgroundLight,
    borderWidth: 1,
    borderColor: theme.colors.border,
    marginRight: theme.spacing.sm,
  },
  chipSelected: {
    backgroundColor: theme.colors.primary,
    borderColor: theme.colors.primary,
  },
  chipContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  iconContainer: {
    marginTop: 1,
  },
  chipText: {
    fontFamily: theme.typography.bodyBold.fontFamily,
    fontSize: theme.typography.caption.fontSize,
    color: theme.colors.textSecondary,
  },
  chipTextSelected: {
    color: theme.colors.white,
  },
});

