import { useState } from 'react';
import { Mail, Plus, Trash2, RefreshCw, CheckCircle, AlertCircle } from 'lucide-react';
import { TopBar } from '../components/nessie/TopBar';

interface EmailAccount {
  id: string;
  provider: 'gmail' | 'outlook';
  email_address: string;
  display_name?: string;
  is_active: boolean;
  is_primary: boolean;
  last_used_at?: string;
  created_at: string;
}

export const SettingsPage = () => {
  const [activeTab, setActiveTab] = useState<'integrations' | 'profile' | 'appearance'>('integrations');
  const [emailAccounts, setEmailAccounts] = useState<EmailAccount[]>([]);
  const [loading, setLoading] = useState(false);

  const handleConnectGmail = () => {
    // TODO: Implement Gmail OAuth flow
    console.log('Connecting Gmail...');
    
    // For now, show what will happen
    alert('Gmail OAuth flow will:\n1. Open Google consent screen\n2. User grants permission\n3. Store OAuth token\n4. Ready to send emails!');
  };

  const handleConnectOutlook = () => {
    // TODO: Implement Outlook OAuth flow
    console.log('Connecting Outlook...');
    
    alert('Outlook OAuth flow will:\n1. Open Microsoft consent screen\n2. User grants permission\n3. Store OAuth token\n4. Ready to send emails!');
  };

  const handleDisconnect = (accountId: string) => {
    // TODO: Implement disconnect logic
    console.log('Disconnecting account:', accountId);
    setEmailAccounts(prev => prev.filter(acc => acc.id !== accountId));
  };

  const handleSetPrimary = (accountId: string) => {
    // TODO: Update primary account
    console.log('Setting primary account:', accountId);
    setEmailAccounts(prev => prev.map(acc => ({
      ...acc,
      is_primary: acc.id === accountId,
    })));
  };

  return (
    <div>
      <link
        href="https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@400;500;600;700&family=Playfair+Display:wght@500;600&display=swap"
        rel="stylesheet"
      />

      <TopBar
        activeView="Settings"
        onViewChange={() => {}}
        onCreateNewBatch={() => {}}
      />

      <div style={{ padding: '40px', maxWidth: '1200px', margin: '0 auto' }}>
        {/* Page Title */}
        <div style={{ marginBottom: '32px' }}>
          <h1 style={{
            fontSize: '32px',
            fontFamily: 'Playfair Display, serif',
            fontWeight: 600,
            color: 'var(--text)',
            marginBottom: '8px',
          }}>
            Settings
          </h1>
          <p style={{
            fontSize: '14px',
            color: 'var(--text-secondary)',
          }}>
            Manage your account, integrations, and preferences
          </p>
        </div>

        {/* Tab Navigation */}
        <div style={{
          display: 'flex',
          gap: '24px',
          borderBottom: '1px solid var(--border)',
          marginBottom: '32px',
        }}>
          {['integrations', 'profile', 'appearance'].map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab as any)}
              style={{
                padding: '12px 0',
                fontSize: '14px',
                fontWeight: 600,
                color: activeTab === tab ? 'var(--accent)' : 'var(--text-secondary)',
                background: 'transparent',
                border: 'none',
                borderBottom: activeTab === tab ? '2px solid var(--accent)' : '2px solid transparent',
                cursor: 'pointer',
                transition: 'all 0.2s',
                textTransform: 'capitalize',
              }}
            >
              {tab}
            </button>
          ))}
        </div>

        {/* Integrations Tab */}
        {activeTab === 'integrations' && (
          <div>
            {/* Email Integrations Section */}
            <div style={{
              background: 'var(--surface)',
              border: '1px solid var(--border)',
              borderRadius: '12px',
              padding: '24px',
              marginBottom: '24px',
            }}>
              <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'start',
                marginBottom: '20px',
              }}>
                <div>
                  <h2 style={{
                    fontSize: '18px',
                    fontWeight: 600,
                    color: 'var(--text)',
                    marginBottom: '4px',
                  }}>
                    Email Accounts
                  </h2>
                  <p style={{
                    fontSize: '13px',
                    color: 'var(--text-secondary)',
                  }}>
                    Connect your email accounts to send outreach directly from Nessie
                  </p>
                </div>
              </div>

              {/* Connected Accounts List */}
              {emailAccounts.length > 0 ? (
                <div style={{ marginBottom: '16px' }}>
                  {emailAccounts.map((account) => (
                    <div
                      key={account.id}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        padding: '16px',
                        background: 'rgba(255, 255, 255, 0.02)',
                        border: '1px solid var(--border)',
                        borderRadius: '8px',
                        marginBottom: '8px',
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flex: 1 }}>
                        <div style={{
                          width: '40px',
                          height: '40px',
                          borderRadius: '8px',
                          background: account.provider === 'gmail' 
                            ? 'linear-gradient(135deg, #EA4335 0%, #FBBC04 100%)'
                            : 'linear-gradient(135deg, #0078D4 0%, #50E6FF 100%)',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                        }}>
                          <Mail size={20} color="white" />
                        </div>
                        <div style={{ flex: 1 }}>
                          <div style={{
                            fontSize: '14px',
                            fontWeight: 600,
                            color: 'var(--text)',
                            marginBottom: '2px',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '8px',
                          }}>
                            {account.email_address}
                            {account.is_primary && (
                              <span style={{
                                fontSize: '10px',
                                fontWeight: 600,
                                padding: '2px 6px',
                                borderRadius: '4px',
                                background: 'rgba(17, 194, 210, 0.1)',
                                color: 'var(--accent)',
                              }}>
                                PRIMARY
                              </span>
                            )}
                          </div>
                          <div style={{
                            fontSize: '12px',
                            color: 'var(--text-secondary)',
                          }}>
                            {account.provider === 'gmail' ? 'Gmail' : 'Outlook'} • 
                            {account.is_active ? (
                              <span style={{ color: 'rgb(34, 197, 94)', marginLeft: '4px' }}>
                                <CheckCircle size={12} style={{ display: 'inline', marginRight: '4px' }} />
                                Connected
                              </span>
                            ) : (
                              <span style={{ color: 'rgb(239, 68, 68)', marginLeft: '4px' }}>
                                <AlertCircle size={12} style={{ display: 'inline', marginRight: '4px' }} />
                                Disconnected
                              </span>
                            )}
                          </div>
                        </div>
                      </div>

                      <div style={{ display: 'flex', gap: '8px' }}>
                        {!account.is_primary && (
                          <button
                            onClick={() => handleSetPrimary(account.id)}
                            style={{
                              padding: '6px 12px',
                              fontSize: '12px',
                              fontWeight: 600,
                              color: 'var(--text-secondary)',
                              background: 'transparent',
                              border: '1px solid var(--border)',
                              borderRadius: '6px',
                              cursor: 'pointer',
                              transition: 'all 0.2s',
                            }}
                            onMouseEnter={(e) => {
                              e.currentTarget.style.background = 'rgba(255, 255, 255, 0.05)';
                            }}
                            onMouseLeave={(e) => {
                              e.currentTarget.style.background = 'transparent';
                            }}
                          >
                            Set Primary
                          </button>
                        )}
                        <button
                          onClick={() => handleDisconnect(account.id)}
                          style={{
                            padding: '6px 12px',
                            fontSize: '12px',
                            fontWeight: 600,
                            color: 'rgb(239, 68, 68)',
                            background: 'transparent',
                            border: '1px solid rgba(239, 68, 68, 0.3)',
                            borderRadius: '6px',
                            cursor: 'pointer',
                            transition: 'all 0.2s',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '4px',
                          }}
                          onMouseEnter={(e) => {
                            e.currentTarget.style.background = 'rgba(239, 68, 68, 0.1)';
                          }}
                          onMouseLeave={(e) => {
                            e.currentTarget.style.background = 'transparent';
                          }}
                        >
                          <Trash2 size={12} />
                          Disconnect
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div style={{
                  padding: '32px',
                  textAlign: 'center',
                  background: 'rgba(255, 255, 255, 0.02)',
                  border: '1px dashed var(--border)',
                  borderRadius: '8px',
                  marginBottom: '16px',
                }}>
                  <Mail size={40} color="var(--text-secondary)" style={{ opacity: 0.5, marginBottom: '12px' }} />
                  <p style={{
                    fontSize: '14px',
                    color: 'var(--text-secondary)',
                    marginBottom: '4px',
                  }}>
                    No email accounts connected
                  </p>
                  <p style={{
                    fontSize: '12px',
                    color: 'var(--text-secondary)',
                  }}>
                    Connect an account below to start sending emails
                  </p>
                </div>
              )}

              {/* Connect Buttons */}
              <div style={{ display: 'flex', gap: '12px' }}>
                <button
                  onClick={handleConnectGmail}
                  disabled={loading}
                  style={{
                    flex: 1,
                    padding: '12px',
                    fontSize: '14px',
                    fontWeight: 600,
                    color: '#fff',
                    background: 'linear-gradient(135deg, #EA4335 0%, #FBBC04 100%)',
                    border: 'none',
                    borderRadius: '8px',
                    cursor: loading ? 'not-allowed' : 'pointer',
                    transition: 'all 0.2s',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '8px',
                    opacity: loading ? 0.5 : 1,
                  }}
                  onMouseEnter={(e) => {
                    if (!loading) e.currentTarget.style.transform = 'translateY(-2px)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.transform = 'translateY(0)';
                  }}
                >
                  <Plus size={16} />
                  Connect Gmail
                </button>

                <button
                  onClick={handleConnectOutlook}
                  disabled={loading}
                  style={{
                    flex: 1,
                    padding: '12px',
                    fontSize: '14px',
                    fontWeight: 600,
                    color: '#fff',
                    background: 'linear-gradient(135deg, #0078D4 0%, #50E6FF 100%)',
                    border: 'none',
                    borderRadius: '8px',
                    cursor: loading ? 'not-allowed' : 'pointer',
                    transition: 'all 0.2s',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '8px',
                    opacity: loading ? 0.5 : 1,
                  }}
                  onMouseEnter={(e) => {
                    if (!loading) e.currentTarget.style.transform = 'translateY(-2px)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.transform = 'translateY(0)';
                  }}
                >
                  <Plus size={16} />
                  Connect Outlook
                </button>
              </div>
            </div>

            {/* Make.com Integration (Future) */}
            <div style={{
              background: 'var(--surface)',
              border: '1px solid var(--border)',
              borderRadius: '12px',
              padding: '24px',
            }}>
              <h2 style={{
                fontSize: '18px',
                fontWeight: 600,
                color: 'var(--text)',
                marginBottom: '4px',
              }}>
                Other Integrations
              </h2>
              <p style={{
                fontSize: '13px',
                color: 'var(--text-secondary)',
                marginBottom: '16px',
              }}>
                Coming soon: CRM integrations, Zapier, and more
              </p>
              
              <div style={{
                padding: '16px',
                background: 'rgba(251, 191, 36, 0.1)',
                border: '1px solid rgba(251, 191, 36, 0.2)',
                borderRadius: '8px',
              }}>
                <p style={{
                  fontSize: '13px',
                  color: 'rgb(251, 191, 36)',
                  fontWeight: 500,
                }}>
                  🚀 More integrations launching soon!
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Profile Tab */}
        {activeTab === 'profile' && (
          <div style={{
            background: 'var(--surface)',
            border: '1px solid var(--border)',
            borderRadius: '12px',
            padding: '24px',
          }}>
            <h2 style={{
              fontSize: '18px',
              fontWeight: 600,
              color: 'var(--text)',
              marginBottom: '16px',
            }}>
              Profile Settings
            </h2>
            <p style={{ color: 'var(--text-secondary)' }}>Coming soon...</p>
          </div>
        )}

        {/* Appearance Tab */}
        {activeTab === 'appearance' && (
          <div style={{
            background: 'var(--surface)',
            border: '1px solid var(--border)',
            borderRadius: '12px',
            padding: '24px',
          }}>
            <h2 style={{
              fontSize: '18px',
              fontWeight: 600,
              color: 'var(--text)',
              marginBottom: '16px',
            }}>
              Appearance Settings
            </h2>
            <p style={{ color: 'var(--text-secondary)' }}>Coming soon...</p>
          </div>
        )}
      </div>
    </div>
  );
};