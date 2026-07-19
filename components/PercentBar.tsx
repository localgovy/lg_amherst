/**
 * PercentBar Component
 * 
 * Visual progress bar displaying poll results.
 * Shows option text, percentage, animated fill bar, and vote count.
 * Used in Polls screen to visualize voting results with professional styling.
 */

import { View, Text, StyleSheet } from 'react-native';
import { theme } from '../theme';

interface PercentBarProps {
  label: string;
  percentage: number;
  votes: number;
}

export function PercentBar({ label, percentage, votes }: PercentBarProps) {
  return (
    <View style={styles.container}>
      <View style={styles.labelRow}>
        <Text style={styles.label}>{label}</Text>
        <Text style={styles.percentage}>{percentage.toFixed(1)}%</Text>
      </View>
      <View style={styles.barBackground}>
        <View style={[styles.barFill, { width: `${percentage}%` }]} />
      </View>
      <Text style={styles.votes}>{votes} {votes === 1 ? 'vote' : 'votes'}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: theme.spacing.md,
  },
  labelRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: theme.spacing.sm,
  },
  label: {
    ...theme.typography.bodyBold,
    color: theme.colors.text,
    flex: 1,
  },
  percentage: {
    fontFamily: theme.typography.bodyBold.fontFamily,
    fontSize: theme.typography.body.fontSize,
    fontWeight: '700',
    color: theme.colors.accentDark,
    marginLeft: theme.spacing.sm,
  },
  barBackground: {
    height: 32,
    backgroundColor: theme.colors.surfaceLight,
    borderRadius: theme.borderRadius.full,
    overflow: 'hidden',
    marginBottom: theme.spacing.xs,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  barFill: {
    height: '100%',
    backgroundColor: theme.colors.primary,
    borderRadius: theme.borderRadius.full,
  },
  votes: {
    fontSize: theme.typography.small.fontSize,
    color: theme.colors.textMuted,
  },
});

