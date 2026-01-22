import { View, Text, StyleSheet } from "react-native";
import { useLocalSearchParams } from "expo-router";

// Design system colors
const COLORS = {
  forestGreen: "#2D5A27",
  creamWhite: "#FFF8E7",
  earthBrown: "#795548",
};

export default function GoalDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Goal Details</Text>
      <Text style={styles.text}>Goal ID: {id}</Text>
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
