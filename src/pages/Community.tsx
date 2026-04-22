import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Users, Loader2, MessageSquare, Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { z } from "zod";

interface Post {
  id: string;
  user_id: string;
  title: string;
  content: string;
  created_at: string;
  display_name?: string | null;
}

const postSchema = z.object({
  title: z.string().trim().min(3).max(150),
  content: z.string().trim().min(10).max(5000),
});

export default function Community() {
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [user, setUser] = useState<{ id: string } | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);

  const load = async () => {
    setLoading(true);
    const { data: postRows } = await supabase
      .from("blog_posts")
      .select("id, user_id, title, content, created_at")
      .order("created_at", { ascending: false });
    if (!postRows) { setPosts([]); setLoading(false); return; }

    const userIds = [...new Set(postRows.map((p) => p.user_id))];
    const { data: profs } = await supabase.from("profiles").select("id, display_name").in("id", userIds);
    const nameMap = new Map(profs?.map((p) => [p.id, p.display_name]) ?? []);
    setPosts(postRows.map((p) => ({ ...p, display_name: nameMap.get(p.user_id) ?? "Farmer" })));
    setLoading(false);
  };

  useEffect(() => {
    load();
    supabase.auth.getUser().then(async ({ data }) => {
      if (data.user) {
        setUser({ id: data.user.id });
        const { data: roles } = await supabase.from("user_roles").select("role").eq("user_id", data.user.id);
        setIsAdmin(roles?.some((r) => r.role === "admin") ?? false);
      }
    });
  }, []);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return toast.error("Please sign in to post");
    const parsed = postSchema.safeParse({ title, content });
    if (!parsed.success) return toast.error(parsed.error.errors[0].message);
    setSubmitting(true);
    const { error } = await supabase.from("blog_posts").insert({ user_id: user.id, title: parsed.data.title, content: parsed.data.content });
    setSubmitting(false);
    if (error) return toast.error(error.message);
    toast.success("Posted!");
    setOpen(false); setTitle(""); setContent(""); load();
  };

  const remove = async (id: string) => {
    if (!confirm("Delete this post?")) return;
    const { error } = await supabase.from("blog_posts").delete().eq("id", id);
    if (error) return toast.error(error.message);
    toast.success("Deleted"); load();
  };

  return (
    <div className="container py-12 max-w-4xl animate-fade-in">
      <header className="mb-8 flex items-end justify-between gap-4 flex-wrap">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-gradient-leaf shadow-soft"><Users className="h-5 w-5 text-primary-foreground" /></div>
            <h1 className="font-display text-3xl font-bold">Farmer Community</h1>
          </div>
          <p className="text-muted-foreground">Share tips and learn from fellow farmers</p>
        </div>
        {user ? (
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild><Button><Plus className="h-4 w-4 mr-1" />New post</Button></DialogTrigger>
            <DialogContent>
              <DialogHeader><DialogTitle>Create a new post</DialogTitle></DialogHeader>
              <form onSubmit={submit} className="space-y-4">
                <Input placeholder="Title" value={title} onChange={(e) => setTitle(e.target.value)} required maxLength={150} />
                <Textarea placeholder="Share your tip, question or experience…" value={content} onChange={(e) => setContent(e.target.value)} required maxLength={5000} rows={6} />
                <Button type="submit" className="w-full" disabled={submitting}>{submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : "Publish"}</Button>
              </form>
            </DialogContent>
          </Dialog>
        ) : (
          <Button asChild variant="outline"><Link to="/auth">Sign in to post</Link></Button>
        )}
      </header>

      {loading && <div className="flex justify-center py-16"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div>}
      {!loading && posts.length === 0 && (
        <Card className="text-center py-12"><CardContent><MessageSquare className="h-10 w-10 mx-auto mb-3 text-muted-foreground" /><p className="text-muted-foreground">No posts yet. Be the first to share!</p></CardContent></Card>
      )}
      <div className="space-y-4">
        {posts.map((p) => (
          <Card key={p.id} className="shadow-soft hover:shadow-elegant transition-smooth">
            <CardHeader>
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1">
                  <CardTitle className="font-display">{p.title}</CardTitle>
                  <CardDescription>By {p.display_name} · {new Date(p.created_at).toLocaleDateString()}</CardDescription>
                </div>
                {(user?.id === p.user_id || isAdmin) && (
                  <Button size="icon" variant="ghost" onClick={() => remove(p.id)}><Trash2 className="h-4 w-4 text-destructive" /></Button>
                )}
              </div>
            </CardHeader>
            <CardContent>
              <p className="whitespace-pre-wrap text-sm leading-relaxed">{p.content}</p>
              <Comments postId={p.id} currentUserId={user?.id} isAdmin={isAdmin} />
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}

function Comments({ postId, currentUserId, isAdmin }: { postId: string; currentUserId?: string; isAdmin: boolean }) {
  const [comments, setComments] = useState<{ id: string; user_id: string; content: string; created_at: string; display_name?: string | null }[]>([]);
  const [text, setText] = useState("");
  const [show, setShow] = useState(false);
  const [loading, setLoading] = useState(false);

  const load = async () => {
    const { data: rows } = await supabase.from("blog_comments").select("id, user_id, content, created_at").eq("post_id", postId).order("created_at");
    if (!rows) return;
    const ids = [...new Set(rows.map((r) => r.user_id))];
    const { data: profs } = await supabase.from("profiles").select("id, display_name").in("id", ids);
    const map = new Map(profs?.map((p) => [p.id, p.display_name]) ?? []);
    setComments(rows.map((r) => ({ ...r, display_name: map.get(r.user_id) ?? "Farmer" })));
  };

  useEffect(() => { if (show) load(); }, [show]); // eslint-disable-line

  const post = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUserId) return toast.error("Sign in to comment");
    const trimmed = text.trim();
    if (trimmed.length < 1 || trimmed.length > 1000) return toast.error("1–1000 characters");
    setLoading(true);
    const { error } = await supabase.from("blog_comments").insert({ post_id: postId, user_id: currentUserId, content: trimmed });
    setLoading(false);
    if (error) return toast.error(error.message);
    setText(""); load();
  };

  const remove = async (id: string) => {
    if (!confirm("Delete comment?")) return;
    const { error } = await supabase.from("blog_comments").delete().eq("id", id);
    if (error) return toast.error(error.message);
    load();
  };

  return (
    <div className="mt-4 pt-4 border-t border-border/60">
      <button onClick={() => setShow((s) => !s)} className="text-xs text-muted-foreground hover:text-foreground flex items-center gap-1">
        <MessageSquare className="h-3 w-3" /> {show ? "Hide" : "Show"} comments
      </button>
      {show && (
        <div className="mt-3 space-y-2">
          {comments.map((c) => (
            <div key={c.id} className="text-sm bg-secondary/40 p-2.5 rounded-md flex items-start justify-between gap-2">
              <div><span className="font-medium">{c.display_name}</span>: <span className="text-muted-foreground">{c.content}</span></div>
              {(currentUserId === c.user_id || isAdmin) && <button onClick={() => remove(c.id)}><Trash2 className="h-3 w-3 text-destructive" /></button>}
            </div>
          ))}
          {currentUserId && (
            <form onSubmit={post} className="flex gap-2 mt-2">
              <Input value={text} onChange={(e) => setText(e.target.value)} placeholder="Write a comment…" maxLength={1000} />
              <Button type="submit" size="sm" disabled={loading}>Post</Button>
            </form>
          )}
        </div>
      )}
    </div>
  );
}
