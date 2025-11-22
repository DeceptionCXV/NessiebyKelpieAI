import { useState, useMemo } from 'react';
import type { Batch } from '../../hooks/useBatches';
import type { SuccessfulScrape } from '../../types/nessie';
import { BatchCard } from './BatchCard';
import { ConfirmDialog } from './ConfirmDialog';
import { Search, RefreshCw, Trash2 } from 'lucide-react';

interface SidebarProps {
  batches: Batch[];
  leadsByBatch: Record<string, SuccessfulScrape[]>;
  activeBatchId: string | null;
  activeLeadId: string | null;
  onBatchClick: (batchId: string) => void;
  onLeadClick: (leadId: string, batchId: string) => void;
  onToast: (message: string) => void;
  onCreateNewBatch: () => void;
  onRefreshBatches: () => Promise<void>;
  onDeleteBatch: (batchId: string) => Promise<void>;
}

export const Sidebar = ({
  batches,
  leadsByBatch,
  activeBatchId,
  activeLeadId,
  onBatchClick,
  onLeadClick,
  onToast,
  onCreateNewBatch,
  onRefreshBatches,
  onDeleteBatch,
}: SidebarProps) => {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [expandedBatches, setExpandedBatches] = useState<Set<string>>(new Set());
  const [searchQuery, setSearchQuery] = useState('');
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);

  console.log('Sidebar rendering with batches:', batches);

  const handleToggle = () => {
    setIsCollapsed(!isCollapsed);
    onToast(isCollapsed ? 'Sidebar expanded' : 'Sidebar collapsed');
  };

  const handleRefresh = async () => {
    setIsRefreshing(true);
    try {
      await onRefreshBatches();
      onToast('Batches refreshed');
    } catch (error) {
      onToast('Failed to refresh batches');
    } finally {
      setIsRefreshing(false);
    }
  };

  const handleDeleteClick = () => {
    if (!activeBatchId) return;
    setShowDeleteDialog(true);
  };

  const handleDeleteConfirm = async () => {
    if (!activeBatchId) return;
    setShowDeleteDialog(false);
    try {
      await onDeleteBatch(activeBatchId);
      onToast('Batch deleted');
    } catch (error) {
      onToast('Failed to delete batch');
    }
  };

  const activeBatch = batches.find((b) => b.id === activeBatchId);
  const leadCount = activeBatch ? (leadsByBatch[activeBatch.id] || []).length : 0;

  const handleBatchToggle = (batchId: string) => {
    setExpandedBatches((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(batchId)) {
        newSet.delete(batchId);
      } else {
        newSet.add(batchId);
      }
      return newSet;
    });
  };

  const handleLeadClickWithExpand = (leadId: string) => {
    const batchId = batches.find(b =>
      (leadsByBatch[b.id] || []).some(l => l.id === leadId)
    )?.id;

    if (batchId && !expandedBatches.has(batchId)) {
      setExpandedBatches((prev) => new Set(prev).add(batchId));
    }

    if (batchId) {
      onLeadClick(leadId, batchId);
    }
  };

  const handleBatchClickWithExpand = (batchId: string) => {
    if (!expandedBatches.has(batchId)) {
      setExpandedBatches((prev) => new Set(prev).add(batchId));
    }
    onBatchClick(batchId);
  };

  const filteredBatches = useMemo(() => {
    if (!searchQuery.trim()) {
      return batches;
    }

    const query = searchQuery.toLowerCase().trim();

    return batches.filter((batch) => {
      if (batch.label.toLowerCase().includes(query)) {
        return true;
      }

      const leads = leadsByBatch[batch.id] || [];
      return leads.some((lead) => {
        const websiteMatch = lead.website?.toLowerCase().includes(query);
        const domainMatch = lead.domain?.toLowerCase().includes(query);
        const companyMatch = lead.company?.toLowerCase().includes(query);
        const industryMatch = lead.industry?.toLowerCase().includes(query);

        const emailsArray = Array.isArray(lead.emails) ? lead.emails : [];
        const emailMatch = emailsArray.some((email: string) =>
          email.toLowerCase().includes(query)
        );

        return websiteMatch || domainMatch || companyMatch || industryMatch || emailMatch;
      });
    });
  }, [batches, leadsByBatch, searchQuery]);

  return (
    <aside className={`sidebar ${isCollapsed ? 'collapsed' : ''}`}>
      <div className="sidebar-header">
        <div className="sidebar-title">Batches</div>
        <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
          <button
            className="sidebar-toggle"
            onClick={() => {
              onCreateNewBatch();
              onToast('Create a new batch');
            }}
            title="Create new batch"
            style={{ background: 'var(--accent)', color: '#021014', fontWeight: 600 }}
          >
            +
          </button>
          <button
            className="sidebar-toggle"
            onClick={handleRefresh}
            title="Refresh batches"
            disabled={isRefreshing}
            style={{
              opacity: isRefreshing ? 0.5 : 1,
              cursor: isRefreshing ? 'not-allowed' : 'pointer',
            }}
          >
            <RefreshCw size={14} style={{ animation: isRefreshing ? 'spin 1s linear infinite' : 'none' }} />
          </button>
          <button
            className="sidebar-toggle"
            onClick={handleDeleteClick}
            title="Delete batch (Del)"
            disabled={!activeBatchId}
            style={{
              opacity: !activeBatchId ? 0.3 : 1,
              cursor: !activeBatchId ? 'not-allowed' : 'pointer',
            }}
          >
            <Trash2 size={14} />
          </button>
          <button
            className="sidebar-toggle"
            onClick={handleToggle}
            title="Collapse sidebar"
          >
            ☰
          </button>
        </div>
      </div>

      <div style={{ padding: '12px 16px', borderBottom: '1px solid var(--border)' }}>
        <div style={{ position: 'relative' }}>
          <Search
            size={16}
            style={{
              position: 'absolute',
              left: '10px',
              top: '50%',
              transform: 'translateY(-50%)',
              color: 'var(--text-secondary)',
              pointerEvents: 'none',
            }}
          />
          <input
            type="text"
            placeholder="Search batches, websites, emails..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            style={{
              width: '100%',
              padding: '8px 12px 8px 32px',
              background: 'rgba(255, 255, 255, 0.05)',
              border: '1px solid var(--border)',
              borderRadius: '6px',
              color: 'var(--text)',
              fontSize: '13px',
              outline: 'none',
              transition: 'all 0.2s ease',
            }}
            onFocus={(e) => {
              e.currentTarget.style.background = 'rgba(255, 255, 255, 0.08)';
              e.currentTarget.style.borderColor = 'var(--accent)';
            }}
            onBlur={(e) => {
              e.currentTarget.style.background = 'rgba(255, 255, 255, 0.05)';
              e.currentTarget.style.borderColor = 'var(--border)';
            }}
          />
        </div>
      </div>

      <div className="batch-list">
        {batches.length === 0 ? (
          <div className="empty-sidebar">
            No batches yet. Create a batch on the right to let Nessie hunt.
          </div>
        ) : filteredBatches.length === 0 ? (
          <div className="empty-sidebar">
            No results found for "{searchQuery}"
          </div>
        ) : (
          filteredBatches.map((batch) => (
            <BatchCard
              key={batch.id}
              batch={batch}
              leads={leadsByBatch[batch.id] || []}
              isActive={batch.id === activeBatchId}
              isExpanded={expandedBatches.has(batch.id)}
              activeLeadId={activeLeadId}
              onClick={() => handleBatchClickWithExpand(batch.id)}
              onToggleExpand={() => handleBatchToggle(batch.id)}
              onLeadClick={(leadId) => handleLeadClickWithExpand(leadId)}
            />
          ))
        )}
      </div>

      {showDeleteDialog && activeBatch && (
        <ConfirmDialog
          title="Delete Batch"
          message={`Are you sure you want to delete this batch? This will also delete all ${leadCount} leads associated with it. This action cannot be undone.`}
          confirmText="Delete"
          cancelText="Cancel"
          isDestructive={true}
          onConfirm={handleDeleteConfirm}
          onCancel={() => setShowDeleteDialog(false)}
        />
      )}

      <style>{`
        @keyframes spin {
          from {
            transform: rotate(0deg);
          }
          to {
            transform: rotate(360deg);
          }
        }
      `}</style>
    </aside>
  );
};
