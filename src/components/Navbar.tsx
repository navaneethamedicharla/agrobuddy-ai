import { Link, NavLink as RouterNavLink, useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Sprout, Menu, X, Languages } from "lucide-react";
import type { User } from "@supabase/supabase-js";
import { useI18n, LANG_LABELS, type Lang } from "@/lib/i18n";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export default function Navbar() {
  const [user, setUser] = useState<User | null>(null);
  const [open, setOpen] = useState(false);
  const navigate = useNavigate();
  const { t, lang, setLang } = useI18n();

  const links = [
    { to: "/", label: t("nav.home") },
    { to: "/crops", label: t("nav.crops") },
    { to: "/fertilizer", label: t("nav.fertilizer") },
    { to: "/disease", label: t("nav.disease") },
    { to: "/weather", label: t("nav.weather") },
    { to: "/chat", label: t("nav.chat") },
    { to: "/community", label: t("nav.community") },
  ];

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => setUser(data.session?.user ?? null));
    const { data: sub } = supabase.auth.onAuthStateChange((_e, session) => setUser(session?.user ?? null));
    return () => sub.subscription.unsubscribe();
  }, []);

  const signOut = async () => {
    await supabase.auth.signOut();
    navigate("/");
  };

  const LangSwitcher = () => (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="sm" className="gap-1.5">
          <Languages className="h-4 w-4" />
          <span className="text-xs">{LANG_LABELS[lang]}</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        {(Object.keys(LANG_LABELS) as Lang[]).map((l) => (
          <DropdownMenuItem key={l} onClick={() => setLang(l)}>
            {LANG_LABELS[l]}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );

  return (
    <header className="sticky top-0 z-40 w-full border-b border-border/60 bg-background/80 backdrop-blur-lg">
      <div className="container flex h-16 items-center justify-between">
        <Link to="/" className="flex items-center gap-2 font-display font-bold text-lg">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-gradient-leaf shadow-soft">
            <Sprout className="h-5 w-5 text-primary-foreground" />
          </div>
          <span>Agrobuddy</span>
        </Link>

        <nav className="hidden md:flex items-center gap-1">
          {links.map((l) => (
            <RouterNavLink
              key={l.to}
              to={l.to}
              end={l.to === "/"}
              className={({ isActive }) =>
                `px-3 py-2 rounded-md text-sm font-medium transition-smooth ${
                  isActive ? "text-primary bg-secondary" : "text-muted-foreground hover:text-foreground hover:bg-secondary/60"
                }`
              }
            >
              {l.label}
            </RouterNavLink>
          ))}
        </nav>

        <div className="hidden md:flex items-center gap-2">
          <LangSwitcher />
          {user ? (
            <Button variant="outline" size="sm" onClick={signOut}>{t("nav.signout")}</Button>
          ) : (
            <>
              <Button variant="ghost" size="sm" asChild><Link to="/auth">{t("nav.signin")}</Link></Button>
              <Button size="sm" asChild><Link to="/auth">{t("nav.getstarted")}</Link></Button>
            </>
          )}
        </div>

        <div className="md:hidden flex items-center gap-1">
          <LangSwitcher />
          <button className="p-2" onClick={() => setOpen(!open)} aria-label="Menu">
            {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>
      </div>

      {open && (
        <div className="md:hidden border-t border-border/60 bg-background">
          <div className="container py-3 flex flex-col gap-1">
            {links.map((l) => (
              <RouterNavLink
                key={l.to} to={l.to} end={l.to === "/"} onClick={() => setOpen(false)}
                className={({ isActive }) =>
                  `px-3 py-2 rounded-md text-sm font-medium ${isActive ? "text-primary bg-secondary" : "text-muted-foreground"}`
                }
              >
                {l.label}
              </RouterNavLink>
            ))}
            <div className="border-t border-border/60 pt-2 mt-1">
              {user ? (
                <Button variant="outline" size="sm" className="w-full" onClick={signOut}>{t("nav.signout")}</Button>
              ) : (
                <Button size="sm" className="w-full" asChild><Link to="/auth">{t("nav.signin")}</Link></Button>
              )}
            </div>
          </div>
        </div>
      )}
    </header>
  );
}
