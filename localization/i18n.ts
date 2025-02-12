import i18next, { InitOptions } from "i18next";
import { initReactI18next } from "react-i18next";
import * as RNLocalize from "react-native-localize";

import en from "./en.json";
import fr from "./fr.json";

const resources = {
  en: { translation: en },
  fr: { translation: fr },
};

// Detect device language
const getDeviceLanguage = () => {
  const locales = RNLocalize.getLocales();
  return locales[0]?.languageCode === "fr" ? "fr" : "en";
};

// Define InitOptions explicitly
const options: InitOptions = {
  resources,
  lng: getDeviceLanguage(),
  fallbackLng: "en",
  compatibilityJSON: "v4",
  interpolation: { escapeValue: false },
};

i18next.use(initReactI18next).init(options);

export default i18next;
