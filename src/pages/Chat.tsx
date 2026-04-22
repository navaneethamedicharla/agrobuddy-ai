import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Bot, Loader2, Send, User as UserIcon } from "lucide-react";
import { toast } from "sonner";

type Msg = { role: "user" | "assistant"; content: string };

const CHAT_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/chatbot`;

export default function Chat() {
  const [messages, setMessages] = useState<Msg[]>([
    { role: "assistant", content: "👋 Hi! I'm KrishiAI. Ask me anything about crops, fertilizers, pests, or farming techniques." },
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [language, setLanguage] = useState<"en" | "te">("en");
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => { scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" }); }, [messages]);

  const send = async () => {
    const text = input.trim();
    if (!text || loading) return;
    const userMsg: Msg = { role: "user", content: text };
    const next = [...messages, userMsg];
    setMessages(next); setInput(""); setLoading(true);

    let acc = "";
    const upsert = (chunk: string) => {
      acc += chunk;
      setMessages((prev) => {
        const last = prev[prev.length - 1];
        if (last?.role === "assistant" && last.content !== messages[messages.length - 1]?.content) {
          return prev.map((m, i) => i === prev.length - 1 ? { ...m, content: acc } : m);
        }
        return [...prev, { role: "assistant", content: acc }];
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
    } catch (e) {
      console.error(e);
      toast.error("Failed to get response");
    } finally { setLoading(false); }
  };

  return (
    <div className="container py-12 max-w-3xl animate-fade-in">
      <header className="mb-6 flex items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-gradient-leaf shadow-soft"><Bot className="h-5 w-5 text-primary-foreground" /></div>
          <div>
            <h1 className="font-display text-3xl font-bold">AI Assistant</h1>
            <p className="text-sm text-muted-foreground">Ask in English or Telugu</p>
          </div>
        </div>
        <Select value={language} onValueChange={(v) => setLanguage(v as "en" | "te")}>
          <SelectTrigger className="w-36"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="en">English</SelectItem>
            <SelectItem value="te">తెలుగు (Telugu)</SelectItem>
          </SelectContent>
        </Select>
      </header>

      <Card className="shadow-elegant flex flex-col h-[65vh]">
        <CardHeader className="border-b py-3"><CardTitle className="text-base">Chat</CardTitle></CardHeader>
        <CardContent className="flex-1 overflow-y-auto p-4 space-y-4" ref={scrollRef}>
          {messages.map((m, i) => (
            <div key={i} className={`flex gap-2 ${m.role === "user" ? "justify-end" : ""}`}>
              {m.role === "assistant" && <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-gradient-leaf"><Bot className="h-4 w-4 text-primary-foreground" /></div>}
              <div className={`px-4 py-2.5 rounded-2xl max-w-[80%] text-sm whitespace-pre-wrap ${m.role === "user" ? "bg-primary text-primary-foreground rounded-tr-sm" : "bg-secondary rounded-tl-sm"}`}>
                {m.content || <Loader2 className="h-3 w-3 animate-spin inline" />}
              </div>
              {m.role === "user" && <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-accent"><UserIcon className="h-4 w-4 text-accent-foreground" /></div>}
            </div>
          ))}
        </CardContent>
        <div className="border-t p-3 flex gap-2">
          <Input value={input} onChange={(e) => setInput(e.target.value)} placeholder={language === "te" ? "మీ ప్రశ్న టైప్ చేయండి…" : "Type your question…"} onKeyDown={(e) => { if (e.key === "Enter") send(); }} disabled={loading} />
          <Button onClick={send} disabled={loading || !input.trim()}>{loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}</Button>
        </div>
      </Card>
    </div>
  );
}
