import { Stack } from 'expo-router';

export default function WellnessLayout() {
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="index" />
      <Stack.Screen name="quiz" />
      <Stack.Screen name="breathing" />
      <Stack.Screen name="goals" />
      <Stack.Screen name="therapy" />
    </Stack>
  );
}