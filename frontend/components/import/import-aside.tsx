import styles from "./import-aside.module.css";

type ImportAsideProps = {
  title: string;
  guidance: string[];
  requiredColumns: string[];
  columnsTitle?: string;
};

export function ImportAside({
  title,
  guidance,
  requiredColumns,
  columnsTitle = "Required columns",
}: ImportAsideProps) {
  return (
    <aside className={styles.aside}>
      <h2 className={styles.title}>{title}</h2>
      <ul className={styles.list}>
        {guidance.map((item) => (
          <li key={item}>{item}</li>
        ))}
      </ul>
      <p className={styles.sectionTitle}>{columnsTitle}</p>
      <div className={styles.columns}>
        {requiredColumns.map((column) => (
          <span key={column} className={styles.columnChip}>
            {column}
          </span>
        ))}
      </div>
    </aside>
  );
}
