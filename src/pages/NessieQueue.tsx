import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { TopBar } from '../components/nessie/TopBar';
import { Sidebar } from '../components/nessie/Sidebar';
import { TabBar } from '../components/nessie/TabBar';
import { LeadDetail } from '../components/nessie/LeadDetail';
import { NotesPanel } from '../components/nessie/NotesPanel';
import { Toast } from '../components/nessie/Toast';
import { AnalyticsPage } from './AnalyticsPage';
import LeadsTable from '../components/nessie/LeadsTable';
import { useBatches } from '../hooks/useBatches';
import { useLeads } from '../hooks/useLeads';
import { useToast } from '../hooks/useToast';
import { useKeyboardShortcuts } from '../hooks/useKeyboardShortcuts';
import type { SuccessfulScrape } from '../hooks/useLeads';
import '../styles/nessie.css';

interface LeadTab {
  leadId: string;
  lead: SuccessfulScrape;
}

export const NessieQueue = () => {
  const [activeView, setActiveView] = useState('Queue');
  const [activeBatchId, setActiveBatchId] = useState<string | null>(null);
  const [activeLeadId, setActiveLeadId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'all' | 'failed'>('all'); // NEW: Track which tab in LeadsTable
  const [openTabs, setOpenTabs] = useState<LeadTab[]>([]);
  const [leadsByBatch, setLeadsByBatch] = useState<Record<string, SuccessfulScrape[]>>({});
  const [loadingLead, setLoadingLead] = useState(false);

  const navigate = useNavigate();

  const { batches, deleteBatch, refreshBatches } = useBatches();
  const { leads, updateLead, deleteLead } = useLeads(activeBatchId);
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
    navigate('/queue/new');
  };

  const handleDeleteBatch = async (batchId?: string) => {
    console.log('🗑️ DELETE CALLED with batchId:', batchId);
    console.log('🗑️ activeBatchId:', activeBatchId);
    
    const idToDelete = batchId || activeBatchId;
    console.log('🗑️ Will delete:', idToDelete);
    
    if (!idToDelete) {
      console.log('❌ No batch ID to delete!');
      return;
    }

    const { error } = await deleteBatch(idToDelete);
    
    console.log('🗑️ Delete result - Error:', error);
    
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

  // NEW: Handle lead updates (status, tags, etc.)
  const handleLeadUpdate = async (leadId: string, updates: Partial<SuccessfulScrape>) => {
    console.log('[NessieQueue] Updating lead:', leadId, updates);
    
    const { error } = await updateLead(leadId, updates);
    
    if (error) {
      showToast('Failed to update lead');
      console.error('Error updating lead:', error);
      return;
    }

    // Update the lead in tabs if it's open
    setOpenTabs((prev) =>
      prev.map((tab) =>
        tab.leadId === leadId
          ? { ...tab, lead: { ...tab.lead, ...updates } }
          : tab
      )
    );

    // Update leadsByBatch cache
    if (activeBatchId) {
      setLeadsByBatch((prev) => ({
        ...prev,
        [activeBatchId]: (prev[activeBatchId] || []).map((lead) =>
          lead.id === leadId ? { ...lead, ...updates } : lead
        ),
      }));
    }
  };

  // NEW: Handle lead deletion
  const handleLeadDelete = async (leadId: string) => {
    console.log('[NessieQueue] Deleting lead:', leadId);
    
    const { error } = await deleteLead(leadId);
    
    if (error) {
      showToast('Failed to delete lead');
      console.error('Error deleting lead:', error);
      return;
    }

    // Close the tab if it's open
    setOpenTabs((prev) => prev.filter((tab) => tab.leadId !== leadId));

    // If this was the active lead, select another one
    if (activeLeadId === leadId && activeBatchId) {
      const remainingLeads = leadsByBatch[activeBatchId]?.filter((l) => l.id !== leadId) || [];
      if (remainingLeads.length > 0) {
        openLead(remainingLeads[0], activeBatchId);
      } else {
        setActiveLeadId(null);
      }
    }

    // Update leadsByBatch cache
    if (activeBatchId) {
      setLeadsByBatch((prev) => ({
        ...prev,
        [activeBatchId]: (prev[activeBatchId] || []).filter((lead) => lead.id !== leadId),
      }));
    }

    showToast('Lead deleted');
  };

  // NEW: Handle lead navigation (prev/next)
  const handleLeadNavigate = (direction: 'prev' | 'next') => {
    if (!activeBatchId) return;

    const currentLeads = leadsByBatch[activeBatchId] || [];
    const currentIndex = currentLeads.findIndex((l) => l.id === activeLeadId);

    if (currentIndex === -1) return;

    let newIndex: number;
    if (direction === 'prev') {
      newIndex = currentIndex > 0 ? currentIndex - 1 : currentIndex;
    } else {
      newIndex = currentIndex < currentLeads.length - 1 ? currentIndex + 1 : currentIndex;
    }

    if (newIndex !== currentIndex) {
      openLead(currentLeads[newIndex], activeBatchId);
    }
  };

  // NEW: Handle opening failed tab from batch card warning
  const handleOpenFailedTab = (batchId: string) => {
    console.log('Opening failed tab for batch:', batchId);
    setActiveBatchId(batchId);
    setActiveTab('failed'); // Switch to failed tab
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
    onNavigateUp: () => handleLeadNavigate('prev'),
    onNavigateDown: () => handleLeadNavigate('next'),
    onDeleteBatch: handleDeleteBatch,
  });


  const handleBatchClick = (batchId: string) => {
    console.log('[NessieQueue] Batch clicked:', batchId);
    setActiveBatchId(batchId);
    setActiveTab('all'); // NEW: Reset to "all" tab when clicking batch normally

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

  // Get all leads in current batch for navigation
  const allLeadsInBatch = activeBatchId ? (leadsByBatch[activeBatchId] || []) : [];

  return (
    <div>
      <link
        href="https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@400;500;600;700&family=Playfair+Display:wght@500;600&display=swap"
        rel="stylesheet"
      />

      <TopBar
        activeView={activeView}
        onViewChange={setActiveView}
        onCreateNewBatch={handleCreateNewBatch}
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
      ) : activeView === 'Leads' ? (
        /* NEW: Show LeadsTable when Leads view is active */
        <LeadsTable 
          activeBatchId={activeBatchId}
          initialTab={activeTab}
        />
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
            onOpenFailedTab={handleOpenFailedTab} // NEW: Pass handler
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
                  allLeads={allLeadsInBatch}
                  loading={loadingLead}
                  onToast={showToast}
                  onLeadUpdate={handleLeadUpdate}
                  onLeadDelete={handleLeadDelete}
                  onNavigate={handleLeadNavigate}
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