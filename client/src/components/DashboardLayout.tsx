import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarInset,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarProvider,
  SidebarTrigger,
  useSidebar,
} from "@/components/ui/sidebar";
import { getLoginUrl } from "@/const";
import { useIsMobile } from "@/hooks/useMobile";
import { LayoutDashboard, LogOut, PanelLeft, Users, MapPin, FileText, DollarSign, TrendingUp, History, UserCheck, Lock } from "lucide-react";
import { CSSProperties, useEffect, useRef, useState } from "react";
import { useLocation } from "wouter";
import { DashboardLayoutSkeleton } from './DashboardLayoutSkeleton';
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { trpc } from "@/lib/trpc";

const menuItems = [
  { icon: LayoutDashboard, label: "Dashboard", path: "/" },
  { icon: Users, label: "Clientes", path: "/clients", submenu: [
    { label: "Filtrados", path: "/clients/filtered" },
    { label: "Pendentes", path: "/clients/pending" },
    { label: "Contratados", path: "/clients/contracted" },
    { label: "Em Outro Momento", path: "/clients/awaiting" },
  ]},
  { icon: MapPin, label: "Buscar Boxes", path: "/leads/search" },
  { icon: FileText, label: "Leads", path: "/leads" },
  { icon: DollarSign, label: "Financeiro", path: "/financials" },
  { icon: UserCheck, label: "Consultores", path: "/consultants" },
  { icon: TrendingUp, label: "Comissões", path: "/commissions" },
  { icon: History, label: "Pagamentos", path: "/payments" },
];

const SIDEBAR_WIDTH_KEY = "sidebar-width";
const DEFAULT_WIDTH = 280;
const MIN_WIDTH = 200;
const MAX_WIDTH = 480;

// Componente de login local (sem OAuth)
function LocalLoginForm() {
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const utils = trpc.useUtils();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/local-login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password }),
        credentials: "include",
      });
      if (res.ok) {
        // Recarrega a query de auth para atualizar o estado
        await utils.auth.me.invalidate();
        window.location.reload();
      } else {
        const data = await res.json() as { error?: string };
        setError(data.error || "Senha incorreta");
      }
    } catch {
      setError("Erro de conexão. Verifique se o servidor está rodando.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-50">
      <div className="flex flex-col items-center gap-6 p-8 max-w-sm w-full bg-white rounded-2xl shadow-lg border">
        <div className="flex flex-col items-center gap-3">
          <div className="w-14 h-14 bg-orange-500 rounded-xl flex items-center justify-center">
            <Lock className="w-7 h-7 text-white" />
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-center text-gray-900">
            WODPULSE CRM
          </h1>
          <p className="text-sm text-gray-500 text-center">
            Digite a senha para acessar o sistema
          </p>
        </div>

        <form onSubmit={handleLogin} className="w-full flex flex-col gap-3">
          <Input
            type="password"
            placeholder="Senha de acesso"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            autoFocus
            className="text-center text-lg tracking-widest"
          />
          {error && (
            <p className="text-sm text-red-500 text-center">{error}</p>
          )}
          <Button
            type="submit"
            disabled={loading || !password}
            className="w-full bg-orange-500 hover:bg-orange-600 text-white"
            size="lg"
          >
            {loading ? "Entrando..." : "Entrar"}
          </Button>
        </form>

        <p className="text-xs text-gray-400 text-center">
          Senha padrão: <span className="font-mono font-semibold">wodpulse2026</span>
        </p>
      </div>
    </div>
  );
}

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [sidebarWidth, setSidebarWidth] = useState(() => {
    const saved = localStorage.getItem(SIDEBAR_WIDTH_KEY);
    return saved ? parseInt(saved, 10) : DEFAULT_WIDTH;
  });
  const { loading, user } = useAuth();

  useEffect(() => {
    localStorage.setItem(SIDEBAR_WIDTH_KEY, sidebarWidth.toString());
  }, [sidebarWidth]);

  if (loading) {
    return <DashboardLayoutSkeleton />
  }

  // Se não há usuário autenticado, verifica se há OAuth configurado
  if (!user) {
    const loginUrl = getLoginUrl();
    if (loginUrl) {
      // Tem OAuth configurado (ambiente Manus) → redireciona para login OAuth
      return (
        <div className="flex items-center justify-center min-h-screen">
          <div className="flex flex-col items-center gap-8 p-8 max-w-md w-full">
            <div className="flex flex-col items-center gap-6">
              <h1 className="text-2xl font-semibold tracking-tight text-center">
                Sign in to continue
              </h1>
              <p className="text-sm text-muted-foreground text-center max-w-sm">
                Access to this dashboard requires authentication. Continue to launch the login flow.
              </p>
            </div>
            <Button
              onClick={() => {
                window.location.href = loginUrl;
              }}
              size="lg"
              className="w-full shadow-lg hover:shadow-xl transition-all"
            >
              Sign in
            </Button>
          </div>
        </div>
      );
    } else {
      // Sem OAuth configurado (uso local) → mostra formulário de senha local
      return <LocalLoginForm />;
    }
  }

  return (
    <SidebarProvider
      style={
        {
          "--sidebar-width": `${sidebarWidth}px`,
        } as CSSProperties
      }
    >
      <AppSidebar sidebarWidth={sidebarWidth} setSidebarWidth={setSidebarWidth} />
      <SidebarInset>
        <header className="flex h-14 items-center gap-2 border-b px-4 sticky top-0 bg-background z-10">
          <SidebarTrigger className="-ml-1" />
        </header>
        <main className="flex-1 overflow-auto">
          {children}
        </main>
      </SidebarInset>
    </SidebarProvider>
  );
}

