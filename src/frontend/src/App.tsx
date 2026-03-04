import { Skeleton } from "@/components/ui/skeleton";
import { useQueryClient } from "@tanstack/react-query";
import { useEffect, useRef } from "react";
import { toast } from "sonner";
import Dashboard from "./components/Dashboard";
import LoginPage from "./components/LoginPage";
import ProfileSetupModal from "./components/ProfileSetupModal";
import { ThemeProvider } from "./contexts/ThemeContext";
import { useInternetIdentity } from "./hooks/useInternetIdentity";
import { useGetCallerUserProfile } from "./hooks/useQueries";

const INACTIVITY_TIMEOUT_MS = 5 * 60 * 1000; // 5 minutes

function AppLoader() {
  return (
    <div className="min-h-screen bg-background flex items-center justify-center">
      <div className="flex flex-col items-center gap-4">
        <div className="w-12 h-12 rounded-xl bg-teal/10 border border-teal/20 flex items-center justify-center">
          <img
            src="/assets/generated/infovault-logo-transparent.dim_64x64.png"
            alt="InfoVault"
            className="w-7 h-7 object-contain"
          />
        </div>
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-teal animate-pulse" />
          <span className="text-sm text-muted-foreground">
            Initializing vault...
          </span>
        </div>
        <div className="space-y-2 w-64">
          <Skeleton className="h-2 w-full bg-secondary rounded" />
          <Skeleton className="h-2 w-3/4 bg-secondary rounded" />
        </div>
      </div>
    </div>
  );
}

function AuthenticatedApp() {
  const { clear } = useInternetIdentity();
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    const resetTimer = () => {
      if (timerRef.current) clearTimeout(timerRef.current);
      timerRef.current = setTimeout(async () => {
        await clear();
        toast("Session locked due to inactivity", {
          description: "Please sign in again to continue.",
          icon: "🔒",
        });
      }, INACTIVITY_TIMEOUT_MS);
    };

    const events = ["mousemove", "keydown", "click", "touchstart"] as const;
    for (const event of events) {
      window.addEventListener(event, resetTimer, { passive: true });
    }
    resetTimer(); // start initial timer

    return () => {
      for (const event of events) {
        window.removeEventListener(event, resetTimer);
      }
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [clear]);

  const queryClient = useQueryClient();
  const {
    data: profile,
    isLoading: profileLoading,
    isFetched: profileFetched,
  } = useGetCallerUserProfile();

  if (profileLoading) {
    return <AppLoader />;
  }

  const showProfileSetup = profileFetched && profile === null;

  if (showProfileSetup) {
    return (
      <>
        <Dashboard />
        <ProfileSetupModal
          onComplete={() => {
            queryClient.invalidateQueries({ queryKey: ["currentUserProfile"] });
          }}
        />
      </>
    );
  }

  return <Dashboard />;
}

export default function App() {
  const { identity, isInitializing } = useInternetIdentity();
  const isAuthenticated = !!identity;

  if (isInitializing) {
    return (
      <ThemeProvider>
        <AppLoader />
      </ThemeProvider>
    );
  }

  if (!isAuthenticated) {
    return (
      <ThemeProvider>
        <LoginPage />
      </ThemeProvider>
    );
  }

  return (
    <ThemeProvider>
      <AuthenticatedApp />
    </ThemeProvider>
  );
}
