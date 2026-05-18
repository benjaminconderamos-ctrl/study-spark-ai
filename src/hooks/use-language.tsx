import { createContext, useContext, useEffect, useState, ReactNode } from "react";

export type Lang = "en" | "es-MX";

type Dict = Record<string, string>;

const translations: Record<Lang, Dict> = {
  en: {
    "nav.price": "Price",
    "nav.signin": "Sign in",
    "nav.getStarted": "Get started",
    "hero.kicker": "AI-powered study workspace",
    "hero.title.1": "Read less.",
    "hero.title.2": "Understand more.",
    "hero.desc": "Drop in a PDF. StudyFlow gives you a clean summary, a deck of flashcards, a quiz to test yourself, and a tutor that answers from your own sources.",
    "hero.cta.start": "Start studying",
    "hero.cta.haveAccount": "I have an account",
    "tile.01": "Upload PDF",
    "tile.02": "Auto-summarize",
    "tile.03": "Flashcards",
    "tile.04": "Tutor chat",
    "pricing.kicker": "Pricing",
    "pricing.title": "Start free. Upgrade when you need more.",
    "pricing.free": "Free",
    "pricing.free.sub": "Forever free",
    "pricing.free.f1": "3 documents / month",
    "pricing.free.f2": "Up to 10 flashcards per doc",
    "pricing.free.f3": "Basic summary",
    "pricing.free.f4": "No AI tutor",
    "pricing.free.cta": "Get started",
    "pricing.pro": "Pro",
    "pricing.pro.popular": "Most popular",
    "pricing.pro.period": "USD / month",
    "pricing.pro.sub": "Cancel anytime",
    "pricing.pro.f1": "Unlimited documents",
    "pricing.pro.f2": "Unlimited flashcards & quizzes",
    "pricing.pro.f3": "AI tutor included",
    "pricing.pro.cta": "Start 7-day Pro trial",
    "footer.built": "Built by Benjamin CR",
    "lang.toggle": "ES",
  },
  "es-MX": {
    "nav.price": "Precios",
    "nav.signin": "Iniciar sesión",
    "nav.getStarted": "Comenzar",
    "hero.kicker": "Espacio de estudio con IA",
    "hero.title.1": "Lee menos.",
    "hero.title.2": "Entiende más.",
    "hero.desc": "Sube un PDF. StudyFlow te da un resumen limpio, un mazo de flashcards, un quiz para ponerte a prueba y un tutor que responde con tus propias fuentes.",
    "hero.cta.start": "Empezar a estudiar",
    "hero.cta.haveAccount": "Ya tengo cuenta",
    "tile.01": "Sube tu PDF",
    "tile.02": "Resumen automático",
    "tile.03": "Flashcards",
    "tile.04": "Chat con tutor",
    "pricing.kicker": "Precios",
    "pricing.title": "Empieza gratis. Mejora cuando lo necesites.",
    "pricing.free": "Gratis",
    "pricing.free.sub": "Gratis para siempre",
    "pricing.free.f1": "3 documentos / mes",
    "pricing.free.f2": "Hasta 10 flashcards por documento",
    "pricing.free.f3": "Resumen básico",
    "pricing.free.f4": "Sin tutor con IA",
    "pricing.free.cta": "Comenzar",
    "pricing.pro": "Pro",
    "pricing.pro.popular": "Más popular",
    "pricing.pro.period": "USD / mes",
    "pricing.pro.sub": "Cancela cuando quieras",
    "pricing.pro.f1": "Documentos ilimitados",
    "pricing.pro.f2": "Flashcards y quizzes ilimitados",
    "pricing.pro.f3": "Tutor con IA incluido",
    "pricing.pro.cta": "Prueba Pro 7 días",
    "footer.built": "Hecho por Benjamin CR",
    "lang.toggle": "EN",
  },
};

type Ctx = {
  lang: Lang;
  setLang: (l: Lang) => void;
  toggle: () => void;
  t: (key: string) => string;
};

const LanguageContext = createContext<Ctx | null>(null);

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [lang, setLangState] = useState<Lang>("en");

  useEffect(() => {
    try {
      const stored = localStorage.getItem("lang") as Lang | null;
      if (stored === "en" || stored === "es-MX") setLangState(stored);
    } catch {}
  }, []);

  const setLang = (l: Lang) => {
    setLangState(l);
    try { localStorage.setItem("lang", l); } catch {}
  };

  const toggle = () => setLang(lang === "en" ? "es-MX" : "en");
  const t = (key: string) => translations[lang][key] ?? translations.en[key] ?? key;

  return (
    <LanguageContext.Provider value={{ lang, setLang, toggle, t }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  const ctx = useContext(LanguageContext);
  if (!ctx) {
    // Fallback so components don't crash if provider is missing
    return {
      lang: "en" as Lang,
      setLang: () => {},
      toggle: () => {},
      t: (k: string) => translations.en[k] ?? k,
    };
  }
  return ctx;
}
