import Constants from "expo-constants";

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

// API URLs for each environment
const API_URLS: Record<Environment, string> = {
  development: "http://localhost:3000/api/v1",
  staging: "https://staging.entmoot.app/api/v1",
  production: "https://api.entmoot.app/api/v1",
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
  apiUrl: API_URLS[environment],
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
