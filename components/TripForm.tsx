import React, { useState } from 'react';
import { StyleSheet, TextInput, TouchableOpacity, Alert, ActivityIndicator, View, Text, ScrollView, Image } from 'react-native';
import { ThemedText } from './ThemedText';
import { ThemedView } from './ThemedView';
import { Timestamp, writeBatch, doc, collection, GeoPoint } from 'firebase/firestore';
import { getCurrentUser } from '@/src/firebase/auth';
import { db } from '@/src/firebase/config';
import { addTrip } from '@/src/firebase/firestore';
import DateTimePicker from '@react-native-community/datetimepicker';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { LocalTripStep, TripCreateData } from '@/types/tripTypes';
import { dateToTimestamp, stringToActivitiesArray } from '@/src/utils/typeConverters';
import * as ImagePicker from 'expo-image-picker';
import { uploadImage } from '@/src/firebase/storage';
import { IconSymbol } from './ui/IconSymbol';

// --- Interfaces ---
interface StepFormData {
  name: string;
  description: string;
  activities: string;
  latitude: string;
  longitude: string;
  startDate: Date | null;
  endDate: Date | null;
}

// --- Composants auxiliaires ---
const DateSelectorButton = ({ 
  label, 
  date, 
  onPress, 
  disabled = false 
}: { 
  label: string; 
  date: Date | null; 
  onPress: () => void; 
  disabled?: boolean 
}) => {
  const formatDate = (date: Date | null) => {
    if (!date) return 'Sélectionner';
    return format(date, 'dd MMMM yyyy', { locale: fr });
  };

  return (
    <TouchableOpacity 
      style={[styles.dateSelector, disabled && styles.disabledSelector]}
      onPress={onPress}
      disabled={disabled}
    >
      <ThemedText style={styles.dateLabel}>
        {label}: {formatDate(date)}
      </ThemedText>
    </TouchableOpacity>
  );
};

const StepItem = ({ 
  step, 
  index, 
  onEdit, 
  onRemove 
}: { 
  step: LocalTripStep; 
  index: number; 
  onEdit: (index: number) => void; 
  onRemove: (index: number) => void 
}) => {
  const formatDate = (date: Date | null) => {
    if (!date) return '';
    return format(date, 'dd MMMM yyyy', { locale: fr });
  };

  return (
    <View style={styles.stepItem}>
      <View style={styles.stepItemHeader}>
        <ThemedText type="defaultSemiBold">{step.name}</ThemedText>
        <View style={styles.stepActions}>
          <TouchableOpacity style={styles.iconButton} onPress={() => onEdit(index)}>
            <Text style={styles.editIcon}>✏️</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.iconButton} onPress={() => onRemove(index)}>
            <Text style={styles.deleteIcon}>🗑️</Text>
          </TouchableOpacity>
        </View>
      </View>
      <ThemedText style={styles.stepDate}>
        {formatDate(step.startDate)}
        {step.endDate && ` - ${formatDate(step.endDate)}`}
      </ThemedText>
    </View>
  );
};

