/**
 * Business Directory List Screen
 * 
 * Searchable and filterable list of Amherst businesses with LocalGovy Scores.
 * Features text search, category filter chips, ratings, and sponsored badges.
 * Shows live count of filtered results.
 */

import { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, FlatList, ScrollView, TouchableOpacity, ActivityIndicator, RefreshControl } from 'react-native';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Card } from '../../../components/Card';
import { SearchBar } from '../../../components/SearchBar';
import { Chip } from '../../../components/Chip';
import { fetchBusinesses } from '../../../services/supabase';
import { filterBusinesses } from '../../../utils/filter';
import { formatCategory } from '../../../utils/formatCategory';
import { theme } from '../../../theme';

// Icon mapping for categories
const CATEGORY_ICONS: Record<string, string> = {
  All: 'office-building',
  'Health & Wellness': 'heart-pulse',
  'Shopping & Retail': 'shopping',
  'Food & Dining': 'silverware-fork-knife',
  'Education & Child Care': 'school',
  'Professional Services': 'briefcase',
  'Automotive': 'car',
  'Entertainment & Arts': 'palette',
};

// Interface to match Supabase structure with reviewCount
interface Business {
  id: string;
  name: string;
  category: string;
  description: string;
  phone: string;
  address: string;
  website: string | null;
  rating: number | null;
  reviewCount: number | null;
}

