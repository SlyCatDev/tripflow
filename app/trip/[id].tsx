import { useLocalSearchParams } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { StyleSheet, ScrollView, View, TouchableOpacity, Alert, ActivityIndicator, Dimensions, Image } from 'react-native';
import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { IconSymbol } from '@/components/ui/IconSymbol';
import { doc, getDoc, Timestamp } from 'firebase/firestore';
import { db } from '@/src/firebase/config';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import TripStepForm from '@/components/TripStepForm';
import JournalDisplay from '@/components/JournalDisplay';
import { getTripSteps, deleteTripStep, getTripStep } from '@/src/firebase/firestore';
import { Trip, TripStep, JournalEntry } from '@/types/tripTypes';
// import InteractiveMap from '@/components/InteractiveMap';

const { width } = Dimensions.get('window');
const MAP_HEIGHT = width * 0.7; // Hauteur proportionnelle à la largeur pour la carte

export default function TripDetail() {
  const { id } = useLocalSearchParams();
  // S'assurer que tripId est toujours une chaîne de caractères
  const tripId = Array.isArray(id) ? id[0] : (id?.toString() || '');

  const [trip, setTrip] = useState<Trip | null>(null);
  const [steps, setSteps] = useState<TripStep[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddStepForm, setShowAddStepForm] = useState(false);
  const [stepToEdit, setStepToEdit] = useState<TripStep | null>(null);
  const [showMap, setShowMap] = useState(true); // État pour afficher/masquer la carte
  const [selectedStep, setSelectedStep] = useState<TripStep | null>(null);
  const [expandedJournalStep, setExpandedJournalStep] = useState<string | null>(null);
  const [refreshJournal, setRefreshJournal] = useState(0); // Compteur pour forcer le rafraîchissement des journaux

  // Vérification si tripId est valide
  useEffect(() => {
    if (!tripId) {
      Alert.alert("Erreur", "Identifiant de voyage invalide");
      return;
    }
    
    fetchTrip();
    fetchSteps();
  }, [tripId]);

  // Log pour déboguer l'état du formulaire
  useEffect(() => {
    console.log("État du formulaire d'ajout d'étape:", showAddStepForm ? "Visible" : "Caché");
  }, [showAddStepForm]);

  // Charger les détails du voyage
  const fetchTrip = async () => {
    if (!tripId) return;
    
    try {
      const tripDoc = await getDoc(doc(db, "trips", tripId));
      
      if (tripDoc.exists()) {
        setTrip({ 
          id: tripDoc.id, 
          ...tripDoc.data() as Omit<Trip, 'id'> 
        });
      } else {
        Alert.alert("Erreur", "Ce voyage n'existe pas");
      }
    } catch (error) {
      console.error("Erreur lors du chargement du voyage:", error);
      Alert.alert("Erreur", "Impossible de charger les détails du voyage");
    }
  };

  // Charger les étapes du voyage
  const fetchSteps = async () => {
    if (!tripId) return;
    
    try {
      console.log("Récupération des étapes pour le voyage ID:", tripId);
      const stepsData = await getTripSteps(tripId);
      console.log(`${stepsData.length} étapes récupérées`);
      setSteps(stepsData as TripStep[]);
    } catch (error) {
      console.error("Erreur lors du chargement des étapes:", error);
    } finally {
      setLoading(false);
    }
  };

  // Fonction pour rafraîchir une étape spécifique (pour mettre à jour le journal)
  const refreshStep = async (stepId: string) => {
    try {
      console.log("Rafraîchissement de l'étape:", stepId);
      const step = await getTripStep(stepId);
      if (step) {
        console.log("Étape récupérée avec journal:", step.journal?.length || 0, "entrées");
        setSteps(prevSteps => 
          prevSteps.map(s => s.id === stepId ? step : s)
        );
      } else {
        console.log("Étape non trouvée lors du rafraîchissement");
      }
      // Force le rafraîchissement des composants de journal
      setRefreshJournal(prev => prev + 1);
    } catch (error) {
      console.error("Erreur lors du rafraîchissement de l'étape:", error);
      Alert.alert("Erreur", "Impossible de rafraîchir les données de l'étape.");
    }
  };

  // Basculer l'affichage du journal d'une étape
  const toggleJournal = (stepId: string) => {
    if (expandedJournalStep === stepId) {
      setExpandedJournalStep(null);
    } else {
      setExpandedJournalStep(stepId);
      // Rafraîchir les données de cette étape pour avoir les dernières entrées journal
      refreshStep(stepId);
    }
  };

  // Fonction pour formater les dates
  const formatFirestoreDate = (timestamp: Timestamp): string => {
    if (!timestamp || typeof timestamp.toDate !== 'function') {
      return 'Date non disponible';
    }
    return format(timestamp.toDate(), 'dd MMMM yyyy', { locale: fr });
  };

  // Fonction pour supprimer une étape
  const handleDeleteStep = (stepId: string) => {
    // Vérifier que l'ID est valide
    if (!stepId) {
      Alert.alert("Erreur", "Identifiant d'étape invalide");
      return;
    }
    
    Alert.alert(
      "Supprimer cette étape",
      "Êtes-vous sûr de vouloir supprimer cette étape?",
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
              console.log("Tentative de suppression de l'étape:", stepId);
              
              // Stocker l'étape à supprimer et son index pour une possible restauration
              const stepToDelete = steps.find(step => step.id === stepId);
              const stepIndex = steps.findIndex(step => step.id === stepId);
              
              // Mettre à jour l'interface immédiatement pour une meilleure réactivité
              setSteps(prevSteps => prevSteps.filter(step => step.id !== stepId));
              
              try {
                // Supprimer dans Firestore
                await deleteTripStep(stepId);
                console.log(`Étape ${stepId} supprimée avec succès`);
              } catch (error) {
                console.error("Erreur lors de la suppression de l'étape:", error);
                
                // En cas d'erreur lors de la suppression, restaurer l'étape dans l'interface
                if (stepToDelete && stepIndex !== -1) {
                  setSteps(prevSteps => {
                    const newSteps = [...prevSteps];
                    newSteps.splice(stepIndex, 0, stepToDelete);
                    return newSteps;
                  });
                }
                
                // Afficher un message d'erreur à l'utilisateur
                Alert.alert("Erreur", "Impossible de supprimer cette étape. Veuillez réessayer.");
              }
            } catch (error) {
              console.error("Erreur inattendue:", error);
              Alert.alert("Erreur", "Une erreur inattendue s'est produite.");
            }
          }
        }
      ]
    );
  };

  // Fonction pour éditer une étape
  const handleEditStep = (step: TripStep) => {
    console.log("Préparation à l'édition de l'étape ID:", step.id);
    setStepToEdit(step);
    setShowAddStepForm(true);
  };

  // Fonction appelée après ajout ou modification d'une étape
  const handleFormSuccess = () => {
    console.log("Formulaire soumis avec succès, rafraîchissement des étapes");
    setShowAddStepForm(false);
    setStepToEdit(null);
    // Attendre un court instant pour laisser Firestore se mettre à jour
    setTimeout(() => {
      fetchSteps(); // Recharger les étapes pour refléter les modifications
    }, 500);
  };

  // Fonction pour gérer l'appui sur un marqueur de la carte
  const handleMarkerPress = (step: TripStep) => {
    setSelectedStep(step);
    // Faire défiler jusqu'à l'étape sélectionnée dans la liste
    // Note: Ceci nécessiterait l'utilisation d'une référence pour le ScrollView
  };

  if (loading) {
    return (
      <ThemedView style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#0a7ea4" />
        <ThemedText style={styles.loadingText}>Chargement...</ThemedText>
      </ThemedView>
    );
  }

  if (!trip) {
    return (
      <ThemedView style={styles.container}>
        <ThemedText>Voyage introuvable</ThemedText>
      </ThemedView>
    );
  }

  return (
    <ScrollView>
      <ThemedView style={styles.container}>
        {/* Image de couverture */}
        {trip.coverImageUrl && (
          <View style={styles.coverImageContainer}>
            <Image 
              source={{ uri: trip.coverImageUrl }} 
              style={styles.coverImage}
              resizeMode="cover"
            />
          </View>
        )}

        {/* Détails du voyage */}
        <ThemedView style={styles.tripHeader}>
          <ThemedText type="title">{trip.title}</ThemedText>
          <ThemedText style={styles.dates}>
            {formatFirestoreDate(trip.startDate)} - {formatFirestoreDate(trip.endDate)}
          </ThemedText>
          {trip.description && (
            <ThemedText style={styles.description}>{trip.description}</ThemedText>
          )}
        </ThemedView>

        {/* Carte interactive */}
        {/* {steps.length > 0 && (
          <View style={styles.mapSection}>
            <View style={styles.mapHeader}>
              <ThemedText type="subtitle">Carte du voyage</ThemedText>
              <TouchableOpacity onPress={() => setShowMap(!showMap)}>
                <IconSymbol 
                  name={showMap ? "chevron.up" : "chevron.down"} 
                  size={20} 
                  color="#0a7ea4" 
                />
              </TouchableOpacity>
            </View>
            
            {showMap && (
              <View style={styles.mapContainer}>
                <InteractiveMap 
                  steps={steps}
                  onMarkerPress={handleMarkerPress}
                  showCurrentLocation={true}
                />
              </View>
            )}
          </View>
        )} */}

        {/* Section des étapes */}
        <View style={styles.sectionHeader}>
          <ThemedText type="subtitle">Étapes du voyage</ThemedText>
          <TouchableOpacity 
            style={styles.addButton}
            onPress={() => {
              console.log("Bouton d'ajout d'étape appuyé");
              setStepToEdit(null); // Réinitialiser l'étape à éditer
              setShowAddStepForm(!showAddStepForm);
              // Utiliser un petit délai pour s'assurer que l'état est bien mis à jour
              setTimeout(() => {
                console.log("État du formulaire après clic: ", showAddStepForm ? "Caché" : "Visible");
              }, 100);
            }}
          >
            <IconSymbol 
              name={showAddStepForm ? "minus.circle.fill" : "plus.circle.fill"} 
              size={28} 
              color="#0a7ea4" 
            />
          </TouchableOpacity>
        </View>

        {/* Formulaire d'ajout/modification d'étape */}
        {showAddStepForm && (
          <View style={styles.formContainer}>
            <TripStepForm 
              tripId={tripId} 
              existingStep={stepToEdit || undefined}
              onSuccess={handleFormSuccess}
            />
          </View>
        )}

        {/* Liste des étapes */}
        {steps.length > 0 ? (
          steps
            .sort((a, b) => a.startDate.seconds - b.startDate.seconds)
            .map((step) => (
              <ThemedView 
                key={step.id} 
                style={[
                  styles.stepCard, 
                  selectedStep?.id === step.id && styles.selectedStepCard
                ]}
              >
                <View style={styles.stepHeader}>
                  <ThemedText type="defaultSemiBold">{step.name}</ThemedText>
                  <View style={styles.actionButtons}>
                    <TouchableOpacity 
                      onPress={() => handleEditStep(step)}
                      style={styles.editButton}
                    >
                      <IconSymbol name="gear" size={18} color="#0a7ea4" />
                    </TouchableOpacity>
                    <TouchableOpacity 
                      onPress={() => handleDeleteStep(step.id)}
                      style={styles.deleteButton}
                    >
                      <IconSymbol name="trash" size={18} color="#ff3b30" />
                    </TouchableOpacity>
                  </View>
                </View>
                
                <ThemedText style={styles.stepDates}>
                  {formatFirestoreDate(step.startDate)} 
                  {step.endDate && ` - ${formatFirestoreDate(step.endDate)}`}
                </ThemedText>
                
                {step.description && (
                  <ThemedText style={styles.stepDescription}>{step.description}</ThemedText>
                )}
                
                {step.activities && step.activities.length > 0 && (
                  <View style={styles.activitiesContainer}>
                    <ThemedText type="defaultSemiBold" style={styles.activitiesTitle}>Activités:</ThemedText>
                    {step.activities.map((activity, index) => (
                      <ThemedText key={index} style={styles.activity}>• {activity}</ThemedText>
                    ))}
                  </View>
                )}

                {/* Bouton pour afficher/masquer le journal de bord */}
                <TouchableOpacity
                  style={styles.journalToggleButton}
                  onPress={() => toggleJournal(step.id)}
                >
                  <IconSymbol 
                    name={expandedJournalStep === step.id ? "chevron.up" : "chevron.down"} 
                    size={16} 
                    color="#0a7ea4" 
                  />
                  <ThemedText style={styles.journalToggleText}>
                    {expandedJournalStep === step.id ? "Masquer le journal" : "Journal de bord"}
                    {' '}
                    {step.journal && step.journal.length > 0 && `(${step.journal.length})`}
                  </ThemedText>
                </TouchableOpacity>

                {/* Affichage du journal de bord */}
                {expandedJournalStep === step.id && (
                  <View style={styles.journalContainer}>
                    <ThemedText type="defaultSemiBold" style={styles.journalHeader}>
                      Journal de bord pour {step.name}
                    </ThemedText>
                    <JournalDisplay 
                      key={`journal-${step.id}-${refreshJournal}`}
                      stepId={step.id}
                      entries={step.journal || []}
                      onUpdate={() => {
                        console.log("onUpdate appelé depuis JournalDisplay");
                        Alert.alert("Mise à jour", "Rafraîchissement de l'étape...");
                        refreshStep(step.id);
                      }}
                    />
                  </View>
                )}
              </ThemedView>
            ))
        ) : (
          <ThemedView style={styles.emptyState}>
            <IconSymbol name="paperplane.fill" size={40} color="#ccc" />
            <ThemedText style={styles.emptyText}>
              Aucune étape pour ce voyage. 
              {!showAddStepForm && " Ajoutez-en une !"}
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
    padding: 16,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 20,
    fontSize: 16,
  },
  tripHeader: {
    padding: 16,
    borderRadius: 8,
    marginBottom: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  dates: {
    color: '#666',
    marginTop: 8,
  },
  description: {
    marginTop: 12,
    color: '#333',
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
    paddingHorizontal: 4,
  },
  addButton: {
    padding: 8,
    backgroundColor: '#e6f2f5',
    borderRadius: 20,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 1,
  },
  stepCard: {
    padding: 16,
    borderRadius: 8,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 1,
  },
  selectedStepCard: {
    borderWidth: 2,
    borderColor: '#0a7ea4',
  },
  stepHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  actionButtons: {
    flexDirection: 'row',
  },
  editButton: {
    padding: 8,
    marginRight: 4,
  },
  deleteButton: {
    padding: 8,
  },
  stepDates: {
    color: '#666',
    fontSize: 14,
    marginTop: 4,
  },
  address: {
    marginTop: 8,
    color: '#444',
    fontSize: 14,
  },
  stepDescription: {
    marginTop: 10,
    color: '#333',
  },
  activitiesContainer: {
    marginTop: 12,
  },
  activitiesTitle: {
    marginBottom: 4,
  },
  activity: {
    marginLeft: 8,
    marginVertical: 2,
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 40,
    borderStyle: 'dashed',
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 8,
  },
  emptyText: {
    textAlign: 'center',
    marginTop: 12,
    color: '#666',
  },
  mapSection: {
    marginBottom: 24,
    borderRadius: 8,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  mapHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  mapContainer: {
    height: MAP_HEIGHT,
    width: '100%',
    borderBottomLeftRadius: 8,
    borderBottomRightRadius: 8,
    overflow: 'hidden',
  },
  coverImageContainer: {
    width: '100%',
    height: 250,
    borderRadius: 8,
    overflow: 'hidden',
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 3,
  },
  coverImage: {
    width: '100%',
    height: '100%',
  },
  journalToggleButton: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 15,
    paddingVertical: 8,
    paddingHorizontal: 12,
    backgroundColor: '#f5f5f5',
    borderRadius: 5,
    alignSelf: 'flex-start',
  },
  journalToggleText: {
    color: '#0a7ea4',
    marginLeft: 8,
    fontSize: 14,
  },
  journalContainer: {
    marginTop: 10,
    marginBottom: 10,
    padding: 10,
    borderRadius: 8,
    backgroundColor: '#f9f9f9',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 1,
  },
  journalHeader: {
    marginBottom: 8,
  },
  formContainer: {
    marginBottom: 16,
  },
});