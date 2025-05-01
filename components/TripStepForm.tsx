import React, { useState, useEffect } from 'react';
import { StyleSheet, TextInput, TouchableOpacity, Alert, ActivityIndicator, View } from 'react-native';
import { ThemedText } from './ThemedText';
import { ThemedView } from './ThemedView';
import { addTripStep, updateTripStep } from '@/src/firebase/firestore';
import { Timestamp } from 'firebase/firestore';
import DateTimePicker from '@react-native-community/datetimepicker';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { TripStepFormData } from '@/types/tripTypes';

// --- Composant auxiliaire ---
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

// --- Composant principal --- 
export default function TripStepForm({ 
  tripId, 
  existingStep,
  onSuccess 
}: { 
  tripId: string,
  existingStep?: TripStepFormData,
  onSuccess?: () => void 
}) {
  // --- États du formulaire ---
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    activities: '',
  });
  
  // --- États pour les dates ---
  const [startDate, setStartDate] = useState<Date | null>(null);
  const [endDate, setEndDate] = useState<Date | null>(null);
  
  // --- État des pickers de date ---
  const [showDatePicker, setShowDatePicker] = useState({
    start: false,
    end: false,
  });
  
  const [loading, setLoading] = useState(false);
  const isEditMode = !!existingStep?.id;
  
  // --- Chargement des données existantes ---
  useEffect(() => {
    console.log("TripStepForm monté avec tripId:", tripId);
    console.log("Mode formulaire:", isEditMode ? "Édition" : "Création");
    
    if (existingStep) {
      console.log("Chargement des données de l'étape existante:", existingStep.id);
      setFormData({
        name: existingStep.name || '',
        description: existingStep.description || '',
        activities: existingStep.activities ? existingStep.activities.join(', ') : '',
      });
      
      if (existingStep.startDate) {
        setStartDate(existingStep.startDate.toDate());
      }
      
      if (existingStep.endDate) {
        setEndDate(existingStep.endDate.toDate());
      }
    }
  }, [existingStep, tripId]);
  
  // --- Gestionnaires ---
  const updateFormData = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };
  
  const handleShowDatePicker = (type: 'start' | 'end') => {
    if (type === 'start') {
      setShowDatePicker(prev => ({ ...prev, start: true }));
    } else {
      setShowDatePicker(prev => ({ ...prev, end: true }));
    }
  };
  
  const handleStartDateChange = (event: any, selectedDate?: Date) => {
    setShowDatePicker(prev => ({ ...prev, start: false }));
    
    if (selectedDate) {
      setStartDate(selectedDate);
      if (endDate && selectedDate > endDate) {
        setEndDate(null);
      }
    }
  };
  
  const handleEndDateChange = (event: any, selectedDate?: Date) => {
    setShowDatePicker(prev => ({ ...prev, end: false }));
    
    if (selectedDate) {
      setEndDate(selectedDate);
    }
  };
  
  const handleSubmit = async () => {
    // --- Validation ---
    if (!formData.name || !startDate) {
      Alert.alert('Erreur', 'Veuillez remplir au moins le nom et la date de début');
      return;
    }

    if (!tripId) {
      Alert.alert('Erreur', 'ID du voyage manquant');
      return;
    }

    setLoading(true);
    
    try {
      console.log("Soumission du formulaire:", isEditMode ? "Modification" : "Création");
      
      // --- Création ou mise à jour ---
      if (isEditMode && existingStep?.id) {
        console.log("Mise à jour de l'étape:", existingStep.id);
        await updateTripStep(existingStep.id, {
          id: existingStep.id,
          name: formData.name,
          description: formData.description,
          activities: formData.activities.split(',').map(a => a.trim()).filter(a => a),
          location: existingStep.location || {}, 
          startDate: Timestamp.fromDate(startDate),
          endDate: endDate ? Timestamp.fromDate(endDate) : null
        });
        console.log("Étape mise à jour avec succès");
      } else {
        console.log("Ajout d'une nouvelle étape pour le voyage:", tripId);
        
        const stepData = {
          tripId,
          name: formData.name,
          description: formData.description,
          activities: formData.activities.split(',').map(a => a.trim()).filter(a => a),
          location: {}, 
          startDate: Timestamp.fromDate(startDate),
          endDate: endDate ? Timestamp.fromDate(endDate) : null,
          journal: []
        };
        
        console.log("Données de l'étape à ajouter:", JSON.stringify(stepData));
      }
      
      // --- Succès ---
      setLoading(false);
      
      Alert.alert(
        'Succès', 
        isEditMode ? 'L\'étape a été modifiée avec succès' : 'L\'étape a été ajoutée au voyage',
        [
          {
            text: 'OK',
            onPress: () => {
              if (onSuccess) {
                console.log("Appel du callback onSuccess");
                onSuccess();
              }
            }
          }
        ]
      );
      
      // --- Réinitialisation du formulaire ---
      if (!isEditMode) {
        setFormData({
          name: '',
          description: '',
          activities: '',
        });
        setStartDate(null);
        setEndDate(null);
      }
    } catch (error) {
      console.error("Erreur lors de l'opération sur l'étape:", error);
      setLoading(false);
      Alert.alert('Erreur', `Une erreur est survenue lors de l'${isEditMode ? 'édition' : 'ajout'} de l'étape: ${error.message || error}`);
    }
  };

  // --- Rendu ---
  return (
    <ThemedView style={styles.container}>
      <ThemedText type="subtitle" style={styles.formTitle}>
        {isEditMode ? 'Modifier l\'étape' : 'Ajouter une étape'}
      </ThemedText>
      
      <TextInput
        style={styles.input}
        placeholder="Nom du lieu *"
        value={formData.name}
        onChangeText={(value) => updateFormData('name', value)}
      />
      
      <TextInput
        style={[styles.input, styles.textArea]}
        placeholder="Description (optionnel)"
        value={formData.description}
        onChangeText={(value) => updateFormData('description', value)}
        multiline
        numberOfLines={3}
      />
      
      <TextInput
        style={styles.input}
        placeholder="Activités (séparées par des virgules)"
        value={formData.activities}
        onChangeText={(value) => updateFormData('activities', value)}
      />
      
      {/* Dates de l'étape */}
      <DateSelectorButton 
        label="Date de début*"
        date={startDate}
        onPress={() => handleShowDatePicker('start')}
      />
      
      {showDatePicker.start && (
        <DateTimePicker
          value={startDate || new Date()}
          mode="date"
          display="default"
          onChange={handleStartDateChange}
        />
      )}
      
      <DateSelectorButton 
        label="Date de fin"
        date={endDate}
        onPress={() => handleShowDatePicker('end')}
        disabled={!startDate}
      />
      
      {showDatePicker.end && (
        <DateTimePicker
          value={endDate || startDate || new Date()}
          mode="date"
          display="default"
          onChange={handleEndDateChange}
          minimumDate={startDate || undefined}
        />
      )}
      
      <TouchableOpacity 
        style={[styles.button, loading && styles.buttonDisabled]} 
        onPress={handleSubmit}
        disabled={loading}
      >
        {loading ? (
          <ActivityIndicator color="white" />
        ) : (
          <ThemedText style={styles.buttonText}>
            {isEditMode ? 'Mettre à jour l\'étape' : 'Ajouter cette étape'}
          </ThemedText>
        )}
      </TouchableOpacity>
    </ThemedView>
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
});