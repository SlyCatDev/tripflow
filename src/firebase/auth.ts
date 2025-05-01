import { 
  getAuth, 
  createUserWithEmailAndPassword, 
  signInWithEmailAndPassword,
  signOut as firebaseSignOut,
  User,
  onAuthStateChanged,
} from "firebase/auth";
import { Alert } from 'react-native';
import app from './config';
import { addUser } from './firestore';

const auth = getAuth(app);

// Fonction d'inscription avec création de profil utilisateur
export async function signUp(email: string, password: string): Promise<User> {
  try {
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    const user = userCredential.user;
    
    // Créer un profil utilisateur dans Firestore
    await addUser({
      userId: user.uid,
      email: user.email || email,
      displayName: user.displayName || email.split('@')[0],
      // photoURL: user.photoURL || undefined,
      createdAt: Date.now()
    });
    
    return user;
  } catch (error: any) {
    console.error("Erreur d'inscription:", error.code, error.message);
    throw error;
  }
}

export async function signIn(email: string, password: string): Promise<User> {
  try {
    const userCredential = await signInWithEmailAndPassword(auth, email, password);
    return userCredential.user;
  } catch (error: any) {
    console.error("Erreur de connexion:", error.code, error.message);
    throw error;
  }
}


export async function SignOut(options?: { 
  router?: any;  // Instance router d'Expo
  redirectTo?: string; // Route de redirection après déconnexion 
  showConfirmation?: boolean; // Afficher une confirmation avant déconnexion
  onSuccess?: () => void; // Callback en cas de succès
  onError?: (error: any) => void; // Callback en cas d'erreur
}): Promise<void> {
  const performSignOut = async () => {
    try {
      await firebaseSignOut(auth);
      console.log("Déconnexion réussie");
      
      if (options?.router && options?.redirectTo) {
        options.router.replace(options.redirectTo);
      }
      
      options?.onSuccess?.();
    } catch (error) {
      console.error("Erreur lors de la déconnexion:", error);
      options?.onError?.(error);
      throw error;
    }
  };

  if (options?.showConfirmation && typeof Alert !== 'undefined') {
    Alert.alert(
      "Déconnexion",
      "Êtes-vous sûr de vouloir vous déconnecter ?",
      [
        { text: "Annuler", style: "cancel" },
        { 
          text: "Déconnexion", 
          style: "destructive", 
          onPress: performSignOut 
        }
      ]
    );
    return;
  }
  
  return performSignOut();
}

export function getCurrentUser(): User | null {
  return auth.currentUser;
}

export function checkPasswordValidity(password: string): boolean {
  return password.length >= 6;
}

export function observeAuthState(callback: (user: User | null) => void) {
  return onAuthStateChanged(auth, callback);
}

export { auth };