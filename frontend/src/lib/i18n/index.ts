import en from "./en.json";
import th from "./th.json";

export type Language = "en" | "th";

export type TranslationKey = keyof typeof en;

export const translations: Record<Language, Record<string, string>> = {
  en,
  th,
};
