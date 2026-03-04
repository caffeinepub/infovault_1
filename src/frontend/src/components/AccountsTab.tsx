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
import { Checkbox } from "@/components/ui/checkbox";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { Slider } from "@/components/ui/slider";
import { Textarea } from "@/components/ui/textarea";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  Check,
  Copy,
  Edit2,
  Eye,
  EyeOff,
  Key,
  Loader2,
  Plus,
  RefreshCw,
  Search,
  ShieldAlert,
  Star,
  Trash2,
  Wand2,
  X,
} from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { useCallback, useState } from "react";
import { toast } from "sonner";
import type { Account } from "../backend.d.ts";
import { useInternetIdentity } from "../hooks/useInternetIdentity";
import {
  useCreateAccount,
  useDeleteAccount,
  useGetAllAccounts,
  useUpdateAccount,
} from "../hooks/useQueries";
import { getServiceColor, maskPassword } from "../utils/format";
import { useEnrichment } from "../utils/localEnrichment";

// ─── Constants ──────────────────────────────────────────────────────────────

const CATEGORY_COLORS: Record<string, string> = {
  Banking: "bg-blue-500/20 text-blue-400 border-blue-500/30",
  Work: "bg-purple-500/20 text-purple-400 border-purple-500/30",
  Social: "bg-teal/20 text-teal border-teal/30",
  Shopping: "bg-amber-500/20 text-amber-400 border-amber-500/30",
  Entertainment: "bg-pink-500/20 text-pink-400 border-pink-500/30",
  Other: "bg-secondary text-muted-foreground border-border",
};

function getCategoryColor(cat: string): string {
  return CATEGORY_COLORS[cat] ?? CATEGORY_COLORS.Other;
}

// ─── New Category inline input ────────────────────────────────────────────────

interface NewCategoryInputProps {
  onSave: (name: string) => void;
  onCancel: () => void;
  ocidPrefix: string;
}

function NewCategoryInput({
  onSave,
  onCancel,
  ocidPrefix,
}: NewCategoryInputProps) {
  const [value, setValue] = useState("");

  const handleSave = () => {
    const trimmed = value.trim();
    if (!trimmed) return;
    onSave(trimmed);
    setValue("");
  };

  return (
    <motion.div
      initial={{ opacity: 0, height: 0 }}
      animate={{ opacity: 1, height: "auto" }}
      exit={{ opacity: 0, height: 0 }}
      transition={{ duration: 0.15 }}
      className="overflow-hidden"
    >
      <div className="mt-2 flex gap-2 items-center p-2 rounded-lg border border-teal/30 bg-teal/5">
        <Input
          autoFocus
          placeholder="Category name..."
          value={value}
          onChange={(e) => setValue(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              handleSave();
            }
            if (e.key === "Escape") onCancel();
          }}
          className="h-7 text-xs bg-secondary border-border text-foreground flex-1"
          data-ocid={`${ocidPrefix}.input`}
        />
        <Button
          type="button"
          size="sm"
          className="h-7 px-2 text-xs bg-teal hover:bg-teal/90 text-background font-semibold"
          onClick={handleSave}
          disabled={!value.trim()}
          data-ocid={`${ocidPrefix}.save_button`}
        >
          Add
        </Button>
        <button
          type="button"
          onClick={onCancel}
          className="text-muted-foreground hover:text-foreground transition-colors"
        >
          <X className="w-3.5 h-3.5" />
        </button>
      </div>
    </motion.div>
  );
}

// ─── Category Select with "+ New" option ─────────────────────────────────────

interface CategorySelectProps {
  value: string;
  onValueChange: (value: string) => void;
  categories: string[];
  onAddCategory: (name: string) => void;
  triggerId?: string;
  triggerClassName?: string;
  ocidTrigger?: string;
  ocidPrefix: string;
  placeholder?: string;
  includeAll?: boolean;
}

