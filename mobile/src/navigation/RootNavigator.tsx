import { createNativeStackNavigator } from "@react-navigation/native-stack";
import type { RootStackParamList } from "./types";
import { AuthNavigator } from "./AuthNavigator";
import { MainTabNavigator } from "./MainTabNavigator";
import {
  GoalDetailScreen,
  CreateGoalScreen,
  EditGoalScreen,
} from "../screens/goals";
import { View, Text, StyleSheet } from "react-native";

// Design system colors
const COLORS = {
  forestGreen: "#2D5A27",
  creamWhite: "#FFF8E7",
  earthBrown: "#795548",
};

// Placeholder screens for stack screens (to be implemented in future stories)
const FamilyMemberDetailScreen = () => (
  <View style={styles.container}>
    <Text style={styles.text}>Family Member Detail Screen</Text>
  </View>
);

const InviteMemberScreen = () => (
  <View style={styles.container}>
    <Text style={styles.text}>Invite Member Screen</Text>
  </View>
);

const NotificationsScreen = () => (
  <View style={styles.container}>
    <Text style={styles.text}>Notifications Screen</Text>
  </View>
);

const ProfileScreen = () => (
  <View style={styles.container}>
    <Text style={styles.text}>Profile Screen</Text>
  </View>
);

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: COLORS.creamWhite,
  },
  text: {
    fontSize: 18,
    color: COLORS.forestGreen,
  },
});

const Stack = createNativeStackNavigator<RootStackParamList>();

interface RootNavigatorProps {
  isAuthenticated: boolean;
}

export function RootNavigator({ isAuthenticated }: RootNavigatorProps) {
  return (
    <Stack.Navigator
      screenOptions={{
        headerStyle: {
          backgroundColor: COLORS.creamWhite,
        },
        headerTintColor: COLORS.forestGreen,
        headerTitleStyle: {
          fontWeight: "600",
        },
      }}
    >
      {isAuthenticated ? (
        <>
          <Stack.Screen
            name="Main"
            component={MainTabNavigator}
            options={{ headerShown: false }}
          />
          <Stack.Screen
            name="GoalDetail"
            component={GoalDetailScreen}
            options={{ title: "Goal Details" }}
          />
          <Stack.Screen
            name="CreateGoal"
            component={CreateGoalScreen}
            options={{ title: "Create Goal" }}
          />
          <Stack.Screen
            name="EditGoal"
            component={EditGoalScreen}
            options={{ title: "Edit Goal" }}
          />
          <Stack.Screen
            name="FamilyMemberDetail"
            component={FamilyMemberDetailScreen}
            options={{ title: "Member Details" }}
          />
          <Stack.Screen
            name="InviteMember"
            component={InviteMemberScreen}
            options={{ title: "Invite Member" }}
          />
          <Stack.Screen
            name="Notifications"
            component={NotificationsScreen}
            options={{ title: "Notifications" }}
          />
          <Stack.Screen
            name="Profile"
            component={ProfileScreen}
            options={{ title: "Profile" }}
          />
        </>
      ) : (
        <Stack.Screen
          name="Auth"
          component={AuthNavigator}
          options={{ headerShown: false }}
        />
      )}
    </Stack.Navigator>
  );
}
