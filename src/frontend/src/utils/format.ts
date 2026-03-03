/**
 * Format file size from bytes to human-readable string
 */
export function formatFileSize(bytes: bigint | number): string {
  const n = typeof bytes === "bigint" ? Number(bytes) : bytes;
  if (n < 1024) return `${n} B`;
  if (n < 1024 * 1024) return `${(n / 1024).toFixed(1)} KB`;
  if (n < 1024 * 1024 * 1024) return `${(n / (1024 * 1024)).toFixed(1)} MB`;
  return `${(n / (1024 * 1024 * 1024)).toFixed(1)} GB`;
}

/**
 * Format a timestamp (bigint nanoseconds) to a readable date string
 */
export function formatDate(timestamp: bigint | number): string {
  // IC timestamps are in nanoseconds
  const ms =
    typeof timestamp === "bigint"
      ? Number(timestamp / BigInt(1_000_000))
      : timestamp;
  const date = new Date(ms);
  return date.toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

/**
 * Get initials from a name
 */
export function getInitials(name: string): string {
  return name
    .split(" ")
    .map((n) => n[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();
}

/**
 * Mask a password for display
 */
export function maskPassword(password: string): string {
  return "•".repeat(Math.min(password.length, 12));
}

/**
 * Get a consistent color for a service name
 */
export function getServiceColor(serviceName: string): string {
  const colors = [
    "bg-teal/20 text-teal",
    "bg-purple-500/20 text-purple-400",
    "bg-amber-500/20 text-amber-400",
    "bg-rose-500/20 text-rose-400",
    "bg-emerald-500/20 text-emerald-400",
    "bg-blue-500/20 text-blue-400",
    "bg-orange-500/20 text-orange-400",
    "bg-pink-500/20 text-pink-400",
  ];
  let hash = 0;
  for (let i = 0; i < serviceName.length; i++) {
    hash = serviceName.charCodeAt(i) + ((hash << 5) - hash);
  }
  return colors[Math.abs(hash) % colors.length];
}

/**
 * Get file type icon label
 */
export function getFileTypeLabel(fileType: string): string {
  const lower = fileType.toLowerCase();
  if (lower.includes("pdf")) return "PDF";
  if (lower.includes("image") || lower.match(/\.(jpg|jpeg|png|gif|webp|svg)/))
    return "IMG";
  if (lower.includes("word") || lower.includes("doc")) return "DOC";
  if (lower.includes("sheet") || lower.includes("xls")) return "XLS";
  if (lower.includes("text") || lower.includes("txt")) return "TXT";
  if (lower.includes("zip") || lower.includes("archive")) return "ZIP";
  return "FILE";
}

/**
 * Get file type color
 */
export function getFileTypeColor(fileType: string): string {
  const label = getFileTypeLabel(fileType);
  const colorMap: Record<string, string> = {
    PDF: "bg-rose-500/20 text-rose-400",
    IMG: "bg-teal/20 text-teal",
    DOC: "bg-blue-500/20 text-blue-400",
    XLS: "bg-emerald-500/20 text-emerald-400",
    TXT: "bg-muted text-muted-foreground",
    ZIP: "bg-amber-500/20 text-amber-400",
    FILE: "bg-secondary text-secondary-foreground",
  };
  return colorMap[label] || colorMap.FILE;
}
