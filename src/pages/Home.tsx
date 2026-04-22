import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Sprout, FlaskConical, Leaf, CloudSun, Bot, Users } from "lucide-react";
import { useI18n } from "@/lib/i18n";

export default function Home() {
  const { t } = useI18n();
  const features = [
    { to: "/crops", icon: Sprout, title: t("feat.crop.t"), desc: t("feat.crop.d") },
    { to: "/fertilizer", icon: FlaskConical, title: t("feat.fert.t"), desc: t("feat.fert.d") },
    { to: "/disease", icon: Leaf, title: t("feat.dis.t"), desc: t("feat.dis.d") },
    { to: "/weather", icon: CloudSun, title: t("feat.wea.t"), desc: t("feat.wea.d") },
    { to: "/chat", icon: Bot, title: t("feat.chat.t"), desc: t("feat.chat.d") },
    { to: "/community", icon: Users, title: t("feat.com.t"), desc: t("feat.com.d") },
  ];

  return (
    <div className="animate-fade-in">
      {/* Hero */}
      <section className="relative overflow-hidden bg-background">
        <div className="container relative py-24 md:py-36 max-w-3xl">
          <div className="inline-flex items-center gap-2 rounded-full bg-secondary/80 backdrop-blur px-4 py-1.5 text-xs font-semibold text-primary mb-6 border border-primary/20">
            {t("hero.badge")}
          </div>
          <h1 className="font-display text-4xl md:text-6xl font-extrabold tracking-tight mb-6 leading-tight">
            {t("hero.title1")} <span className="text-primary">{t("hero.brand")}</span>
          </h1>
          <p className="text-lg md:text-xl text-muted-foreground mb-8 leading-relaxed">
            {t("hero.subtitle")}
          </p>
          <div className="flex flex-wrap gap-3">
            <Button size="lg" asChild className="shadow-elegant"><Link to="/crops">{t("hero.cta1")}</Link></Button>
            <Button size="lg" variant="outline" asChild><Link to="/chat">{t("hero.cta2")}</Link></Button>
          </div>
        </div>
      </section>

      {/* Features grid */}
      <section className="container py-16 md:py-24">
        <div className="text-center mb-12">
          <h2 className="font-display text-3xl md:text-4xl font-bold mb-3">{t("features.heading")}</h2>
          <p className="text-muted-foreground max-w-2xl mx-auto">{t("features.sub")}</p>
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
