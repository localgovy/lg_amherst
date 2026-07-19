/**
 * Events List Screen
 *
 * Displays upcoming Amherst community events in chronological order.
 * Features category badges, date/time stamps, location info, and filtering by category.
 * Events include festivals, sports, government meetings, cultural activities, and more.
 * Tapping any event navigates to the full detail view.
 */

import { useState, useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, ScrollView, ActivityIndicator, TextInput, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Card } from '../../../components/Card';
import { Chip } from '../../../components/Chip';
import { theme } from '../../../theme';
import { fetchEvents, EventItemDB } from '../../../services/supabase';
import { parseLocalDate, isUpcoming } from '../../../utils/date';

const CATEGORY_ICONS: Record<string, string> = {
  'All': 'calendar-month',
  'Music & Entertainment': 'music-note',
  'Music & Concerts': 'music',
  'Government & Community': 'gavel',
  'Festivals & Events': 'party-popper',
  'Programs & Workshops': 'school',
  'Arts & Culture': 'palette',
  'Film & Cinema': 'movie',
  'Sports & Recreation': 'run',
  'Health & Wellness': 'heart-pulse',
  'Education': 'school',
  'Food & Drink': 'silverware-fork-knife',
};

const getCategoryIcon = (category: string): string =>
  CATEGORY_ICONS[category] ?? 'calendar';

