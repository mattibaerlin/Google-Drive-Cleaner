import { initializeApp, getApps, getApp } from 'firebase/app';
import { getAuth, signInWithPopup, GoogleAuthProvider, signOut, User } from 'firebase/auth';
import firebaseConfig from '../../firebase-applet-config.json';
import { DriveAbout, DriveFile, LoginResult } from '../types';

const DRIVE_API_BASE = 'https://www.googleapis.com/drive/v3';
const TOKEN_STORAGE_KEY = 'google_drive_access_token';
const TOKEN_EXPIRY_KEY = 'google_drive_token_expires_at';
const USER_INFO_STORAGE_KEY = 'google_drive_user_cache';

// Initialize Firebase App & Auth
const firebaseApp = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);
const auth = getAuth(firebaseApp);

// Declare Google Identity Services globals on window
declare global {
  interface Window {
    google?: {
      accounts: {
        oauth2: {
          initTokenClient: (config: {
            client_id: string;
            scope: string;
            callback: (response: { access_token?: string; error?: string; error_description?: string; expires_in?: number }) => void;
            error_callback?: (err: unknown) => void;
          }) => {
            requestAccessToken: (overrideConfig?: { prompt?: string }) => void;
          };
        };
      };
    };
  }
}

export class GoogleDriveService {
  private static token: string | null = null;
  private static tokenClient: any = null;

  /**
   * Initialisiert den gespeicherten Token aus der Session/Storage
   */
  public static getStoredToken(): string | null {
    if (this.token) return this.token;

    const stored = localStorage.getItem(TOKEN_STORAGE_KEY) || sessionStorage.getItem(TOKEN_STORAGE_KEY);
    const expiresAt = localStorage.getItem(TOKEN_EXPIRY_KEY);

    if (stored) {
      if (expiresAt && Date.now() > parseInt(expiresAt, 10)) {
        // Token ist abgelaufen
        this.clearToken();
        return null;
      }
      this.token = stored;
      return stored;
    }
    return null;
  }

  /**
   * Speichert einen neuen Access Token
   */
  public static setToken(token: string, expiresInSeconds: number = 3600): void {
    this.token = token;
    const expiresAt = Date.now() + expiresInSeconds * 1000;
    localStorage.setItem(TOKEN_STORAGE_KEY, token);
    localStorage.setItem(TOKEN_EXPIRY_KEY, expiresAt.toString());
  }

  /**
   * Entfernt den Token (Logout)
   */
  public static async clearToken(): Promise<void> {
    this.token = null;
    localStorage.removeItem(TOKEN_STORAGE_KEY);
    localStorage.removeItem(TOKEN_EXPIRY_KEY);
    localStorage.removeItem(USER_INFO_STORAGE_KEY);
    try {
      await signOut(auth);
    } catch {
      // ignore
    }
  }

  /**
   * Überprüft, ob ein gültiger Token vorhanden ist
   */
  public static isAuthenticated(): boolean {
    return !!this.getStoredToken();
  }

