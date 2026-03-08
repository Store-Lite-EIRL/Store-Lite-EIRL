const ALLOWED_EXTENSIONS = ['.xlsx', '.xls', '.sql'];

export function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
}

export function validateFile(file: File): { valid: boolean; error?: string } {
  const ext = '.' + file.name.split('.').pop()?.toLowerCase();
  if (!ALLOWED_EXTENSIONS.includes(ext)) {
    return {
      valid: false,
      error: `Tipo no permitido. Solo se aceptan: ${ALLOWED_EXTENSIONS.join(', ')}`,
    };
  }
  if (file.size > 20 * 1024 * 1024) {
    return { valid: false, error: 'El archivo supera el tamaño máximo de 20 MB.' };
  }
  return { valid: true };
}

export type FileStatus = 'idle' | 'valid' | 'invalid';

export interface FileInfo {
  name: string;
  size: string;
  type: string;
  status: FileStatus;
  error?: string;
}

export function buildFileInfo(file: File): FileInfo {
  const validation = validateFile(file);
  const ext = '.' + file.name.split('.').pop()?.toLowerCase();
  const typeLabel = ext === '.sql' ? 'SQL' : 'Excel (XLSX)';
  return {
    name: file.name,
    size: formatBytes(file.size),
    type: typeLabel,
    status: validation.valid ? 'valid' : 'invalid',
    error: validation.error,
  };
}
