import { Stack } from 'expo-router';

export default function SleepLayout() {
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="index" />
      <Stack.Screen name="log" />
      <Stack.Screen name="trends" />
    </Stack>
  );
}