  /**
   * Startet den Google Drive Login-Flow
   * Nutzt primär Firebase Auth mit GoogleAuthProvider und fällt bei Bedarf auf GSI zurück.
   */
  public static async requestGoogleDriveLogin(): Promise<LoginResult> {
    // 1. Primärer Weg: Firebase Auth Popup
    try {
      const provider = new GoogleAuthProvider();
      provider.addScope('https://www.googleapis.com/auth/drive');
      provider.setCustomParameters({
        prompt: 'consent',
        access_type: 'offline',
      });

      const result = await signInWithPopup(auth, provider);
      const credential = GoogleAuthProvider.credentialFromResult(result);
      const accessToken = credential?.accessToken;

      if (accessToken) {
        this.setToken(accessToken, 3599);
        if (result.user) {
          try {
            const userObj = {
              displayName: result.user.displayName || 'Google Benutzer',
              emailAddress: result.user.email || '',
              photoLink: result.user.photoURL || '',
            };
            localStorage.setItem(USER_INFO_STORAGE_KEY, JSON.stringify(userObj));
          } catch {
            // ignore
          }
        }
        return { success: true, token: accessToken, user: result.user };
      }
    } catch (err: any) {
      console.warn('Firebase Auth Versuch mitgeteilt:', err);
      const code = err?.code || '';
      const msg = String(err?.message || err);

      // Wenn der Benutzer das Popup einfach geschlossen hat
      if (
        code === 'auth/popup-closed-by-user' ||
        code === 'auth/cancelled-popup-request' ||
        msg.includes('Popup window closed') ||
        msg.includes('popup_closed')
      ) {
        return { success: false, cancelled: true };
      }

      // Bei Domain- oder Popup-Blockaden: Versuche GSI Fallback
      if (window.google?.accounts?.oauth2) {
        return await this.requestGsiLogin();
      }

      return {
        success: false,
        cancelled: false,
        message: this.translateAuthError(err),
      };
    }

    // 2. Sekundärer Weg: Google Identity Services (GSI)
    if (window.google?.accounts?.oauth2) {
      return await this.requestGsiLogin();
    }

    return {
      success: false,
      cancelled: false,
      message: 'Google Anmeldedienst ist derzeit nicht erreichbar. Bitte überprüfen Sie Pop-up-Blocker.',
    };
  }

  /**
   * Google Identity Services (GSI) OAuth Token Flow Fallback
   */
  private static async requestGsiLogin(): Promise<LoginResult> {
    return new Promise((resolve) => {
      if (!window.google?.accounts?.oauth2) {
        resolve({
          success: false,
          cancelled: false,
          message: 'Google Identity Services Bibliothek wurde noch nicht geladen.',
        });
        return;
      }

      const activeClientId =
        firebaseConfig.oAuthClientId ||
        (import.meta as any).env?.VITE_GOOGLE_CLIENT_ID ||
        '393286389273-p1au8s7asjarmvsb56uqbu31tseaeqau.apps.googleusercontent.com';

      try {
        const client = window.google.accounts.oauth2.initTokenClient({
          client_id: activeClientId,
          scope: 'https://www.googleapis.com/auth/drive',
          callback: (response) => {
            if (response.error) {
              if (
                response.error === 'popup_closed_by_user' ||
                response.error === 'access_denied' ||
                response.error.includes('closed')
              ) {
                resolve({ success: false, cancelled: true });
                return;
              }
              resolve({
                success: false,
                cancelled: false,
                message: `Google Authentifizierungsfehler: ${response.error_description || response.error}`,
              });
              return;
            }

            if (response.access_token) {
              this.setToken(response.access_token, response.expires_in || 3599);
              resolve({ success: true, token: response.access_token });
            } else {
              resolve({
                success: false,
                cancelled: false,
                message: 'Kein Zugriffs-Token von Google erhalten.',
              });
            }
          },
          error_callback: (err: any) => {
            const errStr = typeof err === 'string' ? err : err?.type || err?.message || JSON.stringify(err);
            if (
              errStr.includes('popup_closed') ||
              errStr.includes('Popup window closed') ||
              errStr.includes('closed')
            ) {
              resolve({ success: false, cancelled: true });
              return;
            }
            resolve({
              success: false,
              cancelled: false,
              message: `Fehler beim Öffnen des Anmeldefensters: ${errStr}`,
            });
          },
        });

        this.tokenClient = client;
        client.requestAccessToken({ prompt: 'consent' });
      } catch (err: any) {
        resolve({
          success: false,
          cancelled: false,
          message: `Fehler beim Starten des Logins: ${err?.message || err}`,
        });
      }
    });
  }

