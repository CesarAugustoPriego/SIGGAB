export type BackupSource = 'MANUAL' | 'AUTO_SCHEDULER' | string;

export interface BackupListItem {
  fileName: string;
  sizeBytes: number;
  createdAt: string;
  modifiedAt: string;
}

export interface BackupCloudMeta {
  uploadUrl: string;
  status: number;
  uploadedAt: string;
}

export interface BackupExecutionResult {
  fileName: string;
  filePath: string;
  generatedAt: string;
  source: BackupSource;
  executedBy: number | null;
  cloud?: BackupCloudMeta | null;
}

export interface BackupDownloadResult {
  blob: Blob;
  fileName: string;
}
