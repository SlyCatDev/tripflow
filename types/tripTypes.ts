import { Timestamp, GeoPoint } from "firebase/firestore";

// Interface complète pour une étape de voyage
export interface TripStep {
  id: string;
  tripId: string;
  name: string;
  location: {
    geopoint?: GeoPoint;  // Ajout du GeoPoint optionnel pour la conversion
    name?: string;        // Nom de la localisation (optionnel)
  };
  startDate: Timestamp;
  endDate?: Timestamp;
  description?: string;
  activities?: string[];
  createdAt: Timestamp;
  journal?: JournalEntry[]; // Journal de bord pour cette étape
}

// Interface pour une entrée du journal de bord
export interface JournalEntry {
  id: string;
  text: string;
  photos?: string[]; // Tableau d'URLs des photos
  createdAt: Timestamp;
  updatedAt?: Timestamp;
}

// Type pour la création d'une entrée de journal
export type JournalEntryCreateData = Omit<JournalEntry, 'id' | 'createdAt'>;

// Type pour la création d'une étape (sans id ni createdAt)
export type TripStepCreateData = Omit<TripStep, 'id' | 'createdAt'>;

// Type pour la mise à jour d'une étape (tout est optionnel sauf l'id)
export type TripStepUpdateData = Partial<Omit<TripStep, 'id' | 'createdAt' | 'tripId'>> & { id: string };

// Type pour le formulaire d'étape (tripId est séparé)
export type TripStepFormData = Omit<TripStep, 'id' | 'tripId' | 'createdAt'> & { id?: string };

// Interface pour un voyage
export interface Trip {
  id: string;
  title: string;
  description?: string;
  startDate: Timestamp;
  endDate: Timestamp;
  userId: string;
  coverImageUrl?: string; // URL de l'image de couverture (optionnelle)
  createdAt: Timestamp;
}

// Type pour la création d'un voyage (sans id ni createdAt)
export type TripCreateData = Omit<Trip, 'id' | 'createdAt'>;

// Type pour la mise à jour d'un voyage (tout est optionnel sauf l'id)
export type TripUpdateData = Partial<Omit<Trip, 'id' | 'createdAt' | 'userId'>> & { id: string };

// Type pour les étapes dans le formulaire de création de voyage (avant enregistrement dans Firebase)
export interface LocalTripStep {
  name: string;
  description?: string;
  activities: string[];
  location: {
    geopoint?: GeoPoint; // Ajout du GeoPoint optionnel pour la conversion
    name?: string;       // Nom de la localisation (optionnel)
  };
  startDate: Date;
  endDate?: Date;
  journal?: JournalEntry[]; // Journal de bord pour cette étape
}