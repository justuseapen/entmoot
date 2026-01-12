import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import type { MainTabParamList } from "./types";
import { View, Text, StyleSheet } from "react-native";

// Design system colors
const COLORS = {
  forestGreen: "#2D5A27",
  leafGreen: "#7CB342",
  creamWhite: "#FFF8E7",
  earthBrown: "#795548",
};

// Placeholder screens - will be implemented in subsequent stories
const DashboardScreen = () => (
  <View style={styles.container}>
    <Text style={styles.title}>Dashboard</Text>
    <Text style={styles.text}>Welcome to Entmoot!</Text>
  </View>
);

const GoalsScreen = () => (
  <View style={styles.container}>
    <Text style={styles.title}>Goals</Text>
    <Text style={styles.text}>Your goals will appear here</Text>
  </View>
);

const DailyPlannerScreen = () => (
  <View style={styles.container}>
    <Text style={styles.title}>Daily Planner</Text>
    <Text style={styles.text}>Plan your day</Text>
  </View>
);

const FamilyScreen = () => (
  <View style={styles.container}>
    <Text style={styles.title}>Family</Text>
    <Text style={styles.text}>Manage your family</Text>
  </View>
);

const SettingsScreen = () => (
  <View style={styles.container}>
    <Text style={styles.title}>Settings</Text>
    <Text style={styles.text}>App settings</Text>
  </View>
);

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

const Tab = createBottomTabNavigator<MainTabParamList>();

export function MainTabNavigator() {
  return (
    <Tab.Navigator
      screenOptions={{
        tabBarActiveTintColor: COLORS.forestGreen,
        tabBarInactiveTintColor: COLORS.earthBrown,
        tabBarStyle: {
          backgroundColor: COLORS.creamWhite,
          borderTopColor: `${COLORS.forestGreen}20`,
        },
        headerStyle: {
          backgroundColor: COLORS.creamWhite,
        },
        headerTintColor: COLORS.forestGreen,
      }}
    >
      <Tab.Screen
        name="Dashboard"
        component={DashboardScreen}
        options={{
          title: "Home",
          tabBarLabel: "Home",
        }}
      />
      <Tab.Screen
        name="Goals"
        component={GoalsScreen}
        options={{
          title: "Goals",
          tabBarLabel: "Goals",
        }}
      />
      <Tab.Screen
        name="DailyPlanner"
        component={DailyPlannerScreen}
        options={{
          title: "Daily",
          tabBarLabel: "Daily",
        }}
      />
      <Tab.Screen
        name="Family"
        component={FamilyScreen}
        options={{
          title: "Family",
          tabBarLabel: "Family",
        }}
      />
      <Tab.Screen
        name="Settings"
        component={SettingsScreen}
        options={{
          title: "Settings",
          tabBarLabel: "Settings",
        }}
      />
    </Tab.Navigator>
  );
}
