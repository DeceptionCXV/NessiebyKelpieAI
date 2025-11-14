import type { Batch } from '../../hooks/useBatches';
import type { SuccessfulScrape } from '../../types/nessie';
import { LeadItem } from './LeadItem';

interface BatchCardProps {
  batch: Batch;
  leads: SuccessfulScrape[];
  isActive: boolean;
  activeLeadId: string | null;
  onClick: () => void;
  onLeadClick: (leadId: string) => void;
}

export const BatchCard = ({
  batch,
  leads,
  isActive,
  activeLeadId,
  onClick,
  onLeadClick,
}: BatchCardProps) => {
  const progressPercent = batch.total_urls > 0
    ? (batch.processed_urls / batch.total_urls) * 100
    : 0;

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return `${date.toLocaleDateString()} · ${date.toLocaleTimeString([], {
      hour: '2-digit',
      minute: '2-digit'
    })}`;
  };

  return (
    <div
      className={`batch-card ${isActive ? 'active' : ''}`}
      onClick={onClick}
    >
      <div className="batch-top-row">
        <div>
          <div className="batch-name">{batch.label}</div>
          <div className="batch-meta">
            <span>{batch.total_urls} leads</span>
            <span>Created {formatDate(batch.created_at)}</span>
          </div>
        </div>
        <div className="batch-expand-icon">▾</div>
      </div>

      <div className="batch-meta">
        <span
          className={`batch-pill ${
            batch.status === 'processing' ? 'processing' : ''
          }`}
        >
          {batch.status === 'processing'
            ? `Processing ${batch.processed_urls}/${batch.total_urls}`
            : batch.status === 'complete'
            ? 'Processing complete'
            : 'Pending'}
        </span>
      </div>

      {batch.status === 'processing' && (
        <div className="batch-progress">
          <div
            className="batch-progress-bar"
            style={{ width: `${progressPercent}%` }}
          />
        </div>
      )}

      {leads.length > 0 ? (
        <div className="batch-leads">
          <div className="batch-leads-title">Leads (drag to reorder)</div>
          <ul className="lead-list">
            {leads.map((lead) => (
              <LeadItem
                key={lead.id}
                lead={lead}
                isActive={lead.id === activeLeadId}
                onClick={(e) => {
                  e.stopPropagation();
                  onLeadClick(lead.id);
                }}
              />
            ))}
          </ul>
        </div>
      ) : batch.status === 'processing' ? (
        <div className="batch-leads">
          <div className="batch-empty-processing">
            <div className="emoji">🌊</div>
            Nessie is hunting...
          </div>
        </div>
      ) : null}
    </div>
  );
};
