/**
 * Town Seal Component
 * 
 * Official Town of Amherst seal for use in headers and official contexts.
 * Displays the town seal as a clean, simple image.
 * Available in different sizes for various placements.
 */

import { Image, StyleSheet, View } from 'react-native';

interface TownSealProps {
  size?: 'small' | 'medium' | 'large';
}

export function TownSeal({ size = 'small' }: TownSealProps) {
  const dimensions = {
    small: 28,
    medium: 40,
    large: 60,
  };

  const sealSize = dimensions[size];

  return (
    <View pointerEvents="none" style={{ opacity: 1 }}>
      <Image 
        source={require('../assets/amherst-crest.jpg')} 
        style={[styles.seal, { width: sealSize, height: sealSize }]}
        resizeMode="contain"
      />
    </View>
  );
}

const styles = StyleSheet.create({
  seal: {
    // Clean, flat image with no effects
  },
});

