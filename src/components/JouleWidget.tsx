import React, { useState, useEffect } from 'react';
import { Sparkles, X, Maximize2, Minimize2, ExternalLink, RefreshCw } from 'lucide-react';

export const JouleWidget: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  const [key, setKey] = useState(0);

  const jouleUrl = 'https://ais-joule-hqc0gyza.eu10.sapdas.cloud.sap/webclient/standalone/podzo_assistant';

  // Real-time synchronization while Joule drawer is open
  useEffect(() => {
    if (!isOpen) return;
    const interval = setInterval(() => {
      window.dispatchEvent(new Event('pod_data_refreshed'));
    }, 4000);
    return () => clearInterval(interval);
  }, [isOpen]);

  const handleRefreshIframe = () => {
    setKey(k => k + 1);
  };

  return (
    <>
      {/* Floating Joule Trigger Button */}
      {!isOpen && (
        <button
          onClick={() => setIsOpen(true)}
          style={{
            position: 'fixed',
            bottom: '24px',
            right: '24px',
            zIndex: 9999,
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
            padding: '12px 20px',
            borderRadius: '9999px',
            background: 'linear-gradient(135deg, #6366F1 0%, #8B5CF6 50%, #EC4899 100%)',
            color: '#FFFFFF',
            fontWeight: 700,
            fontSize: '14px',
            border: 'none',
            boxShadow: '0 8px 24px rgba(99, 102, 241, 0.4), 0 2px 6px rgba(0,0,0,0.1)',
            cursor: 'pointer',
            transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
          }}
          onMouseEnter={e => {
            e.currentTarget.style.transform = 'translateY(-2px) scale(1.03)';
            e.currentTarget.style.boxShadow = '0 12px 28px rgba(99, 102, 241, 0.5), 0 4px 10px rgba(0,0,0,0.15)';
          }}
          onMouseLeave={e => {
            e.currentTarget.style.transform = 'translateY(0) scale(1)';
            e.currentTarget.style.boxShadow = '0 8px 24px rgba(99, 102, 241, 0.4), 0 2px 6px rgba(0,0,0,0.1)';
          }}
          title="Open PODZO Joule Assistant"
        >
          <Sparkles size={18} style={{ animation: 'pulse 2s infinite' }} />
          <span>Ask Joule</span>
          <span
            style={{
              fontSize: '11px',
              fontWeight: 800,
              background: 'rgba(255,255,255,0.25)',
              padding: '2px 7px',
              borderRadius: '9999px',
              letterSpacing: '0.04em',
            }}
          >
            PODZO AI
          </span>
        </button>
      )}

      {/* Slide-over Drawer / Modal Panel */}
      {isOpen && (
        <div
          style={{
            position: 'fixed',
            top: isExpanded ? '16px' : '20px',
            right: isExpanded ? '16px' : '20px',
            bottom: isExpanded ? '16px' : '20px',
            width: isExpanded ? 'calc(100vw - 32px)' : '480px',
            maxWidth: '100vw',
            zIndex: 10000,
            backgroundColor: '#FFFFFF',
            borderRadius: '16px',
            boxShadow: '0 20px 48px rgba(0, 0, 0, 0.22), 0 0 0 1px rgba(0, 0, 0, 0.08)',
            display: 'flex',
            flexDirection: 'column',
            overflow: 'hidden',
            transition: 'all 0.25s cubic-bezier(0.16, 1, 0.3, 1)',
          }}
        >
          {/* Header */}
          <div
            style={{
              padding: '14px 18px',
              background: 'linear-gradient(135deg, #4F46E5 0%, #7C3AED 100%)',
              color: '#FFFFFF',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <div
                style={{
                  width: '32px',
                  height: '32px',
                  borderRadius: '8px',
                  background: 'rgba(255,255,255,0.2)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <Sparkles size={18} />
              </div>
              <div>
                <div style={{ fontSize: '15px', fontWeight: 700, lineHeight: 1.2 }}>
                  PODZO Assistant
                </div>
                <div style={{ fontSize: '11.5px', color: 'rgba(255,255,255,0.8)' }}>
                  SAP Joule Custom Extension
                </div>
              </div>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <button
                onClick={handleRefreshIframe}
                style={{
                  background: 'transparent',
                  border: 'none',
                  color: '#FFFFFF',
                  cursor: 'pointer',
                  padding: '6px',
                  borderRadius: '6px',
                  display: 'flex',
                  alignItems: 'center',
                }}
                title="Restart Joule Session"
              >
                <RefreshCw size={15} />
              </button>

              <button
                onClick={() => window.open(jouleUrl, '_blank')}
                style={{
                  background: 'transparent',
                  border: 'none',
                  color: '#FFFFFF',
                  cursor: 'pointer',
                  padding: '6px',
                  borderRadius: '6px',
                  display: 'flex',
                  alignItems: 'center',
                }}
                title="Open in Full Window"
              >
                <ExternalLink size={15} />
              </button>

              <button
                onClick={() => setIsExpanded(!isExpanded)}
                style={{
                  background: 'transparent',
                  border: 'none',
                  color: '#FFFFFF',
                  cursor: 'pointer',
                  padding: '6px',
                  borderRadius: '6px',
                  display: 'flex',
                  alignItems: 'center',
                }}
                title={isExpanded ? 'Restore Size' : 'Maximize'}
              >
                {isExpanded ? <Minimize2 size={15} /> : <Maximize2 size={15} />}
              </button>

              <button
                onClick={() => setIsOpen(false)}
                style={{
                  background: 'rgba(255,255,255,0.2)',
                  border: 'none',
                  color: '#FFFFFF',
                  cursor: 'pointer',
                  padding: '6px',
                  borderRadius: '6px',
                  display: 'flex',
                  alignItems: 'center',
                }}
                title="Close"
              >
                <X size={16} />
              </button>
            </div>
          </div>

          {/* Embedded Webclient */}
          <div style={{ flex: 1, position: 'relative', width: '100%', height: '100%' }}>
            <iframe
              key={key}
              src={jouleUrl}
              title="SAP Joule PODZO Assistant"
              style={{
                width: '100%',
                height: '100%',
                border: 'none',
                display: 'block',
              }}
              allow="clipboard-read; clipboard-write; microphone"
            />
          </div>
        </div>
      )}
    </>
  );
};
