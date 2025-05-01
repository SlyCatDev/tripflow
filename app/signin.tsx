import { StyleSheet, Text, View, TextInput, TouchableOpacity, Alert } from 'react-native';
import { router } from 'expo-router';
import { useState } from 'react';
import { signIn } from '@/src/firebase/auth';

export default function SignIn() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleLogin = async () => {
    if (!email || !password) {
      Alert.alert('Erreur', 'Veuillez remplir tous les champs');
      return;
    }

    setIsLoading(true);
    try {
      await signIn(email, password);
      // Naviguer vers les onglets après connexion
      router.replace('/(tabs)');
    } catch (error: any) {
      Alert.alert('Erreur de connexion', 
        error.code === 'auth/invalid-credential' 
          ? 'Email ou mot de passe incorrect' 
          : 'Une erreur est survenue lors de la connexion'
      );
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.headerContainer}>
      <Text style={styles.title}>Bienvenue sur TripFlow</Text>
      <Text style={styles.text}>Connectez-vous pour continuer</Text>
      </View>
      
      <View style={styles.inputContainer}>
      <TextInput 
        style={styles.input} 
        placeholder="Email" 
        value={email}
        onChangeText={setEmail}
        keyboardType="email-address"
        autoCapitalize="none"
      />
      <TextInput 
        style={styles.input} 
        placeholder="Mot de passe" 
        secureTextEntry
        value={password}
        onChangeText={setPassword}
      />
      <TouchableOpacity 
        style={[styles.button, isLoading && styles.buttonDisabled]} 
        onPress={handleLogin}
        disabled={isLoading}>
        <Text style={styles.buttonText}>
        {isLoading ? 'Connexion en cours' : 'Se connecter'}
        </Text>
      </TouchableOpacity>
      </View>
      
      <View style={styles.footer}>
      <Text style={styles.footerText}>Vous n'avez pas de compte ?</Text>
      <TouchableOpacity onPress={() => router.push('/signup')} disabled={isLoading}>
        <Text style={styles.footerLink}>Inscrivez-vous ici</Text>
      </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  headerContainer: {
    alignItems: 'center',
    marginBottom: 40,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  text: {
    fontSize: 16,
    color: '#666',
  },
  inputContainer: {
    width: '100%',
    marginBottom: 20,
  },
  input: {
    height: 50,
    borderColor: '#ccc',
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 15,
    marginBottom: 15,
  },
  button: {
    backgroundColor: '#0a7ea4',
    padding: 15,
    alignItems: 'center',
    borderRadius: 8,
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  footer: {
    marginTop: 30,
    alignItems: 'center',
  },
  footerText: {
    fontSize: 14,
    color: '#666',
    marginBottom: 5,
  },
  footerLink: {
    color: '#0a7ea4',
    fontSize: 14,
    fontWeight: '600',
  },
  buttonDisabled: {
    backgroundColor: '#cccccc',
  }
});