import React, { useState, useEffect } from 'react';
import { StyleSheet, View, TextInput, TouchableOpacity, Alert, ActivityIndicator, ScrollView, Image } from 'react-native';
import { ThemedView } from './ThemedView';
import { ThemedText } from './ThemedText';
import { IconSymbol } from './ui/IconSymbol';
import * as ImagePicker from 'expo-image-picker';
import { uploadImage } from '@/src/firebase/storage';
import { addJournalEntry, updateJournalEntry } from '@/src/firebase/firestore';
import { JournalEntry, JournalEntryCreateData } from '@/types/tripTypes';

interface JournalFormProps {
  stepId: string;
  existingEntry?: JournalEntry;
  onSuccess: () => void;
  onCancel: () => void;
}

export default function JournalForm({ stepId, existingEntry, onSuccess, onCancel }: JournalFormProps) {
  const [text, setText] = useState(existingEntry?.text || '');
  const [photos, setPhotos] = useState<string[]>(existingEntry?.photos || []);
  const [loading, setLoading] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);

  const isEditing = !!existingEntry;

  // Pour débogage
  useEffect(() => {
    console.log("JournalForm monté");
    Alert.alert("Formulaire affiché", "Le formulaire d'entrée de journal est maintenant affiché");
    return () => {
      console.log("JournalForm démonté");
    };
  }, []);

  const pickImage = async () => {
    try {
      // Demander la permission d'accès à la galerie d'images
      const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();
      
      if (permissionResult.granted === false) {
        Alert.alert("Permission refusée", "Vous devez accorder l'accès à votre galerie pour ajouter des photos");
        return;
      }

      // Lancer le sélecteur d'images
      let result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        allowsEditing: true,
        aspect: [4, 3],
        quality: 0.7,
      });

      if (!result.canceled) {
        const imageUri = result.assets[0].uri;
        setUploadingImage(true);
        
        try {
          // Télécharger l'image vers Firebase Storage
          const imageUrl = await uploadImage(imageUri, 'journal-photos');
          setPhotos([...photos, imageUrl]);
        } catch (error) {
          console.error("Erreur lors du téléchargement de l'image:", error);
          Alert.alert("Erreur", "Impossible de télécharger l'image. Veuillez réessayer.");
        } finally {
          setUploadingImage(false);
        }
      }
    } catch (error) {
      console.error("Erreur lors de la sélection de l'image:", error);
      Alert.alert("Erreur", "Impossible de sélectionner cette image");
    }
  };

  const removePhoto = (indexToRemove: number) => {
    setPhotos(photos.filter((_, index) => index !== indexToRemove));
  };

  const handleSubmit = async () => {
    if (!text.trim()) {
      Alert.alert("Erreur", "Veuillez ajouter du texte à votre entrée de journal");
      return;
    }

    setLoading(true);

    try {
      const journalData: JournalEntryCreateData = {
        text,
        photos
      };

      if (isEditing && existingEntry) {
        // Mise à jour d'une entrée existante
        await updateJournalEntry(stepId, existingEntry.id, journalData);
        Alert.alert("Succès", "Entrée de journal mise à jour avec succès");
      } else {
        // Création d'une nouvelle entrée
        await addJournalEntry(stepId, journalData);
        Alert.alert("Succès", "Nouvelle entrée de journal ajoutée avec succès");
      }

      onSuccess();
    } catch (error) {
      console.error("Erreur lors de l'enregistrement de l'entrée de journal:", error);
      Alert.alert("Erreur", "Une erreur est survenue lors de l'enregistrement de votre entrée de journal");
    } finally {
      setLoading(false);
    }
  };

  return (
    <ThemedView style={styles.container}>
      <ThemedText type="subtitle" style={styles.title}>
        {isEditing ? "Modifier l'entrée de journal" : "Nouvelle entrée de journal"}
      </ThemedText>

      <TextInput
        style={styles.textInput}
        placeholder="Partagez vos impressions, expériences, souvenirs..."
        value={text}
        onChangeText={setText}
        multiline
        numberOfLines={5}
        textAlignVertical="top"
      />

      {photos.length > 0 && (
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.photoList}>
          {photos.map((photo, index) => (
            <View key={index} style={styles.photoContainer}>
              <Image source={{ uri: photo }} style={styles.photo} />
              <TouchableOpacity
                style={styles.removePhotoButton}
                onPress={() => removePhoto(index)}
              >
                <IconSymbol name="xmark.circle.fill" size={24} color="#ff3b30" />
              </TouchableOpacity>
            </View>
          ))}
        </ScrollView>
      )}

      <View style={styles.buttonRow}>
        <TouchableOpacity
          style={styles.photoButton}
          onPress={pickImage}
          disabled={loading || uploadingImage}
        >
          {uploadingImage ? (
            <ActivityIndicator color="#0a7ea4" />
          ) : (
            <>
              <IconSymbol name="camera" size={20} color="#0a7ea4" />
              <ThemedText style={styles.photoButtonText}>Ajouter photo</ThemedText>
            </>
          )}
        </TouchableOpacity>

        <View style={styles.actionButtons}>
          <TouchableOpacity
            style={styles.cancelButton}
            onPress={() => {
              Alert.alert("Annulation", "Formulaire annulé");
              onCancel();
            }}
            disabled={loading}
          >
            <ThemedText style={styles.cancelButtonText}>Annuler</ThemedText>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.saveButton, (loading || uploadingImage) && styles.disabledButton]}
            onPress={handleSubmit}
            disabled={loading || uploadingImage}
          >
            {loading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <ThemedText style={styles.saveButtonText}>
                {isEditing ? "Mettre à jour" : "Enregistrer"}
              </ThemedText>
            )}
          </TouchableOpacity>
        </View>
      </View>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 15,
    borderRadius: 10,
    marginVertical: 10,
    backgroundColor: '#f9f9f9',
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  title: {
    marginBottom: 15,
    textAlign: 'center',
  },
  textInput: {
    borderColor: '#ccc',
    borderWidth: 1,
    borderRadius: 8,
    padding: 10,
    minHeight: 100,
    marginBottom: 15,
    backgroundColor: '#ffffff',
  },
  photoList: {
    flexDirection: 'row',
    marginBottom: 15,
  },
  photoContainer: {
    position: 'relative',
    marginRight: 10,
  },
  photo: {
    width: 100,
    height: 100,
    borderRadius: 5,
  },
  removePhotoButton: {
    position: 'absolute',
    top: 5,
    right: 5,
    backgroundColor: 'rgba(255, 255, 255, 0.7)',
    borderRadius: 12,
    padding: 2,
  },
  buttonRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  photoButton: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 10,
    borderRadius: 5,
    borderWidth: 1,
    borderColor: '#0a7ea4',
  },
  photoButtonText: {
    color: '#0a7ea4',
    marginLeft: 5,
  },
  actionButtons: {
    flexDirection: 'row',
  },
  cancelButton: {
    paddingVertical: 10,
    paddingHorizontal: 15,
    borderRadius: 5,
    marginRight: 10,
    backgroundColor: '#f2f2f2',
  },
  cancelButtonText: {
    color: '#666',
  },
  saveButton: {
    backgroundColor: '#0a7ea4',
    paddingVertical: 10,
    paddingHorizontal: 15,
    borderRadius: 5,
  },
  saveButtonText: {
    color: '#fff',
    fontWeight: 'bold',
  },
  disabledButton: {
    backgroundColor: '#ccc',
  },
});