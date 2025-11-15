interface TopBarProps {
  activeView: string;
  onViewChange: (view: string) => void;
  onCreateNewBatch: () => void;
}

export const TopBar = ({ activeView, onViewChange, onCreateNewBatch }: TopBarProps) => {
  const views = ['Queue', 'Analytics', 'Settings'];

  return (
    <div className="topbar">
      <div className="topbar-left">
        <div className="brand">Nessie</div>
        <div className="nessie-pill">Kelpie AI Outreach Console</div>
      </div>
      <div className="topbar-nav">
        {views.map((view) => (
          <span
            key={view}
            className={activeView === view ? 'active' : ''}
            onClick={() => onViewChange(view)}
          >
            {view}
          </span>
        ))}
        <button
          onClick={onCreateNewBatch}
          style={{
            background: 'var(--accent)',
            color: '#021014',
            border: 'none',
            borderRadius: '999px',
            padding: '6px 14px',
            fontSize: '12px',
            fontWeight: 600,
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '4px',
            transition: 'all 0.2s ease',
            marginLeft: '8px'
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.transform = 'translateY(-1px)';
            e.currentTarget.style.boxShadow = '0 4px 12px rgba(17, 194, 210, 0.3)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.transform = 'translateY(0)';
            e.currentTarget.style.boxShadow = 'none';
          }}
          title="Create new batch"
        >
          <span style={{ fontSize: '14px' }}>+</span> New Batch
        </button>
        <div className="topbar-user">User · Kelpie AI × Especial</div>
      </div>
    </div>
  );
};
