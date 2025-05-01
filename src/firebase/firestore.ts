import { collection, addDoc, setDoc, doc, deleteDoc, Timestamp, query, where, getDocs, updateDoc, getDoc, arrayUnion, arrayRemove } from "firebase/firestore";
import { getFirestore } from "firebase/firestore";
import app from './config';
import { Trip, TripCreateData, TripUpdateData, TripStep, TripStepCreateData, TripStepUpdateData, JournalEntry, JournalEntryCreateData } from "@/types/tripTypes";

const db = getFirestore(app);

// Ajoute un utilisateur
export async function addUser(userData: {
    userId: string,
    email: string,
    displayName?: string,
    createdAt: number
  }) {
    try {
      await setDoc(doc(db, "users", userData.userId), userData, {
        merge: true
      });
      console.log("Utilisateur ajouté avec succès");
      return userData.userId;
    } catch (error) {
      console.error("Erreur lors de l'ajout de l'utilisateur:", error);
      throw error;
    }
  }

// Ajoute un voyage
export async function addTrip(tripData: TripCreateData): Promise<string> {
  try {
    const docRef = await addDoc(collection(db, "trips"), {
      ...tripData,
      createdAt: Timestamp.now()
    });
    console.log("Voyage ajouté avec ID:", docRef.id);
    return docRef.id;
  } catch (error) {
    console.error("Erreur lors de l'ajout du voyage:", error);
    throw error;
  }
}

// Récupérer un voyage par son ID
export async function getTrip(tripId: string): Promise<Trip | null> {
  try {
    const tripDoc = await getDoc(doc(db, "trips", tripId));
    
    if (tripDoc.exists()) {
      return { 
        id: tripDoc.id, 
        ...tripDoc.data() as Omit<Trip, 'id'> 
      };
    }
    return null;
  } catch (error) {
    console.error("Erreur lors de la récupération du voyage:", error);
    throw error;
  }
}

// Mettre à jour un voyage
export async function updateTrip(tripId: string, tripData: TripUpdateData): Promise<void> {
  try {
    await updateDoc(doc(db, "trips", tripId), tripData);
    console.log("Voyage mis à jour avec succès");
  } catch (error) {
    console.error("Erreur lors de la mise à jour du voyage:", error);
    throw error;
  }
}

// Supprime un voyage
export async function deleteTrip(tripId: string): Promise<void> {
  try {
    await deleteDoc(doc(db, "trips", tripId));
    console.log("Voyage supprimé avec succès");
  } catch (error) {
    console.error("Erreur lors de la suppression du voyage:", error);
    throw error;
  }
}

// Ajouter une étape à un voyage
export async function addTripStep(stepData: TripStepCreateData): Promise<string> {
  try {
    const docRef = await addDoc(collection(db, "trip_steps"), {
      ...stepData,
      createdAt: Timestamp.now()
    });
    console.log("Étape ajoutée avec ID:", docRef.id);
    return docRef.id;
  } catch (error) {
    console.error("Erreur lors de l'ajout de l'étape:", error);
    throw error;
  }
}

// Récupérer les étapes d'un voyage
export async function getTripSteps(tripId: string): Promise<TripStep[]> {
  try {
    const q = query(
      collection(db, "trip_steps"), 
      where("tripId", "==", tripId)
    );
    const querySnapshot = await getDocs(q);
    
    return querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    } as TripStep));
  } catch (error) {
    console.error("Erreur lors de la récupération des étapes:", error);
    throw error;
  }
}

// Récupérer une étape par son ID
export async function getTripStep(stepId: string): Promise<TripStep | null> {
  try {
    const stepDoc = await getDoc(doc(db, "trip_steps", stepId));
    
    if (stepDoc.exists()) {
      return {
        id: stepDoc.id,
        ...stepDoc.data()
      } as TripStep;
    }
    return null;
  } catch (error) {
    console.error("Erreur lors de la récupération de l'étape:", error);
    throw error;
  }
}

// Mettre à jour une étape
export async function updateTripStep(stepId: string, stepData: TripStepUpdateData): Promise<void> {
  try {
    const { id, ...updateData } = stepData;
    await updateDoc(doc(db, "trip_steps", stepId), updateData);
    console.log("Étape mise à jour avec succès");
  } catch (error) {
    console.error("Erreur lors de la mise à jour de l'étape:", error);
    throw error;
  }
}

