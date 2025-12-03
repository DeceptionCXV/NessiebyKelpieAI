import { useAuth } from '../../hooks/useAuth';

export const TopBar = ({ activeView, onViewChange, onNewBatchClick }: TopBarProps) => {
  const { profile, signOut, isAdmin } = useAuth();

  const handleSignOut = async () => {
    await signOut();
    window.location.href = '/login';
  };

  return (
    <header className="top-bar">
      {/* Existing header content */}
      
      {/* Add user menu to the right */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: '16px',
        marginLeft: 'auto',
      }}>
        <div style={{
          fontSize: '14px',
          color: 'var(--text-secondary)',
        }}>
          {profile?.first_name} {profile?.last_name}
          {isAdmin && (
            <span style={{
              marginLeft: '8px',
              fontSize: '11px',
              color: 'var(--accent)',
              fontWeight: 600,
            }}>
              (admin)
            </span>
          )}
        </div>
        
        <button
          onClick={handleSignOut}
          style={{
            padding: '6px 12px',
            background: 'transparent',
            border: '1px solid var(--border)',
            borderRadius: '4px',
            fontSize: '13px',
            color: 'var(--text-secondary)',
            cursor: 'pointer',
            transition: 'all 0.2s',
          }}
        >
          Sign Out
        </button>
      </div>
    </header>
  );
};