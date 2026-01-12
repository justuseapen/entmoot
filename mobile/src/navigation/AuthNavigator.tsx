import { createNativeStackNavigator } from "@react-navigation/native-stack";
import type { AuthStackParamList } from "./types";

// Placeholder screens - will be implemented in US-062
import { View, Text, StyleSheet } from "react-native";

const LoginScreen = () => (
  <View style={styles.container}>
    <Text style={styles.text}>Login Screen</Text>
  </View>
);

const RegisterScreen = () => (
  <View style={styles.container}>
    <Text style={styles.text}>Register Screen</Text>
  </View>
);

const ForgotPasswordScreen = () => (
  <View style={styles.container}>
    <Text style={styles.text}>Forgot Password Screen</Text>
  </View>
);

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#FFF8E7",
  },
  text: {
    fontSize: 18,
    color: "#2D5A27",
  },
});

const Stack = createNativeStackNavigator<AuthStackParamList>();

export function AuthNavigator() {
  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: false,
      }}
    >
      <Stack.Screen name="Login" component={LoginScreen} />
      <Stack.Screen name="Register" component={RegisterScreen} />
      <Stack.Screen name="ForgotPassword" component={ForgotPasswordScreen} />
    </Stack.Navigator>
  );
}
