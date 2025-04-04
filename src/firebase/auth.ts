import { 
  getAuth, 
  createUserWithEmailAndPassword, 
  signInWithEmailAndPassword,
  signOut as firebaseSignOut,
  User,
  onAuthStateChanged
} from "firebase/auth";
import app from './config';

const auth = getAuth(app);

// Fonction d'inscription
export async function signUp(email: string, password: string): Promise<User> {
  try {
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    return userCredential.user;
  } catch (error: any) {
    console.error("Erreur d'inscription:", error.code, error.message);
    throw error;
  }
}

// Fonction de connexion
export async function signIn(email: string, password: string): Promise<User> {
  try {
    const userCredential = await signInWithEmailAndPassword(auth, email, password);
    return userCredential.user;
  } catch (error: any) {
    console.error("Erreur de connexion:", error.code, error.message);
    throw error;
  }
}

// Fonction de déconnexion
export async function signOut(): Promise<void> {
  try {
    await firebaseSignOut(auth);
    console.log("Déconnexion réussie");
  } catch (error: any) {
    console.error("Erreur lors de la déconnexion:", error);
    throw error;
  }
}

// Fonction pour obtenir l'utilisateur actuel
export function getCurrentUser(): User | null {
  return auth.currentUser;
}

// Vérifier si le mot de passe est valide (version simplifiée)
export function checkPasswordValidity(password: string): boolean {
  return password.length >= 6;
}

// Fonction pour observer les changements d'authentification
export function observeAuthState(callback: (user: User | null) => void) {
  return onAuthStateChanged(auth, callback);
}

export { auth };