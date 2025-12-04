import { ConfigContext, ExpoConfig } from "expo/config";

const UNIQUE_IDENTIFIER = "com.ppramanik62.edutest";
const APP_NAME = "EduTest";

const IS_DEV = process.env.APP_VARIANT === "development";
const IS_PREVIEW = process.env.APP_VARIANT === "preview";

const getUniqueIdentifier = () => {
  if (IS_DEV) return `${UNIQUE_IDENTIFIER}.dev`;
  if (IS_PREVIEW) return `${UNIQUE_IDENTIFIER}.preview`;
  return UNIQUE_IDENTIFIER;
};

const getAppName = () => {
  if (IS_DEV) return `${APP_NAME} (Dev)`;
  if (IS_PREVIEW) return `${APP_NAME} (Preview)`;
  return APP_NAME;
};

export default ({ config }: ConfigContext): ExpoConfig => ({
  ...config,
  name: getAppName(),
  slug: "edu-test",
  version: "1.0.0",
  orientation: "portrait",
  icon: "./assets/images/icon.png",
  scheme: "edutest",
  userInterfaceStyle: "automatic",
  newArchEnabled: true,
  ios: {
    supportsTablet: true,
    bundleIdentifier: getUniqueIdentifier(),
  },
  android: {
    adaptiveIcon: {
      backgroundColor: "#E6F4FE",
      foregroundImage: "./assets/images/android-icon-foreground.png",
      backgroundImage: "./assets/images/android-icon-background.png",
      monochromeImage: "./assets/images/android-icon-monochrome.png",
    },
    edgeToEdgeEnabled: true,
    predictiveBackGestureEnabled: false,
    package: getUniqueIdentifier(),
  },
  web: {
    output: "static",
    favicon: "./assets/images/favicon.png",
    bundler: "metro",
  },
  plugins: [
    "expo-router",
    [
      "expo-splash-screen",
      {
        image: "./assets/images/splash-icon.png",
        imageWidth: 200,
        resizeMode: "contain",
        backgroundColor: "#ffffff",
        dark: {
          backgroundColor: "#000000",
        },
      },
    ],
  ],
  experiments: {
    typedRoutes: true,
    reactCompiler: true,
  },
  extra: {
    router: {},
    eas: {
      projectId: "df0f7849-bdf6-439d-8770-a01c906a5d35",
    },
  },
  owner: "ppramanik62",
});
