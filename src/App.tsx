import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { HelmetProvider } from "react-helmet-async";
import { createPortal } from "react-dom";
import { Suspense, lazy, useEffect } from "react";
import "./i18n/config";
import { ScrollToTop } from "./components/ScrollToTop";
import { VisitorTracker } from "./components/VisitorTracker";
import { useStore } from "./store/useStore";
import { Topbar } from "@/components/Topbar";
import { Navbar } from "@/components/Navbar";

// Lazy load pages
const Index = lazy(() => import("./pages/Index"));
const Admin = lazy(() => import("./pages/Admin"));
const Orders = lazy(() => import("./pages/admin/Orders"));
const Analytics = lazy(() => import("./pages/admin/Analytics"));
const Cart = lazy(() => import("./pages/Cart"));
const Products = lazy(() => import("./pages/Products"));
const Locations = lazy(() => import("./pages/Locations"));
const About = lazy(() => import("./pages/About"));
const ProductDetails = lazy(() => import("./pages/ProductDetails"));

// Loading component
const Loading = () => (
  <div className="flex min-h-screen items-center justify-center">
    <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent"></div>
  </div>
);

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000, // 5 minutes
      gcTime: 10 * 60 * 1000, // 10 minutes
      retry: 1,
      refetchOnWindowFocus: false,
      refetchOnMount: false,
      refetchOnReconnect: false,
    },
  },
});

// Component to handle data loading
const DataLoader = () => {
  const refreshProducts = useStore((state) => state.refreshProducts);

  useEffect(() => {
    // Load products from store.json on app start
    refreshProducts();
  }, [refreshProducts]);

  return null;
};

const App = () => (
  <HelmetProvider>
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        {createPortal(<Toaster />, document.body)}
        {createPortal(<Sonner />, document.body)}
        <BrowserRouter>
          <DataLoader />
          <ScrollToTop />
          <VisitorTracker />
          {/* Topbar ثابت في الأعلى */}
          <Topbar />
          {/* Navbar sticky تحت Topbar */}
          <Navbar />
          <Suspense fallback={<Loading />}>
            <Routes>
              <Route path="/" element={<Index />} />
              <Route path="/admin" element={<Admin />} />
              <Route path="/admin/orders" element={<Orders />} />
              <Route path="/admin/analytics" element={<Analytics />} />
              <Route path="/cart" element={<Cart />} />
              <Route path="/products" element={<Products />} />
              <Route path="/products/:id" element={<ProductDetails />} />
              <Route path="/products/:id/:branchId" element={<ProductDetails />} />
              <Route path="/locations" element={<Locations />} />
              <Route path="/about" element={<About />} />
            </Routes>
          </Suspense>
        </BrowserRouter>
      </TooltipProvider>
    </QueryClientProvider>
  </HelmetProvider>
);

export default App;
