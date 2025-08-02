import { Stack } from 'expo-router';

export default function MoodLayout() {
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="index" />
      <Stack.Screen name="journal" />
      <Stack.Screen name="sentiment" />
      <Stack.Screen name="tracking" />
    </Stack>
  );
}