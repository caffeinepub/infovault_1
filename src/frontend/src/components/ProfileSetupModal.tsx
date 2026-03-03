import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2, User } from "lucide-react";
import { motion } from "motion/react";
import { useState } from "react";
import { toast } from "sonner";
import { useSaveCallerUserProfile } from "../hooks/useQueries";

interface ProfileSetupModalProps {
  onComplete: () => void;
}

export default function ProfileSetupModal({
  onComplete,
}: ProfileSetupModalProps) {
  const [name, setName] = useState("");
  const saveProfile = useSaveCallerUserProfile();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    try {
      await saveProfile.mutateAsync({ name: name.trim() });
      toast.success("Welcome to InfoVault!");
      onComplete();
    } catch {
      toast.error("Failed to save profile. Please try again.");
    }
  };

  return (
    <div className="fixed inset-0 bg-background/90 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ duration: 0.3, ease: "easeOut" }}
        className="vault-card rounded-2xl p-8 w-full max-w-md shadow-2xl"
        data-ocid="profile_setup.modal"
      >
        <div className="flex items-center justify-center w-14 h-14 rounded-xl bg-teal/10 border border-teal/20 mx-auto mb-5">
          <User className="w-7 h-7 text-teal" />
        </div>

        <h2 className="font-display text-2xl font-bold text-center text-foreground mb-2">
          Welcome to InfoVault
        </h2>
        <p className="text-muted-foreground text-sm text-center mb-6">
          Set up your display name to get started
        </p>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="setup-name" className="text-sm text-foreground">
              Your Name
            </Label>
            <Input
              id="setup-name"
              placeholder="e.g. Alex Johnson"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="bg-secondary border-border text-foreground placeholder:text-muted-foreground"
              autoFocus
              data-ocid="profile_setup.input"
            />
          </div>

          <Button
            type="submit"
            className="w-full bg-teal hover:bg-teal/90 text-background font-semibold"
            disabled={!name.trim() || saveProfile.isPending}
            data-ocid="profile_setup.submit_button"
          >
            {saveProfile.isPending ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Saving...
              </>
            ) : (
              "Enter Vault"
            )}
          </Button>
        </form>
      </motion.div>
    </div>
  );
}
