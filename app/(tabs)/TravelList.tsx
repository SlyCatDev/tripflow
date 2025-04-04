import { StyleSheet } from 'react-native';

import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { IconSymbol } from '@/components/ui/IconSymbol';

export default function TravelList() {
  return (
    <ThemedView style={styles.container}>
      <IconSymbol name="paperplane.fill" size={50} color="black" />
      <ThemedText type="title" style={{ marginBottom: 20 }}>
        Travel List
      </ThemedText>
      <ThemedText>
        Hello world Travel
      </ThemedText>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
  },
});
