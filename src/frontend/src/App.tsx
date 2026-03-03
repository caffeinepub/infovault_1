import { Skeleton } from "@/components/ui/skeleton";
import { useQueryClient } from "@tanstack/react-query";
import Dashboard from "./components/Dashboard";
import LoginPage from "./components/LoginPage";
import ProfileSetupModal from "./components/ProfileSetupModal";
import { useInternetIdentity } from "./hooks/useInternetIdentity";
import { useGetCallerUserProfile } from "./hooks/useQueries";

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

export default function App() {
  const { identity, isInitializing } = useInternetIdentity();
  const queryClient = useQueryClient();
  const isAuthenticated = !!identity;

  const {
    data: profile,
    isLoading: profileLoading,
    isFetched: profileFetched,
  } = useGetCallerUserProfile();

  // Show loader while auth is initializing
  if (isInitializing) {
    return <AppLoader />;
  }

  // Not logged in — show login page
  if (!isAuthenticated) {
    return <LoginPage />;
  }

  // Logged in but still loading profile
  if (profileLoading) {
    return <AppLoader />;
  }

  // Profile loaded and it's null — first time user, show setup
  const showProfileSetup =
    isAuthenticated && profileFetched && profile === null;

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

  // Fully authenticated and profile exists
  return <Dashboard />;
}
