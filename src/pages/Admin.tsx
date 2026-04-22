import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Loader2, Shield, AlertCircle } from "lucide-react";

export default function Admin() {
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const [stats, setStats] = useState<{ users: number; posts: number; comments: number; activities: number } | null>(null);

  useEffect(() => {
    (async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { setLoading(false); return; }
      const { data: roles } = await supabase.from("user_roles").select("role").eq("user_id", user.id);
      const admin = roles?.some((r) => r.role === "admin") ?? false;
      setIsAdmin(admin);
      if (admin) {
        const [{ count: posts }, { count: comments }, { count: activities }, { count: users }] = await Promise.all([
          supabase.from("blog_posts").select("*", { count: "exact", head: true }),
          supabase.from("blog_comments").select("*", { count: "exact", head: true }),
          supabase.from("activity_history").select("*", { count: "exact", head: true }),
          supabase.from("profiles").select("*", { count: "exact", head: true }),
        ]);
        setStats({ users: users ?? 0, posts: posts ?? 0, comments: comments ?? 0, activities: activities ?? 0 });
      }
      setLoading(false);
    })();
  }, []);

  if (loading) return <div className="flex justify-center py-24"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div>;

  if (!isAdmin) {
    return (
      <div className="container py-16 max-w-md text-center">
        <AlertCircle className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
        <h1 className="font-display text-2xl font-bold mb-2">Admin only</h1>
        <p className="text-muted-foreground mb-4">You don't have admin access. To grant a user admin rights, run this in Cloud → SQL:</p>
        <pre className="text-xs bg-secondary p-3 rounded-md text-left overflow-x-auto">
{`INSERT INTO public.user_roles (user_id, role)
VALUES ('<your-user-id>', 'admin');`}
        </pre>
        <Button variant="outline" className="mt-6" asChild><Link to="/">Back home</Link></Button>
      </div>
    );
  }

  return (
    <div className="container py-12 max-w-4xl animate-fade-in">
      <header className="mb-8 flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-gradient-leaf shadow-soft"><Shield className="h-5 w-5 text-primary-foreground" /></div>
        <h1 className="font-display text-3xl font-bold">Admin Dashboard</h1>
      </header>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {stats && (
          <>
            <Card><CardHeader><CardTitle className="text-3xl">{stats.users}</CardTitle></CardHeader><CardContent className="text-sm text-muted-foreground -mt-4">Users</CardContent></Card>
            <Card><CardHeader><CardTitle className="text-3xl">{stats.posts}</CardTitle></CardHeader><CardContent className="text-sm text-muted-foreground -mt-4">Posts</CardContent></Card>
            <Card><CardHeader><CardTitle className="text-3xl">{stats.comments}</CardTitle></CardHeader><CardContent className="text-sm text-muted-foreground -mt-4">Comments</CardContent></Card>
            <Card><CardHeader><CardTitle className="text-3xl">{stats.activities}</CardTitle></CardHeader><CardContent className="text-sm text-muted-foreground -mt-4">Activities</CardContent></Card>
          </>
        )}
      </div>
    </div>
  );
}
