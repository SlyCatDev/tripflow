import { getAuth, createUserWithEmailAndPassword, validatePassword } from "firebase/auth";

const auth = getAuth();

// Fonction pour vérifier la validité du mot de passe
export async function checkPasswordValidity(password: string) {
  const status = await validatePassword(getAuth(), password);
  return {
    isValid: status.isValid,
    // requirements: {
    //   needsLowerCase: status.containsLowercaseLetter !== true,
    //   needsUpperCase: status.containsUppercaseLetter !== true,
    //   needsNumeric: status.containsNumericCharacter !== true,
    //   needsNonAlphanumeric: status.containsNonAlphanumericCharacter !== true,
    //   meetsCriteria: status.meetsAllRequirements === true,
    //   tooShort: status.isLongEnough !== true
    // }
  };
}

createUserWithEmailAndPassword(auth, email, password)
  .then((userCredential) => {
    // Signed up 
    const user = userCredential.user;
    // ...
  })
  .catch((error) => {
    const errorCode = error.code;
    const errorMessage = error.message;
    // ..
  });

  import { getAuth, signOut } from "firebase/auth";

signOut(auth).then(() => {
  // Sign-out successful.
}).catch((error) => {
  // An error happened.
});