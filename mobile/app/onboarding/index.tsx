import { View, Text, StyleSheet } from "react-native";

// Design system colors
const COLORS = {
  forestGreen: "#2D5A27",
  creamWhite: "#FFF8E7",
  earthBrown: "#795548",
};

export default function OnboardingScreen() {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Welcome to Entmoot</Text>
      <Text style={styles.text}>Let's get started with your family planning journey</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: COLORS.creamWhite,
    padding: 20,
  },
  title: {
    fontSize: 28,
    fontWeight: "bold",
    color: COLORS.forestGreen,
    marginBottom: 12,
    textAlign: "center",
  },
  text: {
    fontSize: 16,
    color: COLORS.earthBrown,
    textAlign: "center",
  },
});
