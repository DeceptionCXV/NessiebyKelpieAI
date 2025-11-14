import { useState, useEffect } from 'react';
import type { SuccessfulScrape } from '../../types/nessie';

interface NotesPanelProps {
  lead: SuccessfulScrape | null;
  onSave: () => void;
  onToast: (message: string) => void;
}

const STATUS_OPTIONS = ['New', 'Contacted', 'Replied', 'Qualified', 'Closed'];

export const NotesPanel = ({ lead, onSave, onToast }: NotesPanelProps) => {
  const [notes, setNotes] = useState('');
  const [status, setStatus] = useState('New');
  const [lastUpdated, setLastUpdated] = useState('just now');

  useEffect(() => {
    if (lead) {
      setNotes('');
      setStatus('New');
      setLastUpdated('just now');
    }
  }, [lead?.id]);

  if (!lead) return null;

  const handleStatusClick = () => {
    const currentIndex = STATUS_OPTIONS.indexOf(status);
    const nextIndex = (currentIndex + 1) % STATUS_OPTIONS.length;
    setStatus(STATUS_OPTIONS[nextIndex]);
    onToast(`Status updated to ${STATUS_OPTIONS[nextIndex]}`);
  };

  const handleSave = () => {
    setLastUpdated('just now');
    onSave();
    onToast('Note saved');
  };

  return (
    <aside className="content-notes">
      <div className="notes-header">
        <div>
          <div className="notes-title">Notes · {lead.company || lead.domain}</div>
          <div className="notes-meta">Visible only inside Nessie</div>
        </div>
        <span className="badge-status" onClick={handleStatusClick}>
          Status: {status}
        </span>
      </div>

      <div className="notes-area">
        <textarea
          className="notes-textarea"
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder="Add quick notes here: objections, call outcomes, manual tweaks you made, etc."
        />
      </div>

      <div className="notes-footer">
        <span>Last updated · {lastUpdated}</span>
        <button className="btn secondary small" onClick={handleSave}>
          Save note
        </button>
      </div>
    </aside>
  );
};
