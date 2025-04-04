import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { useFonts } from 'expo-font';
import { Stack, useRouter, SplashScreen } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useEffect, useState } from 'react';
import { View } from 'react-native';
import 'react-native-reanimated';

import { useColorScheme } from '@/hooks/useColorScheme';
import { observeAuthState } from '@/src/firebase/auth';

// Prevent the splash screen from auto-hiding before asset loading is complete.
SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const colorScheme = useColorScheme();
  const [loaded] = useFonts({
    SpaceMono: require('../assets/fonts/SpaceMono-Regular.ttf'),
  });
  const [isUserAuthenticated, setIsUserAuthenticated] = useState<boolean | null>(null);
  const router = useRouter();

  useEffect(() => {
    if (loaded) {
      SplashScreen.hideAsync();
    }
  }, [loaded]);

  useEffect(() => {
    // Observer les changements d'état d'authentification
    const unsubscribe = observeAuthState((user) => {
      if (user) {
        setIsUserAuthenticated(true);
        router.replace('/(tabs)');
      } else {
        setIsUserAuthenticated(false);
        router.replace('/signin');
      }
      
      // Cacher l'écran de démarrage une fois la vérification terminée
      SplashScreen.hideAsync();
    });

    // Nettoyer l'observateur
    return () => unsubscribe();
  }, []);

  if (!loaded || isUserAuthenticated === null) {
    return <View style={{ flex: 1 }} />;
  }

  return (
    <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
      <Stack>
        <Stack.Screen name="signup" options={{ headerShown: false }} />
        <Stack.Screen name="signin" options={{ headerShown: false }} />
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen name="+not-found" />
      </Stack>
      <StatusBar style="auto" />
    </ThemeProvider>
  );
}
