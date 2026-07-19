/**
 * Event Detail Screen
 *
 * Shows complete information for a selected event including
 * title, date/time, location, full description, and organizer.
 * Includes back button to return to events list.
 */

import { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert, ActivityIndicator, Platform } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import * as Calendar from 'expo-calendar';
import { theme } from '../../../theme';
import { fetchEventById, EventItemDB } from '../../../services/supabase';
import { parseLocalDate } from '../../../utils/date';

const CATEGORY_ICONS: Record<string, string> = {
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

export default function EventDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const [event, setEvent] = useState<EventItemDB | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadEvent();
  }, [id]);

  const loadEvent = async () => {
    if (!id) {
      setError('No event ID provided');
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);
      const data = await fetchEventById(id);
      setEvent(data);
    } catch (err) {
      console.error('Failed to load event:', err);
      setError('Failed to load event. Please try again later.');
    } finally {
      setLoading(false);
    }
  };

  const handleAddToCalendar = async () => {
    if (!event) return;

    // Show confirmation dialog first
      Alert.alert(
      'Add to Calendar',
      `Add "${event.title}" to your calendar?\n\nThis will create a calendar event with reminders 1 hour and 1 day before.`,
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
                  'Please enable calendar access to add this event to your calendar.'
                );
                return;
              }

              // Get all calendars
              const calendars = await Calendar.getCalendarsAsync(Calendar.EntityTypes.EVENT);
              
              // Try to get the default calendar for the device
              let defaultCalendar;
              
              if (Platform.OS === 'ios') {
                // On iOS, try to get the default calendar source first
                try {
                  defaultCalendar = await Calendar.getDefaultCalendarAsync();
                } catch (error) {
                  // If we can't get the default, we'll search manually below
                }
              }
              
              // If we didn't get a default calendar, find the best one
              if (!defaultCalendar) {
                defaultCalendar = 
                  // Try primary calendar first
                  calendars.find(cal => cal.isPrimary && cal.allowsModifications) ||
                  // Then local calendars
                  calendars.find(cal => 
                    cal.source.type === 'local' && 
                    cal.allowsModifications
                  ) ||
                  // Then any calendar that allows modifications
                  calendars.find(cal => cal.allowsModifications) ||
                  // Last resort: any calendar
                  calendars[0];
              }

              if (!defaultCalendar) {
                Alert.alert('Error', 'No calendar available to add the event.');
                return;
              }

              // Parse date
              const eventDate = parseLocalDate(event.date);
              if (!eventDate) {
                Alert.alert('Error', 'Unable to parse event date.');
                return;
              }
              const year = eventDate.getFullYear();
              const month = eventDate.getMonth() + 1;
              const day = eventDate.getDate();

              // Parse time - handle both single time and time ranges
              let timeStr = event.time;
              // If it's a range (e.g., "6:30 PM - 7:30 PM"), take the start time
              if (timeStr.includes(' - ')) {
                timeStr = timeStr.split(' - ')[0].trim();
              }
              
              // Parse time components
              const timeParts = timeStr.match(/(\d+):(\d+)\s*(AM|PM)/i);
              if (!timeParts) {
                Alert.alert('Error', 'Unable to parse event time format.');
                return;
              }
              
              const hours = parseInt(timeParts[1]);
              const minutes = parseInt(timeParts[2]);
              const period = timeParts[3].toUpperCase();
              
              // Convert to 24-hour format
              let hour24 = hours;
              if (period === 'PM' && hours !== 12) {
                hour24 = hours + 12;
              } else if (period === 'AM' && hours === 12) {
                hour24 = 0;
              }

              const startDate = new Date(year, month - 1, day, hour24, minutes, 0);
              const endDate = new Date(startDate.getTime() + 2 * 60 * 60 * 1000); // 2 hours duration

              // Create the event
              const eventId = await Calendar.createEventAsync(defaultCalendar.id, {
                title: event.title,
                startDate,
                endDate,
                location: `${event.location}, ${event.address}`,
                notes: event.description,
                timeZone: 'America/Halifax',
                alarms: [
                  { relativeOffset: -60 }, // 1 hour before
                  { relativeOffset: -1440 }, // 1 day before
                ],
              });

              Alert.alert(
                'Added to Calendar!',
                `"${event.title}" has been added to your ${defaultCalendar.title || 'calendar'} with reminders.`
              );
            } catch (error) {
              console.error('Failed to add to calendar:', error);
              Alert.alert('Error', `Failed to add event to calendar: ${error instanceof Error ? error.message : 'Unknown error'}`);
              }
            },
          },
        ]
      );
  };

  if (loading) {
    return (
      <View style={styles.container}>
        <View style={styles.topDivider} />
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={theme.colors.brand} />
          <Text style={styles.loadingText}>Loading event...</Text>
        </View>
      </View>
    );
  }

  if (error || !event) {
    return (
      <View style={styles.container}>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <Text style={styles.backButtonText}>← Back</Text>
        </TouchableOpacity>
        <View style={styles.errorContainer}>
          <MaterialCommunityIcons name="alert-circle" size={64} color={theme.colors.danger} />
          <Text style={styles.errorText}>{error || 'Event not found'}</Text>
        </View>
      </View>
    );
  }

  const formatDate = (dateString: string) => {
    const date = parseLocalDate(dateString);
    if (!date) return dateString;
    return date.toLocaleDateString('en-US', {
      weekday: 'long',
      month: 'long',
      day: 'numeric',
      year: 'numeric',
    });
  };

  return (
    <View style={styles.container}>
      <View style={styles.topDivider} />
      <ScrollView contentContainerStyle={styles.content}>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <Text style={styles.backButtonText}>← Back to Events</Text>
        </TouchableOpacity>

        <View style={styles.categoryBadge}>
          <MaterialCommunityIcons
            name={getCategoryIcon(event.category) as any}
            size={16}
            color={theme.colors.accent}
          />
          <Text style={styles.categoryText}>{event.category}</Text>
        </View>

      <Text style={styles.title}>{event.title}</Text>

      <TouchableOpacity
        style={styles.reminderButton}
        onPress={handleAddToCalendar}
        accessibilityRole="button"
        accessibilityLabel="Add to calendar"
      >
        <MaterialCommunityIcons
          name="calendar-plus"
          size={20}
          color={theme.colors.accent}
        />
        <Text style={styles.reminderButtonText}>
          Add to Calendar
        </Text>
      </TouchableOpacity>

      <View style={styles.infoSection}>
        <View style={styles.infoRow}>
          <View style={styles.iconCircle}>
            <MaterialCommunityIcons name="calendar" size={20} color={theme.colors.accent} />
          </View>
          <View style={styles.infoContent}>
            <Text style={styles.infoLabel}>Date</Text>
            <Text style={styles.infoValue}>{formatDate(event.date)}</Text>
          </View>
        </View>

        <View style={styles.infoRow}>
          <View style={styles.iconCircle}>
            <MaterialCommunityIcons name="clock-outline" size={20} color={theme.colors.accent} />
          </View>
          <View style={styles.infoContent}>
            <Text style={styles.infoLabel}>Time</Text>
            <Text style={styles.infoValue}>{event.time}</Text>
          </View>
        </View>

        <View style={styles.infoRow}>
          <View style={styles.iconCircle}>
            <MaterialCommunityIcons name="map-marker" size={20} color={theme.colors.accent} />
          </View>
          <View style={styles.infoContent}>
            <Text style={styles.infoLabel}>Location</Text>
            <Text style={styles.infoValue}>{event.location}</Text>
            <Text style={styles.address}>{event.address}</Text>
          </View>
        </View>

        <View style={styles.infoRow}>
          <View style={styles.iconCircle}>
            <MaterialCommunityIcons name="account" size={20} color={theme.colors.accent} />
          </View>
          <View style={styles.infoContent}>
            <Text style={styles.infoLabel}>Organizer</Text>
            <Text style={styles.infoValue}>{event.organizer}</Text>
          </View>
        </View>
      </View>

      <View style={styles.divider} />

      <View style={styles.descriptionSection}>
        <Text style={styles.sectionTitle}>About This Event</Text>
        <Text style={styles.description}>{event.description}</Text>
      </View>
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
  content: {
    padding: theme.spacing.lg,
    paddingBottom: 140,
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
  categoryBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    backgroundColor: theme.colors.surface,
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.sm,
    borderRadius: theme.borderRadius.xl,
    marginBottom: theme.spacing.md,
    gap: 6,
  },
  categoryIcon: {
    fontSize: 16,
  },
  categoryText: {
    fontSize: theme.typography.body.fontSize,
    color: theme.colors.textSecondary,
    fontWeight: '600',
  },
  title: {
    ...theme.typography.title,
    color: theme.colors.primary,
    marginBottom: theme.spacing.lg,
  },
  infoSection: {
    gap: theme.spacing.md,
    marginBottom: theme.spacing.lg,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: theme.spacing.md,
  },
  iconCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: theme.colors.surface,
    justifyContent: 'center',
    alignItems: 'center',
  },
  infoIcon: {
    fontSize: 18,
  },
  infoContent: {
    flex: 1,
    paddingTop: 2,
  },
  infoLabel: {
    ...theme.typography.caption,
    color: theme.colors.textMuted,
    marginBottom: 2,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  infoValue: {
    ...theme.typography.body,
    color: theme.colors.text,
  },
  address: {
    ...theme.typography.caption,
    color: theme.colors.textSecondary,
    marginTop: 2,
  },
  divider: {
    height: 1,
    backgroundColor: theme.colors.divider,
    marginVertical: theme.spacing.lg,
  },
  descriptionSection: {
    marginBottom: theme.spacing.xl,
  },
  sectionTitle: {
    ...theme.typography.heading,
    color: theme.colors.text,
    marginBottom: theme.spacing.md,
  },
  description: {
    ...theme.typography.body,
    color: theme.colors.text,
    lineHeight: theme.typography.body.lineHeight * 1.5,
  },
  reminderButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: theme.spacing.sm,
    backgroundColor: theme.colors.backgroundLight,
    paddingVertical: theme.spacing.md,
    paddingHorizontal: theme.spacing.lg,
    borderRadius: theme.borderRadius.full,
    borderWidth: 1,
    borderColor: theme.colors.accent,
    marginTop: theme.spacing.md,
    marginBottom: theme.spacing.lg,
  },
  reminderButtonText: {
    ...theme.typography.bodyBold,
    color: theme.colors.accentDark,
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
    alignItems: 'center',
    paddingVertical: theme.spacing.xl * 2,
    gap: theme.spacing.md,
  },
  errorText: {
    fontSize: theme.typography.body.fontSize,
    color: theme.colors.textSecondary,
    textAlign: 'center',
    marginTop: theme.spacing.md,
  },
});

