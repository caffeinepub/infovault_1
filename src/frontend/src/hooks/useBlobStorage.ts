import { useState } from "react";

export function useBlobStorage() {
  const [uploadProgress, setUploadProgress] = useState(0);
  const [isUploading, setIsUploading] = useState(false);

  const uploadFile = async (
    _file: File,
    storageClientFactory: (
      onProgress: (pct: number) => void,
    ) => Promise<string>,
  ): Promise<string> => {
    setIsUploading(true);
    setUploadProgress(0);

    try {
      const hash = await storageClientFactory((pct) => {
        setUploadProgress(pct);
      });
      return hash;
    } finally {
      setIsUploading(false);
      setUploadProgress(0);
    }
  };

  return { uploadFile, uploadProgress, isUploading };
}