function CategorySelect({
  value,
  onValueChange,
  categories,
  onAddCategory,
  triggerId,
  triggerClassName,
  ocidTrigger,
  ocidPrefix,
  placeholder,
  includeAll = false,
}: CategorySelectProps) {
  const [showNewInput, setShowNewInput] = useState(false);

  const handleSelectChange = (v: string) => {
    if (v === "__new__") {
      setShowNewInput(true);
      return;
    }
    onValueChange(v);
  };

  const handleSaveNew = (name: string) => {
    onAddCategory(name);
    onValueChange(name);
    setShowNewInput(false);
  };

  return (
    <div className="space-y-0">
      <Select value={value} onValueChange={handleSelectChange}>
        <SelectTrigger
          id={triggerId}
          className={triggerClassName}
          data-ocid={ocidTrigger}
        >
          <SelectValue placeholder={placeholder ?? "Select category"} />
        </SelectTrigger>
        <SelectContent className="bg-popover border-border">
          {includeAll && <SelectItem value="All">All Categories</SelectItem>}
          {categories.map((cat) => (
            <SelectItem key={cat} value={cat}>
              {cat}
            </SelectItem>
          ))}
          <SelectItem value="__new__">
            <span className="flex items-center gap-1.5 text-teal">
              <Plus className="w-3 h-3" />
              New Category
            </span>
          </SelectItem>
        </SelectContent>
      </Select>
      <AnimatePresence>
        {showNewInput && (
          <NewCategoryInput
            onSave={handleSaveNew}
            onCancel={() => setShowNewInput(false)}
            ocidPrefix={ocidPrefix}
          />
        )}
      </AnimatePresence>
    </div>
  );
}

// ─── Password utilities ──────────────────────────────────────────────────────

function generatePassword(
  length: number,
  opts: {
    uppercase: boolean;
    lowercase: boolean;
    numbers: boolean;
    symbols: boolean;
  },
): string {
  const upper = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
  const lower = "abcdefghijklmnopqrstuvwxyz";
  const numbers = "0123456789";
  const symbols = "!@#$%^&*()_+-=[]{}|;:,.<>?";

  let charset = "";
  if (opts.uppercase) charset += upper;
  if (opts.lowercase) charset += lower;
  if (opts.numbers) charset += numbers;
  if (opts.symbols) charset += symbols;
  if (!charset) charset = lower;

  // Ensure at least one of each required type
  const required: string[] = [];
  if (opts.uppercase && upper)
    required.push(upper[Math.floor(Math.random() * upper.length)]);
  if (opts.lowercase && lower)
    required.push(lower[Math.floor(Math.random() * lower.length)]);
  if (opts.numbers && numbers)
    required.push(numbers[Math.floor(Math.random() * numbers.length)]);
  if (opts.symbols && symbols)
    required.push(symbols[Math.floor(Math.random() * symbols.length)]);

  const remaining = Array.from(
    { length: Math.max(0, length - required.length) },
    () => charset[Math.floor(Math.random() * charset.length)],
  );

  const combined = [...required, ...remaining];
  // Shuffle
  for (let i = combined.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [combined[i], combined[j]] = [combined[j], combined[i]];
  }
  return combined.join("");
}

interface PasswordStrength {
  score: 0 | 1 | 2 | 3 | 4;
  label: string;
  color: string;
}

function getPasswordStrength(password: string): PasswordStrength {
  if (!password) return { score: 0, label: "", color: "" };

  const hasUpper = /[A-Z]/.test(password);
  const hasLower = /[a-z]/.test(password);
  const hasNumber = /[0-9]/.test(password);
  const hasSymbol = /[^A-Za-z0-9]/.test(password);
  const charTypes = [hasUpper, hasLower, hasNumber, hasSymbol].filter(
    Boolean,
  ).length;
  const len = password.length;

  if (len < 8 || charTypes < 2) {
    return { score: 1, label: "Weak", color: "bg-red-500" };
  }
  if (len >= 8 && charTypes >= 2 && len < 10) {
    return { score: 2, label: "Fair", color: "bg-orange-400" };
  }
  if (len >= 10 && charTypes >= 3 && len < 12) {
    return { score: 3, label: "Strong", color: "bg-yellow-400" };
  }
  if (len >= 12 && charTypes >= 4) {
    return { score: 4, label: "Very Strong", color: "bg-teal" };
  }
  // fallback
  if (len >= 10 && charTypes >= 3) {
    return { score: 3, label: "Strong", color: "bg-yellow-400" };
  }
  return { score: 2, label: "Fair", color: "bg-orange-400" };
}

// ─── Sub-components ──────────────────────────────────────────────────────────

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

interface PasswordGeneratorProps {
  onUse: (password: string) => void;
}

