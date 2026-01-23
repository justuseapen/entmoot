import React, { useState, useRef } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
} from "react-native";
import PagerView from "react-native-pager-view";
import { router } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { COLORS } from "@/theme/colors";
import { Button, H1, Body } from "@/components/ui";

interface OnboardingPage {
  id: number;
  title: string;
  description: string;
  icon: keyof typeof Ionicons.glyphMap;
}

const PAGES: OnboardingPage[] = [
  {
    id: 0,
    title: "Welcome to Entmoot",
    description:
      "Your family's companion for intentional planning and mindful goal-setting.",
    icon: "leaf",
  },
  {
    id: 1,
    title: "Plan Your Day",
    description:
      "Start each morning with clarity. Set intentions, priorities, and tasks that matter.",
    icon: "sunny",
  },
  {
    id: 2,
    title: "Track Habits",
    description:
      "Build consistency with daily non-negotiables. Watch your streaks grow.",
    icon: "checkmark-circle",
  },
  {
    id: 3,
    title: "Achieve Goals",
    description:
      "Set SMART goals with AI assistance. Review weekly to stay on track.",
    icon: "trophy",
  },
];

export default function OnboardingScreen() {
  const [currentPage, setCurrentPage] = useState(0);
  const pagerRef = useRef<PagerView>(null);

  const isLastPage = currentPage === PAGES.length - 1;

  const handlePageSelected = (e: { nativeEvent: { position: number } }) => {
    setCurrentPage(e.nativeEvent.position);
  };

  const handleSkip = () => {
    router.push("/onboarding/family-setup");
  };

  const handleGetStarted = () => {
    router.push("/onboarding/family-setup");
  };

  const handleNext = () => {
    if (pagerRef.current && currentPage < PAGES.length - 1) {
      pagerRef.current.setPage(currentPage + 1);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Skip button */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.skipButton}
          onPress={handleSkip}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          <Text style={styles.skipText}>Skip</Text>
        </TouchableOpacity>
      </View>

      {/* Swipeable pages */}
      <PagerView
        ref={pagerRef}
        style={styles.pagerView}
        initialPage={0}
        onPageSelected={handlePageSelected}
      >
        {PAGES.map((page) => (
          <View key={page.id} style={styles.page}>
            <View style={styles.iconContainer}>
              <Ionicons
                name={page.icon}
                size={120}
                color={page.id === 0 ? COLORS.secondary : COLORS.primary}
              />
            </View>
            <H1 style={styles.title}>{page.title}</H1>
            <Body style={styles.description}>{page.description}</Body>
          </View>
        ))}
      </PagerView>

      {/* Page indicators */}
      <View style={styles.indicatorContainer}>
        {PAGES.map((page) => (
          <View
            key={page.id}
            style={[
              styles.indicator,
              currentPage === page.id && styles.indicatorActive,
            ]}
          />
        ))}
      </View>

      {/* Bottom buttons */}
      <View style={styles.bottomContainer}>
        {isLastPage ? (
          <Button fullWidth size="large" onPress={handleGetStarted}>
            Get Started
          </Button>
        ) : (
          <View style={styles.navigationButtons}>
            <View style={styles.spacer} />
            <TouchableOpacity
              style={styles.nextButton}
              onPress={handleNext}
              activeOpacity={0.7}
            >
              <Text style={styles.nextText}>Next</Text>
              <Ionicons name="arrow-forward" size={20} color={COLORS.primary} />
            </TouchableOpacity>
          </View>
        )}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  header: {
    flexDirection: "row",
    justifyContent: "flex-end",
    paddingHorizontal: 20,
    paddingTop: 10,
  },
  skipButton: {
    paddingVertical: 8,
    paddingHorizontal: 16,
  },
  skipText: {
    fontSize: 16,
    color: COLORS.textSecondary,
    fontWeight: "500",
  },
  pagerView: {
    flex: 1,
  },
  page: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 40,
  },
  iconContainer: {
    width: 200,
    height: 200,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 40,
    backgroundColor: COLORS.surface,
    borderRadius: 100,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 4,
  },
  title: {
    textAlign: "center",
    marginBottom: 16,
    color: COLORS.text,
  },
  description: {
    textAlign: "center",
    color: COLORS.textSecondary,
    lineHeight: 24,
    paddingHorizontal: 20,
  },
  indicatorContainer: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    paddingVertical: 20,
  },
  indicator: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: COLORS.border,
    marginHorizontal: 6,
  },
  indicatorActive: {
    width: 24,
    backgroundColor: COLORS.primary,
  },
  bottomContainer: {
    paddingHorizontal: 20,
    paddingBottom: 30,
  },
  navigationButtons: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  spacer: {
    width: 80,
  },
  nextButton: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 12,
    paddingHorizontal: 20,
  },
  nextText: {
    fontSize: 16,
    color: COLORS.primary,
    fontWeight: "600",
    marginRight: 8,
  },
});
