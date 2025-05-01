import { StyleSheet, ScrollView, View, TouchableOpacity, Alert, Image } from 'react-native';
import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { IconSymbol } from '@/components/ui/IconSymbol';
import TripForm from '@/components/TripForm';
import { useState, useEffect } from 'react';
import { collection, getDocs, query, orderBy, Timestamp, deleteDoc, doc } from 'firebase/firestore';
import { db } from '@/src/firebase/config';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { useRouter } from 'expo-router';
import { AppStyles } from '@/constants/Colors';

interface Trip {
  id: string;
  title: string;
  startDate: Timestamp;
  endDate: Timestamp;
  description?: string;
  coverImageUrl?: string;
}

export default function TravelList() {
  const router = useRouter();
  const [showForm, setShowForm] = useState(false);
  const [trips, setTrips] = useState<Trip[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchTrips = async () => {
    setLoading(true);
    try {
      const q = query(collection(db, "trips"), orderBy("createdAt", "desc"));
      const querySnapshot = await getDocs(q);
      
      const tripsList: Trip[] = [];
      querySnapshot.forEach((doc) => {
        tripsList.push({
          id: doc.id,
          ...doc.data() as Omit<Trip, 'id'>
        });
      });
      
      setTrips(tripsList);
    } catch (error) {
      console.error("Erreur lors de la récupération des voyages:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTrips();
  }, []);

  const handleAddTripSuccess = () => {
    setShowForm(false);
    fetchTrips();
  };

  // Fonction pour formater les dates Firestore
  const formatFirestoreDate = (timestamp: Timestamp): string => {
    if (!timestamp || typeof timestamp.toDate !== 'function') {
      return 'Date non disponible';
    }
    return format(timestamp.toDate(), 'dd MMMM yyyy', { locale: fr });
  };

  // Fonction pour supprimer un voyage
  const handleDeleteTrip = (tripId: string) => {
    Alert.alert(
      "Supprimer ce voyage",
      "Êtes-vous sûr de vouloir supprimer ce voyage ? Cette action est irréversible.",
      [
        {
          text: "Annuler",
          style: "cancel"
        },
        {
          text: "Supprimer",
          style: "destructive",
          onPress: async () => {
            try {
              // Met à jour l'état localement
              setTrips(prevTrips => prevTrips.filter(trip => trip.id !== tripId));
              
              // Ensuite supprimer dans Firestore
              await deleteDoc(doc(db, "trips", tripId));
            } catch (error) {
              console.error("Erreur lors de la suppression:", error);
              Alert.alert("Erreur", "Impossible de supprimer ce voyage");
              // En cas d'erreur, recharger toute la liste
              fetchTrips();
            }
          }
        }
      ]
    );
  };
  
  // Fonction de navigation vers les détails d'un voyage
  const navigateToTripDetail = (tripId: string) => {
    router.push(`/trip/${tripId}`);
  };

  return (
    <ScrollView>
      <ThemedView style={styles.container}>
        <View style={styles.header}>
          <ThemedText type="title">Mes Voyages</ThemedText>
          <TouchableOpacity 
            style={styles.addButton}
            onPress={() => setShowForm(!showForm)}
          >
            <IconSymbol 
              name={showForm ? "minus.circle.fill" : "plus.circle.fill"} 
              size={28} 
              color="#0a7ea4" 
            />
          </TouchableOpacity>
        </View>

        {showForm && (
          <TripForm onSuccess={handleAddTripSuccess} />
        )}

        {loading ? (
          <ThemedText style={styles.message}>Chargement des voyages...</ThemedText>
        ) : trips.length > 0 ? (
          trips.map((trip) => (
            <ThemedView key={trip.id} style={styles.tripCard}>
              <TouchableOpacity 
                style={styles.tripContent}
                onPress={() => navigateToTripDetail(trip.id)}
              >
                {trip.coverImageUrl && (
                  <View style={styles.coverImageContainer}>
                    <Image 
                      source={{ uri: trip.coverImageUrl }} 
                      style={styles.coverImage} 
                      resizeMode="cover"
                    />
                  </View>
                )}
                <View style={styles.tripHeader}>
                  <ThemedText type="subtitle">{trip.title}</ThemedText>
                  <TouchableOpacity 
                    onPress={(e) => {
                      e.stopPropagation();
                      handleDeleteTrip(trip.id);
                    }}
                    style={styles.deleteButton}
                  >
                    <IconSymbol name="trash" size={20} color="#ff3b30" />
                  </TouchableOpacity>
                </View>
                <ThemedText style={styles.dates}>
                  {formatFirestoreDate(trip.startDate)} - {formatFirestoreDate(trip.endDate)}
                </ThemedText>
                {trip.description && (
                  <ThemedText style={styles.description}>{trip.description}</ThemedText>
                )}
              </TouchableOpacity>
            </ThemedView>
          ))
        ) : (
          <ThemedView style={styles.emptyState}>
            <IconSymbol name="paperplane.fill" size={50} color="#ccc" />
            <ThemedText style={styles.message}>
              Vous n'avez pas encore de voyages.
              {!showForm && " Appuyez sur + pour en créer un."}
            </ThemedText>
          </ThemedView>
        )}
      </ThemedView>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: AppStyles.spacing.contentPadding,
    paddingTop: AppStyles.spacing.topPadding,
    backgroundColor: '#f5f5f5',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
    paddingVertical: 10,
  },
  addButton: {
    padding: 5,
  },
  coverImageContainer: {
    marginBottom: 12,
    borderRadius: 6,
    overflow: 'hidden',
    height: 160,
  },
  coverImage: {
    width: '100%',
    height: '100%',
  },
  tripCard: {
    marginBottom: 16,
    borderRadius: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
    overflow: 'hidden',
  },
  tripContent: {
    padding: 16,
  },
  tripHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 5,
  },
  deleteButton: {
    padding: 8,
  },
  dates: {
    color: '#666',
    marginTop: 5,
  },
  description: {
    marginTop: 10,
    color: '#333',
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 30,
    marginTop: 30,
  },
  message: {
    textAlign: 'center',
    marginTop: 10,
    color: '#666',
  },
});