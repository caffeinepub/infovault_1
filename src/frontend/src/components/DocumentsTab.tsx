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
import { Progress } from "@/components/ui/progress";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Calendar,
  CloudUpload,
  Download,
  Edit2,
  File,
  FileText,
  HardDrive,
  Loader2,
  Plus,
  Search,
  Star,
  Trash2,
  Upload,
  X,
} from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { useCallback, useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { ExternalBlob } from "../backend";
import type { Document } from "../backend.d.ts";
import { loadConfig } from "../config";
import { useActor } from "../hooks/useActor";
import { useInternetIdentity } from "../hooks/useInternetIdentity";
import {
  useCreateDocument,
  useDeleteDocument,
  useGetAllDocuments,
} from "../hooks/useQueries";
import {
  formatDate,
  formatFileSize,
  getFileTypeColor,
  getFileTypeLabel,
} from "../utils/format";
import { useEnrichment } from "../utils/localEnrichment";

// ─── Constants ──────────────────────────────────────────────────────────────

const DOC_CATEGORY_COLORS: Record<string, string> = {
  ID: "bg-blue-500/20 text-blue-400 border-blue-500/30",
  Contract: "bg-purple-500/20 text-purple-400 border-purple-500/30",
  Receipt: "bg-amber-500/20 text-amber-400 border-amber-500/30",
  Medical: "bg-rose-500/20 text-rose-400 border-rose-500/30",
  Financial: "bg-teal/20 text-teal border-teal/30",
  Other: "bg-secondary text-muted-foreground border-border",
};

function getCategoryColor(cat: string): string {
  return DOC_CATEGORY_COLORS[cat] ?? DOC_CATEGORY_COLORS.Other;
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

async function buildBlobUrl(blobId: string): Promise<string> {
  const config = await loadConfig();
  const gatewayUrl = config.storage_gateway_url;
  const canisterId = config.backend_canister_id;
  const projectId = config.project_id;
  return `${gatewayUrl}/v1/blob/?blob_hash=${encodeURIComponent(blobId)}&owner_id=${encodeURIComponent(canisterId)}&project_id=${encodeURIComponent(projectId)}`;
}

// ─── New Category inline input ───────────────────────────────────────────────

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

// ─── Sub-components ──────────────────────────────────────────────────────────

function DocumentSkeleton() {
  return (
    <div className="vault-card rounded-xl p-4 flex items-center gap-4">
      <Skeleton className="h-12 w-12 rounded-lg bg-secondary flex-shrink-0" />
      <div className="flex-1 space-y-2">
        <Skeleton className="h-4 w-48 bg-secondary" />
        <div className="flex gap-3">
          <Skeleton className="h-3 w-20 bg-secondary" />
          <Skeleton className="h-3 w-16 bg-secondary" />
          <Skeleton className="h-3 w-24 bg-secondary" />
        </div>
      </div>
    </div>
  );
}

interface ExpiryBadgeProps {
  expiryDate: string;
}

function ExpiryBadge({ expiryDate }: ExpiryBadgeProps) {
  const days = getDaysUntilExpiry(expiryDate);

  if (days <= 0) {
    return (
      <Badge className="bg-red-500/20 text-red-400 border-red-500/30 text-xs">
        Expired
      </Badge>
    );
  }
  if (days <= 30) {
    return (
      <Badge className="bg-amber-500/20 text-amber-400 border-amber-500/30 text-xs">
        Expires in {days}d
      </Badge>
    );
  }
  return (
    <span className="text-xs text-teal">
      Expires{" "}
      {new Date(expiryDate).toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
      })}
    </span>
  );
}

// ─── Document Viewer Dialog ──────────────────────────────────────────────────

interface DocumentViewerProps {
  doc: Document | null;
  displayDescription: string;
  onClose: () => void;
}

