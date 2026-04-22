import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import Layout from "@/components/Layout";
import { I18nProvider } from "@/lib/i18n";
import Home from "./pages/Home";
import Auth from "./pages/Auth";
import Crops from "./pages/Crops";
import Fertilizer from "./pages/Fertilizer";
import Disease from "./pages/Disease";
import Weather from "./pages/Weather";
import Chat from "./pages/Chat";
import Community from "./pages/Community";
import Admin from "./pages/Admin";
import NotFound from "./pages/NotFound.tsx";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <I18nProvider>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          <Route element={<Layout />}>
            <Route path="/" element={<Home />} />
            <Route path="/auth" element={<Auth />} />
            <Route path="/crops" element={<Crops />} />
            <Route path="/fertilizer" element={<Fertilizer />} />
            <Route path="/disease" element={<Disease />} />
            <Route path="/weather" element={<Weather />} />
            <Route path="/chat" element={<Chat />} />
            <Route path="/community" element={<Community />} />
            <Route path="/admin" element={<Admin />} />
            <Route path="*" element={<NotFound />} />
          </Route>
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
    </I18nProvider>
  </QueryClientProvider>
);

export default App;
