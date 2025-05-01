import { Image, StyleSheet, Platform } from 'react-native';
import { useState, useEffect } from 'react';

import { HelloWave } from '@/components/HelloWave';
import ParallaxScrollView from '@/components/ParallaxScrollView';
import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { getCurrentUser } from '@/src/firebase/auth';

export default function HomeScreen() {
  const [displayName, setDisplayName] = useState<string>('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const currentUser = getCurrentUser();
    
    if (currentUser) {
      setDisplayName(
        currentUser.displayName || 
        (currentUser.email ? currentUser.email.split('@')[0] : 'utilisateur')
      );
    }
    
    setLoading(false);
  }, []);

  if (loading) {
    return (
      <ThemedView style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <ThemedText>Veuillez patienter</ThemedText>
      </ThemedView>
    );
  }

  return (
    <ParallaxScrollView
      headerBackgroundColor={{ light: '#A1CEDC', dark: '#1D3D47' }}
      headerImage={
        <Image
          source={require('@/assets/images/background-image.png')}
          style={styles.ImageBackgroundBase}
        />
      }>
      <ThemedView style={styles.titleContainer}>
        <ThemedText type="title">Bonjour {displayName}</ThemedText>
        <HelloWave />
      </ThemedView>
    </ParallaxScrollView>
  );
}

const styles = StyleSheet.create({
  titleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  ImageBackgroundBase: {
    height: Platform.select({ ios: 300, android: 300, default: 300 }),
    width: '100%',
  },
});
