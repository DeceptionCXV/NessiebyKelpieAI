export const NessieStatusBar: React.FC<{ userId?: string }> = ({ userId }) => {
  return (
    <div className="fixed bottom-2 right-3 z-50 pointer-events-none">
      <p className="text-[11px] text-gray-400 font-[Space Grotesk] tracking-wide select-none">
        Nessie by Kelpie AI | v0.8.3 | Build #148
        {userId ? ` | User: ${userId}` : ""}
      </p>
    </div>
  );
};