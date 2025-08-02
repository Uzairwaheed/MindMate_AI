import { Stack } from 'expo-router';

export default function AuthLayout() {
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="login" />
      <Stack.Screen name="signup" />
      <Stack.Screen name="signup-step2" />
      <Stack.Screen name="signup-step3" />
      <Stack.Screen name="forgot-password" />
    </Stack>
  );
}