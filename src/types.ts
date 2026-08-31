export interface DriveUser {
  displayName: string;
  emailAddress: string;
  photoLink?: string;
  me?: boolean;
}

export interface DriveStorageQuota {
  limit?: string; // in bytes
  usage?: string; // in bytes
  usageInDrive?: string; // in bytes
  usageInDriveTrash?: string; // in bytes
}

export interface DriveAbout {
  user: DriveUser;
  storageQuota: DriveStorageQuota;
}

export interface DriveFile {
  id: string;
  name: string;
  mimeType: string;
  size?: string; // in bytes
  quotaBytesUsed?: string;
  trashed: boolean;
  createdTime?: string;
  modifiedTime?: string;
  webViewLink?: string;
  thumbnailLink?: string;
  iconLink?: string;
  owners?: DriveUser[];
  shared?: boolean;
  parents?: string[];
  description?: string;
  fileExtension?: string;
}

export type FileCategory =
  | 'alle'
  | 'dokumente'
  | 'tabellen'
  | 'praesentationen'
  | 'pdf'
  | 'bilder'
  | 'videos'
  | 'audio'
  | 'archive'
  | 'code'
  | 'ordner'
  | 'sonstige';

export type CleanupAdvisorCategory =
  | 'trash'
  | 'large_files'
  | 'duplicates'
  | 'old_files'
  | 'temp_files';

export type ActiveTab = 'advisor' | 'trash' | 'files' | 'large_files';

export interface FileFilterState {
  searchQuery: string;
  category: FileCategory;
  minSizeMB: number;
  maxSizeMB?: number;
  sortBy: 'size' | 'modifiedTime' | 'name' | 'createdTime';
  sortOrder: 'asc' | 'desc';
  onlyTrashed: boolean;
}

export interface NotificationItem {
  id: string;
  type: 'success' | 'error' | 'info' | 'warning';
  title: string;
  message: string;
  timestamp: number;
}

export interface LoginSuccess {
  success: true;
  token: string;
  user?: any;
}

export interface LoginFailure {
  success: false;
  cancelled: boolean;
  message?: string;
}

export type LoginResult = LoginSuccess | LoginFailure;

