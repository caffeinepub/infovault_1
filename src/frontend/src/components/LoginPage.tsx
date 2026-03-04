import { Button } from "@/components/ui/button";
import { FileText, Key, Loader2, Lock, Shield } from "lucide-react";
import { motion } from "motion/react";
import { useInternetIdentity } from "../hooks/useInternetIdentity";

export default function LoginPage() {
  const { login, loginStatus } = useInternetIdentity();
  const isLoggingIn = loginStatus === "logging-in";

  const features = [
    {
      icon: Key,
      title: "Account Vault",
      description: "Store passwords and credentials securely",
    },
    {
      icon: FileText,
      title: "Document Safe",
      description: "Upload and manage personal documents",
    },
    {
      icon: Lock,
      title: "Private by Default",
      description: "Your data, accessible only to you",
    },
  ];

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center relative overflow-hidden">
      {/* Background geometry */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-0 left-0 w-full h-full">
          <svg
            width="100%"
            height="100%"
            viewBox="0 0 1200 800"
            preserveAspectRatio="xMidYMid slice"
            aria-hidden="true"
          >
            {/* Vertical grid lines */}
            <line
              x1="100"
              y1="0"
              x2="100"
              y2="800"
              stroke="oklch(0.25 0.02 250)"
              strokeWidth="1"
              strokeOpacity="0.4"
            />
            <line
              x1="200"
              y1="0"
              x2="200"
              y2="800"
              stroke="oklch(0.25 0.02 250)"
              strokeWidth="1"
              strokeOpacity="0.4"
            />
            <line
              x1="300"
              y1="0"
              x2="300"
              y2="800"
              stroke="oklch(0.25 0.02 250)"
              strokeWidth="1"
              strokeOpacity="0.4"
            />
            <line
              x1="400"
              y1="0"
              x2="400"
              y2="800"
              stroke="oklch(0.25 0.02 250)"
              strokeWidth="1"
              strokeOpacity="0.4"
            />
            <line
              x1="500"
              y1="0"
              x2="500"
              y2="800"
              stroke="oklch(0.25 0.02 250)"
              strokeWidth="1"
              strokeOpacity="0.4"
            />
            <line
              x1="600"
              y1="0"
              x2="600"
              y2="800"
              stroke="oklch(0.25 0.02 250)"
              strokeWidth="1"
              strokeOpacity="0.4"
            />
            <line
              x1="700"
              y1="0"
              x2="700"
              y2="800"
              stroke="oklch(0.25 0.02 250)"
              strokeWidth="1"
              strokeOpacity="0.4"
            />
            <line
              x1="800"
              y1="0"
              x2="800"
              y2="800"
              stroke="oklch(0.25 0.02 250)"
              strokeWidth="1"
              strokeOpacity="0.4"
            />
            <line
              x1="900"
              y1="0"
              x2="900"
              y2="800"
              stroke="oklch(0.25 0.02 250)"
              strokeWidth="1"
              strokeOpacity="0.4"
            />
            <line
              x1="1000"
              y1="0"
              x2="1000"
              y2="800"
              stroke="oklch(0.25 0.02 250)"
              strokeWidth="1"
              strokeOpacity="0.4"
            />
            <line
              x1="1100"
              y1="0"
              x2="1100"
              y2="800"
              stroke="oklch(0.25 0.02 250)"
              strokeWidth="1"
              strokeOpacity="0.4"
            />
            {/* Horizontal grid lines */}
            <line
              x1="0"
              y1="100"
              x2="1200"
              y2="100"
              stroke="oklch(0.25 0.02 250)"
              strokeWidth="1"
              strokeOpacity="0.4"
            />
            <line
              x1="0"
              y1="200"
              x2="1200"
              y2="200"
              stroke="oklch(0.25 0.02 250)"
              strokeWidth="1"
              strokeOpacity="0.4"
            />
            <line
              x1="0"
              y1="300"
              x2="1200"
              y2="300"
              stroke="oklch(0.25 0.02 250)"
              strokeWidth="1"
              strokeOpacity="0.4"
            />
            <line
              x1="0"
              y1="400"
              x2="1200"
              y2="400"
              stroke="oklch(0.25 0.02 250)"
              strokeWidth="1"
              strokeOpacity="0.4"
            />
            <line
              x1="0"
              y1="500"
              x2="1200"
              y2="500"
              stroke="oklch(0.25 0.02 250)"
              strokeWidth="1"
              strokeOpacity="0.4"
            />
            <line
              x1="0"
              y1="600"
              x2="1200"
              y2="600"
              stroke="oklch(0.25 0.02 250)"
              strokeWidth="1"
              strokeOpacity="0.4"
            />
            <line
              x1="0"
              y1="700"
              x2="1200"
              y2="700"
              stroke="oklch(0.25 0.02 250)"
              strokeWidth="1"
              strokeOpacity="0.4"
            />
            {/* Teal accent shape */}
            <circle
              cx="900"
              cy="150"
              r="300"
              fill="oklch(0.72 0.14 195 / 0.04)"
            />
            <circle
              cx="900"
              cy="150"
              r="200"
              fill="oklch(0.72 0.14 195 / 0.04)"
            />
          </svg>
        </div>
      </div>

      <div className="relative z-10 w-full max-w-5xl mx-auto px-6 py-12">
        <div className="grid lg:grid-cols-2 gap-16 items-center">
          {/* Left: Branding */}
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6, ease: "easeOut" }}
          >
            <div className="flex items-center gap-3 mb-8">
              <div className="w-10 h-10 rounded-lg bg-teal/20 border border-teal/30 flex items-center justify-center">
                <img
                  src="/assets/uploads/original-358c449a1d214658481ee0571a00d34c-2-1.gif"
                  alt="InfoVault"
                  className="w-7 h-7 object-contain"
                />
              </div>
              <span className="font-display text-xl font-bold tracking-tight text-foreground">
                InfoVault
              </span>
            </div>

            <h1 className="font-display text-5xl font-bold leading-tight text-foreground mb-6">
              Your personal <span className="text-teal">information</span>
              <br />
              fortress
            </h1>

            <p className="text-muted-foreground text-lg leading-relaxed mb-10">
              Securely manage account credentials, passwords, and personal
              documents — all encrypted and private to you.
            </p>

            <div className="space-y-4">
              {features.map((feature, i) => (
                <motion.div
                  key={feature.title}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.3 + i * 0.1, duration: 0.5 }}
                  className="flex items-start gap-4"
                >
                  <div className="w-8 h-8 rounded-md bg-teal/10 border border-teal/20 flex items-center justify-center flex-shrink-0 mt-0.5">
                    <feature.icon className="w-4 h-4 text-teal" />
                  </div>
                  <div>
                    <p className="font-medium text-foreground text-sm">
                      {feature.title}
                    </p>
                    <p className="text-muted-foreground text-sm">
                      {feature.description}
                    </p>
                  </div>
                </motion.div>
              ))}
            </div>
          </motion.div>

          {/* Right: Login card */}
          <motion.div
            initial={{ opacity: 0, x: 30 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6, ease: "easeOut", delay: 0.1 }}
          >
            <div className="vault-card rounded-2xl p-8 shadow-2xl">
              <div className="flex items-center justify-center w-16 h-16 rounded-2xl bg-teal/10 border border-teal/20 mx-auto mb-6">
                <Shield className="w-8 h-8 text-teal" />
              </div>

              <h2 className="font-display text-2xl font-bold text-center text-foreground mb-2">
                Access Your Vault
              </h2>
              <p className="text-muted-foreground text-sm text-center mb-8">
                Sign in securely with Internet Identity to access your private
                information vault
              </p>

              <Button
                className="w-full h-12 text-base font-semibold bg-teal hover:bg-teal/90 text-background transition-all duration-200 glow-teal"
                onClick={() => login()}
                disabled={isLoggingIn}
                data-ocid="login.primary_button"
              >
                {isLoggingIn ? (
                  <>
                    <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                    Authenticating...
                  </>
                ) : (
                  <>
                    <Lock className="mr-2 h-5 w-5" />
                    Sign In Securely
                  </>
                )}
              </Button>

              <p className="text-xs text-muted-foreground text-center mt-4">
                Protected by Internet Identity — no passwords stored on servers
              </p>
            </div>

            {/* Security badges */}
            <div className="flex items-center justify-center gap-6 mt-6">
              {["End-to-End Encrypted", "Decentralized", "Self-Sovereign"].map(
                (badge) => (
                  <div
                    key={badge}
                    className="flex items-center gap-1.5 text-xs text-muted-foreground"
                  >
                    <div className="w-1.5 h-1.5 rounded-full bg-teal" />
                    {badge}
                  </div>
                ),
              )}
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
}