  /**
   * Übersetzt Firebase/Google Auth Fehler ins Deutsche
   */
  private static translateAuthError(err: any): string {
    const code = err?.code || '';
    const message = err?.message || String(err);

    if (code === 'auth/popup-blocked') {
      return 'Das Anmelde-Popup wurde vom Browser blockiert. Bitte erlauben Sie Popups für diese Seite und versuchen Sie es erneut.';
    }
    if (code === 'auth/network-request-failed') {
      return 'Netzwerkfehler: Bitte überprüfen Sie Ihre Internetverbindung.';
    }
    if (code === 'auth/unauthorized-domain') {
      return 'Die Domain ist im Google Cloud Projekt nicht autorisiert. Sie können das Zugriffstoken manuell eingeben.';
    }
    if (code === 'auth/operation-not-allowed') {
      return 'Google Anmeldung ist in diesem Projekt noch nicht aktiviert.';
    }
    return message || 'Authentifizierung fehlgeschlagen.';
  }

  /**
   * Generische API-Anfrage an Google Drive v3
   */
  private static async fetchDrive<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    const token = this.getStoredToken();
    if (!token) {
      throw new Error('Nicht authentifiziert. Bitte melden Sie sich bei Google Drive an.');
    }

    const headers: Record<string, string> = {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
      ...(options.headers as Record<string, string> || {}),
    };

    const url = endpoint.startsWith('http') ? endpoint : `${DRIVE_API_BASE}${endpoint}`;

    const response = await fetch(url, {
      ...options,
      headers,
    });

    if (response.status === 401) {
      this.clearToken();
      throw new Error('Ihre Google-Sitzung ist abgelaufen. Bitte melden Sie sich erneut an.');
    }

    if (response.status === 204) {
      return {} as T;
    }

    if (!response.ok) {
      let errorMessage = `Google Drive Fehler (${response.status}): ${response.statusText}`;
      try {
        const errorData = await response.json();
        if (errorData?.error?.message) {
          errorMessage = errorData.error.message;
        }
      } catch {
        // Ignorieren falls kein JSON
      }
      throw new Error(errorMessage);
    }

