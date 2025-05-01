import { Stack } from 'expo-router';

export default function TripLayout() {
  return (
    <Stack screenOptions={{ headerBackVisible: false }}>
      <Stack.Screen
        name="[id]"
        options={{
          headerTitle: "Détails du voyage",
          headerBackTitle: "Retour",
        }}
      />
    </Stack>
  );
}