import { Tabs } from "expo-router";
import { Ionicons } from "@expo/vector-icons";

// Design system colors
const COLORS = {
  forestGreen: "#2D5A27",
  creamWhite: "#FFF8E7",
  earthBrown: "#795548",
};

type IconName = React.ComponentProps<typeof Ionicons>["name"];

export default function TabLayout() {
  return (
    <Tabs
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
        headerTitleStyle: {
          fontWeight: "600",
        },
      }}
    >
      <Tabs.Screen
        name="today"
        options={{
          title: "Today",
          tabBarLabel: "Today",
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="sunny-outline" size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="goals"
        options={{
          title: "Goals",
          tabBarLabel: "Goals",
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="flag-outline" size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="me"
        options={{
          title: "Me",
          tabBarLabel: "Me",
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="person-outline" size={size} color={color} />
          ),
        }}
      />
    </Tabs>
  );
}
