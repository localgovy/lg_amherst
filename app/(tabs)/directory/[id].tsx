/**
 * Business Detail Screen
 * 
 * Shows complete information for a selected business including
 * LocalGovy Score, contact info, website, and clickable address.
 */

import { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, Linking, TouchableOpacity, Alert, Platform, ActivityIndicator } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { fetchBusinessById, BusinessDB } from '../../../services/supabase';
import { formatCategory } from '../../../utils/formatCategory';
import { theme } from '../../../theme';

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

export default function BusinessDetailScreen() {
  const { id, returnTo } = useLocalSearchParams<{ id: string; returnTo?: string }>();
  const router = useRouter();
  const [business, setBusiness] = useState<Business | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadBusiness = async () => {
      try {
        const data = await fetchBusinessById(id);
        if (data) {
          setBusiness({
            id: data.id,
            name: data.name,
            category: data.category,
            description: data.description,
            phone: data.phone,
            address: data.address,
            website: data.website || null,
            rating: data.rating,
            reviewCount: data.review_count,
          });
        }
      } catch (error) {
        console.error('Failed to load business:', error);
      } finally {
        setLoading(false);
      }
    };

    loadBusiness();
  }, [id]);

  const handleBack = () => {
    if (returnTo === 'school') {
      // Replace with school tab (removes business detail from stack)
      router.replace('/(tabs)/school');
    } else {
      // Default back navigation
      router.back();
    }
  };

  const handleCall = () => {
    Linking.openURL(`tel:${business!.phone}`);
  };

  const handleWebsitePress = () => {
    if (!business || !business.website) return;
    Alert.alert(
      'Open Website',
      `Would you like to open this website in your browser?\n\n${business.website}`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Open Website',
          onPress: async () => {
            try {
              const url = business.website!.startsWith('http') 
                ? business.website! 
                : `https://${business.website}`;
              const canOpen = await Linking.canOpenURL(url);
              if (canOpen) {
                await Linking.openURL(url);
              } else {
                Alert.alert('Error', 'Unable to open this website');
              }
            } catch (error) {
              Alert.alert('Error', 'Unable to open this website');
            }
          },
        },
      ]
    );
  };

  const handleAddressPress = () => {
    if (!business) return;
    Alert.alert(
      'Open in Maps',
      `Would you like to open this address in your default maps app?\n\n${business.address}`,
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Open Maps',
          onPress: async () => {
            try {
              const encodedAddress = encodeURIComponent(business.address);
              const mapsUrl = Platform.OS === 'ios'
                ? `maps://maps.apple.com/?q=${encodedAddress}`
                : `geo:0,0?q=${encodedAddress}`;
              
              const canOpen = await Linking.canOpenURL(mapsUrl);
              if (canOpen) {
                await Linking.openURL(mapsUrl);
              } else {
                Alert.alert('Error', 'Unable to open maps');
              }
            } catch (error) {
              Alert.alert('Error', 'Unable to open maps');
            }
          },
        },
      ]
    );
  };

  if (loading) {
    return (
      <View style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={theme.colors.brand} />
          <Text style={styles.loadingText}>Loading business details...</Text>
        </View>
      </View>
    );
  }

  if (!business) {
    return (
      <View style={styles.container}>
        <TouchableOpacity style={styles.backButton} onPress={handleBack}>
          <Text style={styles.backButtonText}>← Back</Text>
        </TouchableOpacity>
        <Text style={styles.errorText}>Business not found</Text>
      </View>
    );
  }

  const formattedCategory = formatCategory(business.category);

  return (
    <View style={styles.container}>
      <View style={styles.topDivider} />
      <ScrollView contentContainerStyle={styles.content}>
        <TouchableOpacity style={styles.backButton} onPress={handleBack}>
          <Text style={styles.backButtonText}>
            ← Back to {returnTo === 'school' ? 'School Updates' : 'Directory'}
          </Text>
        </TouchableOpacity>
        
        <View style={styles.headerSection}>
          <View style={styles.categoryBadge}>
            <Text style={styles.categoryText}>{formattedCategory}</Text>
          </View>
          
          <Text style={styles.name}>{business.name}</Text>
        </View>
        
        <View style={styles.headerDivider} />
        
        <View style={styles.detailsContainer}>
          <View style={styles.section}>
            <Text style={styles.sectionLabel}>LocalGovy Score</Text>
            <View style={styles.ratingDisplay}>
              <View style={styles.ratingBadgeLarge}>
                <MaterialCommunityIcons name="star" size={32} color={theme.colors.highlightGold} />
                <Text style={styles.ratingTextLarge}>
                  {business.rating != null ? business.rating.toFixed(1) : 'N/A'}
                </Text>
              </View>
              <View style={styles.ratingInfo}>
                <Text style={styles.ratingOutOf}>out of 5.0</Text>
                <Text style={styles.reviewCount}>
                  Based on {business.reviewCount != null ? business.reviewCount : 0} reviews
                </Text>
              </View>
            </View>
          </View>

          <View style={styles.sectionDivider} />

          <View style={styles.section}>
            <Text style={styles.sectionLabel}>About</Text>
            <Text style={styles.description}>{business.description}</Text>
          </View>

          <View style={styles.sectionDivider} />

          <View style={styles.section}>
            <Text style={styles.sectionLabel}>Contact</Text>
            <TouchableOpacity 
              style={styles.contactRow}
              onPress={handleCall} 
              accessibilityRole="button" 
              accessibilityLabel={`Call ${business.phone}`}
            >
              <MaterialCommunityIcons name="phone" size={18} color={theme.colors.accent} />
              <Text style={styles.phone}>{business.phone}</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.sectionDivider} />

          <View style={styles.section}>
            <Text style={styles.sectionLabel}>Address</Text>
            <TouchableOpacity 
              style={styles.contactRow}
              onPress={handleAddressPress} 
              accessibilityRole="button" 
              accessibilityLabel={`Open ${business.address} in maps`}
            >
              <MaterialCommunityIcons name="map-marker" size={18} color={theme.colors.accent} />
              <Text style={styles.address}>{business.address}</Text>
            </TouchableOpacity>
          </View>

          {business.website && (
            <>
              <View style={styles.sectionDivider} />

              <View style={styles.section}>
                <Text style={styles.sectionLabel}>Website</Text>
                <TouchableOpacity 
                  style={styles.contactRow}
                  onPress={handleWebsitePress} 
                  accessibilityRole="button" 
                  accessibilityLabel={`Open ${business.website} in browser`}
                >
                  <MaterialCommunityIcons name="web" size={18} color={theme.colors.accent} />
                  <Text style={styles.website} numberOfLines={1}>{business.website}</Text>
                </TouchableOpacity>
              </View>
            </>
          )}
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
  headerSection: {
    paddingBottom: theme.spacing.md,
  },
  categoryBadge: {
    alignSelf: 'flex-start',
    backgroundColor: theme.colors.surface,
    paddingHorizontal: theme.spacing.md,
    paddingVertical: 6,
    borderRadius: theme.borderRadius.full,
    marginBottom: theme.spacing.md,
  },
  categoryText: {
    ...theme.typography.label,
    fontSize: 10,
    letterSpacing: 0.8,
    color: theme.colors.textSecondary,
  },
  name: {
    ...theme.typography.title,
    color: theme.colors.primary,
  },
  headerDivider: {
    height: 1,
    backgroundColor: theme.colors.divider,
    marginTop: theme.spacing.md,
    marginBottom: theme.spacing.lg,
  },
  detailsContainer: {
    borderWidth: 1,
    borderColor: theme.colors.borderLight,
    borderRadius: theme.borderRadius.lg,
    padding: theme.spacing.lg,
    backgroundColor: theme.colors.surfaceElevated,
    ...theme.shadows.small,
  },
  section: {
    paddingVertical: theme.spacing.sm,
  },
  sectionDivider: {
    height: 1,
    backgroundColor: theme.colors.divider,
    marginVertical: theme.spacing.sm,
  },
  sectionLabel: {
    ...theme.typography.label,
    color: theme.colors.accentDark,
    marginBottom: theme.spacing.sm,
  },
  description: {
    fontSize: theme.typography.body.fontSize,
    color: theme.colors.text,
    lineHeight: theme.typography.body.lineHeight,
  },
  contactRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.sm,
  },
  phone: {
    fontSize: theme.typography.body.fontSize,
    color: theme.colors.accent,
    fontWeight: '600',
  },
  address: {
    fontSize: theme.typography.body.fontSize,
    color: theme.colors.accent,
    fontWeight: '600',
  },
  website: {
    fontSize: theme.typography.body.fontSize,
    color: theme.colors.accent,
    fontWeight: '600',
    flex: 1,
  },
  ratingDisplay: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.md,
    backgroundColor: theme.colors.highlightYellow,
    padding: theme.spacing.md,
    borderRadius: theme.borderRadius.lg,
    borderWidth: 2,
    borderColor: theme.colors.highlightGold,
  },
  ratingBadgeLarge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.xs,
  },
  ratingTextLarge: {
    fontSize: 36,
    fontWeight: '700',
    color: theme.colors.text,
  },
  ratingInfo: {
    flex: 1,
    gap: 4,
  },
  ratingOutOf: {
    fontSize: theme.typography.body.fontSize,
    color: theme.colors.textSecondary,
    fontWeight: '600',
  },
  reviewCount: {
    fontSize: theme.typography.caption.fontSize,
    color: theme.colors.textSecondary,
  },
  errorText: {
    fontSize: theme.typography.body.fontSize,
    color: theme.colors.textSecondary,
    textAlign: 'center',
    marginTop: theme.spacing.xl,
  },
});
