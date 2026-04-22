import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { recommendCrops, type Season, type SoilType, type Water, type CropMatch } from "@/lib/agronomy";
import { supabase } from "@/integrations/supabase/client";
import { Sprout, Trophy } from "lucide-react";
import { toast } from "sonner";

export default function Crops() {
  const [region, setRegion] = useState("");
  const [season, setSeason] = useState<Season>("Kharif");
  const [soil, setSoil] = useState<SoilType>("Loamy");
  const [water, setWater] = useState<Water>("Medium");
  const [results, setResults] = useState<CropMatch[] | null>(null);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!region.trim()) return toast.error("Please enter a region");
    const matches = recommendCrops({ region, season, soil, water });
    setResults(matches);
    if (matches.length === 0) toast.info("No strong matches — try adjusting inputs.");
    // Save to history if logged in
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      await supabase.from("activity_history").insert([{
        user_id: user.id, activity_type: "crop_recommendation",
        input_data: { region, season, soil, water },
        result_data: { crops: matches.map((m) => m.crop.name) },
      }]);
    }
  };

  return (
    <div className="container py-12 max-w-5xl animate-fade-in">
      <header className="mb-8">
        <div className="flex items-center gap-3 mb-2">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-gradient-leaf shadow-soft"><Sprout className="h-5 w-5 text-primary-foreground" /></div>
          <h1 className="font-display text-3xl font-bold">Crop Recommendation</h1>
        </div>
        <p className="text-muted-foreground">Get the best crops for your land based on region, season, soil and water.</p>
      </header>

      <div className="grid md:grid-cols-2 gap-6">
        <Card className="shadow-soft">
          <CardHeader><CardTitle>Tell us about your farm</CardTitle><CardDescription>Fill in the details below</CardDescription></CardHeader>
          <CardContent>
            <form onSubmit={submit} className="space-y-4">
              <div><Label>Region / City</Label><Input value={region} onChange={(e) => setRegion(e.target.value)} placeholder="e.g. Hyderabad, Punjab" required /></div>
              <div>
                <Label>Season</Label>
                <Select value={season} onValueChange={(v) => setSeason(v as Season)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Kharif">Kharif (June–Oct)</SelectItem>
                    <SelectItem value="Rabi">Rabi (Nov–Apr)</SelectItem>
                    <SelectItem value="Zaid">Zaid (Mar–Jun)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Soil type</Label>
                <Select value={soil} onValueChange={(v) => setSoil(v as SoilType)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {["Loamy", "Clay", "Sandy", "Black", "Red"].map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Water availability</Label>
                <Select value={water} onValueChange={(v) => setWater(v as Water)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {["Low", "Medium", "High"].map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <Button type="submit" className="w-full" size="lg">Get Recommendations</Button>
            </form>
          </CardContent>
        </Card>

        <Card className="shadow-soft bg-gradient-card">
          <CardHeader><CardTitle>Results</CardTitle><CardDescription>Suitable crops for your conditions</CardDescription></CardHeader>
          <CardContent>
            {!results && <p className="text-muted-foreground text-sm py-8 text-center">Submit the form to see recommendations</p>}
            {results && results.length === 0 && <p className="text-muted-foreground text-sm py-8 text-center">No strong matches found. Try adjusting your inputs.</p>}
            {results && results.length > 0 && (
              <div className="space-y-3">
                {results.map((m, i) => (
                  <div key={m.crop.name} className={`p-4 rounded-lg border ${i === 0 ? "border-primary bg-primary/5 shadow-soft" : "border-border"}`}>
                    <div className="flex items-start justify-between gap-3 mb-1">
                      <div className="flex items-center gap-2">
                        <span className="text-2xl">{m.crop.emoji}</span>
                        <h3 className="font-semibold">{m.crop.name}</h3>
                        {i === 0 && <Badge className="gap-1"><Trophy className="h-3 w-3" /> Best</Badge>}
                      </div>
                      <Badge variant="secondary">Score {m.score}/9</Badge>
                    </div>
                    <p className="text-sm text-muted-foreground">{m.crop.notes}</p>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
