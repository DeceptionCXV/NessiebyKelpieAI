import { useState, useEffect } from 'react';
import { TopBar } from '../components/nessie/TopBar';
import { Sidebar } from '../components/nessie/Sidebar';
import { TabBar } from '../components/nessie/TabBar';
import { LeadDetail } from '../components/nessie/LeadDetail';
import { NotesPanel } from '../components/nessie/NotesPanel';
import { Toast } from '../components/nessie/Toast';
import { AnalyticsPage } from './AnalyticsPage';
import { useBatches } from '../hooks/useBatches';
import { useLeads } from '../hooks/useLeads';
import { useToast } from '../hooks/useToast';
import { useKeyboardShortcuts } from '../hooks/useKeyboardShortcuts';
import type { SuccessfulScrape } from '../types/nessie';
import '../styles/nessie.css';

interface LeadTab {
  leadId: string;
  lead: SuccessfulScrape;
}

export const NessieQueue = () => {
  const [activeView, setActiveView] = useState('Queue');
  const [activeBatchId, setActiveBatchId] = useState<string | null>(null);
  const [activeLeadId, setActiveLeadId] = useState<string | null>(null);
  const [openTabs, setOpenTabs] = useState<LeadTab[]>([]);
  const [leadsByBatch, setLeadsByBatch] = useState<Record<string, SuccessfulScrape[]>>({});
  const [loadingLead, setLoadingLead] = useState(false);

  const { batches, deleteBatch, refreshBatches } = useBatches();
  const { leads } = useLeads(activeBatchId);
  const { toasts, showToast, removeToast } = useToast();

  useEffect(() => {
    if (activeBatchId && leads) {
      console.log('[NessieQueue] Updating leadsByBatch cache. Batch:', activeBatchId, 'Leads count:', leads.length);
      setLeadsByBatch((prev) => ({
        ...prev,
        [activeBatchId]: leads,
      }));
    }
  }, [activeBatchId, leads]);


  const handleCreateNewBatch = () => {
    window.location.hash = '#/queue/new';
  };

  const handleDeleteBatch = async (batchId?: string) => {
    const idToDelete = batchId || activeBatchId;
    if (!idToDelete) return;

    const { error } = await deleteBatch(idToDelete);
    if (error) {
      showToast('Failed to delete batch');
      return;
    }

    // If we deleted the active batch, clear selection
    if (idToDelete === activeBatchId) {
      setActiveBatchId(null);
      setActiveLeadId(null);
    }

    await refreshBatches();
    showToast('Batch deleted');
  };

  useKeyboardShortcuts({
    onCreateBatch: () => {
      handleCreateNewBatch();
      showToast('Create a new batch');
    },
    onSaveNotes: () => {
      if (activeLeadId) {
        showToast('Note saved');
      }
    },
    onNavigateUp: () => {
      if (activeBatchId) {
        const currentLeads = leadsByBatch[activeBatchId] || [];
        const currentIndex = currentLeads.findIndex((l) => l.id === activeLeadId);
        if (currentIndex > 0) {
          openLead(currentLeads[currentIndex - 1], activeBatchId);
        }
      }
    },
    onNavigateDown: () => {
      if (activeBatchId) {
        const currentLeads = leadsByBatch[activeBatchId] || [];
        const currentIndex = currentLeads.findIndex((l) => l.id === activeLeadId);
        if (currentIndex < currentLeads.length - 1 && currentIndex !== -1) {
          openLead(currentLeads[currentIndex + 1], activeBatchId);
        }
      }
    },
    onDeleteBatch: handleDeleteBatch,
  });


  const handleBatchClick = (batchId: string) => {
    console.log('[NessieQueue] Batch clicked:', batchId);
    setActiveBatchId(batchId);

    const batchLeads = leadsByBatch[batchId] || [];
    console.log('[NessieQueue] Leads in cache for batch:', batchLeads.length);

    if (batchLeads.length > 0) {
      if (!batchLeads.find((l) => l.id === activeLeadId)) {
        console.log('[NessieQueue] Opening first lead from batch');
        openLead(batchLeads[0], batchId);
      }
    } else {
      console.log('[NessieQueue] No leads in cache, clearing active lead');
      setActiveLeadId(null);
    }
  };

  const handleLeadClick = (leadId: string, batchId: string) => {
    const lead = leadsByBatch[batchId]?.find((l) => l.id === leadId);
    if (lead) {
      openLead(lead, batchId);
    }
  };

  const openLead = (lead: SuccessfulScrape, batchId: string) => {
    setLoadingLead(true);
    setActiveLeadId(lead.id);
    setActiveBatchId(batchId);

    const existingTab = openTabs.find((t) => t.leadId === lead.id);
    if (!existingTab) {
      setOpenTabs((prev) => [...prev, { leadId: lead.id, lead }]);
    }

    setTimeout(() => {
      setLoadingLead(false);
    }, 200);
  };

  const handleTabClose = (leadId: string) => {
    setOpenTabs((prev) => prev.filter((t) => t.leadId !== leadId));

    if (activeLeadId === leadId) {
      const remainingTabs = openTabs.filter((t) => t.leadId !== leadId);
      if (remainingTabs.length > 0) {
        const lastTab = remainingTabs[remainingTabs.length - 1];
        setActiveLeadId(lastTab.leadId);
      } else {
        setActiveLeadId(null);
      }
    }
  };

  const currentLead = activeLeadId
    ? Object.values(leadsByBatch)
        .flat()
        .find((l) => l.id === activeLeadId)
    : null;

  const currentBatch = batches.find((b) => b.id === activeBatchId);

  return (
    <div>
      <link
        href="https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@400;500;600;700&family=Playfair+Display:wght@500;600&display=swap"
        rel="stylesheet"
      />

      <TopBar
        activeView={activeView}
        onViewChange={setActiveView}
        onNewBatchClick={handleCreateNewBatch}
      />

      {activeView === 'Analytics' ? (
        <AnalyticsPage
          onNavigateToBatch={(batchId) => {
            setActiveView('Queue');
            handleBatchClick(batchId);
          }}
        />
      ) : activeView === 'Settings' ? (
        <div style={{ padding: '40px', color: 'var(--text)' }}>
          <div style={{ fontSize: '32px', fontFamily: 'Playfair Display, serif', marginBottom: '32px', fontWeight: 600 }}>
            Settings
          </div>
          <div style={{ color: 'var(--text-secondary)' }}>Settings page coming soon...</div>
        </div>
      ) : (
        <div className="layout">
          <Sidebar
            batches={batches}
            leadsByBatch={leadsByBatch}
            activeBatchId={activeBatchId}
            activeLeadId={activeLeadId}
            onBatchClick={handleBatchClick}
            onLeadClick={handleLeadClick}
            onToast={showToast}
            onCreateNewBatch={handleCreateNewBatch}
            onRefreshBatches={refreshBatches}
            onDeleteBatch={handleDeleteBatch}
          />

          <main className="main">
            <TabBar
              tabs={openTabs}
              activeLeadId={activeLeadId}
              onTabClick={(leadId) => {
                setActiveLeadId(leadId);
                setLoadingLead(true);
                setTimeout(() => setLoadingLead(false), 150);
              }}
              onTabClose={handleTabClose}
            />

            <div className="content">
              <section className="content-main">
                <LeadDetail
                  lead={currentLead}
                  batch={currentBatch || null}
                  loading={loadingLead}
                  onToast={showToast}
                />
              </section>

              {currentLead && (
                <NotesPanel
                  lead={currentLead}
                  onSave={() => {}}
                  onToast={showToast}
                />
              )}
            </div>
          </main>
        </div>
      )}

      {toasts.map((toast) => (
        <Toast
          key={toast.id}
          message={toast.message}
          onClose={() => removeToast(toast.id)}
        />
      ))}
    </div>
  );
};