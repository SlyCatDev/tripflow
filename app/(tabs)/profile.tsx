import { StyleSheet, View, Image, TouchableOpacity, ScrollView } from 'react-native';
import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { IconSymbol } from '@/components/ui/IconSymbol';
import { useState, useEffect } from 'react';
import { auth, getCurrentUser, signOut } from '@/src/firebase/auth';
import { collection, getDocs, query, orderBy, limit, where, Timestamp, doc, getDoc } from 'firebase/firestore';
import { db } from '@/src/firebase/config';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { useRouter } from 'expo-router';

interface Trip {
  id: string;
  title: string;
  startDate: Timestamp;
  endDate: Timestamp;
  description?: string;
  coverImageUrl?: string;
}

interface UserProfile {
  userId: string;
  email: string;
  displayName: string;
  createdAt: number;
}

export default function Profile() {
  const router = useRouter();
  const [tripCount, setTripCount] = useState<number>(0);
  const [lastTrip, setLastTrip] = useState<Trip | null>(null);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  
  useEffect(() => {
    const fetchUserData = async () => {
      setLoading(true);
      const currentUser = getCurrentUser();
      
      if (!currentUser) {
        router.push('/signin');
        return;
      }
      
      try {
        // Récupération du profil utilisateur
        const userDocRef = doc(db, "users", currentUser.uid);
        const userDocSnap = await getDoc(userDocRef);
        
        if (userDocSnap.exists()) {
          setUserProfile(userDocSnap.data() as UserProfile);
        }
        
        // Comptage des voyages
        const tripsQuery = query(
          collection(db, "trips"), 
          where("userId", "==", currentUser.uid)
        );
        const tripsSnapshot = await getDocs(tripsQuery);
        setTripCount(tripsSnapshot.size);
        
        // Récupération du dernier voyage
        const latestTripQuery = query(
          collection(db, "trips"),
          where("userId", "==", currentUser.uid),
          orderBy("createdAt", "desc"),
          limit(1)
        );
        
        const latestTripSnapshot = await getDocs(latestTripQuery);
        if (!latestTripSnapshot.empty) {
          const tripData = latestTripSnapshot.docs[0].data();
          setLastTrip({
            id: latestTripSnapshot.docs[0].id,
            ...tripData as Omit<Trip, 'id'>
          });
        }
      } catch (error) {
        console.error("Erreur lors de la récupération des données:", error);
      } finally {
        setLoading(false);
      }
    };
    
    fetchUserData();
  }, [router]);
  
  // Fonction pour formater les dates Firestore
  const formatFirestoreDate = (timestamp: Timestamp | undefined): string => {
    if (!timestamp || typeof timestamp.toDate !== 'function') {
      return 'Date non disponible';
    }
    return format(timestamp.toDate(), 'dd MMMM yyyy', { locale: fr });
  };
  
  // Fonction pour formater la date de création du compte (timestamp en milliseconds)
  const formatCreationDate = (timestamp: number | undefined): string => {
    if (!timestamp) {
      return 'Date non disponible';
    }
    return format(new Date(timestamp), 'dd MMMM yyyy', { locale: fr });
  };
  
  // Fonction de déconnexion
  const handleSignOut = async () => {
    try {
      await signOut();
      router.push('/signin');
    } catch (error) {
      console.error("Erreur lors de la déconnexion:", error);
    }
  };
  
  // Navigation vers le dernier voyage
  const navigateToLastTrip = () => {
    if (lastTrip) {
      router.push(`/trip/${lastTrip.id}`);
    }
  };
  
  // Navigation vers la liste de voyages
  const navigateToTripList = () => {
    router.push('/');
  };

  if (loading) {
    return (
      <ThemedView style={styles.container}>
        <ThemedText>Chargement du profil...</ThemedText>
      </ThemedView>
    );
  }

  return (
    <ScrollView>
      <ThemedView style={styles.container}>
        {/* En-tête du profil */}
        <View style={styles.profileHeader}>
          <View style={styles.avatarContainer}>
            <Image 
              source={{ uri: 'https://ui-avatars.com/api/?name=' + (userProfile?.displayName || 'U') }} 
              style={styles.avatar} 
            />
          </View>
          
          <ThemedText type="title" style={styles.displayName}>
            {userProfile?.displayName || 'Utilisateur'}
          </ThemedText>
          
          <ThemedText style={styles.email}>
            {userProfile?.email || 'Email non disponible'}
          </ThemedText>
        </View>
        
        {/* Statistiques */}
        <ThemedView style={styles.statsContainer}>
          <View style={styles.statsItem}>
            <IconSymbol name="airplane" size={24} color="#0a7ea4" />
            <ThemedText style={styles.statsValue}>{tripCount}</ThemedText>
            <ThemedText style={styles.statsLabel}>Voyages</ThemedText>
          </View>
          
          <View style={styles.divider} />
          
          <View style={styles.statsItem}>
            <IconSymbol name="calendar" size={24} color="#0a7ea4" />
            <ThemedText style={styles.statsValue}>
              {userProfile?.createdAt ? formatCreationDate(userProfile.createdAt).split(' ')[2] : '---'}
            </ThemedText>
            <ThemedText style={styles.statsLabel}>Membre depuis</ThemedText>
          </View>
        </ThemedView>
        
        {/* Informations du compte */}
        <ThemedView style={styles.sectionContainer}>
          <ThemedText type="subtitle">Informations du compte</ThemedText>
          
          <View style={styles.infoItem}>
            <ThemedText style={styles.infoLabel}>Date d'inscription</ThemedText>
            <ThemedText style={styles.infoValue}>
              {userProfile?.createdAt ? formatCreationDate(userProfile.createdAt) : 'Non disponible'}
            </ThemedText>
          </View>
        </ThemedView>
        
        {/* Dernier voyage */}
        <ThemedView style={styles.sectionContainer}>
          <ThemedText type="subtitle">Dernier voyage</ThemedText>
          
          {lastTrip ? (
            <TouchableOpacity onPress={navigateToLastTrip} style={styles.tripCard}>
              {lastTrip.coverImageUrl && (
                <View style={styles.tripImageContainer}>
                  <Image 
                    source={{ uri: lastTrip.coverImageUrl }} 
                    style={styles.tripImage} 
                    resizeMode="cover"
                  />
                </View>
              )}
              
              <View style={styles.tripInfo}>
                <ThemedText style={styles.tripTitle}>{lastTrip.title}</ThemedText>
                <ThemedText style={styles.tripDates}>
                  {formatFirestoreDate(lastTrip.startDate)} - {formatFirestoreDate(lastTrip.endDate)}
                </ThemedText>
              </View>
            </TouchableOpacity>
          ) : (
            <View style={styles.emptyState}>
              <IconSymbol name="paperplane" size={40} color="#ccc" />
              <ThemedText style={styles.emptyMessage}>
                Vous n'avez pas encore créé de voyage
              </ThemedText>
              <TouchableOpacity 
                onPress={navigateToTripList} 
                style={styles.actionButton}
              >
                <ThemedText style={styles.buttonText}>Créer un voyage</ThemedText>
              </TouchableOpacity>
            </View>
          )}
        </ThemedView>
        
        {/* Bouton de déconnexion */}
        <TouchableOpacity 
          onPress={handleSignOut} 
          style={[styles.actionButton, styles.signOutButton]}
        >
          <ThemedText style={styles.buttonText}>Se déconnecter</ThemedText>
        </TouchableOpacity>
      </ThemedView>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
    backgroundColor: '#f5f5f5',
  },
  profileHeader: {
    alignItems: 'center',
    marginBottom: 24,
    paddingVertical: 16,
  },
  avatarContainer: {
    marginBottom: 12,
  },
  avatar: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: '#e1e1e1',
  },
  displayName: {
    marginTop: 8,
    fontSize: 24,
    fontWeight: '600',
  },
  email: {
    marginTop: 4,
    color: '#666',
  },
  statsContainer: {
    flexDirection: 'row',
    borderRadius: 12,
    padding: 16,
    marginBottom: 24,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  statsItem: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  statsValue: {
    fontSize: 20,
    fontWeight: 'bold',
    marginTop: 8,
    color: '#0a7ea4',
  },
  statsLabel: {
    color: '#666',
    marginTop: 4,
  },
  divider: {
    width: 1,
    backgroundColor: '#e0e0e0',
  },
  sectionContainer: {
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  infoItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  infoLabel: {
    color: '#666',
  },
  infoValue: {
    fontWeight: '500',
  },
  tripCard: {
    marginTop: 12,
    borderRadius: 8,
    overflow: 'hidden',
    backgroundColor: '#fff',
  },
  tripImageContainer: {
    height: 120,
    overflow: 'hidden',
  },
  tripImage: {
    width: '100%',
    height: '100%',
  },
  tripInfo: {
    padding: 12,
  },
  tripTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  tripDates: {
    color: '#666',
    fontSize: 14,
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  emptyMessage: {
    color: '#666',
    marginTop: 12,
    marginBottom: 16,
    textAlign: 'center',
  },
  actionButton: {
    backgroundColor: '#0a7ea4',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 8,
    alignItems: 'center',
  },
  signOutButton: {
    backgroundColor: '#ff3b30',
    marginTop: 8,
  },
  buttonText: {
    color: '#fff',
    fontWeight: '600',
  },
});