export default function EventsScreen() {
  const router = useRouter();
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [events, setEvents] = useState<EventItemDB[]>([]);
  const [categories, setCategories] = useState<string[]>(['All']);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadEvents();
  }, []);

  const loadEvents = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await fetchEvents();
      setEvents(data);
      // Dynamically build category list from actual database values
      const unique = [...new Set(data.map(e => e.category).filter(Boolean))].sort();
      setCategories(['All', ...unique]);
    } catch (err) {
      console.error('Failed to load events:', err);
      setError('Failed to load events. Please try again later.');
    } finally {
      setLoading(false);
    }
  };

  // Filter and sort events
  const filteredEvents = events
    .filter((event) => {
      // Filter by category
      const matchesCategory = selectedCategory === 'All' || event.category === selectedCategory;
      
      // Filter by search query (guard against null/undefined fields from the data source)
      const query = searchQuery.toLowerCase();
      const matchesSearch = searchQuery === '' ||
        (event.title ?? '').toLowerCase().includes(query) ||
        (event.description ?? '').toLowerCase().includes(query) ||
        (event.location ?? '').toLowerCase().includes(query);
      
      return matchesCategory && matchesSearch;
    })
    .sort((a, b) => a.date.localeCompare(b.date));

  const renderHeader = () => (
    <View style={styles.sectionHeadingRow}>
      <Text style={styles.sectionHeading}>Upcoming Events</Text>
      <Text style={styles.sectionMeta}>
        {filteredEvents.length} {filteredEvents.length === 1 ? 'event' : 'events'}
      </Text>
    </View>
  );

  const renderPageHeader = () => (
    <View style={styles.pageHeader}>
      <Text style={styles.overline}>Town of Amherst</Text>
      <Text style={styles.pageTitle}>Local Events</Text>
      <Text style={styles.pageSubtitle}>
        Discover community gatherings, town halls, and cultural experiences in Amherst.
      </Text>
    </View>
  );

  const formatDate = (dateString: string) => {
    const date = parseLocalDate(dateString);
    if (!date) return dateString;
    return date.toLocaleDateString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
    });
  };

  if (loading) {
    return (
      <LinearGradient
        colors={[theme.colors.background, theme.colors.backgroundLight]}
        style={styles.container}
      >
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={theme.colors.brand} />
          <Text style={styles.loadingText}>Loading events...</Text>
        </View>
      </LinearGradient>
    );
  }

  if (error) {
    return (
      <LinearGradient
        colors={[theme.colors.background, theme.colors.backgroundLight]}
        style={styles.container}
      >
        <View style={styles.errorContainer}>
          <MaterialCommunityIcons name="alert-circle" size={64} color={theme.colors.danger} />
          <Text style={styles.errorTitle}>Error Loading Events</Text>
          <Text style={styles.errorText}>{error}</Text>
          <TouchableOpacity
            style={styles.retryButton}
            onPress={loadEvents}
            accessibilityRole="button"
            accessibilityLabel="Retry loading events"
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

      {/* Search Bar */}
      <View style={styles.searchSection}>
        <View style={styles.searchContainer}>
          <MaterialCommunityIcons 
            name="magnify" 
            size={20} 
            color={theme.colors.brand} 
            style={styles.searchIcon}
          />
          <TextInput
            style={styles.searchInput}
            placeholder="Search events..."
            placeholderTextColor={theme.colors.textMuted}
            value={searchQuery}
            onChangeText={setSearchQuery}
            returnKeyType="search"
          />
          {searchQuery.length > 0 && (
            <MaterialCommunityIcons
              name="close-circle"
              size={20}
              color={theme.colors.textMuted}
              style={styles.clearIcon}
              onPress={() => setSearchQuery('')}
            />
          )}
        </View>
      </View>
      
      <View style={styles.filterSection}>
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
                  name={getCategoryIcon(category) as any}
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

      <FlatList
        data={filteredEvents}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContent}
        ListHeaderComponent={renderHeader}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <MaterialCommunityIcons name="calendar-month" size={64} color={theme.colors.textMuted} />
            <Text style={styles.emptyTitle}>No events found</Text>
            <Text style={styles.emptyText}>Check back soon for upcoming events</Text>
          </View>
        }
        renderItem={({ item }) => {
          const upcoming = isUpcoming(item.date);
          
          return (
            <Card
              onPress={() => router.push(`/(tabs)/events/${item.id}`)}
              variant="elevated"
              gradient={false}
              style={styles.eventCard}
            >
              <View style={styles.cardHeader}>
                <View style={styles.titleContainer}>
                  <Text style={styles.title} numberOfLines={2}>
                    {item.title}
                  </Text>
                  <View style={styles.categoryBadge}>
                    <MaterialCommunityIcons
                      name={getCategoryIcon(item.category) as any}
                      size={14}
                      color={theme.colors.brand}
                    />
                    <Text style={styles.categoryText}>{item.category}</Text>
                  </View>
                </View>
                <View style={[styles.dateBadge, !upcoming && styles.dateBadgePast]}>
                  <Text style={[styles.dateDay, !upcoming && styles.dateTextPast]}>{formatDate(item.date).split(',')[0]}</Text>
                  <Text style={[styles.dateMonth, !upcoming && styles.dateTextPast]}>{formatDate(item.date).split(' ')[1]}</Text>
                  <Text style={[styles.dateNum, !upcoming && styles.dateTextPast]}>{formatDate(item.date).split(' ')[2]}</Text>
                </View>
              </View>
              
              <View style={styles.detailsRow}>
                <View style={styles.detailItem}>
                  <MaterialCommunityIcons name="clock-outline" size={14} color={theme.colors.brand} />
                  <Text style={styles.detailText}>{item.time}</Text>
                </View>
              </View>

              <View style={styles.detailsRow}>
                <View style={styles.detailItem}>
                  <MaterialCommunityIcons name="map-marker" size={14} color={theme.colors.brand} />
                  <Text style={styles.detailText} numberOfLines={1}>
                    {item.location}
                  </Text>
                </View>
              </View>

              <Text style={styles.description} numberOfLines={2}>
                {item.description}
              </Text>

              <Text style={styles.viewMore}>View details →</Text>
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
  searchSection: {
    paddingHorizontal: theme.spacing.lg,
    paddingTop: theme.spacing.md,
    paddingBottom: theme.spacing.sm,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.backgroundLight,
    borderRadius: theme.borderRadius.full,
    paddingHorizontal: theme.spacing.lg,
    paddingVertical: theme.spacing.sm + 2,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  searchIcon: {
    marginRight: theme.spacing.sm,
  },
  searchInput: {
    flex: 1,
    fontFamily: theme.typography.body.fontFamily,
    fontSize: theme.typography.body.fontSize,
    color: theme.colors.text,
    paddingVertical: theme.spacing.xs,
  },
  clearIcon: {
    marginLeft: theme.spacing.sm,
    padding: theme.spacing.xs,
  },
  filterSection: {
    paddingHorizontal: theme.spacing.lg,
    paddingTop: theme.spacing.xs,
    paddingBottom: theme.spacing.sm,
  },
  chipsContainer: {
    gap: theme.spacing.sm,
    paddingRight: theme.spacing.lg,
  },
  listContent: {
    paddingHorizontal: theme.spacing.lg,
    paddingTop: theme.spacing.sm,
    paddingBottom: 140,
  },
  eventCard: {},
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: theme.spacing.md,
    gap: theme.spacing.md,
  },
  titleContainer: {
    flex: 1,
    gap: theme.spacing.sm,
  },
  categoryBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    backgroundColor: theme.colors.surface,
    paddingHorizontal: theme.spacing.md,
    paddingVertical: 6,
    borderRadius: theme.borderRadius.full,
    gap: 6,
  },
  categoryIcon: {
    fontSize: 14,
  },
  categoryText: {
    ...theme.typography.label,
    fontSize: 10,
    letterSpacing: 0.8,
    color: theme.colors.textSecondary,
  },
  dateBadge: {
    backgroundColor: theme.colors.brand,
    paddingHorizontal: theme.spacing.sm,
    paddingVertical: 6,
    borderRadius: theme.borderRadius.md,
    minWidth: 60,
    alignItems: 'center',
  },
  dateBadgePast: {
    backgroundColor: theme.colors.lightGray,
  },
  dateDay: {
    ...theme.typography.small,
    color: '#fff',
    fontSize: 9,
    textTransform: 'uppercase',
  },
  dateMonth: {
    ...theme.typography.label,
    color: '#fff',
    fontSize: 10,
  },
  dateNum: {
    ...theme.typography.heading,
    color: '#fff',
    fontSize: 16,
  },
  dateTextPast: {
    color: theme.colors.darkGray,
  },
  title: {
    ...theme.typography.heading,
    color: theme.colors.primary,
  },
  detailsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: theme.spacing.xs,
  },
  detailItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    flex: 1,
  },
  detailIcon: {
    fontSize: 14,
  },
  detailText: {
    ...theme.typography.caption,
    color: theme.colors.textSecondary,
    flex: 1,
  },
  description: {
    ...theme.typography.body,
    color: theme.colors.textSecondary,
    marginTop: theme.spacing.sm,
    marginBottom: theme.spacing.md,
  },
  viewMore: {
    ...theme.typography.label,
    color: theme.colors.accentDark,
  },
  emptyContainer: {
    alignItems: 'center',
    paddingVertical: theme.spacing.xl * 2,
  },
  emptyIcon: {
    fontSize: 64,
    marginBottom: theme.spacing.lg,
    opacity: 0.5,
  },
  emptyTitle: {
    ...theme.typography.heading,
    color: theme.colors.text,
    marginBottom: theme.spacing.sm,
  },
  emptyText: {
    ...theme.typography.body,
    color: theme.colors.textSecondary,
    textAlign: 'center',
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
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: theme.spacing.xl,
    gap: theme.spacing.md,
  },
  errorTitle: {
    ...theme.typography.heading,
    color: theme.colors.text,
    textAlign: 'center',
  },
  errorText: {
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
});

