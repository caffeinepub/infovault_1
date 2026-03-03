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
import { Skeleton } from "@/components/ui/skeleton";
import {
  Calendar,
  CloudUpload,
  File,
  FileText,
  HardDrive,
  Loader2,
  Trash2,
  Upload,
  X,
} from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { useCallback, useRef, useState } from "react";
import { toast } from "sonner";
import { ExternalBlob } from "../backend";
import type { Document } from "../backend.d.ts";
import { useActor } from "../hooks/useActor";
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

interface DocumentRowProps {
  doc: Document;
  index: number;
  onDelete: (doc: Document) => void;
}

function DocumentRow({ doc, index, onDelete }: DocumentRowProps) {
  const typeLabel = getFileTypeLabel(doc.fileType);
  const typeColor = getFileTypeColor(doc.fileType);

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
          <p className="font-semibold text-foreground text-sm truncate">
            {doc.description}
          </p>
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
          </div>
        </div>

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
    </motion.div>
  );
}

export default function DocumentsTab() {
  const { data: documents, isLoading, isError } = useGetAllDocuments();
  const createDocument = useCreateDocument();
  const deleteDocument = useDeleteDocument();
  const { actor } = useActor();

  const [uploadOpen, setUploadOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<Document | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [description, setDescription] = useState("");
  const [isDragging, setIsDragging] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleOpenUpload = () => {
    setSelectedFile(null);
    setDescription("");
    setUploadProgress(0);
    setUploadOpen(true);
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

      // Use ExternalBlob upload via the actor's internal upload function
      const externalBlob = ExternalBlob.fromBytes(bytes).withUploadProgress(
        (pct) => setUploadProgress(pct),
      );

      // Call the actor's internal _uploadFile which is accessible via type cast
      const hashBytes = await (
        actor as unknown as {
          _uploadFile: (blob: ExternalBlob) => Promise<Uint8Array>;
        }
      )._uploadFile(externalBlob);

      // Convert hash bytes to sha256: prefixed hex string
      const hashHex = Array.from(hashBytes)
        .map((b: number) => b.toString(16).padStart(2, "0"))
        .join("");
      const blobId = `sha256:${hashHex}`;

      await createDocument.mutateAsync({
        description: description.trim(),
        blobId,
        fileType: selectedFile.type || "application/octet-stream",
        fileSize: BigInt(selectedFile.size),
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
      toast.success(`Deleted "${deleteTarget.description}"`);
      setDeleteTarget(null);
    } catch {
      toast.error("Failed to delete document");
    }
  };

  return (
    <div className="space-y-4">
      {/* Toolbar */}
      <div className="flex items-center justify-between">
        <div>
          {!isLoading && documents && documents.length > 0 && (
            <Badge
              variant="secondary"
              className="text-xs bg-secondary text-muted-foreground"
            >
              {documents.length} document{documents.length !== 1 ? "s" : ""}{" "}
              stored
            </Badge>
          )}
        </div>
        <Button
          className="bg-teal hover:bg-teal/90 text-background font-semibold gap-2"
          onClick={handleOpenUpload}
          data-ocid="documents.upload_button"
        >
          <Upload className="h-4 w-4" />
          <span className="hidden sm:inline">Upload Document</span>
          <span className="sm:hidden">Upload</span>
        </Button>
      </div>

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
      {!isLoading && !isError && (!documents || documents.length === 0) && (
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
            No documents yet
          </h3>
          <p className="text-muted-foreground text-sm mb-5">
            Upload important documents to keep them securely stored in your
            vault
          </p>
          <Button
            className="bg-teal hover:bg-teal/90 text-background font-semibold gap-2"
            onClick={handleOpenUpload}
          >
            <Upload className="h-4 w-4" />
            Upload Your First Document
          </Button>
        </motion.div>
      )}

      {/* Document list */}
      {!isLoading && !isError && documents && documents.length > 0 && (
        <AnimatePresence mode="popLayout">
          <div className="space-y-2">
            {documents.map((doc, i) => (
              <DocumentRow
                key={doc.id}
                doc={doc}
                index={i + 1}
                onDelete={setDeleteTarget}
              />
            ))}
          </div>
        </AnimatePresence>
      )}

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
