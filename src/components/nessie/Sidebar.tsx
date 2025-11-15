import { useState } from 'react';
import type { Batch } from '../../hooks/useBatches';
import type { SuccessfulScrape } from '../../types/nessie';
import { BatchCard } from './BatchCard';

interface SidebarProps {
  batches: Batch[];
  leadsByBatch: Record<string, SuccessfulScrape[]>;
  activeBatchId: string | null;
  activeLeadId: string | null;
  onBatchClick: (batchId: string) => void;
  onLeadClick: (leadId: string, batchId: string) => void;
  onToast: (message: string) => void;
  onCreateNewBatch: () => void;
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
}: SidebarProps) => {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [expandedBatches, setExpandedBatches] = useState<Set<string>>(new Set());

  console.log('Sidebar rendering with batches:', batches);

  const handleToggle = () => {
    setIsCollapsed(!isCollapsed);
    onToast(isCollapsed ? 'Sidebar expanded' : 'Sidebar collapsed');
  };

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
            onClick={handleToggle}
            title="Collapse sidebar"
          >
            ☰
          </button>
        </div>
      </div>

      <div className="batch-list">
        {batches.length === 0 ? (
          <div className="empty-sidebar">
            No batches yet. Create a batch on the right to let Nessie hunt.
          </div>
        ) : (
          batches.map((batch) => (
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
    </aside>
  );
};