export default function DirectoryScreen() {
  const router = useRouter();
  const flatListRef = useRef<FlatList>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [sortByScore, setSortByScore] = useState(false);
  const [businesses, setBusinesses] = useState<Business[]>([]);
  const [categories, setCategories] = useState<string[]>(['All']);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Fetch businesses from Supabase
  const loadBusinesses = async () => {
    try {
      setError(null);
      const data = await fetchBusinesses();
      
      // Transform Supabase data to match local interface
      const transformed: Business[] = data.map(b => ({
        id: b.id,
        name: b.name,
        category: b.category,
        description: b.description,
        phone: b.phone,
        address: b.address,
        website: b.website || null,
        rating: b.rating,
        reviewCount: b.review_count,
      }));
      
      // Shuffle so "All" view is random rather than alphabetical
      for (let i = transformed.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [transformed[i], transformed[j]] = [transformed[j], transformed[i]];
      }

      setBusinesses(transformed);
      
      // Extract unique categories and format them
      const uniqueCategories = [...new Set(transformed.map(b => b.category))];
      const formattedCategories = ['All', ...uniqueCategories.map(formatCategory).sort()];
      setCategories(formattedCategories);
    } catch (err) {
      console.error('Failed to load businesses:', err);
      setError('Failed to load businesses. Please try again later.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadBusinesses();
  }, []);

  useEffect(() => {
    flatListRef.current?.scrollToOffset({ offset: 0, animated: false });
  }, [selectedCategory]);

  const onRefresh = () => {
    setRefreshing(true);
    loadBusinesses();
  };

  let filteredBusinesses = filterBusinesses(searchQuery, selectedCategory, businesses);

  // Sort by score if enabled - only show businesses with at least 3 reviews
  if (sortByScore) {
    filteredBusinesses = [...filteredBusinesses]
      .filter(b => b.reviewCount != null && b.reviewCount >= 3)
      .sort((a, b) => {
        // Handle null ratings - businesses without ratings go to the bottom
        if (a.rating === null && b.rating === null) return 0;
        if (a.rating === null) return 1;
        if (b.rating === null) return -1;
        
        // Sort by rating descending (highest first)
        return b.rating - a.rating;
      });
  }

  const renderHeader = () => (
    <>
      <View style={styles.sectionHeadingRow}>
        <Text style={styles.sectionHeading}>Local Directory</Text>
        <Text style={styles.sectionMeta}>
          {filteredBusinesses.length} {filteredBusinesses.length === 1 ? 'result' : 'results'}
        </Text>
      </View>

      <TouchableOpacity
        style={[styles.sortButton, sortByScore && styles.sortButtonActive]}
        onPress={() => setSortByScore(!sortByScore)}
        activeOpacity={0.85}
      >
        <MaterialCommunityIcons 
          name={sortByScore ? "sort-descending" : "sort"} 
          size={18} 
          color={sortByScore ? theme.colors.white : theme.colors.primary} 
        />
        <Text style={[styles.sortButtonText, sortByScore && styles.sortButtonTextActive]}>
          {sortByScore ? 'Sorted by Score' : 'Sort by Score'}
        </Text>
      </TouchableOpacity>
    </>
  );

  const renderPageHeader = () => (
    <View style={styles.pageHeader}>
      <Text style={styles.overline}>Town of Amherst</Text>
      <Text style={styles.pageTitle}>Business Directory</Text>
      <Text style={styles.pageSubtitle}>
        Discover local shops, services, and hidden gems across the community.
      </Text>
    </View>
  );

  if (loading) {
    return (
      <LinearGradient
        colors={[theme.colors.backgroundLight, theme.colors.background]}
        style={styles.container}
      >
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={theme.colors.brand} />
          <Text style={styles.loadingText}>Loading businesses...</Text>
        </View>
      </LinearGradient>
    );
  }

  if (error) {
    return (
      <LinearGradient
        colors={[theme.colors.backgroundLight, theme.colors.background]}
        style={styles.container}
      >
        <View style={styles.loadingContainer}>
          <MaterialCommunityIcons name="alert-circle" size={64} color={theme.colors.danger} />
          <Text style={styles.emptyTitle}>Error Loading Businesses</Text>
          <Text style={styles.loadingText}>{error}</Text>
          <TouchableOpacity
            style={styles.retryButton}
            onPress={loadBusinesses}
            accessibilityRole="button"
            accessibilityLabel="Retry loading businesses"
          >
            <Text style={styles.retryButtonText}>Retry</Text>
          </TouchableOpacity>
        </View>
      </LinearGradient>
    );
  }

  return (
    <LinearGradient
      colors={[theme.colors.backgroundLight, theme.colors.background]}
      style={styles.container}
    >
      {renderPageHeader()}

      <View style={styles.filterSection}>
        <SearchBar
          value={searchQuery}
          onChangeText={setSearchQuery}
          placeholder="Search businesses..."
        />
        <View style={styles.categoryScrollContainer}>
          <Text style={styles.categoryScrollHint}>Scroll to browse categories →</Text>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.chipsContainer}
          >
            {categories.map((category) => (
              <Chip
                key={category}
                icon={
                  <MaterialCommunityIcons
                    name={(CATEGORY_ICONS[category] || 'store') as any}
                    size={16}
                    color={selectedCategory === category ? theme.colors.white : theme.colors.brand}
                  />
                }
                label={category}
                selected={selectedCategory === category}
                onPress={() => setSelectedCategory(category)}
              />
            ))}
          </ScrollView>
        </View>
      </View>

      <FlatList
        ref={flatListRef}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={theme.colors.brand}
            colors={[theme.colors.brand]}
          />
        }
        data={filteredBusinesses}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContent}
        ListHeaderComponent={renderHeader}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <MaterialCommunityIcons name="magnify" size={64} color={theme.colors.textMuted} />
            <Text style={styles.emptyTitle}>No businesses found</Text>
            <Text style={styles.emptyText}>Try adjusting your search or filters</Text>
          </View>
        }
        renderItem={({ item }) => {
          const formattedCategory = formatCategory(item.category);
          
          return (
            <Card onPress={() => router.push(`/(tabs)/directory/${item.id}`)} variant="elevated">
              <View style={styles.cardContent}>
                <View style={styles.categoryBadge}>
                  <MaterialCommunityIcons
                    name={(CATEGORY_ICONS[formattedCategory] || 'store') as any}
                    size={14}
                    color={theme.colors.textPrimary}
                  />
                  <Text style={styles.categoryText}>{formattedCategory}</Text>
                </View>

                <Text style={styles.name}>{item.name}</Text>
                <Text style={styles.description} numberOfLines={2}>
                  {item.description}
                </Text>

                <View style={styles.ratingContainer}>
                  <View style={styles.ratingBadge}>
                    <MaterialCommunityIcons name="star" size={16} color="#FFD700" />
                    <Text style={styles.ratingText}>
                      {item.rating != null ? item.rating.toFixed(1) : 'N/A'}
                    </Text>
                  </View>
                  <Text style={styles.ratingLabel}>LocalGovy Score</Text>
                  <Text style={styles.reviewCount}>
                    ({item.reviewCount != null ? item.reviewCount : 0} reviews)
                  </Text>
                </View>

                <View style={styles.cardFooter}>
                  <View style={styles.contactInfo}>
                    <MaterialCommunityIcons name="phone" size={14} color={theme.colors.textSecondary} />
                    <Text style={styles.phone}>{item.phone}</Text>
                  </View>
                  <Text style={styles.viewDetails}>View Details →</Text>
                </View>
              </View>
            </Card>
          );
        }}
      />
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: theme.spacing.md,
  },
  loadingText: {
    ...theme.typography.body,
    color: theme.colors.textSecondary,
    textAlign: 'center',
  },
  retryButton: {
    backgroundColor: theme.colors.primary,
    paddingHorizontal: theme.spacing.lg,
    paddingVertical: theme.spacing.sm,
    borderRadius: theme.borderRadius.full,
    marginTop: theme.spacing.sm,
  },
  retryButtonText: {
    ...theme.typography.bodyBold,
    color: theme.colors.white,
  },
  pageHeader: {
    paddingHorizontal: theme.spacing.lg,
    paddingTop: theme.spacing.md,
    paddingBottom: theme.spacing.sm,
  },
  overline: {
    ...theme.typography.label,
    color: theme.colors.accentDark,
    marginBottom: theme.spacing.xs,
  },
  pageTitle: {
    ...theme.typography.title,
    color: theme.colors.primary,
    marginBottom: theme.spacing.xs,
  },
  pageSubtitle: {
    ...theme.typography.body,
    color: theme.colors.textSecondary,
  },
  sectionHeadingRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    marginBottom: theme.spacing.md,
  },
  sectionHeading: {
    ...theme.typography.heading,
    color: theme.colors.primary,
  },
  sectionMeta: {
    ...theme.typography.label,
    color: theme.colors.textMuted,
  },
  filterSection: {
    paddingHorizontal: theme.spacing.lg,
    paddingTop: theme.spacing.md,
    paddingBottom: theme.spacing.sm,
  },
  categoryScrollContainer: {
    marginTop: 1,
  },
  categoryScrollHint: {
    ...theme.typography.small,
    color: theme.colors.textMuted,
    marginBottom: theme.spacing.sm,
  },
  chipsContainer: {
    paddingTop: theme.spacing.xs,
    gap: theme.spacing.sm,
  },
  listContent: {
    paddingHorizontal: theme.spacing.lg,
    paddingBottom: 140,
    gap: theme.spacing.md,
  },
  emptyContainer: {
    padding: theme.spacing.xl,
    alignItems: 'center',
    gap: theme.spacing.md,
  },
  emptyTitle: {
    ...theme.typography.heading,
    color: theme.colors.text,
  },
  emptyText: {
    ...theme.typography.body,
    color: theme.colors.textSecondary,
    textAlign: 'center',
  },
  cardContent: {
    gap: theme.spacing.sm,
  },
  categoryBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.surfaceLight,
    paddingHorizontal: theme.spacing.md,
    paddingVertical: 6,
    borderRadius: theme.borderRadius.xl,
    gap: 6,
    alignSelf: 'flex-start',
    marginBottom: theme.spacing.xs,
  },
  categoryText: {
    ...theme.typography.label,
    color: theme.colors.textPrimary,
  },
  name: {
    ...theme.typography.heading,
    color: theme.colors.text,
    marginBottom: theme.spacing.xs,
  },
  description: {
    ...theme.typography.body,
    color: theme.colors.textSecondary,
    lineHeight: theme.typography.body.lineHeight,
  },
  ratingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.xs,
    marginTop: theme.spacing.xs,
  },
  ratingBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.surfaceElevated,
    paddingHorizontal: theme.spacing.sm,
    paddingVertical: 4,
    borderRadius: theme.borderRadius.md,
    gap: 4,
    borderWidth: 1,
    borderColor: theme.colors.brand,
  },
  ratingText: {
    fontSize: 14,
    fontWeight: '700',
    color: theme.colors.text,
  },
  ratingLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: theme.colors.brand,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  reviewCount: {
    fontSize: 11,
    color: theme.colors.textSecondary,
  },
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: theme.spacing.sm,
    paddingTop: theme.spacing.sm,
    borderTopWidth: 1,
    borderTopColor: theme.colors.divider,
  },
  contactInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  phone: {
    ...theme.typography.caption,
    color: theme.colors.brand,
  },
  viewDetails: {
    ...theme.typography.caption,
    color: theme.colors.accent,
  },
  sortButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: theme.spacing.xs,
    backgroundColor: theme.colors.backgroundLight,
    paddingVertical: theme.spacing.sm + 2,
    paddingHorizontal: theme.spacing.lg,
    borderRadius: theme.borderRadius.full,
    borderWidth: 1,
    borderColor: theme.colors.border,
    marginBottom: theme.spacing.lg,
  },
  sortButtonActive: {
    backgroundColor: theme.colors.primary,
    borderColor: theme.colors.primary,
  },
  sortButtonText: {
    ...theme.typography.bodyBold,
    color: theme.colors.primary,
    fontSize: 15,
  },
  sortButtonTextActive: {
    color: theme.colors.white,
  },
});
