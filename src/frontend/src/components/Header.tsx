import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useQueryClient } from "@tanstack/react-query";
import {
  ChevronDown,
  Loader2,
  LogOut,
  Settings,
  Shield,
  User,
} from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { useInternetIdentity } from "../hooks/useInternetIdentity";
import {
  useGetCallerUserProfile,
  useSaveCallerUserProfile,
} from "../hooks/useQueries";
import { getInitials } from "../utils/format";

export default function Header() {
  const { clear } = useInternetIdentity();
  const queryClient = useQueryClient();
  const { data: profile } = useGetCallerUserProfile();
  const saveProfile = useSaveCallerUserProfile();

  const [profileOpen, setProfileOpen] = useState(false);
  const [editName, setEditName] = useState("");

  const handleLogout = async () => {
    await clear();
    queryClient.clear();
  };

  const handleOpenProfile = () => {
    setEditName(profile?.name ?? "");
    setProfileOpen(true);
  };

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editName.trim()) return;
    try {
      await saveProfile.mutateAsync({ name: editName.trim() });
      toast.success("Profile updated");
      setProfileOpen(false);
    } catch {
      toast.error("Failed to update profile");
    }
  };

  const displayName = profile?.name ?? "Vault User";
  const initials = getInitials(displayName);

  return (
    <>
      <header className="sticky top-0 z-40 w-full border-b border-border bg-background/95 backdrop-blur-sm">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          {/* Logo */}
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-teal/10 border border-teal/20 flex items-center justify-center">
              <img
                src="/assets/generated/infovault-logo-transparent.dim_64x64.png"
                alt="InfoVault"
                className="w-5 h-5 object-contain"
              />
            </div>
            <span className="font-display text-lg font-bold tracking-tight text-foreground">
              InfoVault
            </span>
            <div className="hidden sm:flex items-center gap-1 ml-1">
              <Shield className="w-3 h-3 text-teal" />
              <span className="text-xs text-teal font-mono font-medium">
                SECURED
              </span>
            </div>
          </div>

          {/* User menu */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                className="flex items-center gap-2.5 h-9 px-3 text-sm hover:bg-accent"
                data-ocid="header.profile_button"
              >
                <Avatar className="h-7 w-7">
                  <AvatarFallback className="bg-teal/20 text-teal text-xs font-bold font-mono">
                    {initials}
                  </AvatarFallback>
                </Avatar>
                <span className="hidden sm:block text-foreground font-medium max-w-[120px] truncate">
                  {displayName}
                </span>
                <ChevronDown className="w-3.5 h-3.5 text-muted-foreground" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent
              align="end"
              className="w-48 bg-popover border-border"
              data-ocid="header.dropdown_menu"
            >
              <div className="px-3 py-2">
                <p className="text-xs text-muted-foreground">Signed in as</p>
                <p className="text-sm font-medium text-foreground truncate">
                  {displayName}
                </p>
              </div>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                onClick={handleOpenProfile}
                className="cursor-pointer"
              >
                <Settings className="mr-2 h-4 w-4" />
                Edit Profile
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                onClick={handleLogout}
                className="cursor-pointer text-destructive focus:text-destructive"
                data-ocid="header.logout_button"
              >
                <LogOut className="mr-2 h-4 w-4" />
                Sign Out
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </header>

      {/* Profile Edit Dialog */}
      <Dialog open={profileOpen} onOpenChange={setProfileOpen}>
        <DialogContent
          className="bg-card border-border sm:max-w-md"
          data-ocid="profile.dialog"
        >
          <DialogHeader>
            <DialogTitle className="font-display text-foreground flex items-center gap-2">
              <User className="w-5 h-5 text-teal" />
              Edit Profile
            </DialogTitle>
            <DialogDescription className="text-muted-foreground">
              Update your display name
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSaveProfile} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="edit-name" className="text-foreground text-sm">
                Display Name
              </Label>
              <Input
                id="edit-name"
                value={editName}
                onChange={(e) => setEditName(e.target.value)}
                placeholder="Your name"
                className="bg-secondary border-border text-foreground"
                data-ocid="profile.input"
              />
            </div>
            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setProfileOpen(false)}
                className="border-border"
                data-ocid="profile.cancel_button"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={!editName.trim() || saveProfile.isPending}
                className="bg-teal hover:bg-teal/90 text-background"
                data-ocid="profile.save_button"
              >
                {saveProfile.isPending ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Saving...
                  </>
                ) : (
                  "Save Changes"
                )}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </>
  );
}
