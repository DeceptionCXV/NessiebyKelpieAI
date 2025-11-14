interface TopBarProps {
  activeView: string;
  onViewChange: (view: string) => void;
}

export const TopBar = ({ activeView, onViewChange }: TopBarProps) => {
  const views = ['Queue', 'Leads', 'Templates', 'Analytics', 'Settings'];

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
        <div className="topbar-user">User · Kelpie AI × Especial</div>
      </div>
    </div>
  );
};