function PasswordGenerator({ onUse }: PasswordGeneratorProps) {
  const [length, setLength] = useState(16);
  const [uppercase, setUppercase] = useState(true);
  const [lowercase, setLowercase] = useState(true);
  const [numbers, setNumbers] = useState(true);
  const [symbols, setSymbols] = useState(false);
  const [preview, setPreview] = useState(() =>
    generatePassword(16, {
      uppercase: true,
      lowercase: true,
      numbers: true,
      symbols: false,
    }),
  );

  const regenerate = useCallback(() => {
    setPreview(
      generatePassword(length, { uppercase, lowercase, numbers, symbols }),
    );
  }, [length, uppercase, lowercase, numbers, symbols]);

  return (
    <motion.div
      initial={{ opacity: 0, height: 0 }}
      animate={{ opacity: 1, height: "auto" }}
      exit={{ opacity: 0, height: 0 }}
      transition={{ duration: 0.2 }}
      className="overflow-hidden"
      data-ocid="add_account.password_generator.panel"
    >
      <div className="mt-2 p-3 rounded-lg border border-teal/30 bg-teal/5 space-y-3">
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold text-teal">
            Password Generator
          </span>
          <button
            type="button"
            onClick={regenerate}
            className="p-1 rounded hover:bg-teal/10 text-teal transition-colors"
            title="Regenerate"
          >
            <RefreshCw className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Preview */}
        <div className="flex items-center gap-2 bg-secondary rounded-lg px-3 py-2">
          <span className="font-mono text-xs text-foreground flex-1 truncate">
            {preview}
          </span>
          <CopyButton text={preview} />
        </div>

        {/* Length slider */}
        <div className="space-y-1">
          <div className="flex justify-between text-xs text-muted-foreground">
            <span>Length</span>
            <span className="font-mono font-bold text-foreground">
              {length}
            </span>
          </div>
          <Slider
            min={8}
            max={32}
            step={1}
            value={[length]}
            onValueChange={([v]) => {
              setLength(v);
              setPreview(
                generatePassword(v, { uppercase, lowercase, numbers, symbols }),
              );
            }}
            className="w-full"
          />
        </div>

        {/* Checkboxes */}
        <div className="grid grid-cols-2 gap-1.5">
          {[
            {
              id: "gen-upper",
              label: "Uppercase",
              value: uppercase,
              setter: setUppercase,
            },
            {
              id: "gen-lower",
              label: "Lowercase",
              value: lowercase,
              setter: setLowercase,
            },
            {
              id: "gen-numbers",
              label: "Numbers",
              value: numbers,
              setter: setNumbers,
            },
            {
              id: "gen-symbols",
              label: "Symbols",
              value: symbols,
              setter: setSymbols,
            },
          ].map(({ id, label, value, setter }) => (
            <div key={label} className="flex items-center gap-2">
              <Checkbox
                id={id}
                checked={value}
                onCheckedChange={(checked) => {
                  setter(!!checked);
                  setPreview(
                    generatePassword(length, {
                      uppercase: label === "Uppercase" ? !!checked : uppercase,
                      lowercase: label === "Lowercase" ? !!checked : lowercase,
                      numbers: label === "Numbers" ? !!checked : numbers,
                      symbols: label === "Symbols" ? !!checked : symbols,
                    }),
                  );
                }}
                className="border-teal/40 data-[state=checked]:bg-teal data-[state=checked]:border-teal"
              />
              <Label
                htmlFor={id}
                className="text-xs text-muted-foreground cursor-pointer"
              >
                {label}
              </Label>
            </div>
          ))}
        </div>

        <Button
          type="button"
          size="sm"
          className="w-full bg-teal hover:bg-teal/90 text-background text-xs font-semibold gap-1.5"
          onClick={() => onUse(preview)}
        >
          <Check className="w-3.5 h-3.5" />
          Use this password
        </Button>
      </div>
    </motion.div>
  );
}

interface StrengthIndicatorProps {
  password: string;
}

