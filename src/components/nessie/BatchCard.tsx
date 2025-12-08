import type { Batch } from '../../hooks/useBatches';
import type { SuccessfulScrape } from '../../types/nessie';
import { ChevronRight, ChevronDown, AlertTriangle } from 'lucide-react';
import { useState } from 'react';

interface BatchCardProps {
  batch: Batch;
  leads: SuccessfulScrape[];
  isActive: boolean;
  isExpanded: boolean;
  isSelected: boolean;
  activeLeadId: string | null;
  onClick: () => void;
  onToggleExpand: () => void;
  onLeadClick: (leadId: string) => void;
  onSelect: (e: React.MouseEvent) => void;
}

export const BatchCard = ({
  batch,
  leads,
  isActive,
  isExpanded,
  isSelected,
  activeLeadId,
  onClick,
  onToggleExpand,
  onLeadClick,
  onSelect,
}: BatchCardProps) => {
  const [isHovered, setIsHovered] = useState(false);
  
  // Use actual_processed if available, fallback to successful leads count
  const successfulCount = batch.successful_count || leads.length;
  const failedCount = batch.failed_count || 0;
  const actualProcessed = batch.actual_processed || successfulCount;
  
  // Calculate status based on actual processed count
  const isComplete = actualProcessed >= batch.total_urls || batch.status === 'complete';
  const isProcessing = actualProcessed > 0 && !isComplete;
  const status = isComplete ? 'complete' : isProcessing ? 'processing' : 'pending';

  // Format date with time
  const formatDateTime = (dateString: string) => {
    const date = new Date(dateString);
    const dateStr = date.toLocaleDateString('en-GB', { 
      day: '2-digit', 
      month: '2-digit', 
      year: 'numeric' 
    });
    const timeStr = date.toLocaleTimeString('en-GB', { 
      hour: '2-digit', 
      minute: '2-digit',
      hour12: false
    });
    return `${dateStr} ${timeStr}`;
  };

  const handleBatchClick = (e: React.MouseEvent) => {
    if ((e.target as HTMLElement).closest('.batch-toggle') || 
        (e.target as HTMLElement).closest('.batch-checkbox')) {
      return;
    }
    onClick();
  };

  const handleBatchDoubleClick = (e: React.MouseEvent) => {
    if ((e.target as HTMLElement).closest('.batch-toggle') || 
        (e.target as HTMLElement).closest('.batch-checkbox')) {
      return;
    }
    onToggleExpand();
  };

  const handleToggleClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    onToggleExpand();
  };

  const handleCheckboxClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    onSelect(e);
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
          userSelect: 'none',
          background: isSelected
            ? 'rgba(20, 184, 166, 0.15)'
            : isActive 
            ? 'rgba(20, 184, 166, 0.1)' 
            : isHovered 
            ? 'rgba(255, 255, 255, 0.05)' 
            : 'transparent',
          border: isSelected 
            ? '1px solid rgba(20, 184, 166, 0.5)'
            : isActive 
            ? '1px solid rgba(20, 184, 166, 0.3)' 
            : '1px solid transparent',
          transition: 'all 0.2s',
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: '8px' }}>
          <div style={{ display: 'flex', alignItems: 'start', gap: '10px', flex: 1, minWidth: 0 }}>
            {/* Checkbox */}
            <div
              className="batch-checkbox"
              onClick={handleCheckboxClick}
              style={{
                width: '16px',
                height: '16px',
                marginTop: '2px',
                borderRadius: '3px',
                border: isSelected 
                  ? '2px solid var(--accent)' 
                  : '2px solid rgba(148, 163, 184, 0.4)',
                background: isSelected ? 'var(--accent)' : 'transparent',
                cursor: 'pointer',
                flexShrink: 0,
                transition: 'all 0.2s',
                opacity: isHovered || isSelected ? 1 : 0,
                pointerEvents: isHovered || isSelected ? 'auto' : 'none',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              {isSelected && (
                <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
                  <path
                    d="M1 5L4 8L9 2"
                    stroke="#021014"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              )}
            </div>

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
                <span>{successfulCount} leads</span>
                <span>•</span>
                <span>{formatDateTime(batch.created_at)}</span>
              </div>
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

            {successfulCount > 0 && (
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
                {actualProcessed}/{batch.total_urls} processed
              </div>
              <div style={{
                fontSize: '11px',
                color: 'var(--text-secondary)',
              }}>
                {successfulCount} success • {failedCount} failed
              </div>
            </div>
          </div>
        )}

        {/* Complete indicator with failed scrapes warning */}
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
              display: 'flex',
              alignItems: 'center',
              gap: '4px',
            }}>
              <span>{successfulCount} success • {failedCount} failed</span>
            </div>
            
            {/* Failed scrapes warning */}
            {failedCount > 0 && (
              <div style={{
                marginTop: '6px',
                padding: '6px 8px',
                borderRadius: '4px',
                background: 'rgba(251, 191, 36, 0.1)',
                border: '1px solid rgba(251, 191, 36, 0.2)',
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
              }}>
                <AlertTriangle size={12} color="rgb(251, 191, 36)" />
                <span style={{
                  fontSize: '11px',
                  color: 'rgb(251, 191, 36)',
                  fontWeight: 500,
                }}>
                  {failedCount} {failedCount === 1 ? 'scrape' : 'scrapes'} need attention
                </span>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Lead list */}
      {isExpanded && successfulCount > 0 && (
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