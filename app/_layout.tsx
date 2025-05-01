import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { useFonts } from 'expo-font';
import { Stack, useRouter, SplashScreen, usePathname } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useEffect, useState } from 'react';
import { View } from 'react-native';
import 'react-native-reanimated';
import { getAuth } from 'firebase/auth';

import { useColorScheme } from '@/hooks/useColorScheme';
import { observeAuthState } from '@/src/firebase/auth';
import app from '@/src/firebase/config';

SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const colorScheme = useColorScheme();
  const [loaded] = useFonts({
    SpaceMono: require('../assets/fonts/SpaceMono-Regular.ttf'),
  });
  const [isUserAuthenticated, setIsUserAuthenticated] = useState<boolean | null>(null);
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (loaded) {
      SplashScreen.hideAsync();
    }
  }, [loaded]);

  useEffect(() => {
    const auth = getAuth(app);
    const unsubscribe = observeAuthState((user) => {
      console.log('État d\'authentification :', user ? 'Connecté' : 'Déconnecté');
      
      if (user) {
        setIsUserAuthenticated(true);
        // Navigation vers la page d'accueil uniquement si nous ne sommes pas déjà sur une page des tabs
        if (!router.canGoBack() || pathname === '/signin' || pathname === '/signup') {
          router.replace('/(tabs)');
        }
      } else {
        setIsUserAuthenticated(false);
        // Seulement rediriger vers signin si nous ne sommes pas déjà sur signin ou signup
        if (pathname !== '/signin' && pathname !== '/signup') {
          router.replace('/signin');
        }
      }
      
      // Cacher l'écran de démarrage une fois la vérification terminée
      SplashScreen.hideAsync();
    });

    // Nettoyer l'observateur
    return () => unsubscribe();
  }, [router, pathname]);

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
