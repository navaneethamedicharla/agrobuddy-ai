import { useEffect, useMemo, useRef, useState } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Bot, Loader2, Mic, MicOff, Send, User as UserIcon, Volume2, VolumeX } from "lucide-react";
import { toast } from "sonner";
import { useI18n, type Lang } from "@/lib/i18n";

type Msg = { role: "user" | "assistant"; content: string };

const CHAT_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/chatbot`;
const TTS_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/tts`;
// Locales used for SpeechRecognition (voice INPUT only)
const SPEECH_LOCALES: Record<Lang, string> = { en: "en-IN", te: "te-IN", hi: "hi-IN" };

// Cache generated audio per (lang|text) so re-clicking Speak is instant
const audioCache = new Map<string, string>();

/**
 * Strip markdown / formatting symbols so TTS reads naturally.
 * Used ONLY for speech — never mutates displayed message content.
 */
function cleanTextForSpeech(input: string): string {
  let t = input;
  // Remove code fences and inline code
  t = t.replace(/```[\s\S]*?```/g, " ");
  t = t.replace(/`([^`]+)`/g, "$1");
  // Images / links -> keep label only
  t = t.replace(/!\[([^\]]*)\]\([^)]*\)/g, "$1");
  t = t.replace(/\[([^\]]+)\]\([^)]*\)/g, "$1");
  // Headings (#, ##, ###...)
  t = t.replace(/^\s{0,3}#{1,6}\s+/gm, "");
  // Blockquotes
  t = t.replace(/^\s{0,3}>\s?/gm, "");
  // Bold / italics / strikethrough markers (*, **, ***, _, __, ~~)
  t = t.replace(/(\*\*\*|\*\*|\*|___|__|_|~~)/g, "");
  // Bullet points: -, *, •, +  and numbered lists "1." -> natural pause
  t = t.replace(/^\s*[-*•+]\s+/gm, "");
  t = t.replace(/^\s*\d+\.\s+/gm, "");
  // Horizontal rules
  t = t.replace(/^\s*([-*_])\1{2,}\s*$/gm, "");
  // Tables pipes
  t = t.replace(/\|/g, " ");
  // Line breaks -> natural pause
  t = t.replace(/\n{2,}/g, ". ");
  t = t.replace(/\n/g, ", ");
  // Collapse whitespace and stray punctuation
  t = t.replace(/\s+/g, " ");
  t = t.replace(/\s+([,.!?;:])/g, "$1");
  t = t.replace(/([,.!?;:]){2,}/g, "$1");
  return t.trim();
}


// Module-level cache: { lang|prompt -> response }
const responseCache = new Map<string, string>();

// Browser speech recognition (vendor-prefixed)
const SpeechRecognitionCtor: any =
  typeof window !== "undefined"
    ? (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition
    : null;

export default function Chat() {
  const { lang: appLang } = useI18n();
  const [language, setLanguage] = useState<Lang>(appLang);
  const greetings: Record<Lang, string> = {
    en: "👋 Hi! I'm Agrobuddy. Ask me anything about crops, fertilizers, pests, or farming techniques.",
    te: "👋 నమస్తే! నేను Agrobuddy. పంటలు, ఎరువులు, చీడపీడలు లేదా వ్యవసాయ పద్ధతుల గురించి అడగండి.",
    hi: "👋 नमस्ते! मैं Agrobuddy हूँ। फसलें, उर्वरक, कीट या खेती की तकनीकों के बारे में पूछें।",
  };
  const [messages, setMessages] = useState<Msg[]>([{ role: "assistant", content: greetings[appLang] }]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [listening, setListening] = useState(false);
  const [interim, setInterim] = useState("");
  const [speakingIdx, setSpeakingIdx] = useState<number | null>(null);

  const scrollRef = useRef<HTMLDivElement>(null);
  const recognitionRef = useRef<any>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const sendRef = useRef<(text?: string) => void>(() => {});
  const [ttsLoadingIdx, setTtsLoadingIdx] = useState<number | null>(null);

  // Update greeting when language changes (only if it's still the initial single-msg state)
  useEffect(() => {
    setMessages((prev) =>
      prev.length === 1 && prev[0].role === "assistant"
        ? [{ role: "assistant", content: greetings[language] }]
        : prev
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [language]);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages, interim]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      try { recognitionRef.current?.stop(); } catch { /* ignore */ }
      try { audioRef.current?.pause(); } catch { /* ignore */ }
    };
  }, []);

  const placeholder = useMemo(
    () =>
      language === "te"
        ? "మీ ప్రశ్న టైప్ చేయండి…"
        : language === "hi"
        ? "अपना प्रश्न लिखें…"
        : "Type your question…",
    [language]
  );

  const send = async (overrideText?: string) => {
    const text = (overrideText ?? input).trim();
    if (!text || loading) return;

    const userMsg: Msg = { role: "user", content: text };
    const next = [...messages, userMsg];
    setMessages(next);
    setInput("");
    setLoading(true);

    const cacheKey = `${language}|${text.toLowerCase()}`;
    const cached = responseCache.get(cacheKey);
    if (cached) {
      setMessages((p) => [...p, { role: "assistant", content: cached }]);
      setLoading(false);
      return;
    }

    let acc = "";
    let assistantPushed = false;
    const upsert = (chunk: string) => {
      acc += chunk;
      setMessages((prev) => {
        if (!assistantPushed) {
          assistantPushed = true;
          return [...prev, { role: "assistant", content: acc }];
        }
        return prev.map((m, i) => (i === prev.length - 1 ? { ...m, content: acc } : m));
      });
    };

    try {
      const resp = await fetch(CHAT_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
        },
        body: JSON.stringify({
          messages: next.map((m) => ({ role: m.role, content: m.content })),
          language,
        }),
      });
      if (resp.status === 429) { toast.error("Rate limit. Please wait a moment."); setLoading(false); return; }
      if (resp.status === 402) { toast.error("AI credits exhausted. Add credits in Settings."); setLoading(false); return; }
      if (!resp.ok || !resp.body) throw new Error("Stream failed");

      const reader = resp.body.getReader();
      const decoder = new TextDecoder();
      let buf = ""; let done = false;
      while (!done) {
        const { done: d, value } = await reader.read();
        if (d) break;
        buf += decoder.decode(value, { stream: true });
        let nl: number;
        while ((nl = buf.indexOf("\n")) !== -1) {
          let line = buf.slice(0, nl); buf = buf.slice(nl + 1);
          if (line.endsWith("\r")) line = line.slice(0, -1);
          if (line.startsWith(":") || line.trim() === "") continue;
          if (!line.startsWith("data: ")) continue;
          const json = line.slice(6).trim();
          if (json === "[DONE]") { done = true; break; }
          try {
            const p = JSON.parse(json);
            const c = p.choices?.[0]?.delta?.content;
            if (c) upsert(c);
          } catch { buf = line + "\n" + buf; break; }
        }
      }
      if (acc) responseCache.set(cacheKey, acc);
    } catch (e) {
      console.error(e);
      toast.error("Failed to get response");
    } finally {
      setLoading(false);
    }
  };
  sendRef.current = send;

  // ---- Voice input (Web Speech API) ----
  const toggleMic = () => {
    if (!SpeechRecognitionCtor) {
      toast.error("Voice input not supported in this browser. Try Chrome.");
      return;
    }
    if (listening) {
      try { recognitionRef.current?.stop(); } catch { /* ignore */ }
      return;
    }

    let finalText = "";
    const rec = new SpeechRecognitionCtor();
    rec.lang = SPEECH_LOCALES[language];
    rec.interimResults = true;
    rec.continuous = false;

    rec.onstart = () => setListening(true);
    rec.onresult = (event: any) => {
      let interimStr = "";
      for (let i = event.resultIndex; i < event.results.length; i++) {
        const transcript = event.results[i][0].transcript;
        if (event.results[i].isFinal) finalText += transcript;
        else interimStr += transcript;
      }
      setInterim(interimStr);
      if (finalText) setInput(finalText.trim());
    };
    rec.onerror = (e: any) => {
      setListening(false);
      setInterim("");
      if (e.error === "not-allowed" || e.error === "service-not-allowed") {
        toast.error("Microphone permission denied");
      } else if (e.error === "no-speech") {
        toast.error("No speech detected");
      } else {
        toast.error("Voice recognition error");
      }
    };
    rec.onend = () => {
      setListening(false);
      setInterim("");
      const t = finalText.trim();
      if (t) sendRef.current(t);
    };

    recognitionRef.current = rec;
    try { rec.start(); } catch (err) { console.error(err); toast.error("Could not start microphone"); }
  };

  // ---- Voice output (SpeechSynthesis) ----
  // Warm up voices list (some browsers populate asynchronously)
  useEffect(() => {
    if (typeof window === "undefined" || !window.speechSynthesis) return;
    const sy = window.speechSynthesis;
    sy.getVoices();
    const handler = () => sy.getVoices();
    sy.addEventListener?.("voiceschanged", handler);
    return () => sy.removeEventListener?.("voiceschanged", handler);
  }, []);

  const speak = (idx: number, text: string) => {
    if (typeof window === "undefined" || !window.speechSynthesis) {
      toast.error("Text-to-speech not supported");
      return;
    }
    if (speakingIdx === idx) {
      window.speechSynthesis.cancel();
      setSpeakingIdx(null);
      return;
    }
    window.speechSynthesis.cancel();

    // Clean ONLY for speech — never mutate original message content
    const cleaned = cleanTextForSpeech(text);
    if (!cleaned) return;

    const targetLang = SPEECH_LOCALES[language];
    const voice = pickVoice(targetLang);

    const u = new SpeechSynthesisUtterance(cleaned);
    if (voice) {
      u.voice = voice;
      u.lang = voice.lang;
      // Inform user if regional voice unavailable and we fell back
      if (!voice.lang.toLowerCase().startsWith(targetLang.split("-")[0])) {
        toast.message(`Voice for ${targetLang} unavailable — using ${voice.lang}`);
      }
    } else {
      u.lang = targetLang;
    }
    u.rate = 1;
    u.pitch = 1;
    u.onend = () => setSpeakingIdx(null);
    u.onerror = () => setSpeakingIdx(null);
    utteranceRef.current = u;
    setSpeakingIdx(idx);
    window.speechSynthesis.speak(u);
  };

  return (
    <div className="container py-12 max-w-3xl animate-fade-in">
      <header className="mb-6 flex items-center justify-between gap-3 flex-wrap">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-gradient-leaf shadow-soft">
            <Bot className="h-5 w-5 text-primary-foreground" />
          </div>
          <div>
            <h1 className="font-display text-3xl font-bold">AI Assistant</h1>
            <p className="text-sm text-muted-foreground">English · తెలుగు · हिन्दी · 🎤 Voice enabled</p>
          </div>
        </div>
        <Select value={language} onValueChange={(v) => setLanguage(v as Lang)}>
          <SelectTrigger className="w-40"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="en">English</SelectItem>
            <SelectItem value="te">తెలుగు (Telugu)</SelectItem>
            <SelectItem value="hi">हिन्दी (Hindi)</SelectItem>
          </SelectContent>
        </Select>
      </header>

      <Card className="shadow-elegant flex flex-col h-[65vh]">
        <CardHeader className="border-b py-3"><CardTitle className="text-base">Chat</CardTitle></CardHeader>
        <CardContent className="flex-1 overflow-y-auto p-4 space-y-4" ref={scrollRef}>
          {messages.map((m, i) => (
            <div key={i} className={`flex gap-2 ${m.role === "user" ? "justify-end" : ""}`}>
              {m.role === "assistant" && (
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-gradient-leaf">
                  <Bot className="h-4 w-4 text-primary-foreground" />
                </div>
              )}
              <div className={`flex flex-col gap-1 max-w-[80%] ${m.role === "user" ? "items-end" : "items-start"}`}>
                <div className={`px-4 py-2.5 rounded-2xl text-sm ${
                  m.role === "user"
                    ? "bg-primary text-primary-foreground rounded-tr-sm whitespace-pre-wrap"
                    : "bg-secondary rounded-tl-sm prose prose-sm dark:prose-invert max-w-none prose-p:my-1 prose-headings:my-2 prose-ul:my-1 prose-ol:my-1 prose-li:my-0 prose-pre:my-2"
                }`}>
                  {m.content
                    ? (m.role === "assistant"
                        ? <ReactMarkdown remarkPlugins={[remarkGfm]}>{m.content}</ReactMarkdown>
                        : m.content)
                    : <Loader2 className="h-3 w-3 animate-spin inline" />}
                </div>
                {m.role === "assistant" && m.content && (
                  <button
                    onClick={() => speak(i, m.content)}
                    className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-smooth px-1"
                    aria-label={speakingIdx === i ? "Stop speaking" : "Speak message"}
                  >
                    {speakingIdx === i ? <VolumeX className="h-3 w-3" /> : <Volume2 className="h-3 w-3" />}
                    <span>{speakingIdx === i ? "Stop" : "Speak"}</span>
                  </button>
                )}
              </div>
              {m.role === "user" && (
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-accent">
                  <UserIcon className="h-4 w-4 text-accent-foreground" />
                </div>
              )}
            </div>
          ))}

          {listening && (
            <div className="flex gap-2 justify-end animate-fade-in">
              <div className="px-4 py-2.5 rounded-2xl max-w-[80%] text-sm bg-primary/10 border border-primary/30 italic text-muted-foreground">
                {interim || "🎤 Listening…"}
              </div>
            </div>
          )}
        </CardContent>

        <div className="border-t p-3 flex gap-2 items-center">
          <Button
            type="button"
            size="icon"
            variant={listening ? "destructive" : "outline"}
            onClick={toggleMic}
            disabled={loading}
            aria-label={listening ? "Stop recording" : "Start voice input"}
            className={listening ? "animate-pulse" : ""}
          >
            {listening ? <MicOff className="h-4 w-4" /> : <Mic className="h-4 w-4" />}
          </Button>
          <Input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder={placeholder}
            onKeyDown={(e) => { if (e.key === "Enter") send(); }}
            disabled={loading || listening}
          />
          <Button onClick={() => send()} disabled={loading || !input.trim()}>
            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
          </Button>
        </div>
      </Card>
    </div>
  );
}
