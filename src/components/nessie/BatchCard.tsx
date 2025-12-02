import type { Batch } from '../../hooks/useBatches';
import type { SuccessfulScrape } from '../../types/nessie';
import { ChevronRight, ChevronDown } from 'lucide-react';
import { useState } from 'react';

interface BatchCardProps {
  batch: Batch;
  leads: SuccessfulScrape[];
  isActive: boolean;
  isExpanded: boolean;
  activeLeadId: string | null;
  onClick: () => void;
  onToggleExpand: () => void;
  onLeadClick: (leadId: string) => void;
}

export const BatchCard = ({
  batch,
  leads,
  isActive,
  isExpanded,
  activeLeadId,
  onClick,
  onToggleExpand,
  onLeadClick,
}: BatchCardProps) => {
  const [isHovered, setIsHovered] = useState(false);
  const leadsCount = leads.length;
  
  // Calculate status based on processed count
  const isComplete = batch.processed_urls >= batch.total_urls;
  const isProcessing = batch.processed_urls > 0 && !isComplete;
  const status = isComplete ? 'complete' : isProcessing ? 'processing' : 'pending';

  const handleBatchClick = (e: React.MouseEvent) => {
    // Don't trigger on chevron click
    if ((e.target as HTMLElement).closest('.batch-toggle')) {
      return;
    }
    onClick();
  };

  const handleBatchDoubleClick = (e: React.MouseEvent) => {
    // Don't trigger on chevron double-click
    if ((e.target as HTMLElement).closest('.batch-toggle')) {
      return;
    }
    onToggleExpand();
  };

  const handleToggleClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    onToggleExpand();
  };

  return (
    <div className="batch-card-wrapper">
      <div
        className={`batch-card ${isActive ? 'active' : ''}`}
        onClick={handleBatchClick}
        onDoubleClick={handleBatchDoubleClick}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        style={{
          padding: '12px 16px',
          borderRadius: '8px',
          cursor: 'pointer',
          marginBottom: '8px',
          background: isActive 
            ? 'rgba(20, 184, 166, 0.1)' 
            : isHovered 
            ? 'rgba(255, 255, 255, 0.05)' 
            : 'transparent',
          border: isActive ? '1px solid rgba(20, 184, 166, 0.3)' : '1px solid transparent',
          transition: 'all 0.2s',
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: '8px' }}>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{
              fontSize: '14px',
              fontWeight: 500,
              color: 'var(--text)',
              marginBottom: '4px',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
            }}>
              {batch.label}
            </div>
            <div style={{
              fontSize: '12px',
              color: 'var(--text-secondary)',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
            }}>
              <span>{leadsCount} leads</span>
              <span>•</span>
              <span>{new Date(batch.created_at).toLocaleDateString()}</span>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <div
              style={{
                padding: '4px 8px',
                borderRadius: '4px',
                fontSize: '10px',
                fontWeight: 600,
                letterSpacing: '0.5px',
                whiteSpace: 'nowrap',
                background:
                  status === 'complete'
                    ? 'rgba(34, 197, 94, 0.1)'
                    : status === 'processing'
                    ? 'rgba(251, 191, 36, 0.1)'
                    : 'rgba(100, 116, 139, 0.1)',
                color:
                  status === 'complete'
                    ? 'rgb(34, 197, 94)'
                    : status === 'processing'
                    ? 'rgb(251, 191, 36)'
                    : 'rgb(148, 163, 184)',
              }}
            >
              {status.toUpperCase()}
            </div>

            {leadsCount > 0 && (
              <button
                className="batch-toggle"
                onClick={handleToggleClick}
                style={{
                  background: 'transparent',
                  border: 'none',
                  color: 'var(--text-secondary)',
                  cursor: 'pointer',
                  padding: '4px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  borderRadius: '4px',
                  transition: 'all 0.2s',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = 'rgba(255, 255, 255, 0.1)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = 'transparent';
                }}
              >
                {isExpanded ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
              </button>
            )}
          </div>
        </div>

        {/* Progress indicator for processing batches */}
        {status === 'processing' && (
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            marginTop: '8px',
            paddingTop: '8px',
            borderTop: '1px solid rgba(148, 163, 184, 0.1)',
          }}>
            <div className="batch-spinner" />
            <div style={{ flex: 1 }}>
              <div style={{
                fontSize: '12px',
                color: 'rgb(251, 191, 36)',
                fontWeight: 500,
                marginBottom: '2px',
              }}>
                {batch.processed_urls || 0}/{batch.total_urls} processed
              </div>
              {(batch.successful_count > 0 || batch.failed_count > 0) && (
                <div style={{
                  fontSize: '11px',
                  color: 'var(--text-secondary)',
                }}>
                  {batch.successful_count || 0} success • {batch.failed_count || 0} failed
                </div>
              )}
            </div>
          </div>
        )}

        {/* Complete indicator */}
        {status === 'complete' && (
          <div style={{
            marginTop: '8px',
            paddingTop: '8px',
            borderTop: '1px solid rgba(148, 163, 184, 0.1)',
          }}>
            <div style={{
              fontSize: '12px',
              color: 'rgb(34, 197, 94)',
              fontWeight: 500,
              marginBottom: '2px',
            }}>
              ✓ All {batch.total_urls} URLs processed
            </div>
            <div style={{
              fontSize: '11px',
              color: 'var(--text-secondary)',
            }}>
              {batch.successful_count || 0} success • {batch.failed_count || 0} failed
            </div>
          </div>
        )}
      </div>

      {/* Lead list */}
      {isExpanded && leadsCount > 0 && (
        <div style={{ marginLeft: '16px', marginBottom: '8px' }}>
          {leads.map((lead) => (
            <div
              key={lead.id}
              className={`lead-item ${activeLeadId === lead.id ? 'active' : ''}`}
              onClick={(e) => {
                e.stopPropagation();
                onLeadClick(lead.id);
              }}
              style={{
                padding: '8px 12px',
                borderRadius: '6px',
                cursor: 'pointer',
                marginBottom: '4px',
                background: activeLeadId === lead.id ? 'rgba(20, 184, 166, 0.15)' : 'rgba(255, 255, 255, 0.02)',
                border: activeLeadId === lead.id ? '1px solid rgba(20, 184, 166, 0.4)' : '1px solid transparent',
                transition: 'all 0.2s',
              }}
              onMouseEnter={(e) => {
                if (activeLeadId !== lead.id) {
                  e.currentTarget.style.background = 'rgba(255, 255, 255, 0.05)';
                }
              }}
              onMouseLeave={(e) => {
                if (activeLeadId !== lead.id) {
                  e.currentTarget.style.background = 'rgba(255, 255, 255, 0.02)';
                }
              }}
            >
              <div style={{
                fontSize: '13px',
                fontWeight: 500,
                color: 'var(--text)',
                marginBottom: '2px',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap',
              }}>
                {lead.company || lead.website || 'Unknown'}
              </div>
              <div style={{
                fontSize: '11px',
                color: 'var(--text-secondary)',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap',
              }}>
                {lead.website}
              </div>
            </div>
          ))}
        </div>
      )}

      <style>{`
        @keyframes spin {
          to { transform: rotate(360deg); }
        }

        .batch-spinner {
          width: 12px;
          height: 12px;
          border: 2px solid rgba(251, 191, 36, 0.2);
          border-top-color: rgb(251, 191, 36);
          border-radius: 50%;
          animation: spin 0.8s linear infinite;
          flex-shrink: 0;
        }
      `}</style>
    </div>
  );
};