    return response.json();
  }

  /**
   * Ruft Benutzerinformationen und Speicherplatzstatistiken (Quota) ab
   */
  public static async getStorageAbout(): Promise<DriveAbout> {
    const data = await this.fetchDrive<DriveAbout>('/about?fields=user,storageQuota');
    try {
      localStorage.setItem(USER_INFO_STORAGE_KEY, JSON.stringify(data.user));
    } catch {
      // Ignoriere Storage-Fehler
    }
    return data;
  }

  /**
   * Ruft alle Dateien aus dem Papierkorb ab (trashed = true)
   */
  public static async getTrashFiles(pageSize: number = 100, pageToken?: string): Promise<{ files: DriveFile[]; nextPageToken?: string }> {
    const params = new URLSearchParams({
      q: 'trashed = true',
      pageSize: pageSize.toString(),
      fields: 'nextPageToken,files(id,name,mimeType,size,quotaBytesUsed,trashed,createdTime,modifiedTime,webViewLink,thumbnailLink,iconLink,owners,shared,parents)',
      orderBy: 'modifiedTime desc',
      supportsAllDrives: 'true',
      includeItemsFromAllDrives: 'true',
    });

    if (pageToken) {
      params.append('pageToken', pageToken);
    }

    return this.fetchDrive<{ files: DriveFile[]; nextPageToken?: string }>(`/files?${params.toString()}`);
  }

  /**
   * Leert den gesamten Google Drive Papierkorb unwiderruflich
   */
  public static async emptyTrash(): Promise<void> {
    await this.fetchDrive<void>('/files/trash', {
      method: 'DELETE',
    });
  }

  /**
   * Löscht eine einzelne Datei endgültig aus Google Drive
   */
  public static async deleteFilePermanently(fileId: string): Promise<void> {
    await this.fetchDrive<void>(`/files/${encodeURIComponent(fileId)}?supportsAllDrives=true`, {
      method: 'DELETE',
    });
  }

  /**
   * Verschiebt eine Datei in den Google Drive Papierkorb (trashed: true)
   */
  public static async moveToTrash(fileId: string): Promise<DriveFile> {
    return this.fetchDrive<DriveFile>(`/files/${encodeURIComponent(fileId)}?supportsAllDrives=true`, {
      method: 'PATCH',
      body: JSON.stringify({ trashed: true }),
    });
  }

  /**
   * Stellt eine Datei aus dem Papierkorb wieder her (trashed: false)
   */
  public static async restoreFromTrash(fileId: string): Promise<DriveFile> {
    return this.fetchDrive<DriveFile>(`/files/${encodeURIComponent(fileId)}?supportsAllDrives=true`, {
      method: 'PATCH',
      body: JSON.stringify({ trashed: false }),
    });
  }

  /**
   * Durchsucht Google Drive Dateien mit flexiblen Filtern
   */
  public static async listFiles(options: {
    query?: string;
    pageSize?: number;
    pageToken?: string;
    orderBy?: string;
    trashed?: boolean;
  } = {}): Promise<{ files: DriveFile[]; nextPageToken?: string }> {
    const {
      query = '',
      pageSize = 50,
      pageToken,
      orderBy = 'quotaBytesUsed desc, modifiedTime desc',
      trashed = false,
    } = options;

    const queryParts: string[] = [`trashed = ${trashed}`];

    if (query) {
      queryParts.push(`(${query})`);
    }

    const params = new URLSearchParams({
      q: queryParts.join(' and '),
      pageSize: pageSize.toString(),
      fields: 'nextPageToken,files(id,name,mimeType,size,quotaBytesUsed,trashed,createdTime,modifiedTime,webViewLink,thumbnailLink,iconLink,owners,shared,parents)',
      orderBy,
      supportsAllDrives: 'true',
      includeItemsFromAllDrives: 'true',
    });

    if (pageToken) {
      params.append('pageToken', pageToken);
    }

    return this.fetchDrive<{ files: DriveFile[]; nextPageToken?: string }>(`/files?${params.toString()}`);
  }

  /**
   * Batch-Aktion: Mehrere Dateien in den Papierkorb verschieben
   */
  public static async batchMoveToTrash(fileIds: string[], onProgress?: (current: number, total: number) => void): Promise<{ success: number; failed: number }> {
    let success = 0;
    let failed = 0;
    const total = fileIds.length;

    for (let i = 0; i < total; i++) {
      try {
        await this.moveToTrash(fileIds[i]);
        success++;
      } catch (err) {
        console.error(`Fehler beim Verschieben in den Papierkorb für Datei ${fileIds[i]}:`, err);
        failed++;
      }
      onProgress?.(i + 1, total);
    }

    return { success, failed };
  }

  /**
   * Batch-Aktion: Mehrere Dateien endgültig löschen
   */
  public static async batchDeletePermanently(fileIds: string[], onProgress?: (current: number, total: number) => void): Promise<{ success: number; failed: number }> {
    let success = 0;
    let failed = 0;
    const total = fileIds.length;

    for (let i = 0; i < total; i++) {
      try {
        await this.deleteFilePermanently(fileIds[i]);
        success++;
      } catch (err) {
        console.error(`Fehler beim endgültigen Löschen von Datei ${fileIds[i]}:`, err);
        failed++;
      }
      onProgress?.(i + 1, total);
    }

    return { success, failed };
  }

  /**
   * Batch-Aktion: Mehrere Dateien aus dem Papierkorb wiederherstellen
   */
  public static async batchRestore(fileIds: string[], onProgress?: (current: number, total: number) => void): Promise<{ success: number; failed: number }> {
    let success = 0;
    let failed = 0;
    const total = fileIds.length;

    for (let i = 0; i < total; i++) {
      try {
        await this.restoreFromTrash(fileIds[i]);
        success++;
      } catch (err) {
        console.error(`Fehler beim Wiederherstellen von Datei ${fileIds[i]}:`, err);
        failed++;
      }
      onProgress?.(i + 1, total);
    }

    return { success, failed };
  }
}
