import { useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Leaf, Upload, Loader2, AlertCircle, CheckCircle2 } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";

interface DiseaseResult {
  isPlant?: boolean;
  plantName?: string;
  disease?: string;
  healthy?: boolean;
  confidence?: number;
  symptoms?: string;
  treatment?: string[];
  prevention?: string[];
  error?: string;
  raw?: string;
}

export default function Disease() {
  const [preview, setPreview] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<DiseaseResult | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleFile = async (file: File) => {
    if (file.size > 5 * 1024 * 1024) return toast.error("Image too large (max 5MB)");
    if (!file.type.startsWith("image/")) return toast.error("Please upload an image");
    const reader = new FileReader();
    reader.onload = async () => {
      const base64 = reader.result as string;
      setPreview(base64); setResult(null); setLoading(true);
      try {
        const { data, error } = await supabase.functions.invoke("disease-detection", { body: { imageBase64: base64 } });
        if (error) throw error;
        setResult(data);
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          await supabase.from("activity_history").insert([{
            user_id: user.id, activity_type: "disease_detection", input_data: { filename: file.name } as any, result_data: data as any,
          }]);
        }
      } catch (e: unknown) {
        const msg = e instanceof Error ? e.message : "Detection failed";
        toast.error(msg);
      } finally { setLoading(false); }
    };
    reader.readAsDataURL(file);
  };

  return (
    <div className="container py-12 max-w-5xl animate-fade-in">
      <header className="mb-8">
        <div className="flex items-center gap-3 mb-2">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-gradient-leaf shadow-soft"><Leaf className="h-5 w-5 text-primary-foreground" /></div>
          <h1 className="font-display text-3xl font-bold">Disease Detection</h1>
        </div>
        <p className="text-muted-foreground">Upload a clear photo of a plant leaf — AI will identify the disease and suggest treatment.</p>
      </header>

      <div className="grid md:grid-cols-2 gap-6">
        <Card className="shadow-soft">
          <CardHeader><CardTitle>Upload leaf image</CardTitle><CardDescription>JPG / PNG, up to 5MB</CardDescription></CardHeader>
          <CardContent>
            <input ref={inputRef} type="file" accept="image/*" className="hidden" onChange={(e) => { const f = e.target.files?.[0]; if (f) handleFile(f); }} />
            <div onClick={() => inputRef.current?.click()} className="cursor-pointer border-2 border-dashed border-border rounded-lg p-8 text-center hover:border-primary hover:bg-secondary/30 transition-smooth">
              {preview ? (
                <img src={preview} alt="Uploaded leaf" className="max-h-64 mx-auto rounded-md" />
              ) : (
                <>
                  <Upload className="h-10 w-10 mx-auto mb-3 text-muted-foreground" />
                  <p className="text-sm font-medium">Click to upload a leaf photo</p>
                  <p className="text-xs text-muted-foreground mt-1">or drag & drop</p>
                </>
              )}
            </div>
            {preview && <Button variant="outline" className="w-full mt-4" onClick={() => inputRef.current?.click()}>Choose another image</Button>}
          </CardContent>
        </Card>

        <Card className="shadow-soft bg-gradient-card">
          <CardHeader><CardTitle>Analysis</CardTitle></CardHeader>
          <CardContent>
            {loading && <div className="flex flex-col items-center py-8 gap-3"><Loader2 className="h-8 w-8 animate-spin text-primary" /><p className="text-sm text-muted-foreground">Analyzing leaf with AI…</p></div>}
            {!loading && !result && <p className="text-sm text-muted-foreground py-8 text-center">Upload an image to get started</p>}
            {result && result.error && <div className="flex items-start gap-2 text-destructive"><AlertCircle className="h-5 w-5 mt-0.5" /><div><p className="font-medium">Analysis failed</p><p className="text-xs">{result.error}</p></div></div>}
            {result && result.isPlant === false && <div className="flex items-start gap-2 text-amber-600"><AlertCircle className="h-5 w-5 mt-0.5" /><p className="text-sm">This doesn't appear to be a plant leaf. Please upload a clear leaf photo.</p></div>}
            {result && result.isPlant !== false && !result.error && (
              <div className="space-y-4">
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <h3 className="font-semibold">{result.plantName ?? "Plant"}</h3>
                    {result.healthy ? <Badge className="bg-primary/20 text-primary border-primary/30"><CheckCircle2 className="h-3 w-3 mr-1" />Healthy</Badge> : <Badge variant="destructive">Disease</Badge>}
                  </div>
                  <p className="text-lg font-bold">{result.disease ?? "—"}</p>
                  {typeof result.confidence === "number" && (
                    <div className="mt-2"><div className="flex justify-between text-xs mb-1"><span>Confidence</span><span>{result.confidence}%</span></div><Progress value={result.confidence} /></div>
                  )}
                </div>
                {result.symptoms && <div><h4 className="font-semibold text-sm mb-1">Symptoms</h4><p className="text-sm text-muted-foreground">{result.symptoms}</p></div>}
                {result.treatment && result.treatment.length > 0 && <div><h4 className="font-semibold text-sm mb-1">Treatment</h4><ul className="text-sm text-muted-foreground list-disc pl-5 space-y-0.5">{result.treatment.map((t, i) => <li key={i}>{t}</li>)}</ul></div>}
                {result.prevention && result.prevention.length > 0 && <div><h4 className="font-semibold text-sm mb-1">Prevention</h4><ul className="text-sm text-muted-foreground list-disc pl-5 space-y-0.5">{result.prevention.map((t, i) => <li key={i}>{t}</li>)}</ul></div>}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
