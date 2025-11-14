import type { SuccessfulScrape } from '../../types/nessie';

interface LeadTab {
  leadId: string;
  lead: SuccessfulScrape;
}

interface TabBarProps {
  tabs: LeadTab[];
  activeLeadId: string | null;
  onTabClick: (leadId: string) => void;
  onTabClose: (leadId: string) => void;
}

export const TabBar = ({
  tabs,
  activeLeadId,
  onTabClick,
  onTabClose,
}: TabBarProps) => {
  if (tabs.length === 0) return null;

  return (
    <div className="tab-bar">
      {tabs.map((tab) => (
        <div
          key={tab.leadId}
          className={`tab ${tab.leadId === activeLeadId ? 'active' : ''}`}
          onClick={() => onTabClick(tab.leadId)}
        >
          <span>{tab.lead.company || tab.lead.domain || 'Lead'}</span>
          <span
            className="tab-close"
            onClick={(e) => {
              e.stopPropagation();
              onTabClose(tab.leadId);
            }}
          >
            ×
          </span>
        </div>
      ))}
    </div>
  );
};
