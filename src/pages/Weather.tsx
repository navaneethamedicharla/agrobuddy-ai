import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { CloudSun, Loader2, Droplets, Wind, Thermometer, AlertTriangle } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface WeatherData {
  location: { name: string; country: string; region?: string };
  current: { temp: number; feelsLike: number; humidity: number; precipitation: number; windSpeed: number; description: string };
  forecast: { date: string; tempMax: number; tempMin: number; precipitation: number; weatherCode: number; windSpeed: number }[];
  alerts: { type: string; severity: string; message: string }[];
}

const codeEmoji = (c: number): string => {
  if (c === 0) return "☀️";
  if (c <= 3) return "⛅";
  if (c <= 48) return "🌫️";
  if (c <= 67) return "🌧️";
  if (c <= 77) return "🌨️";
  if (c <= 82) return "🌦️";
  if (c <= 99) return "⛈️";
  return "🌤️";
};

export default function Weather() {
  const [location, setLocation] = useState("");
  const [data, setData] = useState<WeatherData | null>(null);
  const [loading, setLoading] = useState(false);

  const fetchWeather = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!location.trim()) return;
    setLoading(true);
    try {
      const { data: res, error } = await supabase.functions.invoke("weather", { body: { location } });
      if (error) throw error;
      if (res?.error) { toast.error(res.error); return; }
      setData(res);
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : "Failed to fetch weather");
    } finally { setLoading(false); }
  };

  return (
    <div className="container py-12 max-w-5xl animate-fade-in">
      <header className="mb-8">
        <div className="flex items-center gap-3 mb-2">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-gradient-leaf shadow-soft"><CloudSun className="h-5 w-5 text-primary-foreground" /></div>
          <h1 className="font-display text-3xl font-bold">Weather Advisory</h1>
        </div>
        <p className="text-muted-foreground">Live weather, 5-day forecast and farming alerts.</p>
      </header>

      <Card className="shadow-soft mb-6">
        <CardContent className="pt-6">
          <form onSubmit={fetchWeather} className="flex gap-2">
            <Input value={location} onChange={(e) => setLocation(e.target.value)} placeholder="Enter city — e.g. Hyderabad, Pune" />
            <Button type="submit" disabled={loading}>{loading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Check"}</Button>
          </form>
        </CardContent>
      </Card>

      {data && (
        <div className="space-y-6 animate-fade-in">
          <Card className="shadow-elegant bg-gradient-leaf text-primary-foreground">
            <CardHeader>
              <CardDescription className="text-primary-foreground/80">{data.location.region}, {data.location.country}</CardDescription>
              <CardTitle className="font-display text-2xl">{data.location.name}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-end gap-4">
                <div className="text-6xl font-bold">{Math.round(data.current.temp)}°</div>
                <div className="pb-2">
                  <p className="font-semibold">{data.current.description}</p>
                  <p className="text-sm text-primary-foreground/80">Feels like {Math.round(data.current.feelsLike)}°C</p>
                </div>
              </div>
              <div className="grid grid-cols-3 gap-3 mt-6 text-sm">
                <div className="flex items-center gap-2"><Droplets className="h-4 w-4" /> {data.current.humidity}% humidity</div>
                <div className="flex items-center gap-2"><Wind className="h-4 w-4" /> {Math.round(data.current.windSpeed)} km/h</div>
                <div className="flex items-center gap-2"><Thermometer className="h-4 w-4" /> {data.current.precipitation}mm rain</div>
              </div>
            </CardContent>
          </Card>

          {data.alerts.length > 0 && (
            <Card className="border-accent/50 bg-accent/5">
              <CardHeader><CardTitle className="flex items-center gap-2 text-accent-foreground"><AlertTriangle className="h-5 w-5 text-accent" /> Farming Alerts</CardTitle></CardHeader>
              <CardContent className="space-y-2">
                {data.alerts.map((a, i) => (
                  <div key={i} className="flex items-start gap-3 p-3 rounded-md bg-background border border-border">
                    <Badge variant={a.severity === "high" ? "destructive" : "secondary"}>{a.type}</Badge>
                    <p className="text-sm flex-1">{a.message}</p>
                  </div>
                ))}
              </CardContent>
            </Card>
          )}

          <Card className="shadow-soft">
            <CardHeader><CardTitle>5-Day Forecast</CardTitle></CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
                {data.forecast.map((d) => (
                  <div key={d.date} className="p-3 rounded-lg border border-border bg-gradient-card text-center">
                    <p className="text-xs text-muted-foreground mb-1">{new Date(d.date).toLocaleDateString("en", { weekday: "short" })}</p>
                    <div className="text-3xl mb-1">{codeEmoji(d.weatherCode)}</div>
                    <p className="text-sm font-semibold">{Math.round(d.tempMax)}° / <span className="text-muted-foreground">{Math.round(d.tempMin)}°</span></p>
                    <p className="text-xs text-muted-foreground mt-1">💧 {d.precipitation}mm</p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
