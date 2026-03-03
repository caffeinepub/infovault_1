import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { Textarea } from "@/components/ui/textarea";
import {
  Check,
  Copy,
  Edit2,
  Eye,
  EyeOff,
  Key,
  Loader2,
  Plus,
  Search,
  Trash2,
} from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { useState } from "react";
import { toast } from "sonner";
import type { Account } from "../backend.d.ts";
import {
  useCreateAccount,
  useDeleteAccount,
  useGetAllAccounts,
  useUpdateAccount,
} from "../hooks/useQueries";
import { getServiceColor, maskPassword } from "../utils/format";

interface AccountFormData {
  serviceName: string;
  username: string;
  password: string;
  notes: string;
}

const EMPTY_FORM: AccountFormData = {
  serviceName: "",
  username: "",
  password: "",
  notes: "",
};

function AccountSkeleton() {
  return (
    <div className="vault-card rounded-xl p-4 flex items-center gap-4">
      <Skeleton className="h-10 w-10 rounded-lg bg-secondary" />
      <div className="flex-1 space-y-2">
        <Skeleton className="h-4 w-32 bg-secondary" />
        <Skeleton className="h-3 w-24 bg-secondary" />
      </div>
      <Skeleton className="h-8 w-20 bg-secondary" />
    </div>
  );
}

function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error("Failed to copy");
    }
  };

  return (
    <button
      type="button"
      onClick={handleCopy}
      className="p-1.5 rounded hover:bg-accent transition-colors text-muted-foreground hover:text-foreground"
      title="Copy"
    >
      {copied ? (
        <Check className="w-3.5 h-3.5 text-teal" />
      ) : (
        <Copy className="w-3.5 h-3.5" />
      )}
    </button>
  );
}

interface AccountRowProps {
  account: Account;
  index: number;
  onEdit: (account: Account) => void;
  onDelete: (account: Account) => void;
}

function AccountRow({ account, index, onEdit, onDelete }: AccountRowProps) {
  const [showPassword, setShowPassword] = useState(false);

  return (
    <motion.div
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -6 }}
      transition={{ duration: 0.25 }}
      className="vault-card rounded-xl p-4 hover:border-teal/30 transition-colors group"
      data-ocid={`accounts.item.${index}`}
    >
      <div className="flex items-start gap-4">
        {/* Service icon */}
        <div
          className={`w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 font-mono font-bold text-sm uppercase ${getServiceColor(account.serviceName)}`}
        >
          {account.serviceName.slice(0, 2)}
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <div className="flex-1 min-w-0">
              <p className="font-semibold text-foreground text-sm truncate">
                {account.serviceName}
              </p>
              <div className="flex items-center gap-1 mt-0.5">
                <p className="text-muted-foreground text-xs font-mono truncate">
                  {account.username}
                </p>
                <CopyButton text={account.username} />
              </div>
            </div>

            {/* Actions */}
            <div className="flex items-center gap-1 flex-shrink-0">
              <Button
                variant="ghost"
                size="icon"
                className="h-7 w-7 opacity-0 group-hover:opacity-100 transition-opacity hover:bg-accent"
                onClick={() => onEdit(account)}
                data-ocid={`accounts.edit_button.${index}`}
                title="Edit"
              >
                <Edit2 className="w-3.5 h-3.5" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className="h-7 w-7 opacity-0 group-hover:opacity-100 transition-opacity hover:bg-destructive/10 hover:text-destructive"
                onClick={() => onDelete(account)}
                data-ocid={`accounts.delete_button.${index}`}
                title="Delete"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </Button>
            </div>
          </div>

          {/* Password row */}
          <div className="mt-2 flex items-center gap-2">
            <div className="flex-1 flex items-center gap-1.5 bg-secondary/60 rounded-lg px-3 py-1.5 min-w-0">
              <Key className="w-3 h-3 text-muted-foreground flex-shrink-0" />
              <span className="font-mono text-xs text-foreground tracking-widest truncate">
                {showPassword
                  ? account.password
                  : maskPassword(account.password)}
              </span>
              {showPassword && <CopyButton text={account.password} />}
            </div>
            <button
              type="button"
              onClick={() => setShowPassword((v) => !v)}
              className="p-1.5 rounded-lg hover:bg-accent transition-colors text-muted-foreground hover:text-foreground flex-shrink-0"
              data-ocid={`accounts.password_toggle.${index}`}
              title={showPassword ? "Hide password" : "Show password"}
            >
              {showPassword ? (
                <EyeOff className="w-3.5 h-3.5" />
              ) : (
                <Eye className="w-3.5 h-3.5" />
              )}
            </button>
          </div>

          {/* Notes */}
          {account.notes && (
            <p className="mt-2 text-xs text-muted-foreground truncate">
              {account.notes}
            </p>
          )}
        </div>
      </div>
    </motion.div>
  );
}

