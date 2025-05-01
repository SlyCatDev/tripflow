import { StyleSheet, Alert, ScrollView, TouchableOpacity} from 'react-native';
import { useRouter } from 'expo-router';

import { ThemedView } from '@/components/ThemedView';
import { ThemedText } from '@/components/ThemedText';
import { SignOut } from '@/src/firebase/auth';
import { AppStyles } from '@/constants/Colors';

export default function Settings() {
  const router = useRouter();

  const handleUserSignOut = () => {
    SignOut({
      router: router,
      redirectTo: '/signin',
      showConfirmation: true,
      onError: (error) => {
        Alert.alert("Erreur", "Problème lors de la déconnexion. Veuillez réessayer.");
      }
    });
  };

  return (
    <ThemedView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <ThemedText type="title" style={styles.title}>Paramètres</ThemedText>
        
        <ThemedView style={styles.section}>
          <ThemedText type="subtitle" style={styles.sectionTitle}>Compte</ThemedText>
          
          <TouchableOpacity 
            style={styles.settingsItem}
            onPress={() => Alert.alert("Info", "Fonctionnalité à venir")}
          >
            <ThemedText>Changer le mot de passe</ThemedText>
          </TouchableOpacity>
        </ThemedView>

        
        <ThemedView style={styles.section}>
          <ThemedText type="subtitle" style={styles.sectionTitle}>À propos</ThemedText>
          
          <TouchableOpacity 
            style={styles.settingsItem}
            onPress={() => Alert.alert("TripFlow", "Version 1.0.0")}
          >
            <ThemedText>Version de l'application</ThemedText>
          </TouchableOpacity>
        </ThemedView>
        
        <TouchableOpacity 
          style={styles.signOutButton}
          onPress={handleUserSignOut}
        >
          <ThemedText style={styles.signOutText}>Se déconnecter</ThemedText>
        </TouchableOpacity>
      </ScrollView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingTop: AppStyles.spacing.topPadding,
  },
  scrollContent: {
    padding: AppStyles.spacing.contentPadding,
  },
  title: {
    marginBottom: 30,
  },
  section: {
    marginBottom: 30,
  },
  sectionTitle: {
    marginBottom: 15,
  },
  settingsItem: {
    paddingVertical: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  signOutButton: {
    backgroundColor: '#ff3b30',
    padding: 15,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 20,
    marginBottom: 30,
  },
  signOutText: {
    color: 'white',
    fontWeight: 'bold',
  }
});