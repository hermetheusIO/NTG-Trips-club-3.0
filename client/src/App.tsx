import { Switch, Route, Redirect } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider, useQuery } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import LandingPage from "@/pages/LandingPage";
import WizardFormPage from "@/pages/WizardFormPage";
import ExperiencesPage from "@/pages/ExperiencesPage";
import TripsPage from "@/pages/TripsPage";
import TripsClubPage from "@/pages/TripsClubPage";
import TripsClubOnboarding from "@/pages/TripsClubOnboarding";
import TripsListPage from "@/pages/TripsListPage";
import MemberArea from "@/pages/MemberArea";
import DigitaisPage from "@/pages/DigitaisPage";
import AdminLogin from "@/pages/AdminLogin";
import AdminDashboard from "@/pages/AdminDashboard";
import AdminExperiences from "@/pages/AdminExperiences";
import AdminTrips from "@/pages/AdminTrips";
import ExperienceDetail from "@/pages/ExperienceDetail";
import TripDetail from "@/pages/TripDetail";
import TripAlbum from "@/pages/TripAlbum";
import AdminAlbums from "@/pages/AdminAlbums";
import ClubProposals from "@/pages/ClubProposals";
import TripsClubCreate from "@/pages/TripsClubCreate";
import HowItWorks from "@/pages/HowItWorks";
import NotFound from "@/pages/not-found";
import { Loader2 } from "lucide-react";

interface AuthState {
  authenticated: boolean;
  admin?: { id: number; email: string };
}

function ProtectedRoute({ component: Component }: { component: React.ComponentType }) {
  const { data: auth, isLoading } = useQuery<AuthState>({
    queryKey: ["/api/auth/me"],
    retry: false,
  });

  if (isLoading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!auth?.authenticated) {
    return <Redirect to="/admin/login" />;
  }

  return <Component />;
}

interface UserAuthState {
  id: string;
  email: string;
}

function UserProtectedRoute({ component: Component }: { component: React.ComponentType }) {
  const { data: user, isLoading } = useQuery<UserAuthState | null>({
    queryKey: ["/api/auth/user"],
    queryFn: async () => {
      const res = await fetch("/api/auth/user", { credentials: "include" });
      if (res.status === 401) return null;
      if (!res.ok) throw new Error("Auth check failed");
      return res.json();
    },
    retry: false,
  });

  if (isLoading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-yellow-400" />
      </div>
    );
  }

  if (!user) {
    return <Redirect to="/api/login" />;
  }

  return <Component />;
}

function Router() {
  return (
    <Switch>
      <Route path="/" component={LandingPage} />
      <Route path="/coimbra" component={LandingPage} />
      <Route path="/como-funciona" component={HowItWorks} />
      <Route path="/coimbra/conhecer/form" component={WizardFormPage} />
      <Route path="/coimbra/viver" component={ExperiencesPage} />
      <Route path="/experiencias" component={ExperiencesPage} />
      <Route path="/experiencias/:slug" component={ExperienceDetail} />
      <Route path="/viagens" component={TripsClubPage} />
      <Route path="/viagens/lista" component={TripsListPage} />
      <Route path="/viagens/:slug" component={TripDetail} />
      <Route path="/viagens/:slug/album" component={TripAlbum} />
      <Route path="/trips" component={TripsClubPage} />
      <Route path="/trips-club" component={TripsClubPage} />
      <Route path="/trips-club/onboarding" component={TripsClubOnboarding} />
      <Route path="/trips-club/member">
        {() => <UserProtectedRoute component={MemberArea} />}
      </Route>
      <Route path="/trips-club/propostas">
        {() => <UserProtectedRoute component={ClubProposals} />}
      </Route>
      <Route path="/trips-club/criar">
        {() => <UserProtectedRoute component={TripsClubCreate} />}
      </Route>
      <Route path="/viagem/:slug" component={TripDetail} />
      <Route path="/minha-conta">
        {() => <UserProtectedRoute component={MemberArea} />}
      </Route>
      <Route path="/ntg-trips" component={TripsClubPage} />
      <Route path="/digitais" component={DigitaisPage} />
      <Route path="/admin/login" component={AdminLogin} />
      <Route path="/admin">
        {() => <ProtectedRoute component={AdminDashboard} />}
      </Route>
      <Route path="/admin/experiences">
        {() => <ProtectedRoute component={AdminExperiences} />}
      </Route>
      <Route path="/admin/trips">
        {() => <ProtectedRoute component={AdminTrips} />}
      </Route>
      <Route path="/admin/albums">
        {() => <ProtectedRoute component={AdminAlbums} />}
      </Route>
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Router />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
