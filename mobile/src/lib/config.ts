import Constants from "expo-constants";
import { API_URL } from "@env";

// Environment detection
type Environment = "development" | "staging" | "production";

const getEnvironment = (): Environment => {
  const releaseChannel = Constants.expoConfig?.extra?.releaseChannel;

  if (releaseChannel === "production") {
    return "production";
  }

  if (releaseChannel === "staging") {
    return "staging";
  }

  return "development";
};

// Construct full API URL from base URL
// Base URL comes from .env or eas.json env vars (WITHOUT /api/v1)
// We append /api/v1 here to construct the full API URL
const getApiUrl = (): string => {
  const baseUrl = API_URL || "http://localhost:3000";
  // Remove trailing slash if present
  const cleanBaseUrl = baseUrl.endsWith("/") ? baseUrl.slice(0, -1) : baseUrl;
  return `${cleanBaseUrl}/api/v1`;
};

// App configuration
export interface AppConfig {
  env: Environment;
  apiUrl: string;
  appVersion: string;
  buildNumber: string;
}

const environment = getEnvironment();

export const config: AppConfig = {
  env: environment,
  apiUrl: getApiUrl(),
  appVersion: Constants.expoConfig?.version || "1.0.0",
  buildNumber:
    Constants.expoConfig?.ios?.buildNumber ||
    Constants.expoConfig?.android?.versionCode?.toString() ||
    "1",
};

export const isDevelopment = environment === "development";
export const isStaging = environment === "staging";
export const isProduction = environment === "production";

export default config;
