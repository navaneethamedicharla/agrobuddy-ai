import { Outlet } from "react-router-dom";
import Navbar from "./Navbar";
import { useI18n } from "@/lib/i18n";

export default function Layout() {
  const { t } = useI18n();
  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Navbar />
      <main className="flex-1">
        <Outlet />
      </main>
      <footer className="border-t border-border/60 mt-16 py-8 bg-secondary/30">
        <div className="container text-center text-sm text-muted-foreground">
          <p>{t("footer.tag")}</p>
          <p className="mt-1 text-xs">{t("footer.sub")}</p>
        </div>
      </footer>
    </div>
  );
}
