import { View, Text, StyleSheet } from "react-native";

// Design system colors
const COLORS = {
  forestGreen: "#2D5A27",
  creamWhite: "#FFF8E7",
  earthBrown: "#795548",
};

export default function LoginScreen() {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Login</Text>
      <Text style={styles.text}>Sign in to your account</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: COLORS.creamWhite,
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    color: COLORS.forestGreen,
    marginBottom: 8,
  },
  text: {
    fontSize: 16,
    color: COLORS.earthBrown,
  },
});
