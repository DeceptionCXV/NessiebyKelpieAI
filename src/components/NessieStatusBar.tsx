import { useAuth } from '../hooks/useAuth';

export const NessieStatusBar = () => {
  const { user } = useAuth();
  
  // Get first 8 characters of user ID for display
  const shortUserId = user?.id ? user.id.substring(0, 8) : null;
  
  return (
    <div className="fixed bottom-2 right-3 z-50 pointer-events-none">
      <p className="text-[11px] text-gray-400 font-[Space Grotesk] tracking-wide select-none">
        Nessie by Kelpie AI | v0.8.4 | Build #153
        {shortUserId ? ` | User: ${shortUserId}` : ""}
      </p>
    </div>
  );
};