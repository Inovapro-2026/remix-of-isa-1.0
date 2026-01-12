import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "@/hooks/useAuth";
import { ProtectedRoute } from "@/components/ProtectedRoute";

// Pages
import Index from "./pages/Index";
import Login from "./pages/Login";
import Cadastro from "./pages/Cadastro";
import AguardandoAprovacao from "./pages/AguardandoAprovacao";
import NotFound from "./pages/NotFound";
import RenovarPlano from "./pages/RenovarPlano";

// Admin Dashboard Pages
import AdminDashboard from "./pages/dashboard/AdminDashboard";
import MeuWhatsApp from "./pages/dashboard/MeuWhatsApp";
import MemoriaIA from "./pages/dashboard/MemoriaIA";
import AdminPlanos from "./pages/dashboard/AdminPlanos";

import Requests from "./pages/dashboard/Requests";
import Clients from "./pages/dashboard/Clients";
import Support from "./pages/dashboard/Support";
import Reports from "./pages/dashboard/Reports";
import Settings from "./pages/dashboard/Settings";
import ControlRoom from "./pages/dashboard/ControlRoom";

// Client Dashboard Pages
import ClientDashboard from "./pages/dashboard/ClientDashboard";
import ClientWhatsApp from "./pages/client/ClientWhatsApp";
import ClientPlanos from "./pages/client/ClientPlanos";

import ClientSupport from "./pages/client/ClientSupport";
import ClientProfile from "./pages/client/ClientProfile";
import ClientAIIdentity from "./pages/client/ClientAIIdentity";

import ClientProducts from "./pages/client/ClientProducts";
import ClientCategories from "./pages/client/ClientCategories";
import ClientIsaTest from "./pages/client/ClientIsaTest";
import ClientMemoryBehavior from "./pages/client/ClientMemoryBehavior";
import ClientVitrine from "./pages/client/ClientVitrine";
import ClientSaldo from "./pages/client/ClientSaldo";
import ClientSaque from "./pages/client/ClientSaque";
import ClientSales from "./pages/client/ClientSales";
import Vitrine from "./pages/Vitrine";
import ProductPage from "./pages/ProductPage";
import OrderTracking from "./pages/OrderTracking";

// Admin extra pages
import AdminSaques from "./pages/dashboard/AdminSaques";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <AuthProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter
          future={{
            v7_startTransition: true,
            v7_relativeSplatPath: true,
          }}
        >
          <Routes>
            {/* Public Routes */}
            <Route path="/" element={<Index />} />
            <Route path="/login" element={<Login />} />
            <Route path="/cadastro" element={<Cadastro />} />
            <Route path="/aguardando-aprovacao" element={<AguardandoAprovacao />} />
            <Route path="/renovar-plano" element={<RenovarPlano />} />

            {/* Admin Routes */}
            <Route path="/dashboard/admin" element={
              <ProtectedRoute requireAdmin>
                <AdminDashboard />
              </ProtectedRoute>
            } />
            <Route path="/whatsapp-bot" element={
              <ProtectedRoute requireAdmin>
                <MeuWhatsApp />
              </ProtectedRoute>
            } />
            <Route path="/memoria-ia" element={
              <ProtectedRoute requireAdmin>
                <MemoriaIA />
              </ProtectedRoute>
            } />

            <Route path="/requests" element={
              <ProtectedRoute requireAdmin>
                <Requests />
              </ProtectedRoute>
            } />
            <Route path="/clients" element={
              <ProtectedRoute requireAdmin>
                <Clients />
              </ProtectedRoute>
            } />
            <Route path="/support" element={
              <ProtectedRoute requireAdmin>
                <Support />
              </ProtectedRoute>
            } />
            <Route path="/reports" element={
              <ProtectedRoute requireAdmin>
                <Reports />
              </ProtectedRoute>
            } />
            <Route path="/settings" element={
              <ProtectedRoute requireAdmin>
                <Settings />
              </ProtectedRoute>
            } />
            <Route path="/dashboard/control-room" element={
              <ProtectedRoute requireAdmin>
                <ControlRoom />
              </ProtectedRoute>
            } />
            <Route path="/admin/planos" element={
              <ProtectedRoute requireAdmin>
                <AdminPlanos />
              </ProtectedRoute>
            } />
            <Route path="/admin/saques" element={
              <ProtectedRoute requireAdmin>
                <AdminSaques />
              </ProtectedRoute>
            } />

            {/* Client Routes */}
            <Route path="/dashboard/client" element={
              <ProtectedRoute clientOnly>
                <ClientDashboard />
              </ProtectedRoute>
            } />

            <Route path="/client/support" element={
              <ProtectedRoute clientOnly>
                <ClientSupport />
              </ProtectedRoute>
            } />
            <Route path="/client/whatsapp" element={
              <ProtectedRoute clientOnly>
                <ClientWhatsApp />
              </ProtectedRoute>
            } />
            <Route path="/client/planos" element={
              <ProtectedRoute clientOnly>
                <ClientPlanos />
              </ProtectedRoute>
            } />

            <Route path="/client/memoria-ia" element={
              <ProtectedRoute>
                <ClientMemoryBehavior />
              </ProtectedRoute>
            } />
            <Route path="/client/products" element={
              <ProtectedRoute clientOnly>
                <ClientProducts />
              </ProtectedRoute>
            } />
            <Route path="/client/categories" element={
              <ProtectedRoute clientOnly>
                <ClientCategories />
              </ProtectedRoute>
            } />
            <Route path="/client/isa-test" element={
              <ProtectedRoute clientOnly>
                <ClientIsaTest />
              </ProtectedRoute>
            } />
            <Route path="/client/profile" element={
              <ProtectedRoute clientOnly>
                <ClientProfile />
              </ProtectedRoute>
            } />
            <Route path="/client/vitrine" element={
              <ProtectedRoute clientOnly>
                <ClientVitrine />
              </ProtectedRoute>
            } />
            <Route path="/client/saldo" element={
              <ProtectedRoute clientOnly>
                <ClientSaldo />
              </ProtectedRoute>
            } />
            <Route path="/client/saque" element={
              <ProtectedRoute clientOnly>
                <ClientSaque />
              </ProtectedRoute>
            } />

            {/* Client Sales Route */}
            <Route path="/client/vendas" element={
              <ProtectedRoute clientOnly>
                <ClientSales />
              </ProtectedRoute>
            } />

            {/* Public Vitrine Routes */}
            <Route path="/vitrine/:cpf" element={<Vitrine />} />
            <Route path="/vitrine/:cpf/produto/:productId" element={<ProductPage />} />

            {/* Public Order Tracking Route */}
            <Route path="/rastrear" element={<OrderTracking />} />
            <Route path="/rastrear/:paymentId" element={<OrderTracking />} />

            {/* 404 */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </AuthProvider>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
