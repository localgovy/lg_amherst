/**
 * Home Screen (formerly News List)
 * 
 * Displays news articles and quick links in a tabbed interface.
 * Home tab shows Amherst news, Links tab shows external resources.
 */

import { useState, useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, Linking, Alert, ActivityIndicator, RefreshControl } from 'react-native';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { Card } from '../../../components/Card';
import { theme } from '../../../theme';
import { fetchNews, NewsItemDB } from '../../../services/supabase';

type Tab = 'home' | 'links';

interface QuickLink {
  id: string;
  title: string;
  url: string;
  description: string;
  icon: keyof typeof Ionicons.glyphMap;
}

const quickLinks: QuickLink[] = [
  {
    id: '1',
    title: 'Submit a Service Request',
    url: 'https://www.amherst.ca/submit-a-service-request.html',
    description: 'Report potholes, streetlights, missed collection, or other concerns through E-Service Amherst',
    icon: 'alert-circle-outline',
  },
  {
    id: '2',
    title: 'Pay Bills',
    url: 'https://www.amherst.ca/pay-bills.html',
    description: 'Pay property taxes and water & sewer bills online, by phone, or at Town Hall',
    icon: 'card-outline',
  },
  {
    id: '3',
    title: 'Solid Waste Collection',
    url: 'https://www.amherst.ca/solid-waste-collection.html',
    description: 'Garbage, recycling, and organics collection schedules, zones, and guidelines',
    icon: 'trash-outline',
  },
  {
    id: '4',
    title: 'Recreation Programs',
    url: 'https://www.amherst.ca/fall-winter-spring-programming.html',
    description: 'Browse and register for Town of Amherst recreation programs and activities',
    icon: 'football-outline',
  },
  {
    id: '5',
    title: 'Book a Town Facility',
    url: 'https://www.amherst.ca/book-a-town-facility.html',
    description: 'Reserve Amherst Stadium, parks, and other Town facilities',
    icon: 'calendar-outline',
  },
  {
    id: '6',
    title: 'Council Agendas & Minutes',
    url: 'https://www.amherst.ca/government/council-committee-agendas.html',
    description: 'View Council and Committee meeting agendas and minutes',
    icon: 'document-text-outline',
  },
  {
    id: '7',
    title: 'Contact the Town',
    url: 'https://www.amherst.ca/government.html',
    description: 'Town Hall at 98 Victoria Street East · 902-667-3352 · info@amherst.ca',
    icon: 'business-outline',
  }
];

