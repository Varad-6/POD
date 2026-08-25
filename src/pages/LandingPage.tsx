import React from 'react';
import { useNavigate } from 'react-router-dom';
import { PodzoLogo } from '../components/branding/PodzoLogo';

export default function LandingPage() {
  const navigate = useNavigate();

  return (
    <div className="lp-hero-only">
      <div className="lp-hero-grid" />
      
      <div className="lp-hero-container">
        {/* Top Header Row with logo */}
        <header className="lp-header">
          <div className="lp-logo-box">
            <PodzoLogo variant="full" height={48} />
          </div>
        </header>

        {/* Center content */}
        <main className="lp-main">
          <h1 className="lp-hero-title">Let's make delivery&nbsp;simple.</h1>
          <p className="lp-hero-desc">
            End-to-end freight management connected to SAP S/4HANA.
            From gate-check to MIRO clearance — fully automated.
          </p>

          {/* Stat Pills */}
          <div className="lp-stats">
            <span className="lp-stat-pill">
              <strong>5</strong>&nbsp;Role Levels
            </span>
            <span className="lp-stat-pill">
              <strong>18+</strong>&nbsp;Pipeline Steps
            </span>
            <span className="lp-stat-pill">
              <strong>SAP</strong>&nbsp;S/4HANA Ready
            </span>
          </div>

          {/* Get Started Button */}
          <div className="lp-cta-wrap">
            <button 
              onClick={() => navigate('/login')} 
              className="lp-start-btn"
            >
              Get started
            </button>
          </div>
        </main>
      </div>

      <style>{`
        .lp-hero-only {
          min-height: 100vh;
          position: relative;
          background: linear-gradient(135deg, var(--color-brand-blue-600, #2F5FE0) 0%, var(--color-brand-blue-700, #2648B8) 100%);
          color: #FFFFFF;
          font-family: 'Inter', sans-serif;
          display: flex;
          flex-direction: column;
          overflow: hidden;
        }

        .lp-hero-grid {
          position: absolute;
          inset: 0;
          background-image: radial-gradient(circle, rgba(255,255,255,0.06) 1px, transparent 1px);
          background-size: 28px 28px;
          pointer-events: none;
        }

        .lp-hero-container {
          position: relative;
          z-index: 1;
          flex: 1;
          display: flex;
          flex-direction: column;
          max-width: 1200px;
          width: 100%;
          margin: 0 auto;
          padding: 2.5rem;
        }

        .lp-header {
          display: flex;
          align-items: center;
          margin-bottom: auto;
        }

        .lp-logo-box {
          display: inline-block;
          background: #FFFFFF;
          padding: 10px 18px;
          border-radius: 14px;
          box-shadow: 0 4px 16px rgba(47, 95, 224, 0.15);
        }

        .lp-main {
          margin-top: auto;
          margin-bottom: auto;
          max-width: 680px;
          display: flex;
          flex-direction: column;
          gap: 1.5rem;
        }

        .lp-hero-title {
          font-size: 3.5rem;
          font-weight: 850;
          line-height: 1.15;
          letter-spacing: -0.04em;
          margin: 0;
        }

        .lp-hero-desc {
          font-size: 1.15rem;
          line-height: 1.6;
          color: rgba(255, 255, 255, 0.85);
          margin: 0;
        }

        .lp-stats {
          display: flex;
          flex-wrap: wrap;
          gap: 10px;
          margin-top: 0.5rem;
        }

        .lp-stat-pill {
          display: inline-flex;
          align-items: center;
          gap: 4px;
          background: rgba(255, 255, 255, 0.12);
          border: 1px solid rgba(255, 255, 255, 0.18);
          color: #FFFFFF;
          border-radius: 9999px;
          padding: 6px 16px;
          font-size: 0.85rem;
          font-weight: 600;
        }

        .lp-stat-pill strong {
          color: #FFFFFF;
          font-weight: 800;
        }

        .lp-cta-wrap {
          margin-top: 1.5rem;
          margin-bottom: 2rem;
        }

        .lp-start-btn {
          background: #FFFFFF;
          color: var(--color-brand-blue-600, #2F5FE0);
          border: none;
          border-radius: 10px;
          height: 48px;
          padding: 0 32px;
          font-weight: 700;
          font-size: 1rem;
          font-family: inherit;
          cursor: pointer;
          transition: background 0.15s, transform 0.15s, box-shadow 0.15s;
          display: inline-flex;
          align-items: center;
          justify-content: center;
        }

        .lp-start-btn:hover {
          background: var(--color-brand-blue-50, #EEF2FE);
          transform: translateY(-1px);
          box-shadow: 0 8px 24px rgba(255, 255, 255, 0.2);
        }

        .lp-start-btn:focus {
          outline: none;
          box-shadow: 0 0 0 3px rgba(255, 255, 255, 0.4);
        }

        @media (max-width: 640px) {
          .lp-hero-container {
            padding: 1.5rem;
          }
          
          .lp-hero-title {
            font-size: 2.5rem;
          }
          
          .lp-hero-desc {
            font-size: 1rem;
          }
          
          .lp-start-btn {
            width: 100%;
          }
        }
      `}</style>
    </div>
  );
}