function AppSidebar({
  sidebarWidth,
  setSidebarWidth,
}: {
  sidebarWidth: number;
  setSidebarWidth: (w: number) => void;
}) {
  const [location, navigate] = useLocation();
  const isMobile = useIsMobile();
  const { user, logout } = useAuth();
  const { open } = useSidebar();
  const isResizing = useRef(false);
  const startX = useRef(0);
  const startWidth = useRef(0);

  const handleMouseDown = (e: React.MouseEvent) => {
    if (isMobile || !open) return;
    isResizing.current = true;
    startX.current = e.clientX;
    startWidth.current = sidebarWidth;
    document.body.style.cursor = "col-resize";
    document.body.style.userSelect = "none";
  };

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!isResizing.current) return;
      const delta = e.clientX - startX.current;
      const newWidth = Math.min(MAX_WIDTH, Math.max(MIN_WIDTH, startWidth.current + delta));
      setSidebarWidth(newWidth);
    };
    const handleMouseUp = () => {
      if (!isResizing.current) return;
      isResizing.current = false;
      document.body.style.cursor = "";
      document.body.style.userSelect = "";
    };
    document.addEventListener("mousemove", handleMouseMove);
    document.addEventListener("mouseup", handleMouseUp);
    return () => {
      document.removeEventListener("mousemove", handleMouseMove);
      document.removeEventListener("mouseup", handleMouseUp);
    };
  }, [setSidebarWidth]);

  return (
    <Sidebar collapsible="icon">
      <SidebarHeader className="border-b">
        <div className="flex items-center gap-2 px-2 py-1">
          <div className="w-8 h-8 bg-orange-500 rounded-lg flex items-center justify-center flex-shrink-0">
            <span className="text-white font-bold text-xs">WP</span>
          </div>
          <div className="flex flex-col min-w-0 group-data-[collapsible=icon]:hidden">
            <span className="font-semibold text-sm truncate">WODPULSE</span>
            <span className="text-xs text-muted-foreground truncate">CRM</span>
          </div>
        </div>
      </SidebarHeader>

      <SidebarContent>
        <SidebarMenu className="px-2 py-2 gap-1">
          {menuItems.map((item) => (
            <SidebarMenuItem key={item.path}>
              <SidebarMenuButton
                isActive={location === item.path || (item.path !== "/" && location.startsWith(item.path))}
                onClick={() => navigate(item.path)}
                tooltip={item.label}
              >
                <item.icon className="w-4 h-4" />
                <span>{item.label}</span>
              </SidebarMenuButton>
            </SidebarMenuItem>
          ))}
        </SidebarMenu>
      </SidebarContent>

      <SidebarFooter className="border-t">
        <SidebarMenu>
          <SidebarMenuItem>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <SidebarMenuButton tooltip={user?.name || "Usuário"}>
                  <Avatar className="w-5 h-5">
                    <AvatarFallback className="text-xs bg-orange-100 text-orange-700">
                      {user?.name?.charAt(0).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex flex-col min-w-0 group-data-[collapsible=icon]:hidden">
                    <span className="text-sm font-medium truncate">{user?.name || "-"}</span>
                    <span className="text-xs text-muted-foreground truncate">{user?.email || "-"}</span>
                  </div>
                </SidebarMenuButton>
              </DropdownMenuTrigger>
              <DropdownMenuContent side="top" align="start" className="w-48">
                <DropdownMenuItem onClick={() => logout()}>
                  <LogOut className="w-4 h-4 mr-2" />
                  Sair
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>

      {/* Resize handle */}
      {!isMobile && open && (
        <div
          className="absolute right-0 top-0 bottom-0 w-1 cursor-col-resize hover:bg-orange-300 transition-colors z-50"
          onMouseDown={handleMouseDown}
        />
      )}
    </Sidebar>
  );
}

// Re-export useAuth for use within this file
import { useAuth } from "@/_core/hooks/useAuth";
