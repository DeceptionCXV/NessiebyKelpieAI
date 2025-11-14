import type { SuccessfulScrape } from '../../types/nessie';

interface LeadItemProps {
  lead: SuccessfulScrape;
  isActive: boolean;
  onClick: () => void;
  onDragStart?: (e: React.DragEvent) => void;
  onDragEnd?: (e: React.DragEvent) => void;
}

export const LeadItem = ({
  lead,
  isActive,
  onClick,
  onDragStart,
  onDragEnd,
}: LeadItemProps) => {
  return (
    <li
      className={`lead-item ${isActive ? 'active' : ''}`}
      draggable
      onDragStart={onDragStart}
      onDragEnd={onDragEnd}
      onClick={onClick}
    >
      <div className="lead-handle">☰</div>
      <div className="lead-main">
        <div className="lead-company">{lead.company || lead.domain}</div>
        <div className="lead-domain">{lead.domain}</div>
      </div>
      <span className="lead-industry-pill">{lead.industry || 'business'}</span>
    </li>
  );
};
