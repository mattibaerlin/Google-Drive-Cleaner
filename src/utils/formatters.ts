import { FileCategory } from '../types';

/**
 * Formatiert Dateigrößen in lesbare deutsche Einheiten (Byte, KB, MB, GB, TB)
 */
export function formatBytes(bytesInput: number | string | undefined | null): string {
  if (bytesInput === undefined || bytesInput === null || bytesInput === '') {
    return '0 Byte';
  }

  const bytes = typeof bytesInput === 'string' ? parseInt(bytesInput, 10) : bytesInput;

  if (isNaN(bytes) || bytes === 0) {
    return '0 Byte';
  }

  const k = 1024;
  const sizes = ['Byte', 'KB', 'MB', 'GB', 'TB', 'PB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  const index = Math.min(i, sizes.length - 1);

  const value = bytes / Math.pow(k, index);
  // Wenn weniger als 10 und Nachkommastelle existiert -> 2 Nachkommastellen, sonst 1 bzw. 0
  const formattedNumber = value >= 10 || index === 0
    ? value.toLocaleString('de-DE', { maximumFractionDigits: 1 })
    : value.toLocaleString('de-DE', { minimumFractionDigits: 1, maximumFractionDigits: 2 });

  return `${formattedNumber} ${sizes[index]}`;
}

/**
 * Formatiert Datumsangaben im deutschen Format (z.B. "28.02.2025, 14:30 Uhr" oder "vor 3 Tagen")
 */
export function formatDate(dateString?: string): string {
  if (!dateString) return 'Unbekanntes Datum';

  try {
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return 'Ungültiges Datum';

    return date.toLocaleDateString('de-DE', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    }) + ' Uhr';
  } catch {
    return 'Unbekanntes Datum';
  }
}

/**
 * Formatiert relatives Datum (z.B. "Heute", "Gestern", "vor 3 Monaten", "vor 2 Jahren")
 */
export function formatRelativeDate(dateString?: string): string {
  if (!dateString) return '-';

  try {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (diffDays === 0) return 'Heute';
    if (diffDays === 1) return 'Gestern';
    if (diffDays < 30) return `vor ${diffDays} Tagen`;
    if (diffDays < 365) {
      const months = Math.floor(diffDays / 30);
      return `vor ${months} ${months === 1 ? 'Monat' : 'Monaten'}`;
    }
    const years = Math.floor(diffDays / 365);
    return `vor ${years} ${years === 1 ? 'Jahr' : 'Jahren'}`;
  } catch {
    return formatDate(dateString);
  }
}

/**
 * Ordnet Mime-Type und Dateiname einer benutzerfreundlichen deutschen Kategorie zu
 */
export function getFileCategory(mimeType: string = '', name: string = ''): FileCategory {
  const mime = mimeType.toLowerCase();
  const ext = name.split('.').pop()?.toLowerCase() || '';

  if (mime === 'application/vnd.google-apps.folder') {
    return 'ordner';
  }

  if (
    mime.includes('pdf') ||
    ext === 'pdf'
  ) {
    return 'pdf';
  }

  if (
    mime.includes('image/') ||
    ['jpg', 'jpeg', 'png', 'gif', 'svg', 'webp', 'bmp', 'ico', 'heic', 'tiff'].includes(ext)
  ) {
    return 'bilder';
  }

  if (
    mime.includes('video/') ||
    ['mp4', 'mkv', 'avi', 'mov', 'wmv', 'flv', 'webm', 'm4v', '3gp'].includes(ext)
  ) {
    return 'videos';
  }

  if (
    mime.includes('audio/') ||
    ['mp3', 'wav', 'ogg', 'm4a', 'flac', 'aac', 'wma'].includes(ext)
  ) {
    return 'audio';
  }

  if (
    mime.includes('zip') ||
    mime.includes('compressed') ||
    mime.includes('tar') ||
    mime.includes('rar') ||
    mime.includes('7z') ||
    ['zip', 'rar', '7z', 'tar', 'gz', 'bz2', 'iso', 'dmg'].includes(ext)
  ) {
    return 'archive';
  }

  if (
    mime.includes('spreadsheet') ||
    mime.includes('excel') ||
    mime.includes('csv') ||
    ['xls', 'xlsx', 'csv', 'ods'].includes(ext)
  ) {
    return 'tabellen';
  }

  if (
    mime.includes('presentation') ||
    mime.includes('powerpoint') ||
    ['ppt', 'pptx', 'odp'].includes(ext)
  ) {
    return 'praesentationen';
  }

  if (
    mime.includes('document') ||
    mime.includes('word') ||
    mime.includes('text/plain') ||
    ['doc', 'docx', 'odt', 'rtf', 'txt', 'md'].includes(ext)
  ) {
    return 'dokumente';
  }

  if (
    mime.includes('javascript') ||
    mime.includes('json') ||
    mime.includes('html') ||
    mime.includes('xml') ||
    ['js', 'ts', 'jsx', 'tsx', 'py', 'java', 'c', 'cpp', 'html', 'css', 'json', 'xml', 'sh'].includes(ext)
  ) {
    return 'code';
  }

  return 'sonstige';
}

/**
 * Gibt den deutschen Anzeigenamen der Kategorie zurück
 */
export function getCategoryLabel(category: FileCategory): string {
  switch (category) {
    case 'alle': return 'Alle Dateien';
    case 'dokumente': return 'Dokumente';
    case 'tabellen': return 'Tabellen';
    case 'praesentationen': return 'Präsentationen';
    case 'pdf': return 'PDF-Dateien';
    case 'bilder': return 'Bilder & Fotos';
    case 'videos': return 'Videos & Filme';
    case 'audio': return 'Audio & Musik';
    case 'archive': return 'Archive & ZIP / ISO';
    case 'code': return 'Code & Skripte';
    case 'ordner': return 'Ordner';
    case 'sonstige': return 'Sonstige Dateien';
  }
}
