import { Timestamp, GeoPoint } from "firebase/firestore";
import { LocalTripStep, TripStepCreateData, TripStepFormData, TripStep } from "@/types/tripTypes";

/**
 * Convertit un LocalTripStep (format du formulaire avec Date JS) en TripStepCreateData (format Firebase avec Timestamp)
 */



/**
 * Convertit un TripStep (format complet Firebase) en TripStepFormData (format pour édition dans le formulaire)
 */
export function tripStepToFormData(tripStep: TripStep): TripStepFormData {
  const { id, tripId, createdAt, ...formData } = tripStep;
  return {
    ...formData,
    id
  };
}

/**
 * Extrait les coordonnées d'un GeoPoint Firestore
 */
export function geoPointToCoordinates(geopoint: GeoPoint): { latitude: number, longitude: number } {
  return {
    latitude: geopoint.latitude,
    longitude: geopoint.longitude
  };
}

/**
 * Convertit un objet Date en Timestamp Firestore
 */
export function dateToTimestamp(date: Date | null): Timestamp | null {
  return date ? Timestamp.fromDate(date) : null;
}

/**
 * Convertit un Timestamp Firestore en objet Date
 */
export function timestampToDate(timestamp: Timestamp | null): Date | null {
  return timestamp ? timestamp.toDate() : null;
}

/**
 * Formate une chaîne d'activités en tableau
 */
export function stringToActivitiesArray(activitiesString: string): string[] {
  return activitiesString
    .split(',')
    .map(a => a.trim())
    .filter(a => a);
}