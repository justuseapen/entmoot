import { Stack } from "expo-router";

// Design system colors
const COLORS = {
  forestGreen: "#2D5A27",
  creamWhite: "#FFF8E7",
};

export default function AuthLayout() {
  return (
    <Stack
      screenOptions={{
        headerShown: false,
        contentStyle: {
          backgroundColor: COLORS.creamWhite,
        },
      }}
    >
      <Stack.Screen name="login" />
      <Stack.Screen name="register" />
      <Stack.Screen name="forgot-password" />
    </Stack>
  );
}
