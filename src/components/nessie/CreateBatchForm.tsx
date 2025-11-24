import { useState } from 'react';

interface CreateBatchFormProps {
  onSubmit: (data: {
    batchName: string;
    urls: string[];
    channel: 'email' | 'dm';
    subjectTemplate?: string;
    messageTemplate: string;
  }) => void;
  onToast: (message: string) => void;
}

const highlightVariables = (text: string): JSX.Element[] => {
  const regex = /(\{\{[^}]+\}\})/g;
  const parts = text.split(regex);

  return parts.map((part, index) => {
    if (part.match(regex)) {
      return (
        <span key={index} style={{ color: '#11c2d2', fontWeight: 600 }}>
          {part}
        </span>
      );
    }
    return <span key={index}>{part}</span>;
  });
};

export const CreateBatchForm = ({ onSubmit, onToast }: CreateBatchFormProps) => {
  const [batchName, setBatchName] = useState('');
  const [urlsInput, setUrlsInput] = useState('');
  const [channel, setChannel] = useState<'email' | 'dm'>('dm');
  const [subjectTemplate, setSubjectTemplate] = useState('');
  const [messageTemplate, setMessageTemplate] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const urls = urlsInput
      .split('\n')
      .map((u) => u.trim())
      .filter(Boolean);

    if (urls.length === 0) {
      onToast('Add at least one website');
      return;
    }

    if (!messageTemplate.trim()) {
      onToast('Message template is required');
      return;
    }

    onSubmit({
      batchName: batchName.trim() || `Batch ${Date.now()}`,
      urls,
      channel,
      subjectTemplate: channel === 'email' && subjectTemplate.trim() ? subjectTemplate.trim() : undefined,
      messageTemplate: messageTemplate.trim(),
    });
  };

  const handleReset = () => {
    setBatchName('');
    setUrlsInput('');
    setChannel('dm');
    setSubjectTemplate('');
    setMessageTemplate('');
    onToast('Form reset');
  };

  return (
    <div className="empty-main">
      <div className="empty-card">
        <div className="empty-header">
          <div className="empty-title">Create a new batch</div>
          <div className="empty-sub">
            Name your batch and drop in websites. Nessie will enrich them in the
            background while you get on with your day.
          </div>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="form-grid">
            <div className="form-full">
              <div className="label">Batch name</div>
              <input
                className="input"
                value={batchName}
                onChange={(e) => setBatchName(e.target.value)}
                placeholder="Restaurant Push · Edinburgh"
              />
              <div className="helper-text">
                Something you and Especial will recognise later.
              </div>
            </div>

            <div className="form-full">
              <div className="label">Paste websites (one per line)</div>
              <textarea
                className="textarea"
                value={urlsInput}
                onChange={(e) => setUrlsInput(e.target.value)}
                placeholder="https://example-restaurant.com&#10;https://example-cafe.co.uk&#10;https://example-venue.com"
              />
              <div className="helper-text">
                Nessie will turn each URL into a lead. CSV upload coming later – for now,
                just paste.
              </div>
            </div>

            <div className="form-full">
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '6px' }}>
                <div className="label" style={{ margin: 0, fontSize: '12px' }}>Campaign Type</div>
                <div style={{ display: 'flex', gap: '6px' }}>
                  <button
                    type="button"
                    onClick={() => setChannel('dm')}
                    style={{
                      padding: '6px 16px',
                      borderRadius: '8px',
                      border: channel === 'dm' ? '2px solid #11c2d2' : '1px solid var(--border)',
                      background: channel === 'dm' ? 'rgba(17, 194, 210, 0.15)' : '#0d151a',
                      color: channel === 'dm' ? '#11c2d2' : 'var(--text-muted)',
                      fontSize: '12px',
                      fontWeight: 600,
                      cursor: 'pointer',
                      transition: 'all 0.2s ease',
                    }}
                  >
                    DM
                  </button>
                  <button
                    type="button"
                    onClick={() => setChannel('email')}
                    style={{
                      padding: '6px 16px',
                      borderRadius: '8px',
                      border: channel === 'email' ? '2px solid #11c2d2' : '1px solid var(--border)',
                      background: channel === 'email' ? 'rgba(17, 194, 210, 0.15)' : '#0d151a',
                      color: channel === 'email' ? '#11c2d2' : 'var(--text-muted)',
                      fontSize: '12px',
                      fontWeight: 600,
                      cursor: 'pointer',
                      transition: 'all 0.2s ease',
                    }}
                  >
                    Email
                  </button>
                </div>
              </div>
            </div>

            {channel === 'email' && (
              <div className="form-full">
                <div className="label">Subject Template (optional)</div>
                <input
                  className="input"
                  value={subjectTemplate}
                  onChange={(e) => setSubjectTemplate(e.target.value)}
                  placeholder="Subject line with {{variables}}"
                  maxLength={100}
                />
                <div className="helper-text">
                  {subjectTemplate.length} characters · Recommend &lt;60 for best open rates
                </div>
              </div>
            )}

            <div className="form-full">
              <div className="label">
                Message Template <span style={{ color: '#11c2d2' }}>*</span>
              </div>
              <textarea
                className="textarea"
                value={messageTemplate}
                onChange={(e) => setMessageTemplate(e.target.value)}
                placeholder={
                  channel === 'email'
                    ? 'Hi there,\n\n{{icebreaker}}\n\nWe help {{industry}} businesses improve their outreach. Fancy a chat?\n\nCheers,\n[Your name]'
                    : 'Hi! {{icebreaker}} - would love to connect and share some ideas. What do you think?'
                }
                style={{ minHeight: '200px' }}
                required
              />
              <div className="helper-text">
                {messageTemplate.length} characters · Available: <span style={{ color: '#11c2d2', fontWeight: 500 }}>{'{{company}}'}</span>{' '}
                <span style={{ color: '#11c2d2', fontWeight: 500 }}>{'{{industry}}'}</span>{' '}
                <span style={{ color: '#11c2d2', fontWeight: 500 }}>{'{{icebreaker}}'}</span>{' '}
                <span style={{ color: '#11c2d2', fontWeight: 500 }}>{'{{website}}'}</span>
              </div>
            </div>
          </div>

          <div className="button-row" style={{ marginTop: '12px' }}>
            <button type="submit" className="btn">
              Let Nessie Hunt
            </button>
            <button type="button" className="btn ghost" onClick={handleReset}>
              Reset form
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