function DocumentViewer({
  doc,
  displayDescription,
  onClose,
}: DocumentViewerProps) {
  const [blobUrl, setBlobUrl] = useState<string | null>(null);
  const [isLoadingUrl, setIsLoadingUrl] = useState(false);
  const [urlError, setUrlError] = useState<string | null>(null);

  // Load URL whenever doc changes
  useEffect(() => {
    if (!doc) {
      setBlobUrl(null);
      setUrlError(null);
      return;
    }
    let cancelled = false;
    setIsLoadingUrl(true);
    setBlobUrl(null);
    setUrlError(null);
    buildBlobUrl(doc.blobId)
      .then((url) => {
        if (!cancelled) setBlobUrl(url);
      })
      .catch((err) => {
        if (!cancelled) {
          setUrlError("Failed to generate document URL");
          console.error(err);
        }
      })
      .finally(() => {
        if (!cancelled) setIsLoadingUrl(false);
      });
    return () => {
      cancelled = true;
    };
  }, [doc]);

  const handleDownload = async () => {
    if (!doc) return;
    try {
      const url = blobUrl ?? (await buildBlobUrl(doc.blobId));
      const a = document.createElement("a");
      a.href = url;
      a.download = displayDescription;
      a.target = "_blank";
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
    } catch {
      toast.error("Failed to download document");
    }
  };

  const fileType = doc?.fileType ?? "";
  const isImage = fileType.startsWith("image/");
  const isPdf = fileType === "application/pdf";
  const isVideo = fileType.startsWith("video/");
  const isAudio = fileType.startsWith("audio/");
  const canPreview = isImage || isPdf || isVideo || isAudio;

  return (
    <Dialog open={!!doc} onOpenChange={(open) => !open && onClose()}>
      <DialogContent
        className="bg-card border-border sm:max-w-3xl max-h-[90vh] flex flex-col"
        data-ocid="documents.view_dialog"
      >
        <DialogHeader className="flex-shrink-0">
          <DialogTitle className="font-display text-foreground flex items-center gap-2 truncate pr-6">
            <FileText className="w-5 h-5 text-teal flex-shrink-0" />
            <span className="truncate">{displayDescription}</span>
          </DialogTitle>
          {doc && (
            <DialogDescription className="text-muted-foreground">
              {doc.fileType} &middot; {formatFileSize(doc.fileSize)}
            </DialogDescription>
          )}
        </DialogHeader>

        {/* Preview area */}
        <div className="flex-1 min-h-0 overflow-auto rounded-lg bg-secondary/50 border border-border flex items-center justify-center">
          {isLoadingUrl && (
            <div className="flex flex-col items-center gap-3 p-8 text-muted-foreground">
              <Loader2 className="w-8 h-8 animate-spin text-teal" />
              <p className="text-sm">Loading document...</p>
            </div>
          )}

          {urlError && !isLoadingUrl && (
            <div className="flex flex-col items-center gap-3 p-8 text-destructive">
              <FileText className="w-8 h-8" />
              <p className="text-sm font-medium">{urlError}</p>
            </div>
          )}

          {blobUrl && !isLoadingUrl && !urlError && (
            <>
              {isImage && (
                <img
                  src={blobUrl}
                  alt={displayDescription}
                  className="max-w-full max-h-[60vh] object-contain rounded-lg"
                />
              )}
              {isPdf && (
                <iframe
                  src={blobUrl}
                  title={displayDescription}
                  className="w-full"
                  style={{ height: "60vh" }}
                />
              )}
              {isVideo && (
                <video
                  src={blobUrl}
                  controls
                  className="max-w-full max-h-[60vh] rounded-lg"
                >
                  <track kind="captions" />
                  Your browser does not support video playback.
                </video>
              )}
              {isAudio && (
                <div className="p-8 w-full">
                  {/* biome-ignore lint/a11y/useMediaCaption: audio from user uploads may not have captions */}
                  <audio src={blobUrl} controls className="w-full" />
                </div>
              )}
              {!canPreview && (
                <div className="flex flex-col items-center gap-4 p-8 text-center">
                  <div className="w-16 h-16 rounded-2xl bg-teal/10 border border-teal/20 flex items-center justify-center">
                    <File className="w-8 h-8 text-teal" />
                  </div>
                  <div>
                    <p className="font-medium text-foreground">
                      Preview not available
                    </p>
                    <p className="text-sm text-muted-foreground mt-1">
                      This file type ({fileType || "unknown"}) cannot be
                      previewed directly.
                    </p>
                  </div>
                  <Button
                    onClick={handleDownload}
                    className="bg-teal hover:bg-teal/90 text-background font-semibold gap-2"
                    data-ocid="documents.view_dialog.download_button"
                  >
                    <Download className="w-4 h-4" />
                    Download File
                  </Button>
                </div>
              )}
            </>
          )}
        </div>

        <DialogFooter className="flex-shrink-0 mt-4">
          <Button
            type="button"
            variant="outline"
            onClick={onClose}
            className="border-border"
            data-ocid="documents.view_dialog.close_button"
          >
            Close
          </Button>
          {canPreview && (
            <Button
              type="button"
              onClick={handleDownload}
              className="bg-teal hover:bg-teal/90 text-background font-semibold gap-2"
              data-ocid="documents.view_dialog.download_button"
            >
              <Download className="w-4 h-4" />
              Download
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ─── Document Row ─────────────────────────────────────────────────────────────

interface DocumentRowProps {
  doc: Document;
  index: number;
  onDelete: (doc: Document) => void;
  onEdit: (doc: Document) => void;
  onView: (doc: Document) => void;
  category?: string;
  isFavorite: boolean;
  expiryDate?: string;
  displayDescription: string;
  onToggleFavorite: () => void;
}

function DocumentRow({
  doc,
  index,
  onDelete,
  onEdit,
  onView,
  category,
  isFavorite,
  expiryDate,
  displayDescription,
  onToggleFavorite,
}: DocumentRowProps) {
  const typeLabel = getFileTypeLabel(doc.fileType);
  const typeColor = getFileTypeColor(doc.fileType);

  const handleDownload = async () => {
    try {
      const url = await buildBlobUrl(doc.blobId);
      const a = document.createElement("a");
      a.href = url;
      a.download = displayDescription;
      a.target = "_blank";
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      toast.success("Download started");
    } catch {
      toast.error("Failed to download document");
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -6 }}
      transition={{ duration: 0.25 }}
      className="vault-card rounded-xl p-4 hover:border-teal/30 transition-colors group"
      data-ocid={`documents.item.${index}`}
    >
      <div className="flex items-center gap-4">
        {/* File type badge */}
        <div
          className={`w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 font-mono font-bold text-xs ${typeColor}`}
        >
          {typeLabel}
        </div>

        {/* Document info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <button
              type="button"
              onClick={() => onView(doc)}
              className="font-semibold text-foreground text-sm truncate hover:text-teal transition-colors text-left"
              title="Click to view document"
            >
              {displayDescription}
            </button>
            {category && category !== "Other" && (
              <Badge
                variant="outline"
                className={`text-xs px-1.5 py-0 h-4 ${getCategoryColor(category)}`}
              >
                {category}
              </Badge>
            )}
          </div>
          <div className="flex items-center flex-wrap gap-3 mt-1">
            <span className="flex items-center gap-1 text-xs text-muted-foreground">
              <File className="w-3 h-3" />
              {doc.fileType || "unknown"}
            </span>
            <span className="flex items-center gap-1 text-xs text-muted-foreground">
              <HardDrive className="w-3 h-3" />
              {formatFileSize(doc.fileSize)}
            </span>
            <span className="flex items-center gap-1 text-xs text-muted-foreground">
              <Calendar className="w-3 h-3" />
              {formatDate(doc.createdAt)}
            </span>
            {expiryDate && <ExpiryBadge expiryDate={expiryDate} />}
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
            title={isFavorite ? "Remove from favorites" : "Add to favorites"}
          >
            <Star
              className={`w-3.5 h-3.5 ${isFavorite ? "fill-yellow-400" : ""}`}
            />
          </button>
          {/* Download button */}
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity hover:bg-teal/10 hover:text-teal"
            onClick={handleDownload}
            data-ocid={`documents.download_button.${index}`}
            title="Download document"
          >
            <Download className="w-3.5 h-3.5" />
          </Button>
          {/* Edit button */}
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity hover:bg-accent"
            onClick={() => onEdit(doc)}
            data-ocid={`documents.edit_button.${index}`}
            title="Edit document"
          >
            <Edit2 className="w-3.5 h-3.5" />
          </Button>
          {/* Delete action */}
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity hover:bg-destructive/10 hover:text-destructive flex-shrink-0"
            onClick={() => onDelete(doc)}
            data-ocid={`documents.delete_button.${index}`}
            title="Delete document"
          >
            <Trash2 className="w-4 h-4" />
          </Button>
        </div>
      </div>
    </motion.div>
  );
}

// ─── Main Component ──────────────────────────────────────────────────────────

export default function DocumentsTab() {
  const { identity } = useInternetIdentity();
  const principalText = identity?.getPrincipal().toText() ?? "";
  const {
    enrichment,
    updateDocument: updateEnrichment,
    removeDocument,
    addDocCategory,
  } = useEnrichment(principalText);

  const { data: documents, isLoading, isError } = useGetAllDocuments();
  const createDocument = useCreateDocument();
  const deleteDocument = useDeleteDocument();
  const { actor } = useActor();

  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("All");
  const [uploadOpen, setUploadOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<Document | null>(null);
  const [editTarget, setEditTarget] = useState<Document | null>(null);
  const [viewTarget, setViewTarget] = useState<Document | null>(null);
  const [viewDescription, setViewDescription] = useState("");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [description, setDescription] = useState("");
  const [uploadCategory, setUploadCategory] = useState("Other");
  const [uploadExpiryDate, setUploadExpiryDate] = useState("");
  const [uploadFavorite, setUploadFavorite] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Edit modal state
  const [editDescription, setEditDescription] = useState("");
  const [editCategory, setEditCategory] = useState("Other");
  const [editExpiryDate, setEditExpiryDate] = useState("");
  const [editFavorite, setEditFavorite] = useState(false);

  const docCategories = enrichment.customDocCategories;

  const allDocuments = documents ?? [];

  // Sort: favorites first
  const sortedDocuments = [...allDocuments].sort((a, b) => {
    const aFav = enrichment.documents[a.id]?.favorite ? 1 : 0;
    const bFav = enrichment.documents[b.id]?.favorite ? 1 : 0;
    return bFav - aFav;
  });

  const filtered = sortedDocuments.filter((doc) => {
    const e = enrichment.documents[doc.id] ?? {};
    const displayDesc = e.overrideDescription ?? doc.description;
    const matchesSearch = displayDesc
      .toLowerCase()
      .includes(search.toLowerCase());
    const matchesCategory =
      categoryFilter === "All" || (e.category ?? "Other") === categoryFilter;
    return matchesSearch && matchesCategory;
  });

  const handleOpenUpload = () => {
    setSelectedFile(null);
    setDescription("");
    setUploadCategory("Other");
    setUploadExpiryDate("");
    setUploadFavorite(false);
    setUploadProgress(0);
    setUploadOpen(true);
  };

  const handleOpenEdit = (doc: Document) => {
    const e = enrichment.documents[doc.id] ?? {};
    setEditTarget(doc);
    setEditDescription(e.overrideDescription ?? doc.description);
    setEditCategory(e.category ?? "Other");
    setEditExpiryDate(e.expiryDate ?? "");
    setEditFavorite(e.favorite ?? false);
  };

  const handleOpenView = (doc: Document) => {
    const e = enrichment.documents[doc.id] ?? {};
    setViewDescription(e.overrideDescription ?? doc.description);
    setViewTarget(doc);
  };

  const handleSaveEdit = () => {
    if (!editTarget) return;
    updateEnrichment(editTarget.id, {
      overrideDescription: editDescription.trim() || undefined,
      category: editCategory,
      expiryDate: editExpiryDate || undefined,
      favorite: editFavorite,
    });
    toast.success("Document updated");
    setEditTarget(null);
  };

  const handleFileDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files[0];
    if (file) setSelectedFile(file);
  }, []);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) setSelectedFile(file);
  };

  const handleUploadSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedFile || !description.trim()) {
      toast.error("Please select a file and add a description");
      return;
    }
    if (!actor) {
      toast.error("Not connected to backend");
      return;
    }

    setIsUploading(true);
    setUploadProgress(0);

    try {
      const bytes = new Uint8Array(await selectedFile.arrayBuffer());

      const externalBlob = ExternalBlob.fromBytes(bytes).withUploadProgress(
        (pct) => setUploadProgress(pct),
      );

      const hashBytes = await (
        actor as unknown as {
          _uploadFile: (blob: ExternalBlob) => Promise<Uint8Array>;
        }
      )._uploadFile(externalBlob);

      const hashHex = Array.from(hashBytes)
        .map((b: number) => b.toString(16).padStart(2, "0"))
        .join("");
      const blobId = `sha256:${hashHex}`;

      const docId = await createDocument.mutateAsync({
        description: description.trim(),
        blobId,
        fileType: selectedFile.type || "application/octet-stream",
        fileSize: BigInt(selectedFile.size),
      });

      // Save enrichment
      updateEnrichment(docId, {
        category: uploadCategory,
        favorite: uploadFavorite,
        expiryDate: uploadExpiryDate || undefined,
      });

      toast.success(`"${description}" uploaded successfully`);
      setUploadOpen(false);
    } catch (err) {
      console.error("Upload failed:", err);
      toast.error("Upload failed. Please try again.");
    } finally {
      setIsUploading(false);
      setUploadProgress(0);
    }
  };

  const handleConfirmDelete = async () => {
    if (!deleteTarget) return;
    try {
      await deleteDocument.mutateAsync(deleteTarget.id);
      removeDocument(deleteTarget.id);
      toast.success(`Deleted "${deleteTarget.description}"`);
      setDeleteTarget(null);
    } catch {
      toast.error("Failed to delete document");
    }
  };

  return (
    <div className="space-y-4">
      {/* Toolbar */}
      <div className="flex items-center gap-3 flex-wrap">
        <div className="relative flex-1 min-w-[180px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
          <Input
            placeholder="Search documents..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9 bg-secondary border-border text-foreground placeholder:text-muted-foreground"
            data-ocid="documents.search_input"
          />
        </div>
        <div className="w-[180px]">
          <CategorySelect
            value={categoryFilter}
            onValueChange={setCategoryFilter}
            categories={docCategories}
            onAddCategory={addDocCategory}
            triggerClassName="w-full bg-secondary border-border text-foreground"
            ocidTrigger="documents.category_select"
            ocidPrefix="doc_category"
            includeAll
            placeholder="All Categories"
          />
        </div>
        <Button
          className="bg-teal hover:bg-teal/90 text-background font-semibold gap-2 flex-shrink-0"
          onClick={handleOpenUpload}
          data-ocid="documents.upload_button"
        >
          <Upload className="h-4 w-4" />
          <span className="hidden sm:inline">Upload Document</span>
          <span className="sm:hidden">Upload</span>
        </Button>
      </div>

      {/* Stats */}
      {!isLoading && allDocuments.length > 0 && (
        <div className="flex items-center gap-3 flex-wrap">
          <Badge
            variant="secondary"
            className="text-xs bg-secondary text-muted-foreground"
          >
            {allDocuments.length} document{allDocuments.length !== 1 ? "s" : ""}{" "}
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
        <div className="space-y-3" data-ocid="documents.loading_state">
          {["dsk1", "dsk2", "dsk3"].map((k) => (
            <DocumentSkeleton key={k} />
          ))}
        </div>
      )}

      {/* Error */}
      {isError && (
        <div
          className="vault-card rounded-xl p-6 text-center text-destructive"
          data-ocid="documents.error_state"
        >
          <p className="font-medium">Failed to load documents</p>
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
          data-ocid="documents.empty_state"
        >
          <div className="w-16 h-16 rounded-2xl bg-teal/10 border border-teal/20 flex items-center justify-center mx-auto mb-4">
            <FileText className="w-8 h-8 text-teal" />
          </div>
          <h3 className="font-display font-semibold text-foreground mb-2">
            {search || categoryFilter !== "All"
              ? "No matching documents"
              : "No documents yet"}
          </h3>
          <p className="text-muted-foreground text-sm mb-5">
            {search
              ? `No documents match "${search}"`
              : categoryFilter !== "All"
                ? `No documents in the "${categoryFilter}" category`
                : "Upload important documents to keep them securely stored in your vault"}
          </p>
          {!search && categoryFilter === "All" && (
            <Button
              className="bg-teal hover:bg-teal/90 text-background font-semibold gap-2"
              onClick={handleOpenUpload}
            >
              <Upload className="h-4 w-4" />
              Upload Your First Document
            </Button>
          )}
        </motion.div>
      )}

      {/* Document list */}
      {!isLoading && !isError && filtered.length > 0 && (
        <AnimatePresence mode="popLayout">
          <div className="space-y-2">
            {filtered.map((doc, i) => {
              const e = enrichment.documents[doc.id] ?? {};
              return (
                <DocumentRow
                  key={doc.id}
                  doc={doc}
                  index={i + 1}
                  onDelete={setDeleteTarget}
                  onEdit={handleOpenEdit}
                  onView={handleOpenView}
                  category={e.category}
                  isFavorite={!!e.favorite}
                  expiryDate={e.expiryDate}
                  displayDescription={e.overrideDescription ?? doc.description}
                  onToggleFavorite={() =>
                    updateEnrichment(doc.id, { favorite: !e.favorite })
                  }
                />
              );
            })}
          </div>
        </AnimatePresence>
      )}

      {/* Document Viewer */}
      <DocumentViewer
        doc={viewTarget}
        displayDescription={viewDescription}
        onClose={() => setViewTarget(null)}
      />

      {/* Upload Modal */}
      <Dialog open={uploadOpen} onOpenChange={setUploadOpen}>
        <DialogContent
          className="bg-card border-border sm:max-w-md"
          data-ocid="upload_doc.modal"
        >
          <DialogHeader>
            <DialogTitle className="font-display text-foreground flex items-center gap-2">
              <CloudUpload className="w-5 h-5 text-teal" />
              Upload Document
            </DialogTitle>
            <DialogDescription className="text-muted-foreground">
              Upload a file to store it securely in your vault
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleUploadSubmit} className="space-y-4">
            {/* Dropzone */}
            <label
              htmlFor="file-upload-input"
              className={`relative border-2 border-dashed rounded-xl p-8 text-center transition-colors cursor-pointer block ${
                isDragging
                  ? "border-teal bg-teal/5"
                  : selectedFile
                    ? "border-teal/50 bg-teal/5"
                    : "border-border hover:border-teal/40 hover:bg-secondary/50"
              }`}
              onDragOver={(e) => {
                e.preventDefault();
                setIsDragging(true);
              }}
              onDragLeave={() => setIsDragging(false)}
              onDrop={handleFileDrop}
              data-ocid="upload_doc.dropzone"
            >
              <input
                ref={fileInputRef}
                id="file-upload-input"
                type="file"
                className="sr-only"
                onChange={handleFileSelect}
                accept="*/*"
              />

              {selectedFile ? (
                <div className="flex items-center justify-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-teal/20 flex items-center justify-center">
                    <File className="w-5 h-5 text-teal" />
                  </div>
                  <div className="text-left min-w-0">
                    <p className="text-sm font-medium text-foreground truncate max-w-[200px]">
                      {selectedFile.name}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {formatFileSize(selectedFile.size)}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      setSelectedFile(null);
                    }}
                    className="ml-auto text-muted-foreground hover:text-foreground transition-colors"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              ) : (
                <>
                  <CloudUpload className="w-10 h-10 text-muted-foreground mx-auto mb-3" />
                  <p className="text-sm font-medium text-foreground mb-1">
                    Drop file here or click to browse
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Any file type supported
                  </p>
                </>
              )}
            </label>

            {/* Description */}
            <div className="space-y-2">
              <Label
                htmlFor="doc-description"
                className="text-foreground text-sm"
              >
                Label / Description <span className="text-destructive">*</span>
              </Label>
              <Input
                id="doc-description"
                placeholder="e.g. Passport Scan, Tax Return 2024"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="bg-secondary border-border text-foreground"
                data-ocid="upload_doc.label_input"
              />
            </div>

            {/* Category */}
            <div className="space-y-2">
              <Label htmlFor="doc-category" className="text-foreground text-sm">
                Category
              </Label>
              <CategorySelect
                value={uploadCategory}
                onValueChange={setUploadCategory}
                categories={docCategories}
                onAddCategory={addDocCategory}
                triggerId="doc-category"
                triggerClassName="bg-secondary border-border text-foreground w-full"
                ocidTrigger="upload_doc.category_select"
                ocidPrefix="doc_category"
              />
            </div>

            {/* Expiry date */}
            <div className="space-y-2">
              <Label htmlFor="doc-expiry" className="text-foreground text-sm">
                Expiry Date{" "}
                <span className="text-muted-foreground text-xs">
                  (optional)
                </span>
              </Label>
              <Input
                id="doc-expiry"
                type="date"
                value={uploadExpiryDate}
                onChange={(e) => setUploadExpiryDate(e.target.value)}
                className="bg-secondary border-border text-foreground"
                data-ocid="upload_doc.expiry_input"
              />
            </div>

            {/* Favorite toggle */}
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setUploadFavorite((v) => !v)}
                className={`p-1.5 rounded hover:bg-accent transition-colors ${
                  uploadFavorite ? "text-yellow-400" : "text-muted-foreground"
                }`}
                title={
                  uploadFavorite ? "Remove from favorites" : "Mark as favorite"
                }
              >
                <Star
                  className={`w-4 h-4 ${uploadFavorite ? "fill-yellow-400" : ""}`}
                />
              </button>
              <span className="text-sm text-muted-foreground">
                {uploadFavorite ? "Marked as favorite" : "Add to favorites"}
              </span>
            </div>

            {/* Progress */}
            {isUploading && (
              <div className="space-y-2">
                <div className="flex items-center justify-between text-xs text-muted-foreground">
                  <span>Uploading...</span>
                  <span>{uploadProgress}%</span>
                </div>
                <Progress
                  value={uploadProgress}
                  className="h-1.5 bg-secondary"
                />
              </div>
            )}

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setUploadOpen(false)}
                disabled={isUploading}
                className="border-border"
                data-ocid="upload_doc.cancel_button"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={!selectedFile || !description.trim() || isUploading}
                className="bg-teal hover:bg-teal/90 text-background font-semibold"
                data-ocid="upload_doc.submit_button"
              >
                {isUploading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Uploading...
                  </>
                ) : (
                  <>
                    <Upload className="mr-2 h-4 w-4" />
                    Upload
                  </>
                )}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Edit Modal */}
      <Dialog
        open={!!editTarget}
        onOpenChange={(open) => !open && setEditTarget(null)}
      >
        <DialogContent
          className="bg-card border-border sm:max-w-md"
          data-ocid="edit_doc.dialog"
        >
          <DialogHeader>
            <div className="flex items-center justify-between">
              <DialogTitle className="font-display text-foreground flex items-center gap-2">
                <Edit2 className="w-5 h-5 text-teal" />
                Edit Document
              </DialogTitle>
              <button
                type="button"
                onClick={() => setEditFavorite((v) => !v)}
                className={`p-1.5 rounded hover:bg-accent transition-colors mr-6 ${
                  editFavorite ? "text-yellow-400" : "text-muted-foreground"
                }`}
                title="Toggle favorite"
              >
                <Star
                  className={`w-5 h-5 ${editFavorite ? "fill-yellow-400" : ""}`}
                />
              </button>
            </div>
            <DialogDescription className="text-muted-foreground">
              Update document metadata (stored locally)
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label className="text-foreground text-sm">Description</Label>
              <Input
                value={editDescription}
                onChange={(e) => setEditDescription(e.target.value)}
                placeholder="Document description"
                className="bg-secondary border-border text-foreground"
                data-ocid="edit_doc.input"
              />
            </div>

            <div className="space-y-2">
              <Label className="text-foreground text-sm">Category</Label>
              <CategorySelect
                value={editCategory}
                onValueChange={setEditCategory}
                categories={docCategories}
                onAddCategory={addDocCategory}
                triggerClassName="bg-secondary border-border text-foreground w-full"
                ocidTrigger="edit_doc.select"
                ocidPrefix="doc_category"
              />
            </div>

            <div className="space-y-2">
              <Label className="text-foreground text-sm">
                Expiry Date{" "}
                <span className="text-muted-foreground text-xs">
                  (optional)
                </span>
              </Label>
              <Input
                type="date"
                value={editExpiryDate}
                onChange={(e) => setEditExpiryDate(e.target.value)}
                className="bg-secondary border-border text-foreground"
                data-ocid="edit_doc.expiry_input"
              />
            </div>
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => setEditTarget(null)}
              className="border-border"
              data-ocid="edit_doc.cancel_button"
            >
              Cancel
            </Button>
            <Button
              type="button"
              onClick={handleSaveEdit}
              className="bg-teal hover:bg-teal/90 text-background font-semibold"
              data-ocid="edit_doc.save_button"
            >
              Save Changes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirm */}
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
              Delete Document?
            </AlertDialogTitle>
            <AlertDialogDescription className="text-muted-foreground">
              This will permanently remove{" "}
              <span className="font-semibold text-foreground">
                "{deleteTarget?.description}"
              </span>{" "}
              from your vault. This cannot be undone.
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
              disabled={deleteDocument.isPending}
              data-ocid="delete.confirm_button"
            >
              {deleteDocument.isPending ? (
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
