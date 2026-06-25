import styles from "./import-upload-zone.module.css";

type ImportUploadZoneProps = {
  inputId: string;
  selectedFile: File | null;
  onFileSelect: (file: File | null) => void;
  disabled?: boolean;
};

function formatFileSize(bytes: number): string {
  if (bytes < 1024) {
    return `${bytes} B`;
  }

  if (bytes < 1024 * 1024) {
    return `${(bytes / 1024).toFixed(1)} KB`;
  }

  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export function ImportUploadZone({
  inputId,
  selectedFile,
  onFileSelect,
  disabled = false,
}: ImportUploadZoneProps) {
  return (
    <label
      htmlFor={inputId}
      className={selectedFile ? `${styles.zone} ${styles.zoneHasFile}` : styles.zone}
    >
      <input
        id={inputId}
        className={styles.fileInput}
        type="file"
        accept=".xlsx,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
        disabled={disabled}
        aria-label="Excel file (.xlsx)"
        onChange={(event) => {
          onFileSelect(event.target.files?.[0] ?? null);
        }}
      />

      {selectedFile ? (
        <div className={styles.fileMeta}>
          <p className={styles.fileLabel}>Selected file</p>
          <p className={styles.fileName}>{selectedFile.name}</p>
          <p className={styles.fileSize}>{formatFileSize(selectedFile.size)}</p>
          <span className={styles.changeFile}>Choose a different file</span>
        </div>
      ) : (
        <>
          <span className={styles.icon} aria-hidden="true">
            📄
          </span>
          <p className={styles.title}>Drop an Excel file here, or click to browse</p>
          <p className={styles.hint}>.xlsx spreadsheets only</p>
        </>
      )}
    </label>
  );
}
