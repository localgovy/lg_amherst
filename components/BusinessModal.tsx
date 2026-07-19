/**
 * Business Modal Component
 * 
 * A sliding bottom sheet that displays business information
 * with options to call or view in directory.
 * Supports swipe-down gesture to dismiss.
 */

import { Modal, View, Text, StyleSheet, TouchableOpacity, ScrollView, Linking, Alert, PanResponder, Animated, Platform } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { theme } from '../theme';
import type { Business } from '../data';
import { formatCategory } from '../utils/formatCategory';
import { useRef, useEffect } from 'react';

interface BusinessModalProps {
  visible: boolean;
  business: Business | null;
  onClose: () => void;
  onViewInDirectory: (businessId: string) => void;
}

export function BusinessModal({ visible, business, onClose, onViewInDirectory }: BusinessModalProps) {
  // All hooks must be called before any conditional returns
  const translateY = useRef(new Animated.Value(500)).current; // Start off-screen at bottom
  
  // Animate modal sliding up when visible changes
  useEffect(() => {
    if (visible) {
      // Slide up
      Animated.spring(translateY, {
        toValue: 0,
        useNativeDriver: true,
        tension: 50,
        friction: 8,
      }).start();
    } else {
      // Reset position when hidden
      translateY.setValue(500);
    }
  }, [visible, translateY]);
  
  const panResponder = PanResponder.create({
    onStartShouldSetPanResponder: () => true,
    onMoveShouldSetPanResponder: (_, gestureState) => {
      // Respond to downward swipes
      return gestureState.dy > 5;
    },
    onPanResponderMove: (_, gestureState) => {
      // Only allow downward swipes
      if (gestureState.dy > 0) {
        translateY.setValue(gestureState.dy);
      }
    },
    onPanResponderRelease: (_, gestureState) => {
      // If swiped down more than 80px or with sufficient velocity, close the modal
      if (gestureState.dy > 80 || gestureState.vy > 0.5) {
        Animated.timing(translateY, {
          toValue: 500,
          duration: 200,
          useNativeDriver: true,
        }).start(() => {
          translateY.setValue(500);
          onClose();
        });
      } else {
        // Otherwise, spring back to original position
        Animated.spring(translateY, {
          toValue: 0,
          useNativeDriver: true,
          tension: 50,
          friction: 8,
        }).start();
      }
    },
  });

  const handleCall = () => {
    if (!business) return;
    Alert.alert(
      'Call',
      `Call ${business.name}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Call', 
          onPress: () => {
            Linking.openURL(`tel:${business.phone}`);
            onClose();
          }
        }
      ]
    );
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

  const handleViewDirectory = () => {
    if (!business) return;
    onClose();
    setTimeout(() => {
      onViewInDirectory(business.id);
    }, 300);
  };

  // Don't render if no business is selected
  if (!business) return null;

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <View style={styles.backdrop}>
        <TouchableOpacity 
          style={styles.backdropTouchable} 
          activeOpacity={1} 
          onPress={onClose}
        />
        <Animated.View 
          style={[
            styles.modalContainer,
            {
              transform: [{ translateY }],
            },
          ]}
        >
          <View style={styles.handleContainer} {...panResponder.panHandlers}>
            <View style={styles.handle} />
            <Text style={styles.swipeHint}>Swipe down to close</Text>
          </View>
          
          <View style={styles.contentWrapper}>
            <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
              {/* Header */}
              <View style={styles.header}>
                <View style={styles.categoryBadge}>
                  <Text style={styles.categoryText}>{formatCategory(business.category)}</Text>
                </View>
                <TouchableOpacity onPress={onClose} style={styles.closeButton}>
                  <MaterialCommunityIcons name="close" size={24} color={theme.colors.textSecondary} />
                </TouchableOpacity>
              </View>

              <Text style={styles.businessName}>{business.name}</Text>

              {/* LocalGovy Score */}
              <View style={styles.ratingSection}>
                <View style={styles.ratingBadge}>
                  <MaterialCommunityIcons name="star" size={24} color={theme.colors.highlightGold} />
                  <Text style={styles.ratingText}>
                    {typeof business.rating === 'number' ? business.rating.toFixed(1) : 'N/A'}
                  </Text>
                </View>
                <View style={styles.ratingInfo}>
                  <Text style={styles.ratingLabel}>LocalGovy Score</Text>
                  <Text style={styles.reviewCount}>({business.reviewCount ?? 0} reviews)</Text>
                </View>
              </View>

              <View style={styles.divider} />

              {/* Description */}
              <Text style={styles.description}>{business.description}</Text>

              <View style={styles.divider} />

              {/* Contact Info */}
              <View style={styles.infoSection}>
                <TouchableOpacity 
                  style={styles.infoRow}
                  onPress={handleCall}
                  accessibilityRole="button"
                  accessibilityLabel={`Call ${business.phone}`}
                >
                  <MaterialCommunityIcons name="phone" size={20} color={theme.colors.accent} />
                  <Text style={styles.infoText}>{business.phone}</Text>
                </TouchableOpacity>
                <TouchableOpacity 
                  style={styles.infoRow}
                  onPress={handleAddressPress}
                  accessibilityRole="button"
                  accessibilityLabel={`Open ${business.address} in maps`}
                >
                  <MaterialCommunityIcons name="map-marker" size={20} color={theme.colors.accent} />
                  <Text style={styles.infoText}>{business.address}</Text>
                </TouchableOpacity>
                {business.website && (
                  <TouchableOpacity 
                    style={styles.infoRow}
                    onPress={handleWebsitePress}
                    accessibilityRole="button"
                    accessibilityLabel={`Open ${business.website} in browser`}
                  >
                    <MaterialCommunityIcons name="web" size={20} color={theme.colors.accent} />
                    <Text style={styles.infoText} numberOfLines={1}>{business.website}</Text>
                  </TouchableOpacity>
                )}
              </View>

              {/* Action Buttons */}
              <View style={styles.actions}>
                <TouchableOpacity style={styles.callButton} onPress={handleCall}>
                  <MaterialCommunityIcons name="phone" size={20} color="#fff" />
                  <Text style={styles.callButtonText}>Call</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.directoryButton} onPress={handleViewDirectory}>
                  <MaterialCommunityIcons name="office-building" size={20} color="#fff" />
                  <Text style={styles.directoryButtonText}>View in Directory</Text>
                </TouchableOpacity>
              </View>
            </ScrollView>
          </View>
        </Animated.View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  backdropTouchable: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  modalContainer: {
    backgroundColor: theme.colors.backgroundLight,
    borderTopLeftRadius: theme.borderRadius.xl,
    borderTopRightRadius: theme.borderRadius.xl,
    height: '80%',
    ...theme.shadows.large,
  },
  handleContainer: {
    paddingVertical: theme.spacing.lg,
    paddingHorizontal: theme.spacing.xl,
    alignItems: 'center',
    paddingTop: theme.spacing.lg,
    paddingBottom: theme.spacing.md,
  },
  handle: {
    width: 50,
    height: 5,
    backgroundColor: theme.colors.textMuted,
    borderRadius: 3,
    opacity: 0.6,
    marginBottom: theme.spacing.xs,
  },
  swipeHint: {
    fontSize: 11,
    color: theme.colors.textMuted,
    opacity: 0.5,
  },
  contentWrapper: {
    flex: 1,
  },
  content: {
    paddingHorizontal: theme.spacing.lg,
    paddingBottom: theme.spacing.xl,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: theme.spacing.sm,
  },
  categoryBadge: {
    backgroundColor: theme.colors.surface,
    paddingHorizontal: theme.spacing.md,
    paddingVertical: 6,
    borderRadius: theme.borderRadius.full,
  },
  categoryText: {
    ...theme.typography.label,
    fontSize: 10,
    letterSpacing: 0.8,
    color: theme.colors.textSecondary,
  },
  closeButton: {
    padding: theme.spacing.xs,
  },
  businessName: {
    ...theme.typography.title,
    color: theme.colors.primary,
    marginBottom: theme.spacing.md,
  },
  ratingSection: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.md,
    backgroundColor: theme.colors.highlightYellow,
    padding: theme.spacing.md,
    borderRadius: theme.borderRadius.lg,
    borderWidth: 2,
    borderColor: theme.colors.highlightGold,
    marginBottom: theme.spacing.lg,
  },
  ratingBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.xs,
  },
  ratingText: {
    fontSize: 24,
    fontWeight: '700',
    color: theme.colors.text,
  },
  ratingInfo: {
    flex: 1,
  },
  ratingLabel: {
    fontSize: theme.typography.caption.fontSize,
    fontWeight: '600',
    color: theme.colors.accentDark,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 2,
  },
  reviewCount: {
    fontSize: theme.typography.caption.fontSize,
    color: theme.colors.textSecondary,
  },
  divider: {
    height: 1,
    backgroundColor: theme.colors.divider,
    marginVertical: theme.spacing.md,
  },
  description: {
    fontSize: theme.typography.body.fontSize,
    color: theme.colors.text,
    lineHeight: theme.typography.body.lineHeight * 1.5,
  },
  infoSection: {
    gap: theme.spacing.md,
    marginBottom: theme.spacing.lg,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.sm,
  },
  infoText: {
    fontSize: theme.typography.body.fontSize,
    color: theme.colors.accent,
    fontWeight: '600',
    flex: 1,
  },
  actions: {
    flexDirection: 'row',
    gap: theme.spacing.md,
    marginTop: theme.spacing.md,
    marginBottom: theme.spacing.xl,
  },
  callButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: theme.spacing.sm,
    backgroundColor: theme.colors.brand,
    paddingVertical: theme.spacing.md + 2,
    borderRadius: theme.borderRadius.lg,
    borderWidth: 2,
    borderColor: theme.colors.brand,
    ...theme.shadows.medium,
  },
  callButtonText: {
    fontSize: theme.typography.body.fontSize,
    fontWeight: '700',
    color: '#fff',
  },
  directoryButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: theme.spacing.sm,
    backgroundColor: theme.colors.brand,
    paddingVertical: theme.spacing.md + 2,
    paddingHorizontal: theme.spacing.sm,
    borderRadius: theme.borderRadius.lg,
    borderWidth: 2,
    borderColor: theme.colors.brand,
    ...theme.shadows.medium,
  },
  directoryButtonText: {
    fontSize: theme.typography.body.fontSize,
    fontWeight: '700',
    color: '#fff',
    textAlign: 'center',
  },
});

