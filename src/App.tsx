/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useCallback } from 'react';
import confetti from 'canvas-confetti';
import { Header } from './components/Header';
import { StorageOverview } from './components/StorageOverview';
import { CleanupAdvisor } from './components/CleanupAdvisor';
import { TrashManager } from './components/TrashManager';
import { FileManager } from './components/FileManager';
import { ConfirmModal } from './components/ConfirmModal';
import { NotificationToast } from './components/NotificationToast';
import { AuthCard } from './components/AuthCard';
import { GoogleDriveService } from './services/googleDriveService';
import { DriveAbout, DriveFile, ActiveTab, NotificationItem, LoginResult, LoginFailure } from './types';
import { formatBytes } from './utils/formatters';
import { Loader2, RefreshCw } from 'lucide-react';

export default function App() {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [activeTab, setActiveTab] = useState<ActiveTab>('advisor');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [authError, setAuthError] = useState<string | undefined>();

  // Drive Data State
  const [aboutData, setAboutData] = useState<DriveAbout | null>(null);
  const [trashFiles, setTrashFiles] = useState<DriveFile[]>([]);
  const [allFiles, setAllFiles] = useState<DriveFile[]>([]);

  // Notifications State
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);

  // Modal State for Confirmations
  const [confirmModal, setConfirmModal] = useState<{
    isOpen: boolean;
    title: string;
    description: string;
    warningText?: string;
    confirmLabel?: string;
    isDestructive?: boolean;
    isLoading?: boolean;
    progressText?: string;
    onConfirm: () => void;
  }>({
    isOpen: false,
    title: '',
    description: '',
    onConfirm: () => {},
  });

  const addNotification = useCallback((type: NotificationItem['type'], title: string, message: string = '') => {
    const id = Math.random().toString(36).substring(2, 9);
    const newNotif: NotificationItem = { id, type, title, message, timestamp: Date.now() };
    setNotifications(prev => [newNotif, ...prev.slice(0, 4)]);

    setTimeout(() => {
      setNotifications(prev => prev.filter(n => n.id !== id));
    }, 5000);
  }, []);

  const dismissNotification = useCallback((id: string) => {
    setNotifications(prev => prev.filter(n => n.id !== id));
  }, []);

  // Fetch all Google Drive data
  const loadDriveData = useCallback(async () => {
    if (!GoogleDriveService.isAuthenticated()) {
      setIsAuthenticated(false);
      return;
    }

    setIsLoading(true);
    try {
      // 1. Fetch User & Storage Quota
      const about = await GoogleDriveService.getStorageAbout();
      setAboutData(about);
      setIsAuthenticated(true);
      setAuthError(undefined);

      // 2. Fetch Trash Files (trashed = true)
      const trashResponse = await GoogleDriveService.getTrashFiles(100);
      setTrashFiles(trashResponse.files || []);

      // 3. Fetch Active Files (trashed = false)
      const filesResponse = await GoogleDriveService.listFiles({
        pageSize: 100,
        orderBy: 'quotaBytesUsed desc, modifiedTime desc',
      });
      setAllFiles(filesResponse.files || []);
    } catch (err: any) {
      console.error('Fehler beim Laden der Google Drive Daten:', err);
      if (err?.message?.includes('abgelaufen') || err?.message?.includes('nicht authentifiziert')) {
        setIsAuthenticated(false);
        setAuthError(err.message);
      } else {
        addNotification('error', 'Fehler beim Laden der Drive-Daten', err?.message || 'Unbekannter Fehler');
      }
    } finally {
      setIsLoading(false);
    }
  }, [addNotification]);

  // Initial authentication check on load
  useEffect(() => {
    if (GoogleDriveService.isAuthenticated()) {
      loadDriveData();
    }
  }, [loadDriveData]);

  // Login handler
  const handleLogin = async () => {
    setIsLoading(true);
    setAuthError(undefined);
    try {
      const result: LoginResult = await GoogleDriveService.requestGoogleDriveLogin();
      if (result.success) {
        setIsAuthenticated(true);
        addNotification('success', 'Google Drive erfolgreich verbunden', 'Ihre Speicherdaten werden geladen.');
        await loadDriveData();
      } else {
        const failure = result as LoginFailure;
        if (failure.cancelled) {
          // User closed popup; inform quietly without aggressive red error
          addNotification('info', 'Anmeldung abgebrochen', 'Das Google Anmeldefenster wurde geschlossen.');
          return;
        }
        setAuthError(failure.message || 'Authentifizierung fehlgeschlagen.');
        addNotification('error', 'Anmeldefehler', failure.message || 'Verbindung zu Google Drive fehlgeschlagen.');
      }
    } catch (err: any) {
      console.error('Login-Fehler:', err);
      const isCancellation =
        err?.message?.includes('geschlossen') ||
        err?.message?.includes('closed') ||
        err?.code === 'auth/popup-closed-by-user';

      if (isCancellation) {
        addNotification('info', 'Anmeldung abgebrochen', 'Das Anmeldefenster wurde geschlossen.');
      } else {
        setAuthError(err?.message || 'Authentifizierung fehlgeschlagen.');
        addNotification('error', 'Anmeldefehler', err?.message || 'Verbindung zu Google Drive fehlgeschlagen.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  // Manual Token handler
  const handleManualToken = async (token: string) => {
    GoogleDriveService.setToken(token);
    setIsAuthenticated(true);
    addNotification('success', 'Token angewendet', 'Speicherdaten werden abgerufen...');
    await loadDriveData();
  };

  // Logout handler
  const handleLogout = () => {
    GoogleDriveService.clearToken();
    setIsAuthenticated(false);
    setAboutData(null);
    setTrashFiles([]);
    setAllFiles([]);
    addNotification('info', 'Abgemeldet', 'Ihr Google-Konto wurde getrennt.');
  };

  // 1. ACTION: Empty Trash completely
  const handleEmptyTrash = () => {
    const totalTrashBytes = trashFiles.reduce(
      (acc, f) => acc + (parseInt(f.size || f.quotaBytesUsed || '0', 10) || 0),
      0
    );

    setConfirmModal({
      isOpen: true,
      title: 'Gesamten Papierkorb leeren?',
      description: `Möchten Sie alle ${trashFiles.length} Elemente im Papierkorb (${formatBytes(totalTrashBytes)}) unwiderruflich und endgültig löschen?`,
      warningText: 'Diese Aktion kann nicht rückgängig gemacht werden. Der Speicherplatz wird sofort freigegeben.',
      confirmLabel: 'Ja, Papierkorb jetzt leeren',
      isDestructive: true,
      onConfirm: async () => {
        setConfirmModal(prev => ({ ...prev, isLoading: true, progressText: 'Papierkorb wird geleert...' }));
        try {
          await GoogleDriveService.emptyTrash();
          setConfirmModal(prev => ({ ...prev, isOpen: false, isLoading: false }));

          // Celebration confetti
          try {
            confetti({
              particleCount: 80,
              spread: 70,
              origin: { y: 0.6 },
            });
          } catch {
            // ignore
          }

          addNotification(
            'success',
            'Papierkorb erfolgreich geleert!',
            `${formatBytes(totalTrashBytes)} Speicherplatz wurden erfolgreich freigegeben.`
          );

          await loadDriveData();
        } catch (err: any) {
          setConfirmModal(prev => ({ ...prev, isOpen: false, isLoading: false }));
          addNotification('error', 'Fehler beim Leeren des Papierkorbs', err?.message || 'Vorgang fehlgeschlagen.');
        }
      },
    });
  };

  // 2. ACTION: Move multiple files to Trash
  const handleMoveFilesToTrash = (filesToTrash: DriveFile[]) => {
    if (filesToTrash.length === 0) return;

    const totalBytes = filesToTrash.reduce(
      (acc, f) => acc + (parseInt(f.size || f.quotaBytesUsed || '0', 10) || 0),
      0
    );

    setConfirmModal({
      isOpen: true,
      title: `${filesToTrash.length} ${filesToTrash.length === 1 ? 'Datei' : 'Dateien'} in den Papierkorb verschieben?`,
      description: `Möchten Sie ${filesToTrash.length} ${filesToTrash.length === 1 ? 'Datei' : 'Dateien'} (${formatBytes(totalBytes)}) in den Google Drive Papierkorb legen?`,
      warningText: 'Die Dateien können bei Bedarf innerhalb von 30 Tagen aus dem Papierkorb wiederhergestellt werden.',
      confirmLabel: 'In Papierkorb verschieben',
      isDestructive: true,
      onConfirm: async () => {
        setConfirmModal(prev => ({ ...prev, isLoading: true, progressText: 'Dateien werden verschoben...' }));
        try {
          const fileIds = filesToTrash.map(f => f.id);
          const result = await GoogleDriveService.batchMoveToTrash(fileIds, (cur, total) => {
            setConfirmModal(prev => ({ ...prev, progressText: `${cur} von ${total} verschoben...` }));
          });

          setConfirmModal(prev => ({ ...prev, isOpen: false, isLoading: false }));

          if (result.success > 0) {
            addNotification(
              'success',
              `${result.success} ${result.success === 1 ? 'Datei' : 'Dateien'} in den Papierkorb verschoben`,
              result.failed > 0 ? `${result.failed} fehlgeschlagen.` : ''
            );
          } else {
            addNotification('error', 'Fehler', 'Die Dateien konnten nicht verschoben werden.');
          }

          await loadDriveData();
        } catch (err: any) {
          setConfirmModal(prev => ({ ...prev, isOpen: false, isLoading: false }));
          addNotification('error', 'Fehler', err?.message || 'Vorgang fehlgeschlagen.');
        }
      },
    });
  };

  // 3. ACTION: Permanently Delete selected files
  const handleDeletePermanently = (filesToDelete: DriveFile[]) => {
    if (filesToDelete.length === 0) return;

    const totalBytes = filesToDelete.reduce(
      (acc, f) => acc + (parseInt(f.size || f.quotaBytesUsed || '0', 10) || 0),
      0
    );

    setConfirmModal({
      isOpen: true,
      title: `${filesToDelete.length} ${filesToDelete.length === 1 ? 'Datei' : 'Dateien'} unwiderruflich löschen?`,
      description: `Möchten Sie ${filesToDelete.length} ${filesToDelete.length === 1 ? 'Datei' : 'Dateien'} (${formatBytes(totalBytes)}) endgültig löschen?`,
      warningText: 'Achtung: Diese Aktion löscht die Dateien sofort ohne Wiederherstellungsmöglichkeit!',
      confirmLabel: 'Unwiderruflich löschen',
      isDestructive: true,
      onConfirm: async () => {
        setConfirmModal(prev => ({ ...prev, isLoading: true, progressText: 'Dateien werden gelöscht...' }));
        try {
          const fileIds = filesToDelete.map(f => f.id);
          const result = await GoogleDriveService.batchDeletePermanently(fileIds, (cur, total) => {
            setConfirmModal(prev => ({ ...prev, progressText: `${cur} von ${total} gelöscht...` }));
          });

          setConfirmModal(prev => ({ ...prev, isOpen: false, isLoading: false }));

          if (result.success > 0) {
            addNotification(
              'success',
              `${result.success} ${result.success === 1 ? 'Datei' : 'Dateien'} endgültig gelöscht`,
              `${formatBytes(totalBytes)} Speicherplatz wurden freigegeben.`
            );
          }

          await loadDriveData();
        } catch (err: any) {
          setConfirmModal(prev => ({ ...prev, isOpen: false, isLoading: false }));
          addNotification('error', 'Fehler beim endgültigen Löschen', err?.message || 'Vorgang fehlgeschlagen.');
        }
      },
    });
  };

  // 4. ACTION: Restore files from Trash
  const handleRestoreFiles = async (filesToRestore: DriveFile[]) => {
    if (filesToRestore.length === 0) return;

    setIsLoading(true);
    try {
      const fileIds = filesToRestore.map(f => f.id);
      const result = await GoogleDriveService.batchRestore(fileIds);

      if (result.success > 0) {
        addNotification(
          'success',
          `${result.success} ${result.success === 1 ? 'Datei' : 'Dateien'} wiederhergestellt`,
          'Die Dateien befinden sich wieder an ihrem ursprünglichen Speicherort.'
        );
      }

      await loadDriveData();
    } catch (err: any) {
      addNotification('error', 'Fehler beim Wiederherstellen', err?.message || 'Vorgang fehlgeschlagen.');
    } finally {
      setIsLoading(false);
    }
  };

  const trashTotalBytes = trashFiles.reduce(
    (acc, f) => acc + (parseInt(f.size || f.quotaBytesUsed || '0', 10) || 0),
    0
  );

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col font-sans antialiased selection:bg-blue-100 selection:text-blue-900">
      {/* Header */}
      <Header
        user={aboutData?.user}
        activeTab={activeTab}
        trashCount={trashFiles.length}
        isLoading={isLoading}
        onTabChange={setActiveTab}
        onRefresh={loadDriveData}
        onLogout={handleLogout}
        onConnect={handleLogin}
      />

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 space-y-6">
        {!isAuthenticated ? (
          <AuthCard
            onLogin={handleLogin}
            onTokenSubmit={handleManualToken}
            isLoading={isLoading}
            errorMessage={authError}
          />
        ) : (
          <>
            {/* Storage Overview Bar */}
            <StorageOverview
              quota={aboutData?.storageQuota}
              trashSize={trashTotalBytes}
              trashCount={trashFiles.length}
              onOpenTrash={() => setActiveTab('trash')}
              onQuickEmptyTrash={handleEmptyTrash}
            />

            {/* Tab Views */}
            {activeTab === 'advisor' && (
              <CleanupAdvisor
                trashFiles={trashFiles}
                allFiles={allFiles}
                isLoading={isLoading}
                onEmptyTrash={handleEmptyTrash}
                onMoveFilesToTrash={handleMoveFilesToTrash}
                onDeleteFilesPermanently={handleDeletePermanently}
                onNavigateToTab={setActiveTab}
                onRefresh={loadDriveData}
              />
            )}

            {activeTab === 'trash' && (
              <TrashManager
                trashFiles={trashFiles}
                isLoading={isLoading}
                onEmptyTrash={handleEmptyTrash}
                onRestoreFiles={handleRestoreFiles}
                onDeletePermanently={handleDeletePermanently}
                onRefresh={loadDriveData}
              />
            )}

            {activeTab === 'large_files' && (
              <FileManager
                files={allFiles}
                mode="large_only"
                isLoading={isLoading}
                onMoveToTrash={handleMoveFilesToTrash}
                onDeletePermanently={handleDeletePermanently}
                onRefresh={loadDriveData}
              />
            )}

            {activeTab === 'files' && (
              <FileManager
                files={allFiles}
                mode="all"
                isLoading={isLoading}
                onMoveToTrash={handleMoveFilesToTrash}
                onDeletePermanently={handleDeletePermanently}
                onRefresh={loadDriveData}
              />
            )}
          </>
        )}
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-200 bg-white py-6 mt-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-500">
          <p>
            Google Drive Bereinigung • Vollständig auf Deutsch
          </p>
          <div className="flex items-center gap-4">
            <span>Sichere API v3 Verbindung</span>
            <span>•</span>
            <span>Unwiderrufliches Leeren & Speicherfreigabe</span>
          </div>
        </div>
      </footer>

      {/* Confirmation Modal */}
      <ConfirmModal
        isOpen={confirmModal.isOpen}
        title={confirmModal.title}
        description={confirmModal.description}
        warningText={confirmModal.warningText}
        confirmLabel={confirmModal.confirmLabel}
        isDestructive={confirmModal.isDestructive}
        isLoading={confirmModal.isLoading}
        progressText={confirmModal.progressText}
        onConfirm={confirmModal.onConfirm}
        onClose={() => setConfirmModal(prev => ({ ...prev, isOpen: false }))}
      />

      {/* Notifications Toast */}
      <NotificationToast
        notifications={notifications}
        onDismiss={dismissNotification}
      />
    </div>
  );
}