function StrengthIndicator({ password }: StrengthIndicatorProps) {
  if (!password) return null;
  const { score, label, color } = getPasswordStrength(password);

  return (
    <div
      className="flex items-center gap-2 mt-1.5"
      data-ocid="add_account.strength_indicator"
    >
      <div className="flex gap-1 flex-1">
        {[1, 2, 3, 4].map((i) => (
          <div
            key={i}
            className={`h-1.5 flex-1 rounded-full transition-all duration-300 ${
              i <= score ? color : "bg-secondary"
            }`}
          />
        ))}
      </div>
      {label && (
        <span
          className={`text-xs font-medium ${
            score === 1
              ? "text-red-400"
              : score === 2
                ? "text-orange-400"
                : score === 3
                  ? "text-yellow-400"
                  : "text-teal"
          }`}
        >
          {label}
        </span>
      )}
    </div>
  );
}

interface AccountRowProps {
  account: Account;
  index: number;
  onEdit: (account: Account) => void;
  onDelete: (account: Account) => void;
  category?: string;
  isFavorite: boolean;
  updatedAt?: number;
  hasBreachAlert: boolean;
  onToggleFavorite: () => void;
}

function AccountRow({
  account,
  index,
  onEdit,
  onDelete,
  category,
  isFavorite,
  updatedAt,
  hasBreachAlert,
  onToggleFavorite,
}: AccountRowProps) {
  const [showPassword, setShowPassword] = useState(false);

  const updatedDaysAgo = updatedAt
    ? Math.floor((Date.now() - updatedAt) / (1000 * 60 * 60 * 24))
    : null;

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
              <div className="flex items-center gap-2 flex-wrap">
                <p className="font-semibold text-foreground text-sm truncate">
                  {account.serviceName}
                </p>
                {category && category !== "Other" && (
                  <Badge
                    variant="outline"
                    className={`text-xs px-1.5 py-0 h-4 ${getCategoryColor(category)}`}
                  >
                    {category}
                  </Badge>
                )}
                {hasBreachAlert && (
                  <TooltipProvider delayDuration={100}>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <span
                          className="inline-flex"
                          data-ocid={`accounts.breach_alert.${index}`}
                        >
                          <ShieldAlert className="w-3.5 h-3.5 text-red-400 cursor-help" />
                        </span>
                      </TooltipTrigger>
                      <TooltipContent className="bg-popover border-border text-xs">
                        Weak or reused password
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                )}
              </div>
              <div className="flex items-center gap-1 mt-0.5">
                <p className="text-muted-foreground text-xs font-mono truncate">
                  {account.username}
                </p>
                <CopyButton text={account.username} />
              </div>
            </div>

            {/* Actions */}
            <div className="flex items-center gap-1 flex-shrink-0">
              {/* Favorite star */}
              <button
                type="button"
                onClick={onToggleFavorite}
                className={`p-1.5 rounded hover:bg-accent transition-colors ${
                  isFavorite
                    ? "text-yellow-400"
                    : "text-muted-foreground opacity-0 group-hover:opacity-100"
                }`}
                title={
                  isFavorite ? "Remove from favorites" : "Add to favorites"
                }
              >
                <Star
                  className={`w-3.5 h-3.5 ${isFavorite ? "fill-yellow-400" : ""}`}
                />
              </button>
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

          {/* Notes + updated */}
          <div className="flex items-center justify-between mt-1.5 gap-2">
            {account.notes ? (
              <p className="text-xs text-muted-foreground truncate flex-1">
                {account.notes}
              </p>
            ) : (
              <span />
            )}
            {updatedDaysAgo !== null && (
              <p className="text-xs text-muted-foreground flex-shrink-0">
                {updatedDaysAgo === 0
                  ? "Updated today"
                  : `Updated ${updatedDaysAgo}d ago`}
              </p>
            )}
          </div>
        </div>
      </div>
    </motion.div>
  );
}

// ─── Main Component ──────────────────────────────────────────────────────────

interface AccountFormData {
  serviceName: string;
  username: string;
  password: string;
  notes: string;
  category: string;
  twoFactorNotes: string;
  favorite: boolean;
}

const EMPTY_FORM: AccountFormData = {
  serviceName: "",
  username: "",
  password: "",
  notes: "",
  category: "Other",
  twoFactorNotes: "",
  favorite: false,
};

