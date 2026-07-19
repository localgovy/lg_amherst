/**
 * School Updates Screen
 * 
 * Displays school announcements and Snow Day Calculator.
 * Features two tabs: Announcements and Snow Day Calculator with LocalGovy Snow Score.
 */

import { View, Text, StyleSheet, FlatList, TouchableOpacity, ScrollView, ActivityIndicator, RefreshControl, Alert, Linking, Animated, TextInput, Platform } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useState, useEffect, useRef } from 'react';
import { MaterialCommunityIcons, Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import * as Calendar from 'expo-calendar';
import { Card } from '../../../components/Card';
import { theme } from '../../../theme';
import { snowDayScore } from '../../../data';
import { BusinessModal } from '../../../components/BusinessModal';
import type { Business } from '../../../data';
import { fetchSchoolAnnouncements, SchoolAnnouncementDB, fetchBusinesses } from '../../../services/supabase';
import { parseLocalDate } from '../../../utils/date';

type TabType = 'announcements' | 'snowDay';

const HEADER_MAX_HEIGHT = 120;
const HEADER_MIN_HEIGHT = 0;
const HEADER_SCROLL_DISTANCE = HEADER_MAX_HEIGHT - HEADER_MIN_HEIGHT;

export default function SchoolScreen() {
  const [selectedTab, setSelectedTab] = useState<TabType>('announcements');
  const [selectedBusiness, setSelectedBusiness] = useState<Business | null>(null);
  const [showBusinessModal, setShowBusinessModal] = useState(false);
  const [announcements, setAnnouncements] = useState<SchoolAnnouncementDB[]>([]);
  const [businesses, setBusinesses] = useState<Business[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const router = useRouter();
  
  const scrollY = useRef(new Animated.Value(0)).current;

  // Get the sponsor business (Lawtons Home Health Care)
  const sponsorBusiness = businesses.find(b => b.name === 'Lawtons Home Health Care');

  // Fetch announcements from Supabase
  const loadAnnouncements = async () => {
    try {
      setError(null);
      const data = await fetchSchoolAnnouncements();
      setAnnouncements(data);
    } catch (err) {
      console.error('Failed to load school announcements:', err);
      setError('Unable to load announcements. Please check your connection and try again.');
    } finally {
      setLoading(false);
    }
  };

  // Fetch businesses from Supabase
  const loadBusinesses = async () => {
    try {
      const data = await fetchBusinesses();
      
      // Transform to match local Business interface
      const transformed: Business[] = data.map(b => ({
        id: b.id,
        name: b.name,
        category: b.category,
        description: b.description,
        phone: b.phone,
        address: b.address,
        website: b.website || null,
        rating: b.rating || 0,
        reviewCount: b.review_count || 0,
      }));
      
      setBusinesses(transformed);
    } catch (err) {
      console.error('Failed to load businesses:', err);
    }
  };

  // Handle pull-to-refresh
  const onRefresh = async () => {
    setRefreshing(true);
    await Promise.all([loadAnnouncements(), loadBusinesses()]);
    setRefreshing(false);
  };

  useEffect(() => {
    loadAnnouncements();
    loadBusinesses();
  }, []);

  const formatDate = (dateString: string) => {
    const date = parseLocalDate(dateString);
    if (!date) return dateString;
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  };

  const handleSponsorClick = () => {
    if (!sponsorBusiness) return;
    
    setSelectedBusiness(sponsorBusiness);
    setShowBusinessModal(true);
  };

  const handleAddToCalendar = async (announcement: SchoolAnnouncementDB) => {
    // Show confirmation dialog first
      Alert.alert(
      'Add to Calendar',
      `Add "${announcement.title}" to your calendar?\n\nThis will create a calendar event with reminders.`,
        [
        {
          text: 'Cancel',
          style: 'cancel',
        },
          {
          text: 'Add',
            onPress: async () => {
            try {
              // Request calendar permissions
              const { status } = await Calendar.requestCalendarPermissionsAsync();
              
              if (status !== 'granted') {
                Alert.alert(
                  'Permission Required',
                  'Please enable calendar access to add this announcement to your calendar.'
                );
                return;
              }

              // Get all calendars
              const calendars = await Calendar.getCalendarsAsync(Calendar.EntityTypes.EVENT);
              
              // Try to get the default calendar for the device
              let defaultCalendar;
              
              if (Platform.OS === 'ios') {
                try {
                  defaultCalendar = await Calendar.getDefaultCalendarAsync();
                } catch (error) {
                  // If we can't get the default, we'll search manually below
                }
              }
              
              // If we didn't get a default calendar, find the best one
              if (!defaultCalendar) {
                defaultCalendar = 
                  calendars.find(cal => cal.isPrimary && cal.allowsModifications) ||
                  calendars.find(cal => 
                    cal.source.type === 'local' && 
                    cal.allowsModifications
                  ) ||
                  calendars.find(cal => cal.allowsModifications) ||
                  calendars[0];
              }

              if (!defaultCalendar) {
                Alert.alert('Error', 'No calendar available to add the announcement.');
                return;
              }

              // Parse date
              const announcementDate = parseLocalDate(announcement.date);
              if (!announcementDate) {
                Alert.alert('Error', 'Unable to parse announcement date.');
                return;
              }
              const year = announcementDate.getFullYear();
              const month = announcementDate.getMonth() + 1;
              const day = announcementDate.getDate();

              // Parse time if available, otherwise default to 9 AM
              let hour24 = 9;
              let minutes = 0;
              
              if (announcement.time) {
                const timeParts = announcement.time.match(/(\d+):(\d+)\s*(AM|PM)/i);
                if (timeParts) {
                  const hours = parseInt(timeParts[1]);
                  minutes = parseInt(timeParts[2]);
                  const period = timeParts[3].toUpperCase();
                  
                  hour24 = hours;
                  if (period === 'PM' && hours !== 12) {
                    hour24 = hours + 12;
                  } else if (period === 'AM' && hours === 12) {
                    hour24 = 0;
                  }
                }
              }

              const startDate = new Date(year, month - 1, day, hour24, minutes, 0);
              const endDate = new Date(startDate.getTime() + 60 * 60 * 1000); // 1 hour duration

              // Create the event
              await Calendar.createEventAsync(defaultCalendar.id, {
                title: announcement.title,
                startDate,
                endDate,
                location: announcement.school || announcement.board,
                notes: announcement.summary,
                timeZone: 'America/Halifax',
                alarms: [
                  { relativeOffset: -60 }, // 1 hour before
                  { relativeOffset: -1440 }, // 1 day before
                ],
              });

                Alert.alert(
                'Added to Calendar!',
                `"${announcement.title}" has been added to your ${defaultCalendar.title || 'calendar'} with reminders.`
                );
            } catch (error) {
              console.error('Failed to add to calendar:', error);
              Alert.alert('Error', `Failed to add announcement to calendar: ${error instanceof Error ? error.message : 'Unknown error'}`);
              }
            },
          },
        ]
      );
  };

  const handleViewInDirectory = (businessId: string) => {
    // Pushing the detail screen directly (rather than the directory list
    // first) means the back button naturally returns to School, matching
    // the intent of the returnTo=school handling in the detail screen.
    router.push(`/(tabs)/directory/${businessId}?returnTo=school`);
  };

  // Handle URL clicks with confirmation
  const handleUrlPress = (url: string) => {
    // Add https:// if URL doesn't have a protocol
    let fullUrl = url;
    if (!url.match(/^https?:\/\//i)) {
      fullUrl = 'https://' + url;
    }
    
    Alert.alert(
      'Open Link',
      `Do you want to open this link in your browser?\n\n${url}`,
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Open',
          onPress: async () => {
            try {
              const supported = await Linking.canOpenURL(fullUrl);
              if (supported) {
                await Linking.openURL(fullUrl);
              } else {
                Alert.alert('Error', 'Unable to open this URL');
              }
            } catch (error) {
              Alert.alert('Error', 'Failed to open URL');
            }
          },
        },
      ]
    );
  };

  // Parse text and render with clickable links
  const renderAnnouncementText = (text: string) => {
    // URL pattern matches full URLs, www URLs, and domain URLs
    const urlPattern = /(https?:\/\/[^\s]+|www\.[^\s]+|(?:[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?\.)+[a-zA-Z]{2,}(?:\/[^\s]*)?)/gi;
    
    const parts: Array<{ type: 'text' | 'url'; content: string }> = [];
    let lastIndex = 0;
    
    // Find all URLs
    const urlMatches = Array.from(text.matchAll(new RegExp(urlPattern)));
    
    // Build parts array with text and URLs
    urlMatches.forEach((match) => {
      const matchIndex = match.index || 0;
      
      // Add text before the match
      if (matchIndex > lastIndex) {
        parts.push({
          type: 'text',
          content: text.substring(lastIndex, matchIndex),
        });
      }
      
      // Add the URL
      parts.push({
        type: 'url',
        content: match[0],
      });
      
      lastIndex = matchIndex + match[0].length;
    });
    
    // Add remaining text
    if (lastIndex < text.length) {
      parts.push({
        type: 'text',
        content: text.substring(lastIndex),
      });
    }
    
    // If no matches found, return simple text
    if (parts.length === 0) {
      return (
        <Text style={styles.announcementSummary}>
          {text}
        </Text>
      );
    }
    
    // Render text with clickable links
    return (
      <Text style={styles.announcementSummary}>
        {parts.map((part, index) => {
          if (part.type === 'url') {
            return (
              <Text
                key={index}
                style={styles.linkText}
                onPress={() => handleUrlPress(part.content)}
              >
                {part.content}
              </Text>
            );
          } else {
            return <Text key={index}>{part.content}</Text>;
          }
        })}
      </Text>
    );
  };

  const getScoreColor = (score: number) => {
    if (score >= 8) return '#FF3B30';
    if (score >= 5) return '#FF9500';
    return '#34C759';
  };

  const getScoreLabel = (score: number) => {
    if (score >= 8) return 'High Chance';
    if (score >= 5) return 'Moderate Chance';
    return 'Low Chance';
  };

  const renderHeader = () => {
    const headerHeight = scrollY.interpolate({
      inputRange: [0, HEADER_SCROLL_DISTANCE],
      outputRange: [HEADER_MAX_HEIGHT, HEADER_MIN_HEIGHT],
      extrapolate: 'clamp',
    });

    const headerOpacity = scrollY.interpolate({
      inputRange: [0, HEADER_SCROLL_DISTANCE / 2, HEADER_SCROLL_DISTANCE],
      outputRange: [1, 0.5, 0],
      extrapolate: 'clamp',
    });

    return (
      <Animated.View 
        style={[
          styles.headerWrapper,
          {
            height: headerHeight,
            opacity: headerOpacity,
          },
        ]}
      >
    <View style={styles.header}>
      <View style={styles.headerTextContainer}>
        <Text style={styles.overline}>Town of Amherst</Text>
        <Text style={styles.headerTitle}>School Updates</Text>
        <Text style={styles.headerSubtitle}>Chignecto-Central Regional Centre for Education</Text>
      </View>
    </View>
      </Animated.View>
  );
  };

  const renderSearchBar = () => {
    return (
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
            placeholder="Search announcements..."
            placeholderTextColor={theme.colors.textMuted}
            value={searchQuery}
            onChangeText={setSearchQuery}
            returnKeyType="search"
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity onPress={() => setSearchQuery('')}>
              <MaterialCommunityIcons
                name="close-circle"
                size={20}
                color={theme.colors.textMuted}
                style={styles.clearIcon}
              />
            </TouchableOpacity>
          )}
        </View>
      </View>
    );
  };

  const renderTabs = () => (
    <View style={styles.tabContainer}>
      <TouchableOpacity
        style={[styles.tab, selectedTab === 'announcements' && styles.tabActive]}
        onPress={() => setSelectedTab('announcements')}
        accessibilityRole="tab"
        accessibilityState={{ selected: selectedTab === 'announcements' }}
      >
        <MaterialCommunityIcons
          name="bullhorn"
          size={20}
          color={selectedTab === 'announcements' ? theme.colors.white : theme.colors.lightText}
        />
        <Text 
          style={[styles.tabText, selectedTab === 'announcements' && styles.tabTextActive]}
          numberOfLines={1}
          adjustsFontSizeToFit
        >
          Announcements
        </Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={[styles.tab, selectedTab === 'snowDay' && styles.tabActive]}
        onPress={() => setSelectedTab('snowDay')}
        accessibilityRole="tab"
        accessibilityState={{ selected: selectedTab === 'snowDay' }}
      >
        <MaterialCommunityIcons
          name="snowflake"
          size={20}
          color={selectedTab === 'snowDay' ? theme.colors.white : theme.colors.lightText}
        />
        <Text 
          style={[styles.tabText, selectedTab === 'snowDay' && styles.tabTextActive]}
          numberOfLines={1}
        >
          Snow Day Calculator
        </Text>
      </TouchableOpacity>
    </View>
  );

  const renderAnnouncements = () => {
    if (loading) {
      return (
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color={theme.colors.brand} />
          <Text style={styles.loadingText}>Loading announcements...</Text>
        </View>
      );
    }

    if (error) {
      return (
        <View style={styles.centerContainer}>
          <MaterialCommunityIcons name="alert-circle" size={48} color={theme.colors.error} />
          <Text style={styles.errorText}>{error}</Text>
          <TouchableOpacity style={styles.retryButton} onPress={loadAnnouncements}>
            <Text style={styles.retryButtonText}>Try Again</Text>
          </TouchableOpacity>
        </View>
      );
    }

    // Filter announcements based on search query
    const filteredAnnouncements = announcements.filter((item) => {
      if (searchQuery === '') return true;
      
      const query = searchQuery.toLowerCase();
      return (
        (item.title ?? '').toLowerCase().includes(query) ||
        (item.summary ?? '').toLowerCase().includes(query) ||
        (item.board ?? '').toLowerCase().includes(query) ||
        (item.school ?? '').toLowerCase().includes(query)
      );
    });

    return (
      <Animated.FlatList
        data={filteredAnnouncements}
        contentContainerStyle={styles.listContent}
        keyExtractor={(item) => item.id}
        onScroll={Animated.event(
          [{ nativeEvent: { contentOffset: { y: scrollY } } }],
          { useNativeDriver: false }
        )}
        scrollEventThrottle={16}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={theme.colors.brand}
            colors={[theme.colors.brand]}
          />
        }
        renderItem={({ item }) => (
          <Card variant="elevated">
            <View style={styles.announcementCard}>
              <View style={styles.announcementHeader}>
                <View style={styles.dateBadge}>
                  <Ionicons name="calendar" size={14} color={theme.colors.brand} />
                  <Text style={styles.dateText}>{formatDate(item.date)}</Text>
                </View>
                {item.time && (
                  <View style={styles.timeBadge}>
                    <Ionicons name="time" size={14} color={theme.colors.accent} />
                    <Text style={styles.timeText}>{item.time}</Text>
                  </View>
                )}
              </View>
              
              <Text style={styles.announcementTitle}>{item.title}</Text>
              
              <View style={styles.announcementMeta}>
                <View style={styles.metaRow}>
                  <MaterialCommunityIcons name="school" size={16} color={theme.colors.textSecondary} />
                  <Text style={styles.metaText}>{item.board}</Text>
                </View>
                {item.school && (
                  <View style={styles.metaRow}>
                    <MaterialCommunityIcons name="map-marker" size={16} color={theme.colors.textSecondary} />
                    <Text style={styles.metaText}>{item.school}</Text>
                  </View>
                )}
              </View>
              
              {renderAnnouncementText(item.summary)}
              
              <TouchableOpacity
                style={styles.remindButton}
                onPress={() => handleAddToCalendar(item)}
                accessibilityRole="button"
                accessibilityLabel="Add to calendar"
              >
                <MaterialCommunityIcons
                  name="calendar-plus"
                  size={18}
                  color={theme.colors.brand}
                />
                <Text style={styles.remindButtonText}>
                  Add to Calendar
                </Text>
              </TouchableOpacity>
            </View>
          </Card>
        )}
        ListHeaderComponent={
          <View style={styles.sectionHeader}>
            <MaterialCommunityIcons name="bullhorn" size={20} color={theme.colors.brand} />
            <Text style={styles.sectionTitle}>Announcements</Text>
          </View>
        }
      />
    );
  };

  const renderSnowDayCalculator = () => {
    const scoreColor = getScoreColor(snowDayScore.score);
    const scoreLabel = getScoreLabel(snowDayScore.score);

    // Dynamically compute the start of the current week (Monday)
    const today = new Date();
    const dayOfWeek = today.getDay(); // 0 = Sunday
    const daysToMonday = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;
    const monday = new Date(today);
    monday.setDate(today.getDate() + daysToMonday);
    const currentWeekOf = monday.toISOString().split('T')[0];

    return (
      <Animated.ScrollView 
        contentContainerStyle={styles.scrollContent}
        onScroll={Animated.event(
          [{ nativeEvent: { contentOffset: { y: scrollY } } }],
          { useNativeDriver: false }
        )}
        scrollEventThrottle={16}
      >
        <View style={styles.sectionHeader}>
          <MaterialCommunityIcons name="snowflake" size={20} color={theme.colors.brand} />
          <Text style={styles.sectionTitle}>Snow Day Likelihood</Text>
        </View>

        <Card variant="elevated">
          <View style={styles.snowDayCard}>
            <Text style={styles.snowDayLabel}>LocalGovy Snow Score</Text>
            <View style={styles.scoreDisplay}>
              <MaterialCommunityIcons name="snowflake" size={48} color={scoreColor} />
              <Text style={[styles.scoreNumber, { color: scoreColor }]}>
                {snowDayScore.score}/10
              </Text>
            </View>
            <Text style={[styles.scoreLabel, { color: scoreColor }]}>{scoreLabel}</Text>
            <Text style={styles.weekOf}>Week of {formatDate(currentWeekOf)}</Text>
            
            <View style={styles.sponsorDivider} />
            
            <View style={styles.sponsorContainer}>
              <Text style={styles.sponsorText}>Brought to you by: </Text>
              <TouchableOpacity 
                onPress={handleSponsorClick}
                accessibilityRole="link"
                accessibilityLabel={`View ${sponsorBusiness?.name || 'sponsor'} details`}
              >
                <Text style={styles.sponsorLink}>
                  {sponsorBusiness?.name || 'Local Business'}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </Card>

        {sponsorBusiness && (
          <TouchableOpacity
            style={styles.sponsorSlideCard}
            onPress={handleSponsorClick}
            activeOpacity={0.8}
            accessibilityRole="button"
            accessibilityLabel={`View sponsor ${sponsorBusiness.name}`}
          >
            <View style={styles.sponsorCardContent}>
              <View style={styles.sponsorBadge}>
                <MaterialCommunityIcons name="star" size={12} color={theme.colors.accent} />
                <Text style={styles.sponsorBadgeText}>SPONSORED</Text>
              </View>
              <Text style={styles.sponsorBusinessName}>{sponsorBusiness.name}</Text>
              <Text style={styles.sponsorBusinessDescription} numberOfLines={2}>
                {sponsorBusiness.description}
              </Text>
              <View style={styles.sponsorFooter}>
                <MaterialCommunityIcons name="arrow-right" size={16} color={theme.colors.brand} />
                <Text style={styles.sponsorCTA}>Learn More</Text>
              </View>
            </View>
          </TouchableOpacity>
        )}

        <View style={styles.factorsContainer}>
          <Text style={styles.factorsTitle}>Weather Factors</Text>
          <Card variant="elevated">
            <View style={styles.factorsCard}>
              <View style={styles.factorRow}>
                <View style={styles.factorIcon}>
                  <MaterialCommunityIcons name="thermometer" size={20} color={theme.colors.brand} />
                </View>
                <View style={styles.factorInfo}>
                  <Text style={styles.factorLabel}>Temperature</Text>
                  <Text style={styles.factorValue}>{snowDayScore.factors.temperatureForecast}</Text>
                </View>
              </View>

              <View style={styles.factorDivider} />

              <View style={styles.factorRow}>
                <View style={styles.factorIcon}>
                  <MaterialCommunityIcons name="weather-rainy" size={20} color={theme.colors.brand} />
                </View>
                <View style={styles.factorInfo}>
                  <Text style={styles.factorLabel}>Precipitation Chance</Text>
                  <Text style={styles.factorValue}>{snowDayScore.factors.precipitationChance}</Text>
                </View>
              </View>

              <View style={styles.factorDivider} />

              <View style={styles.factorRow}>
                <View style={styles.factorIcon}>
                  <MaterialCommunityIcons name="weather-windy" size={20} color={theme.colors.brand} />
                </View>
                <View style={styles.factorInfo}>
                  <Text style={styles.factorLabel}>Wind Speed</Text>
                  <Text style={styles.factorValue}>{snowDayScore.factors.windSpeed}</Text>
                </View>
              </View>

              <View style={styles.factorDivider} />

              <View style={styles.factorRow}>
                <View style={styles.factorIcon}>
                  <MaterialCommunityIcons name="road" size={20} color={theme.colors.brand} />
                </View>
                <View style={styles.factorInfo}>
                  <Text style={styles.factorLabel}>Road Conditions</Text>
                  <Text style={styles.factorValue}>{snowDayScore.factors.roadConditions}</Text>
                </View>
              </View>
            </View>
          </Card>

          <Text style={styles.disclaimer}>
            * Snow Day Score is calculated based on weather forecasts and historical data.
            Check official school channels for confirmed closures.
          </Text>
        </View>
      </Animated.ScrollView>
    );
  };

  return (
    <View style={styles.container}>
    <LinearGradient
      colors={[theme.colors.backgroundLight, theme.colors.background]}
        style={styles.gradientContainer}
    >
      {renderHeader()}
        {renderSearchBar()}
        <View style={styles.tabsWrapper}>
      {renderTabs()}
        </View>
      {selectedTab === 'announcements' ? renderAnnouncements() : renderSnowDayCalculator()}
      </LinearGradient>
      
      <BusinessModal
        visible={showBusinessModal}
        business={selectedBusiness}
        onClose={() => setShowBusinessModal(false)}
        onViewInDirectory={handleViewInDirectory}
      />
    </View>
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
  gradientContainer: {
    flex: 1,
  },
  tabsWrapper: {
    // Wrapper for tabs to keep them visible
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: theme.spacing.xl,
  },
  loadingText: {
    marginTop: theme.spacing.md,
    fontSize: theme.typography.body.fontSize,
    color: theme.colors.textSecondary,
  },
  errorText: {
    marginTop: theme.spacing.md,
    fontSize: theme.typography.body.fontSize,
    color: theme.colors.textSecondary,
    textAlign: 'center',
  },
  retryButton: {
    marginTop: theme.spacing.lg,
    paddingHorizontal: theme.spacing.xl,
    paddingVertical: theme.spacing.md,
    backgroundColor: theme.colors.brand,
    borderRadius: theme.borderRadius.lg,
  },
  retryButtonText: {
    color: theme.colors.white,
    fontSize: theme.typography.body.fontSize,
    fontWeight: '600',
  },
  headerWrapper: {
    backgroundColor: 'transparent',
    overflow: 'hidden',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.md,
    paddingHorizontal: theme.spacing.lg,
    paddingTop: theme.spacing.md,
    paddingBottom: theme.spacing.md,
    backgroundColor: 'transparent',
  },
  searchSection: {
    backgroundColor: 'transparent',
    paddingHorizontal: theme.spacing.lg,
    paddingTop: theme.spacing.sm,
    paddingBottom: theme.spacing.md,
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
  headerIconContainer: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: theme.colors.brand,
    alignItems: 'center',
    justifyContent: 'center',
    ...theme.shadows.medium,
  },
  headerTextContainer: {
    flex: 1,
  },
  overline: {
    ...theme.typography.label,
    color: theme.colors.accentDark,
    marginBottom: theme.spacing.xs,
  },
  headerTitle: {
    ...theme.typography.title,
    color: theme.colors.primary,
    marginBottom: 4,
  },
  headerSubtitle: {
    ...theme.typography.caption,
    color: theme.colors.textSecondary,
  },
  tabContainer: {
    flexDirection: 'row',
    backgroundColor: 'transparent',
    paddingHorizontal: theme.spacing.lg,
    paddingVertical: theme.spacing.sm,
    gap: theme.spacing.md,
  },
  tab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderRadius: theme.borderRadius.lg,
    backgroundColor: theme.colors.white,
    borderWidth: 1,
    borderColor: theme.colors.lightGray,
    minHeight: 48,
  },
  tabActive: {
    backgroundColor: theme.colors.primary,
    borderColor: theme.colors.primary,
  },
  tabText: {
    fontSize: 13,
    fontWeight: '600',
    color: theme.colors.lightText,
    flex: 1,
  },
  tabTextActive: {
    color: theme.colors.white,
  },
  listContent: {
    padding: theme.spacing.lg,
    paddingBottom: 140,
    gap: theme.spacing.md,
  },
  scrollContent: {
    padding: theme.spacing.lg,
    paddingBottom: 140,
    gap: theme.spacing.md,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.sm,
    marginBottom: theme.spacing.sm,
  },
  sectionTitle: {
    ...theme.typography.heading,
    color: theme.colors.text,
  },
  announcementCard: {
    gap: theme.spacing.sm,
  },
  announcementHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.sm,
    flexWrap: 'wrap',
  },
  dateBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: theme.colors.highlightYellow,
    paddingHorizontal: theme.spacing.md,
    paddingVertical: 6,
    borderRadius: theme.borderRadius.md,
  },
  dateText: {
    fontSize: theme.typography.caption.fontSize,
    color: theme.colors.brand,
    fontWeight: '600',
  },
  timeBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: theme.colors.highlightYellow,
    paddingHorizontal: theme.spacing.md,
    paddingVertical: 6,
    borderRadius: theme.borderRadius.md,
  },
  timeText: {
    fontSize: theme.typography.caption.fontSize,
    color: theme.colors.accent,
    fontWeight: '600',
  },
  announcementTitle: {
    ...theme.typography.heading,
    color: theme.colors.text,
  },
  announcementMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.md,
    flexWrap: 'wrap',
    marginTop: theme.spacing.xs,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  metaText: {
    fontSize: theme.typography.caption.fontSize,
    color: theme.colors.textSecondary,
    fontWeight: '500',
  },
  announcementSummary: {
    ...theme.typography.body,
    color: theme.colors.textSecondary,
    lineHeight: theme.typography.body.lineHeight,
  },
  linkText: {
    color: theme.colors.brand,
    textDecorationLine: 'underline',
    fontWeight: '600',
  },
  remindButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: theme.spacing.xs,
    paddingVertical: theme.spacing.sm,
    paddingHorizontal: theme.spacing.md,
    borderRadius: theme.borderRadius.lg,
    borderWidth: 2,
    borderColor: theme.colors.brand,
    backgroundColor: 'transparent',
    marginTop: theme.spacing.sm,
  },
  remindButtonText: {
    fontSize: theme.typography.caption.fontSize,
    fontWeight: '600',
    color: theme.colors.brand,
  },
  snowDayCard: {
    alignItems: 'center',
    gap: theme.spacing.md,
    paddingVertical: theme.spacing.lg,
  },
  snowDayLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: theme.colors.textSecondary,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  scoreDisplay: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.md,
  },
  scoreNumber: {
    fontSize: 64,
    fontWeight: '700',
  },
  scoreLabel: {
    fontSize: 20,
    fontWeight: '700',
  },
  weekOf: {
    fontSize: theme.typography.caption.fontSize,
    color: theme.colors.textSecondary,
  },
  sponsorDivider: {
    width: '100%',
    height: 1,
    backgroundColor: theme.colors.divider,
    marginTop: theme.spacing.md,
  },
  sponsorContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    flexWrap: 'wrap',
    marginTop: theme.spacing.xs,
    paddingVertical: theme.spacing.sm,
    paddingHorizontal: theme.spacing.md,
  },
  sponsorText: {
    fontSize: theme.typography.caption.fontSize,
    color: theme.colors.textSecondary,
    fontStyle: 'italic',
  },
  sponsorLink: {
    fontSize: theme.typography.caption.fontSize,
    color: theme.colors.brand,
    fontWeight: '700',
    textDecorationLine: 'underline',
    fontStyle: 'italic',
  },
  sponsorSlideCard: {
    backgroundColor: theme.colors.white,
    borderRadius: theme.borderRadius.lg,
    marginTop: theme.spacing.md,
    borderWidth: 1,
    borderColor: theme.colors.lightGray,
    overflow: 'hidden',
    ...theme.shadows.medium,
  },
  sponsorCardContent: {
    padding: theme.spacing.lg,
    backgroundColor: theme.colors.surfaceElevated,
  },
  sponsorBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    backgroundColor: theme.colors.highlightYellow,
    paddingHorizontal: theme.spacing.sm,
    paddingVertical: 4,
    borderRadius: theme.borderRadius.sm,
    gap: 4,
    marginBottom: theme.spacing.sm,
  },
  sponsorBadgeText: {
    fontSize: 10,
    fontWeight: '700',
    color: theme.colors.accent,
    letterSpacing: 0.5,
  },
  sponsorBusinessName: {
    fontSize: theme.typography.heading.fontSize,
    fontWeight: '700',
    color: theme.colors.text,
    marginBottom: theme.spacing.xs,
  },
  sponsorBusinessDescription: {
    fontSize: theme.typography.body.fontSize,
    color: theme.colors.textSecondary,
    marginBottom: theme.spacing.md,
    lineHeight: theme.typography.body.lineHeight,
  },
  sponsorFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  sponsorCTA: {
    fontSize: theme.typography.caption.fontSize,
    fontWeight: '600',
    color: theme.colors.brand,
  },
  factorsContainer: {
    gap: theme.spacing.md,
  },
  factorsTitle: {
    ...theme.typography.heading,
    color: theme.colors.text,
    marginLeft: theme.spacing.xs,
  },
  factorsCard: {
    gap: 0,
  },
  factorRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.md,
    paddingVertical: theme.spacing.md,
  },
  factorIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: theme.colors.surfaceLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  factorInfo: {
    flex: 1,
    gap: 4,
  },
  factorLabel: {
    fontSize: theme.typography.caption.fontSize,
    color: theme.colors.textSecondary,
    fontWeight: '600',
  },
  factorValue: {
    fontSize: theme.typography.body.fontSize,
    color: theme.colors.text,
    fontWeight: '600',
  },
  factorDivider: {
    height: 1,
    backgroundColor: theme.colors.divider,
    marginHorizontal: theme.spacing.xs,
  },
  disclaimer: {
    fontSize: theme.typography.caption.fontSize,
    color: theme.colors.textMuted,
    fontStyle: 'italic',
    textAlign: 'center',
    paddingHorizontal: theme.spacing.md,
    lineHeight: 18,
  },
});

