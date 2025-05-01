import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { storage } from "./config";

/**
 * Télécharge une image vers Firebase Storage et retourne l'URL de téléchargement
 * @param uri URI de l'image à télécharger
 * @param folder Dossier de destination dans Storage (par défaut 'trip-covers')
 * @returns Promise avec l'URL de l'image téléchargée
 */
export async function uploadImage(uri: string, folder = 'trip-covers'): Promise<string> {
  try {
    // Génère un nom de fichier unique basé sur le timestamp
    const filename = `${Date.now()}.jpg`;
    const storageRef = ref(storage, `${folder}/${filename}`);
    
    // Convertir l'URI en blob pour le téléchargement
    const response = await fetch(uri);
    const blob = await response.blob();
    
    // Télécharger le fichier sur Firebase Storage
    const snapshot = await uploadBytes(storageRef, blob);
    
    // Récupérer l'URL de téléchargement
    const downloadURL = await getDownloadURL(snapshot.ref);
    
    console.log('Image téléchargée avec succès:', downloadURL);
    return downloadURL;
  } catch (error) {
    console.error('Erreur lors du téléchargement de l\'image:', error);
    throw error;
  }
}

/**
 * Construction d'un objet URI local à partir d'une URI de fichier de l'appareil 
 * @param uri URI du fichier local
 * @returns Objet URI pour React Native
 */
export function getLocalImageUri(uri: string) {
  return { uri };
}