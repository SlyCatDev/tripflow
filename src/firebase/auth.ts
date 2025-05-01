import { 
  getAuth, 
  createUserWithEmailAndPassword, 
  signInWithEmailAndPassword,
  signOut as firebaseSignOut,
  User,
  onAuthStateChanged,
} from "firebase/auth";
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

export async function signOut(): Promise<void> {
  try {
    await firebaseSignOut(auth);
    console.log("Déconnexion réussie");
  } catch (error: any) {
    console.error("Erreur lors de la déconnexion:", error);
    throw error;
  }
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