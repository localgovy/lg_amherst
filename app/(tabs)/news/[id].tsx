/**
 * News Detail Screen
 * 
 * Shows full article content for a selected news item.
 * Displays formatted date, headline, summary, and full article text.
 * Includes back button to return to news list.
 * Features adjustable text size slider for accessibility.
 */

import { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { theme } from '../../../theme';
import { fetchNewsById, NewsItemDB } from '../../../services/supabase';

export default function NewsDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const [textSize, setTextSize] = useState(1); // 0.8 to 1.4 scale
  const [item, setItem] = useState<NewsItemDB | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Format date to display correctly in local time
  const formatDate = (dateString: string) => {
    // Parse the date string as local time (YYYY-MM-DD)
    const [year, month, day] = dateString.split('T')[0].split('-').map(Number);
    const date = new Date(year, month - 1, day);
    
    return date.toLocaleDateString('en-US', {
      weekday: 'long',
      month: 'long',
      day: 'numeric',
      year: 'numeric'
    });
  };

  useEffect(() => {
    loadTextSize();
    loadNewsItem();
  }, [id]);

  const loadNewsItem = async () => {
    if (!id) return;
    
    try {
      setLoading(true);
      setError(null);
      const data = await fetchNewsById(id as string);
      setItem(data);
    } catch (err) {
      console.error('Failed to load news item:', err);
      setError('Unable to load article. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const loadTextSize = async () => {
    try {
      const saved = await AsyncStorage.getItem('@text_size');
      if (saved) {
        setTextSize(parseFloat(saved));
      }
    } catch (error) {
      console.log('Error loading text size:', error);
    }
  };

  const handleTextSizeChange = async (size: number) => {
    setTextSize(size);
    try {
      await AsyncStorage.setItem('@text_size', size.toString());
    } catch (error) {
      console.log('Error saving text size:', error);
    }
  };

  if (loading) {
    return (
      <View style={styles.container}>
        <View style={styles.topDivider} />
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color={theme.colors.brand} />
          <Text style={styles.loadingText}>Loading article...</Text>
        </View>
      </View>
    );
  }

  if (error || !item) {
    return (
      <View style={styles.container}>
        <View style={styles.topDivider} />
        <View style={styles.centerContainer}>
          <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
            <Text style={styles.backButtonText}>← Back to News</Text>
          </TouchableOpacity>
          <Text style={styles.errorText}>{error || 'News article not found'}</Text>
          {error && (
            <TouchableOpacity style={styles.retryButton} onPress={loadNewsItem}>
              <Text style={styles.retryButtonText}>Retry</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.topDivider} />
      <ScrollView contentContainerStyle={styles.contentContainer}>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <Text style={styles.backButtonText}>← Back to News</Text>
        </TouchableOpacity>

      {/* Text Size Adjuster */}
      <View style={styles.textSizeControl}>
        <Text style={styles.textSizeLabel}>Text Size</Text>
        <View style={styles.textSizeButtons}>
          <TouchableOpacity 
            style={[styles.textSizeButton, textSize <= 0.9 && styles.textSizeButtonActive]}
            onPress={() => handleTextSizeChange(0.8)}
            accessibilityLabel="Small text size"
          >
            <Text style={[styles.textSizeButtonText, styles.textSizeSmall, textSize <= 0.9 && styles.textSizeButtonTextActive]}>A</Text>
            <Text style={[styles.textSizeButtonLabel, textSize <= 0.9 && styles.textSizeButtonLabelActive]}>Small</Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={[styles.textSizeButton, textSize > 0.9 && textSize <= 1.1 && styles.textSizeButtonActive]}
            onPress={() => handleTextSizeChange(1.0)}
            accessibilityLabel="Medium text size"
          >
            <Text style={[styles.textSizeButtonText, styles.textSizeMedium, textSize > 0.9 && textSize <= 1.1 && styles.textSizeButtonTextActive]}>A</Text>
            <Text style={[styles.textSizeButtonLabel, textSize > 0.9 && textSize <= 1.1 && styles.textSizeButtonLabelActive]}>Medium</Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={[styles.textSizeButton, textSize > 1.1 && styles.textSizeButtonActive]}
            onPress={() => handleTextSizeChange(1.3)}
            accessibilityLabel="Large text size"
          >
            <Text style={[styles.textSizeButtonText, styles.textSizeLarge, textSize > 1.1 && styles.textSizeButtonTextActive]}>A</Text>
            <Text style={[styles.textSizeButtonLabel, textSize > 1.1 && styles.textSizeButtonLabelActive]}>Large</Text>
          </TouchableOpacity>
        </View>
      </View>

      <Text style={[styles.date, { fontSize: 13 * textSize }]}>
        {formatDate(item.date)}
      </Text>
      <Text style={[styles.title, { fontSize: 32 * textSize, lineHeight: 38 * textSize }]}>
        {item.title}
      </Text>
      <Text style={[styles.summary, { fontSize: 20 * textSize, lineHeight: 30 * textSize }]}>
        {item.summary}
      </Text>
      <View style={styles.divider} />
      <Text style={[styles.bodyText, { fontSize: 18 * textSize, lineHeight: 32 * textSize }]}>
        {item.content}
      </Text>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.backgroundLight,
  },
  topDivider: {
    height: 0,
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: theme.spacing.xl,
  },
  loadingText: {
    ...theme.typography.body,
    color: theme.colors.textSecondary,
    marginTop: theme.spacing.md,
  },
  retryButton: {
    backgroundColor: theme.colors.brand,
    paddingHorizontal: theme.spacing.xl,
    paddingVertical: theme.spacing.md,
    borderRadius: theme.borderRadius.md,
    marginTop: theme.spacing.lg,
    ...theme.shadows.small,
  },
  retryButtonText: {
    ...theme.typography.bodyBold,
    color: theme.colors.background,
  },
  contentContainer: {
    padding: theme.spacing.lg,
    paddingTop: theme.spacing.md,
    paddingBottom: 140,
    maxWidth: 680,
    alignSelf: 'center',
    width: '100%',
  },
  backButton: {
    paddingVertical: theme.spacing.sm,
    marginBottom: theme.spacing.md,
  },
  backButtonText: {
    fontSize: theme.typography.body.fontSize,
    color: theme.colors.accent,
    fontWeight: '700',
  },
  textSizeControl: {
    backgroundColor: theme.colors.nearWhite,
    borderRadius: theme.borderRadius.lg,
    padding: theme.spacing.md,
    marginBottom: theme.spacing.lg,
    borderWidth: 1,
    borderColor: theme.colors.lightGray,
  },
  textSizeLabel: {
    fontSize: theme.typography.caption.fontSize,
    color: theme.colors.darkGray,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: theme.spacing.sm,
  },
  textSizeButtons: {
    flexDirection: 'row',
    gap: theme.spacing.sm,
  },
  textSizeButton: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: theme.spacing.md,
    paddingHorizontal: theme.spacing.sm,
    backgroundColor: theme.colors.white,
    borderRadius: theme.borderRadius.md,
    borderWidth: 2,
    borderColor: theme.colors.lightGray,
    gap: 4,
  },
  textSizeButtonActive: {
    backgroundColor: theme.colors.brand,
    borderColor: theme.colors.brand,
  },
  textSizeButtonText: {
    fontWeight: '700',
    color: theme.colors.darkGray,
  },
  textSizeSmall: {
    fontSize: 14,
  },
  textSizeMedium: {
    fontSize: 18,
  },
  textSizeLarge: {
    fontSize: 22,
  },
  textSizeButtonTextActive: {
    color: '#fff',
  },
  textSizeButtonLabel: {
    fontSize: 10,
    fontWeight: '600',
    color: theme.colors.mediumGray,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  textSizeButtonLabelActive: {
    color: '#fff',
  },
  date: {
    fontFamily: theme.typography.label.fontFamily,
    fontSize: 13,
    color: theme.colors.accentDark,
    marginBottom: theme.spacing.md,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  title: {
    fontFamily: theme.typography.display.fontFamily,
    fontSize: 32,
    color: theme.colors.primary,
    marginBottom: theme.spacing.lg,
    lineHeight: 38,
    letterSpacing: -0.5,
  },
  summary: {
    fontFamily: theme.typography.body.fontFamily,
    fontSize: 20,
    color: theme.colors.textSecondary,
    marginBottom: theme.spacing.xl,
    lineHeight: 30,
  },
  bodyText: {
    fontFamily: theme.typography.body.fontFamily,
    fontSize: 18,
    color: theme.colors.text,
    lineHeight: 32,
    letterSpacing: 0.1,
  },
  divider: {
    height: 1,
    backgroundColor: theme.colors.divider,
    marginTop: theme.spacing.xl,
    marginBottom: theme.spacing.xl,
  },
  errorText: {
    fontSize: theme.typography.body.fontSize,
    color: theme.colors.darkGray,
    textAlign: 'center',
    marginTop: theme.spacing.xl,
  },
});

