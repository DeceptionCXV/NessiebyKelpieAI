import { useState } from 'react';

interface CreateBatchFormProps {
  onSubmit: (data: {
    batchName: string;
    channel: string;
    subjectTemplate: string;
    bodyTemplate: string;
    urls: string[];
  }) => void;
  onToast: (message: string) => void;
}

export const CreateBatchForm = ({ onSubmit, onToast }: CreateBatchFormProps) => {
  const [batchName, setBatchName] = useState('');
  const [channel, setChannel] = useState('email');
  const [subjectTemplate, setSubjectTemplate] = useState('Quick idea for {{company}}');
  const [bodyTemplate, setBodyTemplate] = useState(
    `Hey {{name}},

{{icebreaker}}

Many {{industry}} businesses lose potential work because follow ups depend on whoever's available at the time.
A simple automation layer keeps every enquiry answered, quotes followed up, and appointments booked, all without adding extra admin.

Worth a quick chat this week to see how that setup could work for your team?

Kind regards,
Sami
Kelpie AI × Especial Agency`
  );
  const [urlsInput, setUrlsInput] = useState('');

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

    onSubmit({
      batchName: batchName.trim() || `Batch ${Date.now()}`,
      channel,
      subjectTemplate,
      bodyTemplate,
      urls,
    });
  };

  const handleReset = () => {
    setBatchName('');
    setUrlsInput('');
    onToast('Form reset');
  };

  return (
    <div className="empty-main">
      <div className="empty-card">
        <div className="empty-header">
          <div className="empty-title">Create a new batch</div>
          <div className="empty-sub">
            Name your campaign, choose a template, and drop in websites. Nessie will
            enrich them in the background while you get on with your day.
          </div>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="form-grid">
            <div>
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
            <div>
              <div className="label">Channel</div>
              <select
                className="input"
                value={channel}
                onChange={(e) => setChannel(e.target.value)}
              >
                <option value="email">Email</option>
                <option value="dm">DM / Social</option>
              </select>
            </div>

            <div className="form-full">
              <div className="label">Template subject</div>
              <input
                className="input"
                value={subjectTemplate}
                onChange={(e) => setSubjectTemplate(e.target.value)}
                placeholder="Quick idea for {{company}}"
              />
            </div>

            <div className="form-full">
              <div className="label">Template body</div>
              <textarea
                className="textarea"
                value={bodyTemplate}
                onChange={(e) => setBodyTemplate(e.target.value)}
              />
              <div className="helper-text">
                Available placeholders: <strong>{'{{name}}'}</strong>,{' '}
                <strong>{'{{company}}'}</strong>, <strong>{'{{industry}}'}</strong>,{' '}
                <strong>{'{{icebreaker}}'}</strong>, <strong>{'{{website}}'}</strong>.
              </div>
            </div>

            <div className="form-full">
              <div className="label">Paste websites (one per line)</div>
              <textarea
                className="textarea"
                value={urlsInput}
                onChange={(e) => setUrlsInput(e.target.value)}
                placeholder="https://thekitchin.com&#10;https://zestandco.co.uk&#10;https://example.com"
              />
              <div className="helper-text">
                Nessie will turn each URL into a lead. CSV upload coming later – for now,
                just paste.
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
