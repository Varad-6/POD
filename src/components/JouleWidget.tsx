import React, { useState, useEffect, useRef } from 'react';
import { 
  Sparkles, X, Maximize2, Minimize2, ExternalLink, RefreshCw, 
  Send, Bot, User, ArrowRight, CornerDownLeft, Layers, ShieldCheck, CheckCircle2 
} from 'lucide-react';

interface ChatMessage {
  id: string;
  sender: 'joule' | 'user';
  text: string;
  suggestions?: string[];
  timestamp: string;
}

export const JouleWidget: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  const [viewMode, setViewMode] = useState<'copilot' | 'btp_iframe'>('copilot');
  const [key, setKey] = useState(0);

  // Chat State
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 'welcome',
      sender: 'joule',
      text: "👋 Hello! I am **SAP Joule AI**, your Order-to-Cash (O2C) Logistics Assistant.\n\nI can help you monitor live **Sales Orders (VA03)**, manage carrier allocations, track weighbridge gross/tare scales, verify AI POD documents, and execute closed-loop **MIRO** settlements.\n\nWhat would you like to review?",
      suggestions: [
        "What sales orders are open right now?",
        "Show me all shipments in transit",
        "Are there any review exceptions blocking MIRO?",
        "Distribute Sales Order #2322 to Sipho Transport"
      ],
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    }
  ]);
  const [inputPrompt, setInputPrompt] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const jouleUrl = 'https://ais-joule-hqc0gyza.eu10.sapdas.cloud.sap/webclient/standalone/sap_digital_assistant';

  // Real-time synchronization while Joule drawer is open
  useEffect(() => {
    if (!isOpen) return;
    const interval = setInterval(() => {
      window.dispatchEvent(new Event('pod_data_refreshed'));
    }, 4000);
    return () => clearInterval(interval);
  }, [isOpen]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isLoading]);

  const handleSendMessage = async (customText?: string) => {
    const textToSend = (customText || inputPrompt).trim();
    if (!textToSend || isLoading) return;

    const userMsg: ChatMessage = {
      id: `user-${Date.now()}`,
      sender: 'user',
      text: textToSend,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    setMessages(prev => [...prev, userMsg]);
    if (!customText) setInputPrompt('');
    setIsLoading(true);

    try {
      const token = localStorage.getItem('token') || sessionStorage.getItem('token') || '';
      const response = await fetch('/api/v3/joule/ask', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ prompt: textToSend })
      });

      if (!response.ok) {
        throw new Error(`Server returned ${response.status}`);
      }

      const data = await response.json();
      const jouleMsg: ChatMessage = {
        id: `joule-${Date.now()}`,
        sender: 'joule',
        text: data.answer || "I processed your request against the SAP S/4HANA ledger.",
        suggestions: data.suggestions || [],
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };

      setMessages(prev => [...prev, jouleMsg]);
      // Trigger live portal refresh
      window.dispatchEvent(new Event('pod_data_refreshed'));
    } catch (err: any) {
      setMessages(prev => [
        ...prev,
        {
          id: `joule-err-${Date.now()}`,
          sender: 'joule',
          text: `⚠️ Could not reach the Joule Skill Engine: ${err.message}. Please verify your network connection.`,
          suggestions: [
            "What sales orders are open right now?",
            "Give me an operations dashboard overview"
          ],
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        }
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleRefreshIframe = () => {
    setKey(k => k + 1);
  };

  // Helper to format bold markdown in answers
  const renderFormattedText = (text: string) => {
    const parts = text.split('\n');
    return parts.map((line, idx) => {
      // Replace **text** with <strong>
      const boldFormatted = line.split(/(\*\*.*?\*\*|\*.*?\*|`.*?`)/).map((chunk, cIdx) => {
        if (chunk.startsWith('**') && chunk.endsWith('**')) {
          return <strong key={cIdx} style={{ color: '#0F172A' }}>{chunk.slice(2, -2)}</strong>;
        }
        if (chunk.startsWith('*') && chunk.endsWith('*')) {
          return <em key={cIdx} style={{ color: '#334155' }}>{chunk.slice(1, -1)}</em>;
        }
        if (chunk.startsWith('`') && chunk.endsWith('`')) {
          return (
            <code key={cIdx} style={{ background: '#F1F5F9', color: '#0854A0', padding: '1px 5px', borderRadius: '4px', fontSize: '11px', fontFamily: 'monospace' }}>
              {chunk.slice(1, -1)}
            </code>
          );
        }
        return chunk;
      });

      return (
        <div key={idx} style={{ marginBottom: line.trim() ? '4px' : '8px', lineHeight: 1.45 }}>
          {boldFormatted}
        </div>
      );
    });
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
            background: 'linear-gradient(135deg, #0854A0 0%, #4F46E5 50%, #7C3AED 100%)',
            color: '#FFFFFF',
            fontWeight: 700,
            fontSize: '14px',
            border: 'none',
            boxShadow: '0 8px 24px rgba(8, 84, 160, 0.4), 0 2px 6px rgba(0,0,0,0.1)',
            cursor: 'pointer',
            transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
          }}
          onMouseEnter={e => {
            e.currentTarget.style.transform = 'translateY(-2px) scale(1.03)';
            e.currentTarget.style.boxShadow = '0 12px 28px rgba(8, 84, 160, 0.5), 0 4px 10px rgba(0,0,0,0.15)';
          }}
          onMouseLeave={e => {
            e.currentTarget.style.transform = 'translateY(0) scale(1)';
            e.currentTarget.style.boxShadow = '0 8px 24px rgba(8, 84, 160, 0.4), 0 2px 6px rgba(0,0,0,0.1)';
          }}
          title="Open SAP Joule Assistant"
        >
          <Sparkles size={18} style={{ animation: 'pulse 2s infinite' }} />
          <span>Ask Joule</span>
          <span
            style={{
              fontSize: '11px',
              fontWeight: 800,
              background: 'rgba(255,255,255,0.22)',
              padding: '2px 7px',
              borderRadius: '9999px',
              letterSpacing: '0.04em',
            }}
          >
            S/4HANA O2C
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
            width: isExpanded ? 'calc(100vw - 32px)' : '520px',
            maxWidth: '100vw',
            zIndex: 10000,
            backgroundColor: '#F8FAFC',
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
              background: 'linear-gradient(135deg, #0854A0 0%, #4F46E5 50%, #7C3AED 100%)',
              color: '#FFFFFF',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              boxShadow: '0 2px 8px rgba(0,0,0,0.12)',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <div
                style={{
                  width: '34px',
                  height: '34px',
                  borderRadius: '10px',
                  background: 'rgba(255,255,255,0.2)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <Sparkles size={18} />
              </div>
              <div>
                <div style={{ fontSize: '15px', fontWeight: 800, lineHeight: 1.2, letterSpacing: '-0.01em' }}>
                  SAP Joule AI Assistant
                </div>
                <div style={{ fontSize: '11px', color: 'rgba(255,255,255,0.85)', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <span style={{ display: 'inline-block', width: '6px', height: '6px', borderRadius: '50%', background: '#4ADE80' }}></span>
                  <span>Order-to-Cash (VA03 / VL03N / MIRO)</span>
                </div>
              </div>
            </div>

            {/* View Mode Switcher & Controls */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <div style={{ background: 'rgba(0,0,0,0.2)', borderRadius: '8px', padding: '2px', display: 'flex', marginRight: '4px' }}>
                <button
                  onClick={() => setViewMode('copilot')}
                  style={{
                    border: 'none',
                    padding: '4px 10px',
                    borderRadius: '6px',
                    fontSize: '11px',
                    fontWeight: 700,
                    cursor: 'pointer',
                    background: viewMode === 'copilot' ? '#FFFFFF' : 'transparent',
                    color: viewMode === 'copilot' ? '#0854A0' : 'rgba(255,255,255,0.8)',
                    transition: 'all 0.15s ease',
                  }}
                >
                  Skill Copilot
                </button>
                <button
                  onClick={() => setViewMode('btp_iframe')}
                  style={{
                    border: 'none',
                    padding: '4px 10px',
                    borderRadius: '6px',
                    fontSize: '11px',
                    fontWeight: 700,
                    cursor: 'pointer',
                    background: viewMode === 'btp_iframe' ? '#FFFFFF' : 'transparent',
                    color: viewMode === 'btp_iframe' ? '#0854A0' : 'rgba(255,255,255,0.8)',
                    transition: 'all 0.15s ease',
                  }}
                >
                  SAP BTP
                </button>
              </div>

              {viewMode === 'btp_iframe' && (
                <>
                  <button
                    onClick={handleRefreshIframe}
                    style={{ background: 'transparent', border: 'none', color: '#FFFFFF', cursor: 'pointer', padding: '6px' }}
                    title="Restart Joule Session"
                  >
                    <RefreshCw size={14} />
                  </button>
                  <button
                    onClick={() => window.open(jouleUrl, '_blank')}
                    style={{ background: 'transparent', border: 'none', color: '#FFFFFF', cursor: 'pointer', padding: '6px' }}
                    title="Open BTP Joule in New Tab"
                  >
                    <ExternalLink size={14} />
                  </button>
                </>
              )}

              <button
                onClick={() => setIsExpanded(!isExpanded)}
                style={{ background: 'transparent', border: 'none', color: '#FFFFFF', cursor: 'pointer', padding: '6px' }}
                title={isExpanded ? 'Restore Size' : 'Maximize'}
              >
                {isExpanded ? <Minimize2 size={15} /> : <Maximize2 size={15} />}
              </button>

              <button
                onClick={() => setIsOpen(false)}
                style={{ background: 'rgba(255,255,255,0.2)', border: 'none', color: '#FFFFFF', cursor: 'pointer', padding: '6px', borderRadius: '6px' }}
                title="Close"
              >
                <X size={16} />
              </button>
            </div>
          </div>

          {/* VIEW MODE 1: Interactive Autonomous Copilot */}
          {viewMode === 'copilot' && (
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', height: '100%', overflow: 'hidden' }}>
              
              {/* Chat Message Scroll Area */}
              <div style={{ flex: 1, overflowY: 'auto', padding: '16px 18px', display: 'flex', flexDirection: 'column', gap: '14px' }}>
                {messages.map(msg => (
                  <div
                    key={msg.id}
                    style={{
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: msg.sender === 'user' ? 'flex-end' : 'flex-start',
                      maxWidth: '100%',
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'flex-start', gap: '8px', maxWidth: '88%' }}>
                      {msg.sender === 'joule' && (
                        <div style={{ width: '28px', height: '28px', borderRadius: '50%', background: '#0854A0', color: '#FFFFFF', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, marginTop: '2px' }}>
                          <Bot size={15} />
                        </div>
                      )}

                      <div
                        style={{
                          background: msg.sender === 'user' ? '#0854A0' : '#FFFFFF',
                          color: msg.sender === 'user' ? '#FFFFFF' : '#1E293B',
                          padding: '12px 14px',
                          borderRadius: msg.sender === 'user' ? '14px 14px 2px 14px' : '14px 14px 14px 2px',
                          fontSize: '13px',
                          lineHeight: 1.5,
                          boxShadow: msg.sender === 'user' ? '0 2px 8px rgba(8, 84, 160, 0.25)' : '0 2px 8px rgba(0, 0, 0, 0.05)',
                          border: msg.sender === 'user' ? 'none' : '1px solid #E2E8F0',
                          wordBreak: 'break-word',
                        }}
                      >
                        {renderFormattedText(msg.text)}
                      </div>

                      {msg.sender === 'user' && (
                        <div style={{ width: '28px', height: '28px', borderRadius: '50%', background: '#64748B', color: '#FFFFFF', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, marginTop: '2px' }}>
                          <User size={15} />
                        </div>
                      )}
                    </div>

                    <div style={{ fontSize: '10px', color: '#94A3B8', marginTop: '3px', marginLeft: msg.sender === 'joule' ? '36px' : '0', marginRight: msg.sender === 'user' ? '36px' : '0' }}>
                      {msg.timestamp}
                    </div>

                    {/* Proactive Suggestions Pills */}
                    {msg.sender === 'joule' && msg.suggestions && msg.suggestions.length > 0 && (
                      <div style={{ marginTop: '8px', marginLeft: '36px', display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                        {msg.suggestions.map((sug, sIdx) => (
                          <button
                            key={sIdx}
                            onClick={() => handleSendMessage(sug)}
                            style={{
                              background: '#EFF6FF',
                              border: '1px solid #BFDBFE',
                              color: '#1D4ED8',
                              padding: '5px 10px',
                              borderRadius: '9999px',
                              fontSize: '11px',
                              fontWeight: 600,
                              cursor: 'pointer',
                              display: 'flex',
                              alignItems: 'center',
                              gap: '4px',
                              transition: 'all 0.15s ease',
                              textAlign: 'left',
                            }}
                            onMouseEnter={e => {
                              e.currentTarget.style.background = '#DBEAFE';
                              e.currentTarget.style.transform = 'translateY(-1px)';
                            }}
                            onMouseLeave={e => {
                              e.currentTarget.style.background = '#EFF6FF';
                              e.currentTarget.style.transform = 'translateY(0)';
                            }}
                          >
                            <span>💡 {sug}</span>
                            <ArrowRight size={11} />
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                ))}

                {isLoading && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginLeft: '4px' }}>
                    <div style={{ width: '28px', height: '28px', borderRadius: '50%', background: '#0854A0', color: '#FFFFFF', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <Bot size={15} />
                    </div>
                    <div style={{ background: '#FFFFFF', border: '1px solid #E2E8F0', padding: '8px 14px', borderRadius: '12px', fontSize: '12px', color: '#64748B', display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <span style={{ display: 'inline-block', width: '6px', height: '6px', borderRadius: '50%', background: '#0854A0', animation: 'ping 1s infinite' }}></span>
                      <span>Joule is querying SAP S/4HANA OData v4...</span>
                    </div>
                  </div>
                )}
                <div ref={messagesEndRef} />
              </div>

              {/* Chat Input Bar */}
              <div style={{ padding: '12px 16px', background: '#FFFFFF', borderTop: '1px solid #E2E8F0' }}>
                <form
                  onSubmit={e => {
                    e.preventDefault();
                    handleSendMessage();
                  }}
                  style={{ display: 'flex', alignItems: 'center', gap: '8px' }}
                >
                  <input
                    type="text"
                    value={inputPrompt}
                    onChange={e => setInputPrompt(e.target.value)}
                    placeholder="Ask Joule: 'what sales order open', 'distribute 2322'..."
                    style={{
                      flex: 1,
                      padding: '10px 14px',
                      fontSize: '13px',
                      borderRadius: '10px',
                      border: '1px solid #CBD5E1',
                      outline: 'none',
                      boxShadow: 'inset 0 1px 2px rgba(0,0,0,0.05)',
                    }}
                    disabled={isLoading}
                  />

                  <button
                    type="submit"
                    disabled={isLoading || !inputPrompt.trim()}
                    style={{
                      padding: '10px 14px',
                      borderRadius: '10px',
                      background: inputPrompt.trim() && !isLoading ? '#0854A0' : '#CBD5E1',
                      color: '#FFFFFF',
                      border: 'none',
                      fontWeight: 700,
                      cursor: inputPrompt.trim() && !isLoading ? 'pointer' : 'default',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '6px',
                      transition: 'background 0.2s ease',
                    }}
                  >
                    <span>Send</span>
                    <Send size={14} />
                  </button>
                </form>

                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '8px', fontSize: '11px', color: '#94A3B8' }}>
                  <span>Enterprise Joule LLM • 1 Box = 1 Ton Standard Payload</span>
                  <span style={{ display: 'flex', alignItems: 'center', gap: '3px' }}>
                    <ShieldCheck size={12} color="#10B981" />
                    <span>S/4HANA Guardrails Active</span>
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* VIEW MODE 2: Official SAP BTP Webclient */}
          {viewMode === 'btp_iframe' && (
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
          )}
        </div>
      )}
    </>
  );
};
