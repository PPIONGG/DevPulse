"use client";

import {
  createContext,
  useContext,
  useState,
  useCallback,
  useEffect,
  type ReactNode,
} from "react";
import { useAuth } from "@/providers/auth-provider";
import { updateProfile } from "@/lib/services/profiles";
import { translations, type Language, type TranslationKey } from "@/lib/i18n";

interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: (key: TranslationKey) => string;
}

const LanguageContext = createContext<LanguageContextType>({
  language: "en",
  setLanguage: () => {},
  t: (key) => key,
});

export function LanguageProvider({ children }: { children: ReactNode }) {
  const { profile, refreshProfile } = useAuth();
  const [language, setLanguageState] = useState<Language>("en");

  // Sync language from profile when it loads
  useEffect(() => {
    if (profile?.preferred_language) {
      const lang = profile.preferred_language;
      if (lang === "en" || lang === "th") {
        setLanguageState(lang);
      }
    }
  }, [profile?.preferred_language]);

  const setLanguage = useCallback(
    async (lang: Language) => {
      setLanguageState(lang);
      try {
        await updateProfile({ preferred_language: lang });
        await refreshProfile();
      } catch {
        // Revert on failure
        setLanguageState(language);
      }
    },
    [language, refreshProfile]
  );

  const t = useCallback(
    (key: TranslationKey): string => {
      return translations[language]?.[key] ?? translations.en[key] ?? key;
    },
    [language]
  );

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  );
}

export const useTranslation = () => useContext(LanguageContext);
