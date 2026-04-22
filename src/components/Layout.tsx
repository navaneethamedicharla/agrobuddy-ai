import { Outlet } from "react-router-dom";
import Navbar from "./Navbar";

export default function Layout() {
  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Navbar />
      <main className="flex-1">
        <Outlet />
      </main>
      <footer className="border-t border-border/60 mt-16 py-8 bg-secondary/30">
        <div className="container text-center text-sm text-muted-foreground">
          <p>🌱 KrishiAI — Smart Agriculture for Indian Farmers</p>
          <p className="mt-1 text-xs">Powered by Lovable Cloud & AI · Weather by Open-Meteo</p>
        </div>
      </footer>
    </div>
  );
}