// Supprimer une étape
export async function deleteTripStep(stepId: string): Promise<boolean> {
  if (!stepId) {
    throw new Error("ID d'étape invalide ou manquant");
  }
  
  try {
    const stepRef = doc(db, "trip_steps", stepId);
    
    // Vérifier si l'étape existe avant de la supprimer
    const stepDoc = await getDoc(stepRef);
    if (!stepDoc.exists()) {
      throw new Error(`Aucune étape trouvée avec l'ID: ${stepId}`);
    }
    
    await deleteDoc(stepRef);
    console.log("Étape supprimée avec succès, ID:", stepId);
    return true;
  } catch (error) {
    console.error("Erreur lors de la suppression de l'étape:", error);
    throw error;
  }
}

// Fonctions pour le journal de bord

// Ajouter une entrée au journal d'une étape
export async function addJournalEntry(stepId: string, journalData: JournalEntryCreateData): Promise<string> {
  try {
    // Vérifier que l'étape existe
    const stepDoc = await getDoc(doc(db, "trip_steps", stepId));
    
    if (!stepDoc.exists()) {
      throw new Error(`Aucune étape trouvée avec l'ID: ${stepId}`);
    }
    
    // Créer une entrée de journal avec un ID unique
    const entryId = `entry_${Date.now()}`;
    const entry: JournalEntry = {
      id: entryId,
      text: journalData.text,
      photos: journalData.photos || [],
      createdAt: Timestamp.now(),
      updatedAt: Timestamp.now()
    };
    
    // Mettre à jour l'étape avec la nouvelle entrée de journal
    await updateDoc(doc(db, "trip_steps", stepId), {
      journal: arrayUnion(entry)
    });
    
    console.log("Entrée de journal ajoutée avec succès, ID:", entryId);
    return entryId;
  } catch (error) {
    console.error("Erreur lors de l'ajout de l'entrée de journal:", error);
    throw error;
  }
}

// Mettre à jour une entrée de journal
export async function updateJournalEntry(stepId: string, entryId: string, journalData: Partial<JournalEntryCreateData>): Promise<void> {
  try {
    // Obtenir l'étape et son journal actuel
    const stepDoc = await getDoc(doc(db, "trip_steps", stepId));
    
    if (!stepDoc.exists()) {
      throw new Error(`Aucune étape trouvée avec l'ID: ${stepId}`);
    }
    
    const stepData = stepDoc.data() as TripStep;
    const journal = stepData.journal || [];
    
    // Trouver l'entrée à mettre à jour
    const entryIndex = journal.findIndex(entry => entry.id === entryId);
    
    if (entryIndex === -1) {
      throw new Error(`Entrée de journal non trouvée avec l'ID: ${entryId}`);
    }
    
    // Créer la version mise à jour de l'entrée
    const updatedEntry: JournalEntry = {
      ...journal[entryIndex],
      text: journalData.text !== undefined ? journalData.text : journal[entryIndex].text,
      photos: journalData.photos !== undefined ? journalData.photos : journal[entryIndex].photos,
      updatedAt: Timestamp.now()
    };
    
    // Supprimer l'ancienne entrée et ajouter la nouvelle
    await updateDoc(doc(db, "trip_steps", stepId), {
      journal: arrayRemove(journal[entryIndex])
    });
    
    await updateDoc(doc(db, "trip_steps", stepId), {
      journal: arrayUnion(updatedEntry)
    });
    
    console.log("Entrée de journal mise à jour avec succès, ID:", entryId);
  } catch (error) {
    console.error("Erreur lors de la mise à jour de l'entrée de journal:", error);
    throw error;
  }
}

// Supprimer une entrée de journal
export async function deleteJournalEntry(stepId: string, entryId: string): Promise<void> {
  try {
    // Obtenir l'étape et son journal actuel
    const stepDoc = await getDoc(doc(db, "trip_steps", stepId));
    
    if (!stepDoc.exists()) {
      throw new Error(`Aucune étape trouvée avec l'ID: ${stepId}`);
    }
    
    const stepData = stepDoc.data() as TripStep;
    const journal = stepData.journal || [];
    
    // Trouver l'entrée à supprimer
    const entryToDelete = journal.find(entry => entry.id === entryId);
    
    if (!entryToDelete) {
      throw new Error(`Entrée de journal non trouvée avec l'ID: ${entryId}`);
    }
    
    // Supprimer l'entrée
    await updateDoc(doc(db, "trip_steps", stepId), {
      journal: arrayRemove(entryToDelete)
    });
    
    console.log("Entrée de journal supprimée avec succès, ID:", entryId);
  } catch (error) {
    console.error("Erreur lors de la suppression de l'entrée de journal:", error);
    throw error;
  }
}

// Exporter la référence à la base de données
export { db };