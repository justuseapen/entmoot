import React, { useEffect, useState } from "react";
import { View, Text, StyleSheet } from "react-native";
import { COLORS } from "@/theme/colors";
import {
  FirstGoalPrompt,
  useFirstGoalPrompt,
} from "@/components/FirstGoalPrompt";

export default function TodayScreen() {
  const { isEligible, isChecking, dismiss } = useFirstGoalPrompt();
  const [showPrompt, setShowPrompt] = useState(false);

  // Show prompt when eligibility check completes and user is eligible
  useEffect(() => {
    if (!isChecking && isEligible) {
      setShowPrompt(true);
    }
  }, [isChecking, isEligible]);

  const handleClosePrompt = () => {
    setShowPrompt(false);
    dismiss();
  };

  const handleGoalCreated = (_goalId: number) => {
    // Could navigate to goal detail or refresh goals list
    // For now, just close the prompt
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Today</Text>
      <Text style={styles.text}>Plan your day</Text>

      {/* First Goal Prompt Modal */}
      <FirstGoalPrompt
        visible={showPrompt}
        onClose={handleClosePrompt}
        onGoalCreated={handleGoalCreated}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: COLORS.background,
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    color: COLORS.secondary,
    marginBottom: 8,
  },
  text: {
    fontSize: 16,
    color: COLORS.earthBrown,
  },
});