export default function AccountsTab() {
  const { identity } = useInternetIdentity();
  const principalText = identity?.getPrincipal().toText() ?? "";
  const {
    enrichment,
    updateAccount: updateEnrichment,
    removeAccount,
    addAccountCategory,
  } = useEnrichment(principalText);

  const { data: accounts, isLoading, isError } = useGetAllAccounts();
  const createAccount = useCreateAccount();
  const updateAccount = useUpdateAccount();
  const deleteAccount = useDeleteAccount();

  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("All");
  const accountCategories = enrichment.customAccountCategories;
  const [modalOpen, setModalOpen] = useState(false);
  const [editingAccount, setEditingAccount] = useState<Account | null>(null);
  const [form, setForm] = useState<AccountFormData>(EMPTY_FORM);
  const [showFormPassword, setShowFormPassword] = useState(false);
  const [showGenerator, setShowGenerator] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<Account | null>(null);

  const allAccounts = accounts ?? [];

  // Get breach info for all accounts
  const breachMap = new Map<string, boolean>();
  for (const account of allAccounts) {
    const weak = account.password.length < 8;
    const reused =
      allAccounts.filter(
        (a) => a.id !== account.id && a.password === account.password,
      ).length > 0;
    breachMap.set(account.id, weak || reused);
  }

  // Sort: favorites first
  const sortedAccounts = [...allAccounts].sort((a, b) => {
    const aFav = enrichment.accounts[a.id]?.favorite ? 1 : 0;
    const bFav = enrichment.accounts[b.id]?.favorite ? 1 : 0;
    return bFav - aFav;
  });

  const filtered = sortedAccounts.filter((a) => {
    const matchesSearch =
      a.serviceName.toLowerCase().includes(search.toLowerCase()) ||
      a.username.toLowerCase().includes(search.toLowerCase());
    const matchesCategory =
      categoryFilter === "All" ||
      (enrichment.accounts[a.id]?.category ?? "Other") === categoryFilter;
    return matchesSearch && matchesCategory;
  });

  const handleOpenAdd = () => {
    setEditingAccount(null);
    setForm(EMPTY_FORM);
    setShowFormPassword(false);
    setShowGenerator(false);
    setModalOpen(true);
  };

  const handleOpenEdit = (account: Account) => {
    setEditingAccount(account);
    const e = enrichment.accounts[account.id] ?? {};
    setForm({
      serviceName: account.serviceName,
      username: account.username,
      password: account.password,
      notes: account.notes,
      category: e.category ?? "Other",
      twoFactorNotes: e.twoFactorNotes ?? "",
      favorite: e.favorite ?? false,
    });
    setShowFormPassword(false);
    setShowGenerator(false);
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
      let accountId: string;
      if (editingAccount) {
        await updateAccount.mutateAsync({
          id: editingAccount.id,
          serviceName: form.serviceName,
          username: form.username,
          password: form.password,
          notes: form.notes,
        });
        accountId = editingAccount.id;
        toast.success("Account updated");
      } else {
        accountId = await createAccount.mutateAsync({
          serviceName: form.serviceName,
          username: form.username,
          password: form.password,
          notes: form.notes,
        });
        toast.success("Account added to vault");
      }
      // Save enrichment
      updateEnrichment(accountId, {
        category: form.category,
        twoFactorNotes: form.twoFactorNotes,
        favorite: form.favorite,
        updatedAt: Date.now(),
      });
      setModalOpen(false);
    } catch {
      toast.error("Failed to save account. Please try again.");
    }
  };

  const handleConfirmDelete = async () => {
    if (!deleteTarget) return;
    try {
      await deleteAccount.mutateAsync(deleteTarget.id);
      removeAccount(deleteTarget.id);
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
      <div className="flex items-center gap-3 flex-wrap">
        <div className="relative flex-1 min-w-[180px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
          <Input
            placeholder="Search accounts..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9 bg-secondary border-border text-foreground placeholder:text-muted-foreground"
            data-ocid="accounts.search_input"
          />
        </div>
        <div className="w-[180px]">
          <CategorySelect
            value={categoryFilter}
            onValueChange={setCategoryFilter}
            categories={accountCategories}
            onAddCategory={addAccountCategory}
            triggerClassName="w-full bg-secondary border-border text-foreground"
            ocidTrigger="accounts.category_select"
            ocidPrefix="account_category"
            includeAll
            placeholder="All Categories"
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
      {!isLoading && allAccounts.length > 0 && (
        <div className="flex items-center gap-3 flex-wrap">
          <Badge
            variant="secondary"
            className="text-xs bg-secondary text-muted-foreground"
          >
            {allAccounts.length} account{allAccounts.length !== 1 ? "s" : ""}{" "}
            stored
          </Badge>
          {(search || categoryFilter !== "All") && (
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
            {search || categoryFilter !== "All"
              ? "No matching accounts"
              : "No accounts yet"}
          </h3>
          <p className="text-muted-foreground text-sm mb-5">
            {search
              ? `No accounts match "${search}"`
              : categoryFilter !== "All"
                ? `No accounts in the "${categoryFilter}" category`
                : "Add your first account to start building your secure vault"}
          </p>
          {!search && categoryFilter === "All" && (
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
            {filtered.map((account, i) => {
              const e = enrichment.accounts[account.id] ?? {};
              return (
                <AccountRow
                  key={account.id}
                  account={account}
                  index={i + 1}
                  onEdit={handleOpenEdit}
                  onDelete={setDeleteTarget}
                  category={e.category}
                  isFavorite={!!e.favorite}
                  updatedAt={e.updatedAt}
                  hasBreachAlert={!!breachMap.get(account.id)}
                  onToggleFavorite={() =>
                    updateEnrichment(account.id, { favorite: !e.favorite })
                  }
                />
              );
            })}
          </div>
        </AnimatePresence>
      )}

      {/* Add/Edit Modal */}
      <Dialog open={modalOpen} onOpenChange={setModalOpen}>
        <DialogContent
          className="bg-card border-border sm:max-w-lg max-h-[90vh] overflow-y-auto"
          data-ocid="add_account.modal"
        >
          <DialogHeader>
            <div className="flex items-center justify-between">
              <DialogTitle className="font-display text-foreground flex items-center gap-2">
                <Key className="w-5 h-5 text-teal" />
                {editingAccount ? "Edit Account" : "Add Account"}
              </DialogTitle>
              {/* Favorite toggle in header */}
              <button
                type="button"
                onClick={() =>
                  setForm((f) => ({ ...f, favorite: !f.favorite }))
                }
                className={`p-1.5 rounded hover:bg-accent transition-colors mr-6 ${
                  form.favorite ? "text-yellow-400" : "text-muted-foreground"
                }`}
                title={
                  form.favorite ? "Remove from favorites" : "Mark as favorite"
                }
              >
                <Star
                  className={`w-5 h-5 ${form.favorite ? "fill-yellow-400" : ""}`}
                />
              </button>
            </div>
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
              {/* Strength indicator */}
              <StrengthIndicator password={form.password} />
              {/* Generate button */}
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="gap-1.5 text-xs border-teal/30 text-teal hover:bg-teal/10 hover:text-teal"
                onClick={() => setShowGenerator((v) => !v)}
                data-ocid="add_account.generate_button"
              >
                <Wand2 className="w-3.5 h-3.5" />
                {showGenerator ? "Hide Generator" : "Generate Password"}
              </Button>
              {/* Generator panel */}
              <AnimatePresence>
                {showGenerator && (
                  <PasswordGenerator
                    onUse={(password) => {
                      setForm((f) => ({ ...f, password }));
                      setShowGenerator(false);
                    }}
                  />
                )}
              </AnimatePresence>
            </div>

            {/* Category */}
            <div className="space-y-2">
              <Label htmlFor="category" className="text-foreground text-sm">
                Category
              </Label>
              <CategorySelect
                value={form.category}
                onValueChange={(v) => setForm((f) => ({ ...f, category: v }))}
                categories={accountCategories}
                onAddCategory={addAccountCategory}
                triggerId="category"
                triggerClassName="bg-secondary border-border text-foreground w-full"
                ocidTrigger="add_account.category_select"
                ocidPrefix="account_category"
              />
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

            {/* Two-factor notes */}
            <div className="space-y-2">
              <Label htmlFor="twofa" className="text-foreground text-sm">
                Two-Factor Auth Notes
              </Label>
              <Textarea
                id="twofa"
                placeholder="Store backup codes or TOTP secret here..."
                value={form.twoFactorNotes}
                onChange={(e) =>
                  setForm((f) => ({ ...f, twoFactorNotes: e.target.value }))
                }
                className="bg-secondary border-border text-foreground resize-none font-mono"
                rows={2}
                data-ocid="add_account.twofa_input"
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