// --- Composant principal ---
export default function TripForm({ onSuccess }: { onSuccess?: (docRef: string) => void }) {
  // --- États du voyage ---
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [startDate, setStartDate] = useState<Date | null>(null);
  const [endDate, setEndDate] = useState<Date | null>(null);
  const [loading, setLoading] = useState(false);
  const [coverImage, setCoverImage] = useState<string | null>(null);
  const [uploadingImage, setUploadingImage] = useState(false);
  
  // --- États pour les étapes ---
  const [steps, setSteps] = useState<LocalTripStep[]>([]);
  const [showAddStepForm, setShowAddStepForm] = useState(false);
  const [currentStepIndex, setCurrentStepIndex] = useState<number | null>(null);
  
  // --- État pour les date pickers ---
  const [showDatePicker, setShowDatePicker] = useState({
    tripStart: false,
    tripEnd: false,
    stepStart: false,
    stepEnd: false
  });
  
  // --- État du formulaire d'étape ---
  const [stepForm, setStepForm] = useState<StepFormData>({
    name: '',
    description: '',
    activities: '',
    latitude: '0',
    longitude: '0',
    startDate: null,
    endDate: null
  });
  
  // --- Utilitaires ---
  // const formatDisplayDate = (date: Date | null) => {
  //   if (!date) return '';
  //   return format(date, 'dd MMMM yyyy', { locale: fr });
  // };
  
  // --- Gestion des dates du voyage ---
  const handleShowTripDatePicker = (type: 'start' | 'end') => {
    if (type === 'start') {
      setShowDatePicker(prev => ({ ...prev, tripStart: true }));
    } else {
      setShowDatePicker(prev => ({ ...prev, tripEnd: true }));
    }
  };
  
  const handleTripStartDateChange = (event: any, selectedDate?: Date) => {
    setShowDatePicker(prev => ({ ...prev, tripStart: false }));
    
    if (selectedDate) {
      setStartDate(selectedDate);
      if (endDate && selectedDate > endDate) setEndDate(null);
    }
  };
  
  const handleTripEndDateChange = (event: any, selectedDate?: Date) => {
    setShowDatePicker(prev => ({ ...prev, tripEnd: false }));
    if (selectedDate) setEndDate(selectedDate);
  };
  
  // --- Gestion des dates d'étape ---
  const handleShowStepDatePicker = (type: 'start' | 'end') => {
    if (type === 'start') {
      setShowDatePicker(prev => ({ ...prev, stepStart: true }));
    } else {
      setShowDatePicker(prev => ({ ...prev, stepEnd: true }));
    }
  };
  
  const handleStepStartDateChange = (event: any, selectedDate?: Date) => {
    setShowDatePicker(prev => ({ ...prev, stepStart: false }));
    
    if (selectedDate) {
      updateStepForm('startDate', selectedDate);
      if (stepForm.endDate && selectedDate > stepForm.endDate) {
        updateStepForm('endDate', null);
      }
    }
  };
  
  const handleStepEndDateChange = (event: any, selectedDate?: Date) => {
    setShowDatePicker(prev => ({ ...prev, stepEnd: false }));
    if (selectedDate) updateStepForm('endDate', selectedDate);
  };
  
  // --- Gestion du formulaire d'étape ---
  const updateStepForm = (field: keyof StepFormData, value: any) => {
    setStepForm(prev => ({ ...prev, [field]: value }));
  };
  
  const resetStepForm = () => {
    setStepForm({
      name: '',
      description: '',
      activities: '',
      latitude: '0',
      longitude: '0',
      startDate: null,
      endDate: null
    });
    setCurrentStepIndex(null);
  };
  
  const handleAddStepFormToggle = () => {
    if (showAddStepForm) {
      // Annuler l'ajout/édition
      resetStepForm();
    }
    setShowAddStepForm(!showAddStepForm);
  };
  
  // --- Gestion des étapes ---
  const handleAddStep = () => {
    const { name, description, activities, startDate: stepStartDate, endDate: stepEndDate, latitude, longitude } = stepForm;
    
    if (!name || !stepStartDate) {
      Alert.alert('Erreur', 'Veuillez remplir au moins le nom et la date de début');
      return;
    }
    
    // Vérifier les contraintes de dates
    if (startDate && (stepStartDate < startDate || (endDate && stepStartDate > endDate))) {
      Alert.alert('Erreur', 'La date de l\'étape doit être comprise dans la période du voyage');
      return;
    }

    if (stepEndDate && endDate && stepEndDate > endDate) {
      Alert.alert('Erreur', 'La date de fin de l\'étape ne peut pas dépasser celle du voyage');
      return;
    }
    
    // Créer un GeoPoint si les coordonnées sont valides
    let geopoint;
    const lat = parseFloat(latitude);
    const lng = parseFloat(longitude);
    if (!isNaN(lat) && !isNaN(lng)) {
      geopoint = new GeoPoint(lat, lng);
    }
    
    const newStep: LocalTripStep = {
      name,
      description,
      activities: stringToActivitiesArray(activities),
      location: {
        geopoint: geopoint,
      },
      startDate: stepStartDate,
      endDate: stepEndDate || undefined
    };

    if (currentStepIndex !== null) {
      // Mise à jour d'une étape existante
      const updatedSteps = [...steps];
      updatedSteps[currentStepIndex] = newStep;
      setSteps(updatedSteps);
    } else {
      // Ajout d'une nouvelle étape
      setSteps([...steps, newStep]);
    }

    resetStepForm();
    setShowAddStepForm(false);
  };
  
  const handleEditStep = (index: number) => {
    const step = steps[index];
    setStepForm({
      name: step.name,
      description: step.description || '',
      activities: step.activities?.join(', ') || '',
      latitude: step.location?.geopoint?.latitude.toString() || '0',
      longitude: step.location?.geopoint?.longitude.toString() || '0',
      startDate: step.startDate,
      endDate: step.endDate || null
    });
    setCurrentStepIndex(index);
    setShowAddStepForm(true);
  };
  
  const handleRemoveStep = (index: number) => {
    Alert.alert(
      "Supprimer cette étape",
      "Êtes-vous sûr de vouloir supprimer cette étape ?",
      [
        { text: "Annuler", style: "cancel" },
        { 
          text: "Supprimer", 
          style: "destructive",
          onPress: () => {
            const updatedSteps = [...steps];
            updatedSteps.splice(index, 1);
            setSteps(updatedSteps);
            
            if (currentStepIndex === index) {
              resetStepForm();
              setShowAddStepForm(false);
            } else if (currentStepIndex !== null && currentStepIndex > index) {
              setCurrentStepIndex(currentStepIndex - 1);
            }
          }
        }
      ]
    );
  };
  
  // --- Création du voyage ---
  const handleCreateTrip = async () => {
    // Validation
    if (!title || !startDate || !endDate) {
      Alert.alert('Erreur', 'Veuillez remplir tous les champs obligatoires');
      return;
    }

    if (endDate < startDate) {
      Alert.alert('Erreur', 'La date de fin doit être après la date de début');
      return;
    }

    const currentUser = getCurrentUser();
    if (!currentUser) {
      Alert.alert('Erreur', 'Vous devez être connecté pour créer un voyage');
      return;
    }

    setLoading(true);
    
    try {
      // Uploader l'image de couverture si présente
      let coverImageUrl = undefined;
      if (coverImage) {
        setUploadingImage(true);
        coverImageUrl = await uploadImage(coverImage);
        setUploadingImage(false);
      }
      
      // Créer le voyage
      const tripData: TripCreateData = {
        title,
        description,
        startDate: dateToTimestamp(startDate),
        endDate: dateToTimestamp(endDate),
        userId: currentUser.uid,
        coverImageUrl // Ajout de l'URL de l'image de couverture si disponible
      };

      const tripId = await addTrip(tripData);
      
      // Ajouter les étapes si nécessaire
      if (steps.length > 0) {
        const batch = writeBatch(db);
        
        steps.forEach(step => {
          // Convertir l'étape en données Firestore
          const stepData = {
            name: step.name,
            description: step.description,
            activities: step.activities,
            location: step.location,
            startDate: dateToTimestamp(step.startDate),
            endDate: step.endDate ? dateToTimestamp(step.endDate) : null,
            tripId: tripId,
          };
          
          const stepDocRef = doc(collection(db, "trip_steps"));
          batch.set(stepDocRef, {
            ...stepData,
            createdAt: Timestamp.now()
          });
        });
        
        await batch.commit();
      }
      
      // Succès
      Alert.alert('Succès', `Votre voyage a été créé avec ${steps.length} étape${steps.length > 1 ? 's' : ''}`);
      
      // Réinitialiser le formulaire
      setTitle('');
      setDescription('');
      setStartDate(null);
      setEndDate(null);
      setSteps([]);
      setCoverImage(null);
      resetStepForm();
      
      // Callback
      if (onSuccess) onSuccess(tripId);
      
    } catch (error) {
      console.error("Erreur lors de la création du voyage:", error);
      Alert.alert('Erreur', 'Une erreur est survenue lors de la création du voyage');
    } finally {
      setLoading(false);
    }
  };

  // --- Gestion de l'image de couverture ---
  const pickImage = async () => {
    try {
      // Demander la permission d'accès à la galerie d'images
      const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();
      
      if (permissionResult.granted === false) {
        Alert.alert("Permission refusée", "Vous devez accorder l'accès à votre galerie pour ajouter une image de couverture");
        return;
      }

      // Lancer le sélecteur d'images
      let result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        allowsEditing: true,
        aspect: [16, 9],
        quality: 0.7,
      });

      console.log(result);

      if (!result.canceled) {
        setCoverImage(result.assets[0].uri);
      }
    } catch (error) {
      console.error("Erreur lors de la sélection de l'image:", error);
      Alert.alert("Erreur", "Impossible de sélectionner cette image");
    }
  };

  const removeCoverImage = () => {
    setCoverImage(null);
  };
  
  // --- Rendu ---
  return (
    <ScrollView>
      <ThemedView style={styles.container}>
        <ThemedText type="subtitle" style={styles.formTitle}>Créer un nouveau voyage</ThemedText>
        
        {/* --- Image de couverture --- */}
        <View style={styles.coverImageSection}>
          <ThemedText style={styles.sectionLabel}>Image de couverture (optionnelle)</ThemedText>
          
          {coverImage ? (
            <View style={styles.imagePreviewContainer}>
              <Image source={{ uri: coverImage }} style={styles.coverImagePreview} />
              <TouchableOpacity 
                style={styles.removeImageButton}
                onPress={removeCoverImage}
              >
                <IconSymbol name="xmark.circle.fill" size={24} color="#ff3b30" />
              </TouchableOpacity>
            </View>
          ) : (
            <TouchableOpacity 
              style={styles.addCoverImageButton} 
              onPress={pickImage}
              disabled={loading}
            >
              <IconSymbol name="photo" size={24} color="#0a7ea4" />
              <ThemedText style={styles.addCoverImageText}>Sélectionner une image</ThemedText>
            </TouchableOpacity>
          )}
        </View>
        
        {/* --- Formulaire principal --- */}
        <TextInput
          style={styles.input}
          placeholder="Titre du voyage *"
          value={title}
          onChangeText={setTitle}
        />
        
        <TextInput
          style={[styles.input, styles.textArea]}
          placeholder="Description (optionnel)"
          value={description}
          onChangeText={setDescription}
          multiline
          numberOfLines={3}
        />
        
        {/* --- Dates du voyage --- */}
        <DateSelectorButton
          label="Date de début*"
          date={startDate}
          onPress={() => handleShowTripDatePicker('start')}
        />
        
        {showDatePicker.tripStart && (
          <DateTimePicker
            value={startDate || new Date()}
            mode="date"
            display="default"
            onChange={handleTripStartDateChange}
            minimumDate={new Date()}
          />
        )}
        
        <DateSelectorButton
          label="Date de fin*"
          date={endDate}
          onPress={() => handleShowTripDatePicker('end')}
          disabled={!startDate}
        />
        
        {showDatePicker.tripEnd && (
          <DateTimePicker
            value={endDate || new Date()}
            mode="date"
            display="default"
            onChange={handleTripEndDateChange}
            minimumDate={startDate || new Date()}
          />
        )}
        
        {/* --- Section des étapes --- */}
        <View style={styles.stepsSection}>
          <View style={styles.stepsSectionHeader}>
            <ThemedText type="defaultSemiBold">Étapes du voyage</ThemedText>
            <TouchableOpacity
              style={styles.addStepButton}
              onPress={handleAddStepFormToggle}
            >
              <ThemedText style={styles.addStepButtonText}>
                {showAddStepForm ? "Annuler" : "Ajouter une étape"}
              </ThemedText>
            </TouchableOpacity>
          </View>

          {/* --- Liste des étapes --- */}
          {steps.length > 0 && (
            <View style={styles.stepsList}>
              {steps.map((step, index) => (
                <StepItem
                  key={index}
                  step={step}
                  index={index}
                  onEdit={handleEditStep}
                  onRemove={handleRemoveStep}
                />
              ))}
            </View>
          )}

          {/* --- Formulaire d'étape --- */}
          {showAddStepForm && (
            <View style={styles.stepForm}>
              <ThemedText type="defaultSemiBold" style={styles.stepFormTitle}>
                {currentStepIndex !== null ? "Modifier l'étape" : "Nouvelle étape"}
              </ThemedText>
              
              <TextInput
                style={styles.input}
                placeholder="Nom du lieu *"
                value={stepForm.name}
                onChangeText={(value) => updateStepForm('name', value)}
              />
              
              <TextInput
                style={[styles.input, styles.textArea]}
                placeholder="Description (optionnel)"
                value={stepForm.description}
                onChangeText={(value) => updateStepForm('description', value)}
                multiline
                numberOfLines={2}
              />
              
              <TextInput
                style={styles.input}
                placeholder="Activités (séparées par des virgules)"
                value={stepForm.activities}
                onChangeText={(value) => updateStepForm('activities', value)}
              />
              
              {/* Dates de l'étape */}
              <DateSelectorButton
                label="Date de début*"
                date={stepForm.startDate}
                onPress={() => handleShowStepDatePicker('start')}
              />
              
              {showDatePicker.stepStart && (
                <DateTimePicker
                  value={stepForm.startDate || (startDate || new Date())}
                  mode="date"
                  display="default"
                  onChange={handleStepStartDateChange}
                  minimumDate={startDate || new Date()}
                  maximumDate={endDate || undefined}
                />
              )}
              
              <DateSelectorButton
                label="Date de fin"
                date={stepForm.endDate}
                onPress={() => handleShowStepDatePicker('end')}
                disabled={!stepForm.startDate}
              />
              
              {showDatePicker.stepEnd && (
                <DateTimePicker
                  value={stepForm.endDate || stepForm.startDate || new Date()}
                  mode="date"
                  display="default"
                  onChange={handleStepEndDateChange}
                  minimumDate={stepForm.startDate || new Date()}
                  maximumDate={endDate || undefined}
                />
              )}
              
              <View style={styles.stepFormActions}>
                <TouchableOpacity 
                  style={[styles.button, styles.stepButton]} 
                  onPress={handleAddStep}
                >
                  <ThemedText style={styles.buttonText}>
                    {currentStepIndex !== null ? "Mettre à jour" : "Ajouter l'étape"}
                  </ThemedText>
                </TouchableOpacity>
              </View>
            </View>
          )}
        </View>
        
        {/* --- Bouton de création --- */}
        <TouchableOpacity 
          style={[styles.button, (loading || uploadingImage) && styles.buttonDisabled]} 
          onPress={handleCreateTrip}
          disabled={loading || uploadingImage}
        >
          {loading || uploadingImage ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator color="white" />
              <ThemedText style={styles.loadingText}>
                {uploadingImage ? "Téléchargement de l'image..." : "Création du voyage..."}
              </ThemedText>
            </View>
          ) : (
            <ThemedText style={styles.buttonText}>
              {steps.length > 0 
                ? `Créer le voyage avec ${steps.length} étape${steps.length > 1 ? 's' : ''}` 
                : 'Créer mon voyage'}
            </ThemedText>
          )}
        </TouchableOpacity>
      </ThemedView>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 16,
    borderRadius: 8,
    width: '100%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    marginBottom: 20,
  },
  formTitle: {
    marginBottom: 15,
    textAlign: 'center',
  },
  input: {
    height: 50,
    borderColor: '#ccc',
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 15,
    backgroundColor: '#f9f9f9',
    marginVertical: 8,
  },
  textArea: {
    height: 100,
    textAlignVertical: 'top',
    paddingTop: 12,
  },
  dateSelector: {
    height: 50,
    borderColor: '#ccc',
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 15,
    backgroundColor: '#f9f9f9',
    marginVertical: 8,
    justifyContent: 'center',
  },
  dateLabel: {
    color: '#333',
  },
  disabledSelector: {
    backgroundColor: '#e9e9e9',
    borderColor: '#ddd',
  },
  button: {
    backgroundColor: '#0a7ea4',
    padding: 15,
    alignItems: 'center',
    borderRadius: 8,
    marginTop: 10,
  },
  buttonDisabled: {
    backgroundColor: '#cccccc',
  },
  buttonText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 16,
  },
  loadingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingText: {
    color: 'white',
    marginLeft: 10,
    fontSize: 14,
  },
  // Styles pour la section d'image de couverture
  coverImageSection: {
    marginBottom: 16,
  },
  sectionLabel: {
    marginBottom: 8,
    fontSize: 14,
    color: '#555',
  },
  addCoverImageButton: {
    backgroundColor: '#f0f0f0',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#ddd',
    borderStyle: 'dashed',
    height: 150,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  addCoverImageText: {
    color: '#0a7ea4',
    marginTop: 8,
    fontSize: 16,
  },
  imagePreviewContainer: {
    position: 'relative',
    marginBottom: 16,
  },
  coverImagePreview: {
    width: '100%',
    height: 200,
    borderRadius: 8,
    resizeMode: 'cover',
  },
  removeImageButton: {
    position: 'absolute',
    top: 10,
    right: 10,
    backgroundColor: 'rgba(255,255,255,0.8)',
    borderRadius: 15,
    padding: 5,
  },
  // Styles pour la section des étapes
  stepsSection: {
    marginTop: 20,
    borderTopWidth: 1,
    borderTopColor: '#ddd',
    paddingTop: 15,
  },
  stepsSectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  addStepButton: {
    backgroundColor: '#0a7ea4',
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 4,
  },
  addStepButtonText: {
    color: 'white',
    fontSize: 14,
  },
  stepsList: {
    marginBottom: 15,
  },
  stepItem: {
    backgroundColor: '#f0f0f0',
    borderRadius: 6,
    padding: 10,
    marginBottom: 8,
  },
  stepItemHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  stepDate: {
    fontSize: 12,
    color: '#666',
    marginTop: 3,
  },
  stepActions: {
    flexDirection: 'row',
  },
  iconButton: {
    padding: 5,
    marginLeft: 5,
  },
  editIcon: {
    fontSize: 16,
  },
  deleteIcon: {
    fontSize: 16,
  },
  // Styles du formulaire d'étape
  stepForm: {
    backgroundColor: '#f5f5f5',
    borderRadius: 8,
    padding: 12,
    marginBottom: 10,
  },
  stepFormTitle: {
    marginBottom: 12,
    textAlign: 'center',
  },
  coordinatesContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  coordinateInput: {
    width: '48%',
  },
  stepFormActions: {
    flexDirection: 'row',
    justifyContent: 'center',
  },
  stepButton: {
    flex: 1,
  },
});