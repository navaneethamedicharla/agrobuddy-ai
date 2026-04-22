import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import { Loader2, Sprout } from "lucide-react";
import { z } from "zod";

const emailSchema = z.string().email("Invalid email").max(255);
const passwordSchema = z.string().min(6, "At least 6 characters").max(72);
const nameSchema = z.string().trim().min(1, "Name required").max(80);

export default function Auth() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => { if (data.session) navigate("/"); });
  }, [navigate]);

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      emailSchema.parse(email); passwordSchema.parse(password);
    } catch (err) {
      if (err instanceof z.ZodError) return toast.error(err.errors[0].message);
    }
    setLoading(true);
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    setLoading(false);
    if (error) return toast.error(error.message);
    toast.success("Welcome back!"); navigate("/");
  };

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      nameSchema.parse(name); emailSchema.parse(email); passwordSchema.parse(password);
    } catch (err) {
      if (err instanceof z.ZodError) return toast.error(err.errors[0].message);
    }
    setLoading(true);
    const { error } = await supabase.auth.signUp({
      email, password,
      options: { emailRedirectTo: `${window.location.origin}/`, data: { display_name: name } },
    });
    setLoading(false);
    if (error) return toast.error(error.message);
    toast.success("Account created! You're signed in."); navigate("/");
  };

  return (
    <div className="container py-16 max-w-md animate-fade-in">
      <div className="text-center mb-8">
        <div className="inline-flex h-14 w-14 items-center justify-center rounded-xl bg-gradient-leaf shadow-elegant mb-4">
          <Sprout className="h-7 w-7 text-primary-foreground" />
        </div>
        <h1 className="font-display text-3xl font-bold">Welcome to KrishiAI</h1>
        <p className="text-muted-foreground mt-1">Sign in to save your activity and join the community</p>
      </div>

      <Card className="shadow-elegant">
        <CardHeader>
          <Tabs defaultValue="signin">
            <TabsList className="grid grid-cols-2 w-full">
              <TabsTrigger value="signin">Sign in</TabsTrigger>
              <TabsTrigger value="signup">Sign up</TabsTrigger>
            </TabsList>
            <TabsContent value="signin">
              <CardTitle className="mt-4">Sign in</CardTitle>
              <CardDescription>Use your email and password</CardDescription>
              <form onSubmit={handleSignIn} className="space-y-4 mt-6">
                <div><Label htmlFor="si-email">Email</Label><Input id="si-email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required /></div>
                <div><Label htmlFor="si-pw">Password</Label><Input id="si-pw" type="password" value={password} onChange={(e) => setPassword(e.target.value)} required /></div>
                <Button type="submit" className="w-full" disabled={loading}>{loading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Sign in"}</Button>
              </form>
            </TabsContent>
            <TabsContent value="signup">
              <CardTitle className="mt-4">Create account</CardTitle>
              <CardDescription>Free, takes a few seconds</CardDescription>
              <form onSubmit={handleSignUp} className="space-y-4 mt-6">
                <div><Label htmlFor="su-name">Name</Label><Input id="su-name" value={name} onChange={(e) => setName(e.target.value)} required /></div>
                <div><Label htmlFor="su-email">Email</Label><Input id="su-email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required /></div>
                <div><Label htmlFor="su-pw">Password</Label><Input id="su-pw" type="password" value={password} onChange={(e) => setPassword(e.target.value)} required /></div>
                <Button type="submit" className="w-full" disabled={loading}>{loading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Create account"}</Button>
              </form>
            </TabsContent>
          </Tabs>
        </CardHeader>
        <CardContent />
      </Card>
    </div>
  );
}