export default function AccountsTab() {
  const { data: accounts, isLoading, isError } = useGetAllAccounts();
  const createAccount = useCreateAccount();
  const updateAccount = useUpdateAccount();
  const deleteAccount = useDeleteAccount();

  const [search, setSearch] = useState("");
  const [modalOpen, setModalOpen] = useState(false);
  const [editingAccount, setEditingAccount] = useState<Account | null>(null);
  const [form, setForm] = useState<AccountFormData>(EMPTY_FORM);
  const [showFormPassword, setShowFormPassword] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<Account | null>(null);

  const filtered = (accounts ?? []).filter(
    (a) =>
      a.serviceName.toLowerCase().includes(search.toLowerCase()) ||
      a.username.toLowerCase().includes(search.toLowerCase()),
  );

  const handleOpenAdd = () => {
    setEditingAccount(null);
    setForm(EMPTY_FORM);
    setShowFormPassword(false);
    setModalOpen(true);
  };

  const handleOpenEdit = (account: Account) => {
    setEditingAccount(account);
    setForm({
      serviceName: account.serviceName,
      username: account.username,
      password: account.password,
      notes: account.notes,
    });
    setShowFormPassword(false);
    setModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (
      !form.serviceName.trim() ||
      !form.username.trim() ||
      !form.password.trim()
    ) {
      toast.error("Service name, username, and password are required");
      return;
    }

    try {
      if (editingAccount) {
        await updateAccount.mutateAsync({
          id: editingAccount.id,
          ...form,
        });
        toast.success("Account updated");
      } else {
        await createAccount.mutateAsync(form);
        toast.success("Account added to vault");
      }
      setModalOpen(false);
    } catch {
      toast.error("Failed to save account. Please try again.");
    }
  };

  const handleConfirmDelete = async () => {
    if (!deleteTarget) return;
    try {
      await deleteAccount.mutateAsync(deleteTarget.id);
      toast.success(`Deleted ${deleteTarget.serviceName}`);
      setDeleteTarget(null);
    } catch {
      toast.error("Failed to delete account");
    }
  };

  const isPending = createAccount.isPending || updateAccount.isPending;

  return (
    <div className="space-y-4">
      {/* Toolbar */}
      <div className="flex items-center gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
          <Input
            placeholder="Search accounts..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9 bg-secondary border-border text-foreground placeholder:text-muted-foreground"
            data-ocid="accounts.search_input"
          />
        </div>
        <Button
          className="bg-teal hover:bg-teal/90 text-background font-semibold flex-shrink-0 gap-2"
          onClick={handleOpenAdd}
          data-ocid="accounts.add_button"
        >
          <Plus className="h-4 w-4" />
          <span className="hidden sm:inline">Add Account</span>
          <span className="sm:hidden">Add</span>
        </Button>
      </div>

      {/* Stats */}
      {!isLoading && accounts && accounts.length > 0 && (
        <div className="flex items-center gap-3">
          <Badge
            variant="secondary"
            className="text-xs bg-secondary text-muted-foreground"
          >
            {accounts.length} account{accounts.length !== 1 ? "s" : ""} stored
          </Badge>
          {search && (
            <Badge
              variant="outline"
              className="text-xs border-teal/30 text-teal"
            >
              {filtered.length} result{filtered.length !== 1 ? "s" : ""}
            </Badge>
          )}
        </div>
      )}

      {/* Loading */}
      {isLoading && (
        <div className="space-y-3" data-ocid="accounts.loading_state">
          {["sk1", "sk2", "sk3", "sk4"].map((k) => (
            <AccountSkeleton key={k} />
          ))}
        </div>
      )}

      {/* Error */}
      {isError && (
        <div
          className="vault-card rounded-xl p-6 text-center text-destructive"
          data-ocid="accounts.error_state"
        >
          <p className="font-medium">Failed to load accounts</p>
          <p className="text-sm text-muted-foreground mt-1">
            Please try refreshing the page
          </p>
        </div>
      )}

      {/* Empty state */}
      {!isLoading && !isError && filtered.length === 0 && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="vault-card rounded-xl p-12 text-center"
          data-ocid="accounts.empty_state"
        >
          <div className="w-16 h-16 rounded-2xl bg-teal/10 border border-teal/20 flex items-center justify-center mx-auto mb-4">
            <Key className="w-8 h-8 text-teal" />
          </div>
          <h3 className="font-display font-semibold text-foreground mb-2">
            {search ? "No matching accounts" : "No accounts yet"}
          </h3>
          <p className="text-muted-foreground text-sm mb-5">
            {search
              ? `No accounts match "${search}"`
              : "Add your first account to start building your secure vault"}
          </p>
          {!search && (
            <Button
              className="bg-teal hover:bg-teal/90 text-background font-semibold gap-2"
              onClick={handleOpenAdd}
            >
              <Plus className="h-4 w-4" />
              Add Your First Account
            </Button>
          )}
        </motion.div>
      )}

      {/* Account list */}
      {!isLoading && !isError && filtered.length > 0 && (
        <AnimatePresence mode="popLayout">
          <div className="space-y-2">
            {filtered.map((account, i) => (
              <AccountRow
                key={account.id}
                account={account}
                index={i + 1}
                onEdit={handleOpenEdit}
                onDelete={setDeleteTarget}
              />
            ))}
          </div>
        </AnimatePresence>
      )}

      {/* Add/Edit Modal */}
      <Dialog open={modalOpen} onOpenChange={setModalOpen}>
        <DialogContent
          className="bg-card border-border sm:max-w-md"
          data-ocid="add_account.modal"
        >
          <DialogHeader>
            <DialogTitle className="font-display text-foreground flex items-center gap-2">
              <Key className="w-5 h-5 text-teal" />
              {editingAccount ? "Edit Account" : "Add Account"}
            </DialogTitle>
            <DialogDescription className="text-muted-foreground">
              {editingAccount
                ? "Update the credentials for this account"
                : "Store a new set of credentials in your vault"}
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="service-name" className="text-foreground text-sm">
                Service Name <span className="text-destructive">*</span>
              </Label>
              <Input
                id="service-name"
                placeholder="e.g. GitHub, Gmail, Netflix"
                value={form.serviceName}
                onChange={(e) =>
                  setForm((f) => ({ ...f, serviceName: e.target.value }))
                }
                className="bg-secondary border-border text-foreground"
                data-ocid="add_account.service_input"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="username" className="text-foreground text-sm">
                Username / User ID <span className="text-destructive">*</span>
              </Label>
              <Input
                id="username"
                placeholder="Username or email"
                value={form.username}
                onChange={(e) =>
                  setForm((f) => ({ ...f, username: e.target.value }))
                }
                className="bg-secondary border-border text-foreground font-mono"
                data-ocid="add_account.username_input"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="password" className="text-foreground text-sm">
                Password <span className="text-destructive">*</span>
              </Label>
              <div className="relative">
                <Input
                  id="password"
                  type={showFormPassword ? "text" : "password"}
                  placeholder="Password"
                  value={form.password}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, password: e.target.value }))
                  }
                  className="bg-secondary border-border text-foreground font-mono pr-10"
                  data-ocid="add_account.password_input"
                />
                <button
                  type="button"
                  onClick={() => setShowFormPassword((v) => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                >
                  {showFormPassword ? (
                    <EyeOff className="w-4 h-4" />
                  ) : (
                    <Eye className="w-4 h-4" />
                  )}
                </button>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="notes" className="text-foreground text-sm">
                Notes
              </Label>
              <Textarea
                id="notes"
                placeholder="Optional notes about this account"
                value={form.notes}
                onChange={(e) =>
                  setForm((f) => ({ ...f, notes: e.target.value }))
                }
                className="bg-secondary border-border text-foreground resize-none"
                rows={2}
                data-ocid="add_account.notes_input"
              />
            </div>

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setModalOpen(false)}
                className="border-border"
                data-ocid="add_account.cancel_button"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={isPending}
                className="bg-teal hover:bg-teal/90 text-background font-semibold"
                data-ocid="add_account.submit_button"
              >
                {isPending ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Saving...
                  </>
                ) : editingAccount ? (
                  "Save Changes"
                ) : (
                  "Add to Vault"
                )}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Delete Confirm Dialog */}
      <AlertDialog
        open={!!deleteTarget}
        onOpenChange={(open) => !open && setDeleteTarget(null)}
      >
        <AlertDialogContent
          className="bg-card border-border"
          data-ocid="delete.dialog"
        >
          <AlertDialogHeader>
            <AlertDialogTitle className="font-display text-foreground">
              Delete Account?
            </AlertDialogTitle>
            <AlertDialogDescription className="text-muted-foreground">
              This will permanently remove{" "}
              <span className="font-semibold text-foreground">
                {deleteTarget?.serviceName}
              </span>{" "}
              from your vault. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel
              className="border-border"
              data-ocid="delete.cancel_button"
            >
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleConfirmDelete}
              className="bg-destructive hover:bg-destructive/90 text-destructive-foreground"
              disabled={deleteAccount.isPending}
              data-ocid="delete.confirm_button"
            >
              {deleteAccount.isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Deleting...
                </>
              ) : (
                "Delete"
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
