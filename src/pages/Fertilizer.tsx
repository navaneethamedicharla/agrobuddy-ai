import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { recommendFertilizer, type SoilType, type GrowthStage, type FarmingType, type FertilizerAdvice } from "@/lib/agronomy";
import { FlaskConical, Lightbulb } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";

export default function Fertilizer() {
  const [crop, setCrop] = useState("");
  const [soil, setSoil] = useState<SoilType>("Loamy");
  const [stage, setStage] = useState<GrowthStage>("Vegetative");
  const [type, setType] = useState<FarmingType>("Organic");
  const [result, setResult] = useState<{ primary: FertilizerAdvice[]; tips: string[] } | null>(null);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!crop.trim()) return toast.error("Please enter a crop name");
    const r = recommendFertilizer({ crop, soil, stage, type });
    setResult(r);
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      await supabase.from("activity_history").insert([{
        user_id: user.id, activity_type: "fertilizer", input_data: { crop, soil, stage, type } as any, result_data: r as any,
      }]);
    }
  };

  return (
    <div className="container py-12 max-w-5xl animate-fade-in">
      <header className="mb-8">
        <div className="flex items-center gap-3 mb-2">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-gradient-leaf shadow-soft"><FlaskConical className="h-5 w-5 text-primary-foreground" /></div>
          <h1 className="font-display text-3xl font-bold">Fertilizer Advisor</h1>
        </div>
        <p className="text-muted-foreground">Best practices for fertilizing your crop — organic or chemical.</p>
      </header>

      <div className="grid md:grid-cols-2 gap-6">
        <Card className="shadow-soft">
          <CardHeader><CardTitle>Your crop</CardTitle></CardHeader>
          <CardContent>
            <form onSubmit={submit} className="space-y-4">
              <div><Label>Crop</Label><Input value={crop} onChange={(e) => setCrop(e.target.value)} placeholder="e.g. Tomato, Rice, Wheat" required /></div>
              <div><Label>Soil type</Label>
                <Select value={soil} onValueChange={(v) => setSoil(v as SoilType)}><SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>{["Loamy","Clay","Sandy","Black","Red"].map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div><Label>Growth stage</Label>
                <Select value={stage} onValueChange={(v) => setStage(v as GrowthStage)}><SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>{["Seedling","Vegetative","Flowering","Fruiting"].map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div><Label>Farming type</Label>
                <Select value={type} onValueChange={(v) => setType(v as FarmingType)}><SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent><SelectItem value="Organic">Organic 🌿</SelectItem><SelectItem value="Chemical">Chemical 🧪</SelectItem></SelectContent>
                </Select>
              </div>
              <Button type="submit" className="w-full" size="lg">Get Plan</Button>
            </form>
          </CardContent>
        </Card>

        <Card className="shadow-soft bg-gradient-card">
          <CardHeader><CardTitle>Recommended Plan</CardTitle><CardDescription>{result ? `${type} approach for ${stage} stage` : "Submit the form to see fertilizer recommendations"}</CardDescription></CardHeader>
          <CardContent className="space-y-3">
            {result && result.primary.map((a) => (
              <div key={a.fertilizer} className="p-4 rounded-lg border border-border bg-background">
                <h3 className="font-semibold mb-1">{a.fertilizer}</h3>
                <div className="text-sm space-y-1 text-muted-foreground">
                  <p><span className="font-medium text-foreground">Method:</span> {a.method}</p>
                  <p><span className="font-medium text-foreground">Frequency:</span> {a.frequency}</p>
                  <p className="text-xs italic">{a.notes}</p>
                </div>
              </div>
            ))}
            {result && result.tips.length > 0 && (
              <div className="p-4 rounded-lg border border-accent/40 bg-accent/10">
                <div className="flex items-center gap-2 mb-2 font-semibold text-sm"><Lightbulb className="h-4 w-4 text-accent" /> Tips for your soil</div>
                <ul className="text-sm space-y-1 text-muted-foreground list-disc pl-5">
                  {result.tips.map((t) => <li key={t}>{t}</li>)}
                </ul>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
