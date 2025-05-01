import React, { useState } from 'react';
import { StyleSheet, View, TouchableOpacity, Alert, Image, ScrollView } from 'react-native';
import { ThemedView } from './ThemedView';
import { ThemedText } from './ThemedText';
import { IconSymbol } from './ui/IconSymbol';
import { JournalEntry } from '@/types/tripTypes';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { deleteJournalEntry } from '@/src/firebase/firestore';
import JournalForm from './JournalForm';

interface JournalDisplayProps {
  stepId: string;
  entries: JournalEntry[];
  onUpdate: () => void;
}

export default function JournalDisplay({ stepId, entries, onUpdate }: JournalDisplayProps) {
  const [showForm, setShowForm] = useState(false);
  const [entryToEdit, setEntryToEdit] = useState<JournalEntry | null>(null);

  // Formatage de la date d'une entrée
  const formatEntryDate = (timestamp: any): string => {
    if (!timestamp || typeof timestamp.toDate !== 'function') {
      return 'Date non disponible';
    }
    return format(timestamp.toDate(), 'dd MMMM yyyy à HH:mm', { locale: fr });
  };

  // Gérer l'ajout d'une nouvelle entrée
  const handleAddEntry = () => {
    console.log("Ouverture du formulaire pour une nouvelle entrée du journal");
    setEntryToEdit(null);
    setShowForm(true);
  };

  // Gérer la modification d'une entrée
  const handleEditEntry = (entry: JournalEntry) => {
    console.log("Ouverture du formulaire pour modifier l'entrée:", entry.id);
    setEntryToEdit(entry);
    setShowForm(true);
  };

  // Gérer la suppression d'une entrée
  const handleDeleteEntry = (entryId: string) => {
    if (!stepId || !entryId) {
      console.error("Impossible de supprimer l'entrée: stepId ou entryId manquant");
      Alert.alert("Erreur", "Identifiants manquants pour la suppression");
      return;
    }
    
    Alert.alert(
      "Supprimer cette entrée",
      "Êtes-vous sûr de vouloir supprimer cette entrée du journal ?",
      [
        { text: "Annuler", style: "cancel" },
        {
          text: "Supprimer",
          style: "destructive",
          onPress: async () => {
            try {
              console.log(`Tentative de suppression de l'entrée ${entryId} de l'étape ${stepId}`);
              await deleteJournalEntry(stepId, entryId);
              console.log("Entrée supprimée avec succès");
              
              // Appeler le callback pour mettre à jour la liste après suppression
              if (onUpdate) {
                console.log("Appel du callback onUpdate après suppression");
                onUpdate();
              }
            } catch (error) {
              console.error("Erreur lors de la suppression de l'entrée:", error);
              Alert.alert("Erreur", `Impossible de supprimer cette entrée: ${error.message || error}`);
            }
          }
        }
      ]
    );
  };

  // Gérer le succès du formulaire d'entrée de journal
  const handleFormSuccess = () => {
    console.log("Formulaire soumis avec succès, fermeture et rafraîchissement");
    setShowForm(false);
    setEntryToEdit(null);
    
    // Appeler le callback pour mettre à jour la liste après ajout/modification
    if (onUpdate) {
      console.log("Appel du callback onUpdate après ajout/modification");
      onUpdate();
    }
  };

  // Annuler l'édition/ajout d'une entrée
  const handleFormCancel = () => {
    console.log("Annulation du formulaire");
    setShowForm(false);
    setEntryToEdit(null);
  };

  return (
    <ThemedView style={styles.container}>
      {/* Formulaire d'ajout ou modification */}
      {showForm && (
        <JournalForm
          stepId={stepId}
          existingEntry={entryToEdit || undefined}
          onSuccess={handleFormSuccess}
          onCancel={handleFormCancel}
        />
      )}

      {/* Contenu affiché quand le formulaire n'est pas visible */}
      {!showForm && (
        <>
          {/* Bouton pour ajouter une entrée */}
          <View style={styles.bigButtonContainer}>
            <TouchableOpacity 
              style={styles.bigAddButton} 
              onPress={handleAddEntry}
              activeOpacity={0.7}
            >
              <IconSymbol name="plus.circle.fill" size={24} color="#fff" />
              <ThemedText style={styles.bigAddButtonText}>Ajouter une entrée au journal</ThemedText>
            </TouchableOpacity>
          </View>

          {/* Affichage des entrées existantes */}
          {entries && entries.length > 0 ? (
            <View style={styles.entriesList}>
              <ThemedText type="defaultSemiBold" style={styles.entriesTitle}>
                Entrées existantes ({entries.length})
              </ThemedText>
              
              {entries
                .sort((a, b) => b.createdAt.seconds - a.createdAt.seconds)
                .map((entry) => (
                  <ThemedView key={entry.id} style={styles.entryCard}>
                    <View style={styles.entryHeader}>
                      <ThemedText style={styles.entryDate}>
                        {formatEntryDate(entry.createdAt)}
                      </ThemedText>
                      <View style={styles.entryActions}>
                        <TouchableOpacity
                          style={styles.actionButton}
                          onPress={() => handleEditEntry(entry)}
                        >
                          <IconSymbol name="pencil" size={16} color="#0a7ea4" />
                        </TouchableOpacity>
                        <TouchableOpacity
                          style={styles.actionButton}
                          onPress={() => handleDeleteEntry(entry.id)}
                        >
                          <IconSymbol name="trash" size={16} color="#ff3b30" />
                        </TouchableOpacity>
                      </View>
                    </View>

                    <ThemedText style={styles.entryText}>{entry.text}</ThemedText>

                    {/* Affichage des photos */}
                    {entry.photos && entry.photos.length > 0 && (
                      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.photosList}>
                        {entry.photos.map((photo, index) => (
                          <Image key={index} source={{ uri: photo }} style={styles.photo} />
                        ))}
                      </ScrollView>
                    )}
                  </ThemedView>
                ))}
            </View>
          ) : (
            <View style={styles.emptyContainer}>
              <ThemedText style={styles.emptyMessage}>
                Aucune entrée dans le journal pour cette étape.
              </ThemedText>
            </View>
          )}
        </>
      )}
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 15,
    borderRadius: 10,
    marginTop: 10,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 15,
  },
  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#0a7ea4',
    paddingVertical: 5,
    paddingHorizontal: 10,
    borderRadius: 5,
  },
  addButtonText: {
    color: '#fff',
    marginLeft: 5,
    fontSize: 14,
  },
  bigButtonContainer: {
    alignItems: 'center',
    marginVertical: 15,
  },
  bigAddButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#0a7ea4',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 8,
    width: '100%',
    justifyContent: 'center',
  },
  bigAddButtonText: {
    color: '#fff',
    marginLeft: 8,
    fontSize: 16,
    fontWeight: '500',
  },
  emptyContainer: {
    padding: 20,
    alignItems: 'center',
  },
  emptyMessage: {
    fontStyle: 'italic',
    color: '#666',
    textAlign: 'center',
    marginBottom: 15,
  },
  entriesList: {
    marginTop: 10,
  },
  entriesTitle: {
    marginBottom: 10,
  },
  entryCard: {
    padding: 12,
    marginBottom: 10,
    borderRadius: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 1,
  },
  entryHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  entryDate: {
    color: '#666',
    fontSize: 12,
  },
  entryActions: {
    flexDirection: 'row',
  },
  actionButton: {
    padding: 5,
    marginLeft: 8,
  },
  entryText: {
    marginBottom: 10,
  },
  photosList: {
    flexDirection: 'row',
    marginTop: 5,
  },
  photo: {
    width: 100,
    height: 100,
    borderRadius: 5,
    marginRight: 8,
  },
});