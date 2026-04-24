import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { lazy, Suspense } from "react";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Loader2 } from "lucide-react";
import Layout from "@/components/Layout";
import { I18nProvider } from "@/lib/i18n";
import Home from "./pages/Home";

const Auth = lazy(() => import("./pages/Auth"));
const Crops = lazy(() => import("./pages/Crops"));
const Fertilizer = lazy(() => import("./pages/Fertilizer"));
const Disease = lazy(() => import("./pages/Disease"));
const Weather = lazy(() => import("./pages/Weather"));
const Chat = lazy(() => import("./pages/Chat"));
const Community = lazy(() => import("./pages/Community"));
const Admin = lazy(() => import("./pages/Admin"));
const NotFound = lazy(() => import("./pages/NotFound.tsx"));

const queryClient = new QueryClient();

const PageFallback = () => (
  <div className="container py-20 flex items-center justify-center">
    <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
  </div>
);

const App = () => (
  <QueryClientProvider client={queryClient}>
    <I18nProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Suspense fallback={<PageFallback />}>
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
          </Suspense>
        </BrowserRouter>
      </TooltipProvider>
    </I18nProvider>
  </QueryClientProvider>
);

export default App;
