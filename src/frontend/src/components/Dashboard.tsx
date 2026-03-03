import { Toaster } from "@/components/ui/sonner";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { FileText, Key } from "lucide-react";
import { motion } from "motion/react";
import AccountsTab from "./AccountsTab";
import DocumentsTab from "./DocumentsTab";
import Header from "./Header";

export default function Dashboard() {
  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Header />

      <main className="flex-1 max-w-6xl mx-auto w-full px-4 sm:px-6 py-8">
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, ease: "easeOut" }}
        >
          {/* Page title */}
          <div className="mb-6">
            <h1 className="font-display text-2xl font-bold text-foreground">
              Your Vault
            </h1>
            <p className="text-muted-foreground text-sm mt-1">
              Manage your accounts and personal documents
            </p>
          </div>

          {/* Main tabs */}
          <Tabs defaultValue="accounts" className="w-full">
            <TabsList className="bg-secondary border border-border h-10 p-1 mb-6 w-full sm:w-auto">
              <TabsTrigger
                value="accounts"
                className="data-[state=active]:bg-teal data-[state=active]:text-background font-medium flex items-center gap-2 px-5"
                data-ocid="nav.accounts_tab"
              >
                <Key className="w-4 h-4" />
                Accounts
              </TabsTrigger>
              <TabsTrigger
                value="documents"
                className="data-[state=active]:bg-teal data-[state=active]:text-background font-medium flex items-center gap-2 px-5"
                data-ocid="nav.documents_tab"
              >
                <FileText className="w-4 h-4" />
                Documents
              </TabsTrigger>
            </TabsList>

            <TabsContent value="accounts">
              <AccountsTab />
            </TabsContent>

            <TabsContent value="documents">
              <DocumentsTab />
            </TabsContent>
          </Tabs>
        </motion.div>
      </main>

      {/* Footer */}
      <footer className="border-t border-border py-4 px-6">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <p className="text-xs text-muted-foreground">
            &copy; {new Date().getFullYear()}. Built with{" "}
            <span className="text-destructive">♥</span> using{" "}
            <a
              href={`https://caffeine.ai?utm_source=caffeine-footer&utm_medium=referral&utm_content=${encodeURIComponent(window.location.hostname)}`}
              target="_blank"
              rel="noopener noreferrer"
              className="text-teal hover:underline"
            >
              caffeine.ai
            </a>
          </p>
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <div className="w-1.5 h-1.5 rounded-full bg-teal animate-pulse" />
            <span>Secured</span>
          </div>
        </div>
      </footer>

      <Toaster
        position="bottom-right"
        toastOptions={{
          style: {
            background: "oklch(0.19 0.012 250)",
            border: "1px solid oklch(0.25 0.02 250)",
            color: "oklch(0.92 0.01 250)",
          },
        }}
      />
    </div>
  );
}
