import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Sprout, FlaskConical, Leaf, CloudSun, Bot, Users } from "lucide-react";
import heroImg from "@/assets/hero-farm.jpg";

const features = [
  { to: "/crops", icon: Sprout, title: "Crop Recommendation", desc: "Find the best crops for your land based on season, soil and water." },
  { to: "/fertilizer", icon: FlaskConical, title: "Fertilizer Advisor", desc: "Organic and chemical fertilizer plans by crop and growth stage." },
  { to: "/disease", icon: Leaf, title: "Disease Detection", desc: "Upload a leaf photo and let AI identify diseases instantly." },
  { to: "/weather", icon: CloudSun, title: "Weather Advisory", desc: "Live weather, 5-day forecast and farming alerts for your region." },
  { to: "/chat", icon: Bot, title: "AI Assistant", desc: "Ask farming questions in English or Telugu — get instant guidance." },
  { to: "/community", icon: Users, title: "Farmer Community", desc: "Share knowledge, post tips and learn from other farmers." },
];

export default function Home() {
  return (
    <div className="animate-fade-in">
      {/* Hero */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0">
          <img src={heroImg} alt="Lush green farm field at sunrise" className="h-full w-full object-cover" width={1600} height={900} />
          <div className="absolute inset-0 bg-gradient-to-r from-background/95 via-background/70 to-background/30" />
        </div>
        <div className="container relative py-24 md:py-36 max-w-3xl">
          <div className="inline-flex items-center gap-2 rounded-full bg-secondary/80 backdrop-blur px-4 py-1.5 text-xs font-semibold text-primary mb-6 border border-primary/20">
            🌱 Smart farming, powered by AI
          </div>
          <h1 className="font-display text-4xl md:text-6xl font-extrabold tracking-tight mb-6 leading-tight">
            Grow more with <span className="bg-gradient-leaf bg-clip-text text-transparent">KrishiAI</span>
          </h1>
          <p className="text-lg md:text-xl text-muted-foreground mb-8 leading-relaxed">
            AI-powered crop recommendations, fertilizer plans, disease detection, weather advisory and a farmer community — all in one place.
          </p>
          <div className="flex flex-wrap gap-3">
            <Button size="lg" asChild className="shadow-elegant"><Link to="/crops">Get crop advice</Link></Button>
            <Button size="lg" variant="outline" asChild><Link to="/chat">Ask the assistant</Link></Button>
          </div>
        </div>
      </section>

      {/* Features grid */}
      <section className="container py-16 md:py-24">
        <div className="text-center mb-12">
          <h2 className="font-display text-3xl md:text-4xl font-bold mb-3">Everything a modern farmer needs</h2>
          <p className="text-muted-foreground max-w-2xl mx-auto">Six powerful tools, one simple dashboard. Free to use.</p>
        </div>
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {features.map((f) => (
            <Link key={f.to} to={f.to} className="group">
              <Card className="h-full bg-gradient-card border-border/60 transition-smooth hover:shadow-elegant hover:-translate-y-1 hover:border-primary/40">
                <CardHeader>
                  <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-gradient-leaf shadow-soft mb-3 group-hover:shadow-glow transition-smooth">
                    <f.icon className="h-6 w-6 text-primary-foreground" />
                  </div>
                  <CardTitle className="font-display">{f.title}</CardTitle>
                  <CardDescription className="leading-relaxed">{f.desc}</CardDescription>
                </CardHeader>
              </Card>
            </Link>
          ))}
        </div>
      </section>
    </div>
  );
}