export default function NewsScreen() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<Tab>('home');
  const [news, setNews] = useState<NewsItemDB[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  // Format date to display correctly in local time
  const formatDate = (dateString: string) => {
    // Parse the date string as local time (YYYY-MM-DD)
    const [year, month, day] = dateString.split('T')[0].split('-').map(Number);
    const date = new Date(year, month - 1, day);
    
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  // Fetch news from Supabase
  const loadNews = async () => {
    try {
      setError(null);
      const data = await fetchNews();
      setNews(data);
    } catch (err) {
      console.error('Failed to load news:', err);
      setError('Unable to load news. Please check your connection and try again.');
    } finally {
      setLoading(false);
    }
  };

  // Handle pull-to-refresh
  const onRefresh = async () => {
    setRefreshing(true);
    await loadNews();
    setRefreshing(false);
  };

  // Load news on mount
  useEffect(() => {
    loadNews();
  }, []);

  const handleLinkPress = async (link: QuickLink) => {
    Alert.alert(
      'Open External Link',
      `This will open ${link.title} in your browser. Continue?`,
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Open',
          onPress: async () => {
            const canOpen = await Linking.canOpenURL(link.url);
            if (canOpen) {
              await Linking.openURL(link.url);
            } else {
              Alert.alert('Error', 'Cannot open this link');
            }
          },
        },
      ]
    );
  };

  const renderPageHeader = () => (
    <View style={styles.pageHeader}>
      <Text style={styles.overline}>Town of Amherst</Text>
      <Text style={styles.pageTitle}>Welcome home,{'\n'}Amherst.</Text>
      <Text style={styles.pageSubtitle}>
        Stay connected with your community. Here are the latest updates and essential municipal services.
      </Text>
      <View style={styles.segment}>
        <TouchableOpacity
          style={[styles.segmentTab, activeTab === 'home' && styles.segmentTabActive]}
          onPress={() => setActiveTab('home')}
          activeOpacity={0.8}
        >
          <Ionicons
            name="newspaper-outline"
            size={17}
            color={activeTab === 'home' ? theme.colors.white : theme.colors.textSecondary}
          />
          <Text style={[styles.segmentText, activeTab === 'home' && styles.segmentTextActive]}>
            News
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.segmentTab, activeTab === 'links' && styles.segmentTabActive]}
          onPress={() => setActiveTab('links')}
          activeOpacity={0.8}
        >
          <Ionicons
            name="compass-outline"
            size={17}
            color={activeTab === 'links' ? theme.colors.white : theme.colors.textSecondary}
          />
          <Text style={[styles.segmentText, activeTab === 'links' && styles.segmentTextActive]}>
            Quick Links
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  const renderNewsHeader = () => (
    <View style={styles.sectionHeadingRow}>
      <Text style={styles.sectionHeading}>Latest Updates</Text>
      <Text style={styles.sectionMeta}>{news.length} {news.length === 1 ? 'story' : 'stories'}</Text>
    </View>
  );

  const renderLinksHeader = () => (
    <View style={styles.sectionHeadingRow}>
      <Text style={styles.sectionHeading}>Quick Links</Text>
      <Text style={styles.sectionMeta}>External resources</Text>
    </View>
  );

  const renderLinksFooter = () => (
    <View style={styles.linksFooter}>
      <Ionicons name="chatbubbles" size={20} color={theme.colors.textSecondary} />
      <Text style={styles.linksFooterText}>
        Can't find what you're looking for? Ask our chat.
      </Text>
    </View>
  );

  // Render loading state
  const renderLoading = () => (
    <View style={styles.centerContainer}>
      <ActivityIndicator size="large" color={theme.colors.brand} />
      <Text style={styles.loadingText}>Loading news...</Text>
    </View>
  );

  // Render error state
  const renderError = () => (
    <View style={styles.centerContainer}>
      <Ionicons name="alert-circle" size={48} color={theme.colors.danger} />
      <Text style={styles.errorText}>{error}</Text>
      <TouchableOpacity style={styles.retryButton} onPress={loadNews}>
        <Text style={styles.retryButtonText}>Retry</Text>
      </TouchableOpacity>
    </View>
  );

  // Render empty state
  const renderEmpty = () => (
    <View style={styles.centerContainer}>
      <Ionicons name="newspaper-outline" size={48} color={theme.colors.textMuted} />
      <Text style={styles.emptyText}>No news articles available</Text>
    </View>
  );

  return (
    <LinearGradient
      colors={[theme.colors.backgroundLight, theme.colors.background]}
      style={styles.container}
    >
      {renderPageHeader()}

      {activeTab === 'home' ? (
        loading && news.length === 0 ? (
          renderLoading()
        ) : error && news.length === 0 ? (
          renderError()
        ) : (
          <FlatList
            data={news}
            keyExtractor={(item) => item.id}
            contentContainerStyle={news.length === 0 ? styles.emptyListContent : styles.listContent}
            ListHeaderComponent={news.length > 0 ? renderNewsHeader : null}
            ListEmptyComponent={renderEmpty}
            showsVerticalScrollIndicator={false}
            refreshControl={
              <RefreshControl
                refreshing={refreshing}
                onRefresh={onRefresh}
                tintColor={theme.colors.brand}
                colors={[theme.colors.brand]}
              />
            }
            renderItem={({ item, index }) => (
            <Card 
              onPress={() => router.push(`/(tabs)/news/${item.id}`)}
              variant="elevated"
              gradient={false}
            >
              <View style={styles.cardHeader}>
                <View style={[styles.badge, index === 0 && styles.badgeFeatured]}>
                  <Text style={[styles.badgeText, index === 0 && styles.badgeTextFeatured]}>
                    {index === 0 ? 'Featured' : 'News'}
                  </Text>
                </View>
                <Text style={styles.date}>
                  {formatDate(item.date)}
                </Text>
              </View>
              <Text style={styles.title} numberOfLines={2}>{item.title}</Text>
              <Text style={styles.summary} numberOfLines={3}>
                {item.summary}
              </Text>
              <View style={styles.readMoreRow}>
                <Text style={styles.readMore}>Read Article</Text>
                <Ionicons name="arrow-forward" size={16} color={theme.colors.accentDark} />
              </View>
            </Card>
            )}
          />
        )
      ) : (
        <FlatList
          data={quickLinks}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContent}
          ListHeaderComponent={renderLinksHeader}
          ListFooterComponent={renderLinksFooter}
          showsVerticalScrollIndicator={false}
          renderItem={({ item }) => (
            <Card 
              onPress={() => handleLinkPress(item)}
              variant="elevated"
            >
              <View style={styles.linkCard}>
                <View style={styles.linkIconContainer}>
                  <Ionicons name={item.icon} size={24} color={theme.colors.brand} />
                </View>
                <View style={styles.linkContent}>
                  <Text style={styles.linkTitle}>{item.title}</Text>
                  <Text style={styles.linkDescription}>{item.description}</Text>
                  <View style={styles.externalIndicator}>
                    <Ionicons name="open-outline" size={14} color={theme.colors.textMuted} />
                    <Text style={styles.externalText}>Opens in browser</Text>
                  </View>
                </View>
                <Ionicons name="chevron-forward" size={20} color={theme.colors.textMuted} />
              </View>
            </Card>
          )}
        />
      )}
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  topDivider: {
    height: 2,
    backgroundColor: theme.colors.brand,
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
  errorText: {
    ...theme.typography.body,
    color: theme.colors.textSecondary,
    marginTop: theme.spacing.md,
    marginBottom: theme.spacing.lg,
    textAlign: 'center',
  },
  retryButton: {
    backgroundColor: theme.colors.brand,
    paddingHorizontal: theme.spacing.xl,
    paddingVertical: theme.spacing.md,
    borderRadius: theme.borderRadius.md,
    ...theme.shadows.small,
  },
  retryButtonText: {
    ...theme.typography.bodyBold,
    color: theme.colors.background,
  },
  emptyText: {
    ...theme.typography.body,
    color: theme.colors.textMuted,
    marginTop: theme.spacing.md,
    textAlign: 'center',
  },
  emptyListContent: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  pageHeader: {
    paddingHorizontal: theme.spacing.lg,
    paddingTop: theme.spacing.md,
    paddingBottom: theme.spacing.md,
  },
  overline: {
    ...theme.typography.label,
    color: theme.colors.accentDark,
    marginBottom: theme.spacing.xs,
  },
  pageTitle: {
    ...theme.typography.display,
    color: theme.colors.primary,
    marginBottom: theme.spacing.sm,
  },
  pageSubtitle: {
    ...theme.typography.body,
    color: theme.colors.textSecondary,
    marginBottom: theme.spacing.lg,
  },
  segment: {
    flexDirection: 'row',
    backgroundColor: theme.colors.surfaceLight,
    borderRadius: theme.borderRadius.full,
    padding: 4,
    gap: 4,
  },
  segmentTab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: theme.spacing.sm + 2,
    borderRadius: theme.borderRadius.full,
  },
  segmentTabActive: {
    backgroundColor: theme.colors.primary,
  },
  segmentText: {
    ...theme.typography.bodyBold,
    fontSize: 14,
    color: theme.colors.textSecondary,
  },
  segmentTextActive: {
    color: theme.colors.white,
  },
  listContent: {
    padding: theme.spacing.lg,
    paddingBottom: 140,
  },
  sectionHeadingRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    marginBottom: theme.spacing.md,
    marginTop: theme.spacing.xs,
  },
  sectionHeading: {
    ...theme.typography.heading,
    color: theme.colors.primary,
  },
  sectionMeta: {
    ...theme.typography.label,
    color: theme.colors.textMuted,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: theme.spacing.md,
  },
  badge: {
    paddingHorizontal: theme.spacing.sm + 2,
    paddingVertical: 4,
    borderRadius: theme.borderRadius.full,
    backgroundColor: theme.colors.surface,
  },
  badgeFeatured: {
    backgroundColor: theme.colors.accentLight,
  },
  badgeText: {
    ...theme.typography.label,
    fontSize: 10,
    letterSpacing: 1,
    color: theme.colors.textSecondary,
  },
  badgeTextFeatured: {
    color: theme.colors.accentDark,
  },
  date: {
    ...theme.typography.caption,
    color: theme.colors.textMuted,
  },
  title: {
    ...theme.typography.heading,
    color: theme.colors.primary,
    marginBottom: theme.spacing.sm,
  },
  summary: {
    ...theme.typography.body,
    color: theme.colors.textSecondary,
    marginBottom: theme.spacing.md,
  },
  readMoreRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  readMore: {
    ...theme.typography.label,
    color: theme.colors.accentDark,
  },
  linkCard: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  linkIconContainer: {
    width: 48,
    height: 48,
    borderRadius: theme.borderRadius.full,
    backgroundColor: theme.colors.surface,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: theme.spacing.md,
  },
  linkContent: {
    flex: 1,
  },
  linkTitle: {
    ...theme.typography.subheading,
    color: theme.colors.primary,
    marginBottom: theme.spacing.xs,
  },
  linkDescription: {
    ...theme.typography.caption,
    color: theme.colors.textSecondary,
    marginBottom: theme.spacing.xs,
  },
  externalIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  externalText: {
    ...theme.typography.label,
    color: theme.colors.textMuted,
    fontSize: 11,
  },
  linksFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: theme.spacing.xl,
    paddingHorizontal: theme.spacing.lg,
    marginTop: theme.spacing.lg,
    gap: theme.spacing.sm,
  },
  linksFooterText: {
    ...theme.typography.body,
    color: theme.colors.textSecondary,
    textAlign: 'center',
  },
});
