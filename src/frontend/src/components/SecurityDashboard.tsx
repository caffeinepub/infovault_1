import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import {
  Clock,
  Download,
  FileText,
  Key,
  ShieldAlert,
  Star,
  Tag,
} from "lucide-react";
import { motion } from "motion/react";
import { useMemo } from "react";
import { toast } from "sonner";
import type { Account, Document } from "../backend.d.ts";
import type { EnrichmentData } from "../utils/localEnrichment";

interface SecurityDashboardProps {
  accounts: Account[];
  documents: Document[];
  enrichment: EnrichmentData;
  principalText: string;
}

function getBreachInfo(
  account: Account,
  allAccounts: Account[],
): { weak: boolean; reused: boolean } {
  const weak = account.password.length < 8;
  const reused =
    allAccounts.filter(
      (a) => a.id !== account.id && a.password === account.password,
    ).length > 0;
  return { weak, reused };
}

function getDaysUntilExpiry(expiryDate: string): number {
  const expiry = new Date(expiryDate);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  expiry.setHours(0, 0, 0, 0);
  return Math.ceil(
    (expiry.getTime() - today.getTime()) / (1000 * 60 * 60 * 24),
  );
}

export default function SecurityDashboard({
  accounts,
  documents,
  enrichment,
  principalText,
}: SecurityDashboardProps) {
  const stats = useMemo(() => {
    const weakOrReused = accounts.filter((a) => {
      const { weak, reused } = getBreachInfo(a, accounts);
      return weak || reused;
    });

    const expiringDocs = documents.filter((doc) => {
      const docEnrichment = enrichment.documents[doc.id];
      if (!docEnrichment?.expiryDate) return false;
      const days = getDaysUntilExpiry(docEnrichment.expiryDate);
      return days <= 30;
    });

    const favoriteAccounts = accounts.filter(
      (a) => enrichment.accounts[a.id]?.favorite,
    );
    const favoriteDocs = documents.filter(
      (d) => enrichment.documents[d.id]?.favorite,
    );
    const totalFavorites = favoriteAccounts.length + favoriteDocs.length;

    const accountCategories = new Set(
      accounts.map((a) => enrichment.accounts[a.id]?.category).filter(Boolean),
    );
    const docCategories = new Set(
      documents
        .map((d) => enrichment.documents[d.id]?.category)
        .filter(Boolean),
    );
    const totalCategories = new Set([...accountCategories, ...docCategories])
      .size;

    return {
      totalAccounts: accounts.length,
      totalDocuments: documents.length,
      weakOrReused: weakOrReused.length,
      expiringDocs: expiringDocs.length,
      totalFavorites,
      totalCategories,
    };
  }, [accounts, documents, enrichment]);

  const weakPasswordAccounts = useMemo(() => {
    return accounts
      .map((a) => ({ account: a, ...getBreachInfo(a, accounts) }))
      .filter((a) => a.weak || a.reused);
  }, [accounts]);

  const expiringDocuments = useMemo(() => {
    return documents
      .map((doc) => {
        const docEnrichment = enrichment.documents[doc.id];
        if (!docEnrichment?.expiryDate) return null;
        const days = getDaysUntilExpiry(docEnrichment.expiryDate);
        if (days > 60) return null;
        return { doc, docEnrichment, days };
      })
      .filter(Boolean) as Array<{
      doc: Document;
      docEnrichment: { category?: string; expiryDate: string };
      days: number;
    }>;
  }, [documents, enrichment]);

  const handleExport = () => {
    const exportData = {
      exportedAt: new Date().toISOString(),
      principalText,
      accounts: accounts.map((a) => ({
        ...a,
        enrichment: enrichment.accounts[a.id] ?? {},
      })),
      documents: documents.map((d) => ({
        ...d,
        createdAt: d.createdAt.toString(),
        fileSize: d.fileSize.toString(),
        enrichment: enrichment.documents[d.id] ?? {},
      })),
    };

    const blob = new Blob([JSON.stringify(exportData, null, 2)], {
      type: "application/json",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `infovault-backup-${new Date().toISOString().slice(0, 10)}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    toast.success("Vault exported successfully");
  };

  const statCards = [
    {
      label: "Total Accounts",
      value: stats.totalAccounts,
      icon: Key,
      color: "text-teal",
      bg: "bg-teal/10 border-teal/20",
    },
    {
      label: "Total Documents",
      value: stats.totalDocuments,
      icon: FileText,
      color: "text-blue-400",
      bg: "bg-blue-500/10 border-blue-500/20",
    },
    {
      label: "Weak / Reused Passwords",
      value: stats.weakOrReused,
      icon: ShieldAlert,
      color: "text-red-400",
      bg: "bg-red-500/10 border-red-500/20",
    },
    {
      label: "Expiring Documents",
      value: stats.expiringDocs,
      icon: Clock,
      color: "text-amber-400",
      bg: "bg-amber-500/10 border-amber-500/20",
    },
    {
      label: "Favorites",
      value: stats.totalFavorites,
      icon: Star,
      color: "text-yellow-400",
      bg: "bg-yellow-500/10 border-yellow-500/20",
    },
    {
      label: "Categories Used",
      value: stats.totalCategories,
      icon: Tag,
      color: "text-purple-400",
      bg: "bg-purple-500/10 border-purple-500/20",
    },
  ];

  return (
    <div className="space-y-6">
      {/* Stats grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
        {statCards.map((card, i) => (
          <motion.div
            key={card.label}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: i * 0.05 }}
          >
            <Card className={`border ${card.bg} bg-card`}>
              <CardHeader className="pb-2 pt-4 px-4">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-xs font-medium text-muted-foreground">
                    {card.label}
                  </CardTitle>
                  <card.icon className={`w-4 h-4 ${card.color}`} />
                </div>
              </CardHeader>
              <CardContent className="pb-4 px-4">
                <p className={`text-2xl font-bold font-display ${card.color}`}>
                  {card.value}
                </p>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Password Health */}
        <div className="vault-card rounded-xl p-5">
          <div className="flex items-center gap-2 mb-4">
            <ShieldAlert className="w-4 h-4 text-red-400" />
            <h3 className="font-display font-semibold text-foreground text-sm">
              Password Health
            </h3>
          </div>
          {weakPasswordAccounts.length === 0 ? (
            <div className="text-center py-6">
              <div className="w-10 h-10 rounded-full bg-teal/10 border border-teal/20 flex items-center justify-center mx-auto mb-3">
                <ShieldAlert className="w-5 h-5 text-teal" />
              </div>
              <p className="text-sm font-medium text-foreground">
                All passwords look good!
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                No weak or reused passwords detected
              </p>
            </div>
          ) : (
            <div className="space-y-2">
              {weakPasswordAccounts.map(({ account, weak, reused }) => (
                <div
                  key={account.id}
                  className="flex items-center justify-between py-2 px-3 rounded-lg bg-red-500/5 border border-red-500/15"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-7 h-7 rounded-md bg-red-500/15 flex items-center justify-center flex-shrink-0">
                      <Key className="w-3.5 h-3.5 text-red-400" />
                    </div>
                    <p className="text-sm font-medium text-foreground truncate">
                      {account.serviceName}
                    </p>
                  </div>
                  <div className="flex items-center gap-1.5 flex-shrink-0">
                    {weak && (
                      <Badge className="bg-red-500/20 text-red-400 border-red-500/30 text-xs">
                        Too short
                      </Badge>
                    )}
                    {reused && (
                      <Badge className="bg-orange-500/20 text-orange-400 border-orange-500/30 text-xs">
                        Reused
                      </Badge>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Expiring Documents */}
        <div className="vault-card rounded-xl p-5">
          <div className="flex items-center gap-2 mb-4">
            <Clock className="w-4 h-4 text-amber-400" />
            <h3 className="font-display font-semibold text-foreground text-sm">
              Expiring Documents
            </h3>
            <span className="text-xs text-muted-foreground ml-auto">
              Next 60 days
            </span>
          </div>
          {expiringDocuments.length === 0 ? (
            <div className="text-center py-6">
              <div className="w-10 h-10 rounded-full bg-teal/10 border border-teal/20 flex items-center justify-center mx-auto mb-3">
                <Clock className="w-5 h-5 text-teal" />
              </div>
              <p className="text-sm font-medium text-foreground">
                No expiring documents
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                No documents expiring in the next 60 days
              </p>
            </div>
          ) : (
            <div className="space-y-2">
              {expiringDocuments.map(({ doc, docEnrichment, days }) => (
                <div
                  key={doc.id}
                  className={`flex items-center justify-between py-2 px-3 rounded-lg border ${
                    days <= 0
                      ? "bg-red-500/5 border-red-500/15"
                      : days <= 14
                        ? "bg-amber-500/5 border-amber-500/15"
                        : "bg-secondary/60 border-border"
                  }`}
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div
                      className={`w-7 h-7 rounded-md flex items-center justify-center flex-shrink-0 ${
                        days <= 0 ? "bg-red-500/15" : "bg-amber-500/15"
                      }`}
                    >
                      <FileText
                        className={`w-3.5 h-3.5 ${days <= 0 ? "text-red-400" : "text-amber-400"}`}
                      />
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-foreground truncate">
                        {doc.description}
                      </p>
                      {docEnrichment.category && (
                        <p className="text-xs text-muted-foreground">
                          {docEnrichment.category}
                        </p>
                      )}
                    </div>
                  </div>
                  <div className="flex-shrink-0 ml-2">
                    {days <= 0 ? (
                      <Badge className="bg-red-500/20 text-red-400 border-red-500/30 text-xs">
                        Expired
                      </Badge>
                    ) : (
                      <Badge className="bg-amber-500/20 text-amber-400 border-amber-500/30 text-xs whitespace-nowrap">
                        {days}d left
                      </Badge>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <Separator className="bg-border" />

      {/* Export section */}
      <div className="vault-card rounded-xl p-5">
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div>
            <h3 className="font-display font-semibold text-foreground">
              Export Vault
            </h3>
            <p className="text-sm text-muted-foreground mt-0.5">
              Download a complete backup of your vault data including all
              accounts, documents, and metadata.
            </p>
          </div>
          <Button
            onClick={handleExport}
            className="bg-teal hover:bg-teal/90 text-background font-semibold gap-2 flex-shrink-0"
            data-ocid="security.export_button"
          >
            <Download className="w-4 h-4" />
            Export Vault
          </Button>
        </div>
      </div>
    </div>
  );
}
