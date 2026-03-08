
interface SheetTabsProps {
  sheets: string[];
  active: string;
  onSelect: (s: string) => void;
}

export function SheetTabs({ sheets, active, onSelect }: SheetTabsProps) {
  return (
    <div
      style={{
        display: 'flex',
        borderBottom: '2px solid var(--md-sys-color-outline-variant)',
        gap: 0,
      }}
    >
      {sheets.map((s) => {
        const isActive = s === active;
        return (
          <button
            key={s}
            type="button"
            onClick={() => onSelect(s)}
            style={{
              padding: '10px 20px',
              border: 'none',
              borderBottom: isActive
                ? '3px solid var(--md-sys-color-primary)'
                : '3px solid transparent',
              background: 'transparent',
              cursor: 'pointer',
              fontFamily: 'inherit',
              fontSize: '0.875rem',
              fontWeight: isActive ? 600 : 400,
              color: isActive
                ? 'var(--md-sys-color-primary)'
                : 'var(--md-sys-color-on-surface-variant)',
              transition: 'color 0.15s, border-color 0.15s',
              marginBottom: '-2px',
              whiteSpace: 'nowrap',
              textTransform: 'capitalize',
            }}
          >
            {s}
          </button>
        );
      })}
    </div>
  );
}
