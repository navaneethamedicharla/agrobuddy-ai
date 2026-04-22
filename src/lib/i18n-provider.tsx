import { createContext, useContext, useEffect, useState, ReactNode } from "react";

export type Lang = "en" | "te" | "hi";

type Dict = Record<string, string>;

const translations: Record<Lang, Dict> = {
  en: {
    "nav.home": "Home",
    "nav.crops": "Crops",
    "nav.fertilizer": "Fertilizer",
    "nav.disease": "Disease",
    "nav.weather": "Weather",
    "nav.chat": "Assistant",
    "nav.community": "Community",
    "nav.signin": "Sign in",
    "nav.signout": "Sign out",
    "nav.getstarted": "Get started",
    "hero.badge": "🌱 Smart farming, powered by AI",
    "hero.title1": "Grow more with",
    "hero.brand": "Agrobuddy",
    "hero.subtitle":
      "AI-powered crop recommendations, fertilizer plans, disease detection, weather advisory and a farmer community — all in one place.",
    "hero.cta1": "Get crop advice",
    "hero.cta2": "Ask the assistant",
    "features.heading": "Everything a modern farmer needs",
    "features.sub": "Six powerful tools, one simple dashboard. Free to use.",
    "feat.crop.t": "Crop Recommendation",
    "feat.crop.d": "Find the best crops for your land based on season, soil and water.",
    "feat.fert.t": "Fertilizer Advisor",
    "feat.fert.d": "Organic and chemical fertilizer plans by crop and growth stage.",
    "feat.dis.t": "Disease Detection",
    "feat.dis.d": "Upload a leaf photo and let AI identify diseases instantly.",
    "feat.wea.t": "Weather Advisory",
    "feat.wea.d": "Live weather, 5-day forecast and farming alerts for your region.",
    "feat.chat.t": "AI Assistant",
    "feat.chat.d": "Ask farming questions in English, Telugu or Hindi — get instant guidance.",
    "feat.com.t": "Farmer Community",
    "feat.com.d": "Share knowledge, post tips and learn from other farmers.",
    "footer.tag": "🌱 Agrobuddy — Smart Agriculture for Indian Farmers",
    "footer.sub": "Powered by Lovable Cloud & AI · Weather by Open-Meteo",
  },
  te: {
    "nav.home": "హోమ్",
    "nav.crops": "పంటలు",
    "nav.fertilizer": "ఎరువులు",
    "nav.disease": "వ్యాధులు",
    "nav.weather": "వాతావరణం",
    "nav.chat": "సహాయకుడు",
    "nav.community": "సంఘం",
    "nav.signin": "సైన్ ఇన్",
    "nav.signout": "సైన్ అవుట్",
    "nav.getstarted": "ప్రారంభించండి",
    "hero.badge": "🌱 AI తో స్మార్ట్ వ్యవసాయం",
    "hero.title1": "మరింత పండించండి",
    "hero.brand": "Agrobuddy",
    "hero.subtitle":
      "AI ఆధారిత పంట సూచనలు, ఎరువుల ప్రణాళికలు, వ్యాధి గుర్తింపు, వాతావరణ సలహా మరియు రైతు సంఘం — అన్నీ ఒకే చోట.",
    "hero.cta1": "పంట సలహా పొందండి",
    "hero.cta2": "సహాయకుడిని అడగండి",
    "features.heading": "ఆధునిక రైతుకు అవసరమైనవన్నీ",
    "features.sub": "ఆరు శక్తివంతమైన సాధనాలు, ఒక సరళమైన డాష్‌బోర్డ్. ఉచితం.",
    "feat.crop.t": "పంట సూచన",
    "feat.crop.d": "సీజన్, నేల మరియు నీటి ఆధారంగా ఉత్తమ పంటలను కనుగొనండి.",
    "feat.fert.t": "ఎరువు సలహాదారు",
    "feat.fert.d": "పంట మరియు పెరుగుదల దశ ప్రకారం సేంద్రీయ & రసాయన ఎరువుల ప్రణాళికలు.",
    "feat.dis.t": "వ్యాధి గుర్తింపు",
    "feat.dis.d": "ఆకు ఫోటోను అప్‌లోడ్ చేయండి, AI తక్షణమే వ్యాధిని గుర్తిస్తుంది.",
    "feat.wea.t": "వాతావరణ సలహా",
    "feat.wea.d": "ప్రత్యక్ష వాతావరణం, 5 రోజుల అంచనా మరియు వ్యవసాయ హెచ్చరికలు.",
    "feat.chat.t": "AI సహాయకుడు",
    "feat.chat.d": "ఇంగ్లీష్, తెలుగు లేదా హిందీలో ప్రశ్నలు అడగండి — తక్షణ మార్గదర్శకత్వం.",
    "feat.com.t": "రైతు సంఘం",
    "feat.com.d": "జ్ఞానాన్ని పంచుకోండి, చిట్కాలను పోస్ట్ చేయండి మరియు ఇతర రైతుల నుండి నేర్చుకోండి.",
    "footer.tag": "🌱 Agrobuddy — భారతీయ రైతుల కోసం స్మార్ట్ వ్యవసాయం",
    "footer.sub": "Lovable Cloud & AI ద్వారా · వాతావరణం Open-Meteo ద్వారా",
  },
  hi: {
    "nav.home": "होम",
    "nav.crops": "फसलें",
    "nav.fertilizer": "उर्वरक",
    "nav.disease": "रोग",
    "nav.weather": "मौसम",
    "nav.chat": "सहायक",
    "nav.community": "समुदाय",
    "nav.signin": "साइन इन",
    "nav.signout": "साइन आउट",
    "nav.getstarted": "शुरू करें",
    "hero.badge": "🌱 AI से स्मार्ट खेती",
    "hero.title1": "और अधिक उगाएं",
    "hero.brand": "Agrobuddy",
    "hero.subtitle":
      "AI आधारित फसल सुझाव, उर्वरक योजनाएँ, रोग पहचान, मौसम सलाह और किसान समुदाय — सब एक जगह।",
    "hero.cta1": "फसल सलाह लें",
    "hero.cta2": "सहायक से पूछें",
    "features.heading": "आधुनिक किसान के लिए सब कुछ",
    "features.sub": "छह शक्तिशाली उपकरण, एक सरल डैशबोर्ड। मुफ़्त।",
    "feat.crop.t": "फसल सुझाव",
    "feat.crop.d": "मौसम, मिट्टी और पानी के आधार पर सर्वोत्तम फसलें खोजें।",
    "feat.fert.t": "उर्वरक सलाहकार",
    "feat.fert.d": "फसल और वृद्धि चरण के अनुसार जैविक व रासायनिक उर्वरक योजनाएँ।",
    "feat.dis.t": "रोग पहचान",
    "feat.dis.d": "पत्ती की फोटो अपलोड करें, AI तुरंत रोग पहचानेगा।",
    "feat.wea.t": "मौसम सलाह",
    "feat.wea.d": "लाइव मौसम, 5-दिन का पूर्वानुमान और खेती संबंधी अलर्ट।",
    "feat.chat.t": "AI सहायक",
    "feat.chat.d": "अंग्रेज़ी, तेलुगु या हिंदी में पूछें — तुरंत मार्गदर्शन।",
    "feat.com.t": "किसान समुदाय",
    "feat.com.d": "ज्ञान साझा करें, सुझाव पोस्ट करें और अन्य किसानों से सीखें।",
    "footer.tag": "🌱 Agrobuddy — भारतीय किसानों के लिए स्मार्ट कृषि",
    "footer.sub": "Lovable Cloud & AI द्वारा · मौसम Open-Meteo द्वारा",
  },
};

type Ctx = { lang: Lang; setLang: (l: Lang) => void; t: (k: string) => string };
const I18nContext = createContext<Ctx | null>(null);

export function I18nProvider({ children }: { children: ReactNode }) {
  const [lang, setLangState] = useState<Lang>(() => {
    const stored = (typeof window !== "undefined" && localStorage.getItem("lang")) as Lang | null;
    return stored && ["en", "te", "hi"].includes(stored) ? stored : "en";
  });
  useEffect(() => {
    localStorage.setItem("lang", lang);
    document.documentElement.lang = lang;
  }, [lang]);
  const t = (k: string) => translations[lang][k] ?? translations.en[k] ?? k;
  return (
    <I18nContext.Provider value={{ lang, setLang: setLangState, t }}>{children}</I18nContext.Provider>
  );
}

export function useI18n() {
  const ctx = useContext(I18nContext);
  if (!ctx) throw new Error("useI18n must be used within I18nProvider");
  return ctx;
}

export const LANG_LABELS: Record<Lang, string> = { en: "English", te: "తెలుగు", hi: "हिन्दी" };
