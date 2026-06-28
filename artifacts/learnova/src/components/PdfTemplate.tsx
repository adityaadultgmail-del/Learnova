import React from 'react';
import Markdown from 'react-markdown';

interface PdfTemplateProps {
  topic: string;
  notes: string;
}

export const PdfTemplate: React.FC<PdfTemplateProps> = ({ topic, notes }) => {
  const blue = '#0D3B94';
  const yellow = '#FFB300';

  return (
    <div
      style={{
        width: '210mm',
        minHeight: '297mm',
        backgroundColor: '#ffffff',
        fontFamily: "'Arial', 'Helvetica', sans-serif",
        position: 'relative',
        display: 'flex',
        flexDirection: 'column',
        boxSizing: 'border-box',
        overflow: 'hidden',
        margin: '0 auto',
      }}
    >
      {/* ── TOP-RIGHT corner decoration ── */}
      <div style={{ position: 'absolute', top: 0, right: 0, lineHeight: 0, zIndex: 1 }}>
        <svg width="220" height="170" viewBox="0 0 220 170" fill="none" xmlns="http://www.w3.org/2000/svg">
          {/* Blue rounded shape filling top-right corner */}
          <path
            d="M220 0 L220 170 Q220 170 140 170 Q60 170 0 100 L0 0 Z"
            fill={blue}
          />
          {/* Yellow accent wave inside the blue shape */}
          <path
            d="M220 120 L220 170 Q220 170 140 170 Q80 170 30 145 Q120 125 220 120 Z"
            fill={yellow}
          />
        </svg>
      </div>

      {/* ── HEADER ── */}
      <div style={{ padding: '28px 40px 0 36px', position: 'relative', zIndex: 2 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>

          {/* Left: logo + brand */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
            <img
              src="/logo.png"
              alt="Learnova"
              style={{ width: '80px', height: '80px', objectFit: 'contain' }}
            />
            <div>
              <div style={{ fontSize: '38px', fontWeight: '900', lineHeight: 1, letterSpacing: '-0.5px' }}>
                <span style={{ color: blue }}>Learn</span>
                <span style={{ color: yellow }}>nova</span>
              </div>
              <div style={{
                color: blue,
                fontSize: '12px',
                marginTop: '6px',
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                fontWeight: '500',
              }}>
                <span style={{ color: yellow, fontWeight: '700' }}>—</span>
                Learn Smarter, Achieve Better
                <span style={{ color: yellow, fontWeight: '700' }}>—</span>
              </div>
            </div>
          </div>

          {/* Right: quote block */}
          <div style={{
            border: `2px solid ${blue}`,
            borderRadius: '4px 20px 4px 20px',
            padding: '18px 22px',
            maxWidth: '210px',
            position: 'relative',
            marginRight: '80px',
          }}>
            {/* Opening quote mark */}
            <div style={{
              position: 'absolute',
              top: '-22px',
              left: '10px',
              fontSize: '52px',
              lineHeight: 1,
              color: blue,
              backgroundColor: '#fff',
              padding: '0 3px',
              fontFamily: 'Georgia, serif',
              fontWeight: '900',
            }}>"</div>

            <p style={{
              fontSize: '12.5px',
              textAlign: 'center',
              lineHeight: '1.7',
              margin: 0,
              color: '#1a1a2e',
            }}>
              The beautiful thing about{' '}
              <span style={{ color: blue, fontWeight: '600' }}>learning</span>{' '}
              is that no one can take it away from{' '}
              <span style={{ color: yellow, fontWeight: '600' }}>you</span>.
            </p>

            {/* Closing quote mark */}
            <div style={{
              position: 'absolute',
              bottom: '-24px',
              right: '10px',
              fontSize: '52px',
              lineHeight: 1,
              color: yellow,
              backgroundColor: '#fff',
              padding: '0 3px',
              fontFamily: 'Georgia, serif',
              fontWeight: '900',
            }}>"</div>
          </div>
        </div>

        {/* Yellow divider line */}
        <div style={{ height: '2px', backgroundColor: yellow, margin: '28px 0 20px 0' }} />
      </div>

      {/* ── NOTES CONTENT ── */}
      <div style={{
        flex: 1,
        padding: '4px 42px 200px 42px',
        position: 'relative',
        zIndex: 2,
      }}>
        <h1 style={{
          color: blue,
          fontSize: '20px',
          fontWeight: '800',
          marginBottom: '14px',
          marginTop: 0,
          textTransform: 'capitalize',
        }}>
          {topic}
        </h1>

        {/* Markdown prose — inline styles for print safety */}
        <div style={{ fontSize: '12.5px', lineHeight: '1.75', color: '#1a1a2e' }}>
          <style>{`
            .pdf-prose h1 { font-size: 18px; font-weight: 800; color: ${blue}; margin: 14px 0 6px; }
            .pdf-prose h2 { font-size: 15px; font-weight: 700; color: ${blue}; margin: 12px 0 5px; }
            .pdf-prose h3 { font-size: 13px; font-weight: 700; color: ${blue}; margin: 10px 0 4px; }
            .pdf-prose p  { margin: 5px 0; }
            .pdf-prose ul { padding-left: 18px; margin: 5px 0; list-style-type: disc; }
            .pdf-prose ol { padding-left: 18px; margin: 5px 0; list-style-type: decimal; }
            .pdf-prose li { margin: 3px 0; }
            .pdf-prose strong { font-weight: 700; color: #0a0a1a; }
            .pdf-prose em { font-style: italic; }
            .pdf-prose code { background: #f1f5f9; border-radius: 3px; padding: 1px 5px; font-size: 11px; font-family: monospace; }
            .pdf-prose pre  { background: #f1f5f9; border-radius: 6px; padding: 10px 14px; overflow-x: auto; margin: 8px 0; }
            .pdf-prose blockquote { border-left: 3px solid ${yellow}; padding-left: 12px; color: #555; margin: 8px 0; }
            .pdf-prose a { color: ${blue}; text-decoration: underline; }
            .pdf-prose hr { border: none; border-top: 1px solid #e2e8f0; margin: 10px 0; }
            .pdf-prose table { border-collapse: collapse; width: 100%; margin: 8px 0; font-size: 11.5px; }
            .pdf-prose th { background: ${blue}; color: #fff; padding: 6px 10px; text-align: left; }
            .pdf-prose td { border: 1px solid #e2e8f0; padding: 5px 10px; }
            .pdf-prose tr:nth-child(even) td { background: #f8fafc; }
          `}</style>
          <div className="pdf-prose">
            <Markdown>{notes}</Markdown>
          </div>
        </div>
      </div>

      {/* ── FOOTER ── */}
      <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, zIndex: 2 }}>
        {/* Footer top divider */}
        <div style={{ height: '1.5px', backgroundColor: blue, margin: '0 40px 14px 40px' }} />

        {/* Footer 4-column row */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '0 36px 20px 36px',
          gap: '12px',
        }}>

          {/* Col 1 — Copyright */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', minWidth: '120px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '5px', color: blue, fontWeight: '700', fontSize: '12.5px' }}>
              <span>©</span>
              <span>Learnova.co.in</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '5px', fontSize: '11px', color: '#555' }}>
              <span style={{ color: '#e00033' }}>♥</span>
              <span>Made with love in India</span>
            </div>
          </div>

          {/* Vertical separator */}
          <div style={{ width: '1px', height: '44px', backgroundColor: '#cbd5e1', flexShrink: 0 }} />

          {/* Col 2 — LinkedIn */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '9px' }}>
            {/* LinkedIn icon */}
            <div style={{
              width: '38px', height: '38px',
              backgroundColor: blue,
              borderRadius: '8px',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              flexShrink: 0,
            }}>
              <svg width="22" height="22" viewBox="0 0 24 24" fill="white">
                <path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6z"/>
                <rect x="2" y="9" width="4" height="12"/>
                <circle cx="4" cy="4" r="2"/>
              </svg>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1px' }}>
              <span style={{ fontSize: '11px', fontWeight: '700', color: '#1a1a2e' }}>Connect on LinkedIn</span>
              <span style={{ fontSize: '10px', color: blue }}>www.linkedin.com/in/</span>
              <span style={{ fontSize: '10px', color: blue }}>aditya-singh-130409aak</span>
            </div>
          </div>

          {/* Vertical separator */}
          <div style={{ width: '1px', height: '44px', backgroundColor: '#cbd5e1', flexShrink: 0 }} />

          {/* Col 3 — Website */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '9px' }}>
            <div style={{
              width: '38px', height: '38px',
              backgroundColor: '#e8f0fe',
              borderRadius: '50%',
              border: `2px solid ${blue}`,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              flexShrink: 0,
            }}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={blue} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="10"/>
                <line x1="2" y1="12" x2="22" y2="12"/>
                <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/>
              </svg>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '3px' }}>
              <span style={{ fontSize: '11px', fontWeight: '700', color: '#1a1a2e' }}>Visit Our Website</span>
              <span style={{ fontSize: '10.5px', color: blue, fontWeight: '600' }}>Learnova.vercel.app</span>
            </div>
          </div>

          {/* Vertical separator */}
          <div style={{ width: '1px', height: '44px', backgroundColor: '#cbd5e1', flexShrink: 0 }} />

          {/* Col 4 — Coffee To Code */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '9px' }}>
            <img
              src="/coffee-to-code.jpeg"
              alt="Coffee To Code"
              style={{ width: '38px', height: '38px', borderRadius: '8px', objectFit: 'cover', flexShrink: 0 }}
            />
            <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
              <span style={{ fontSize: '11px', fontWeight: '700', color: '#1a1a2e' }}>A Part Of</span>
              <span style={{ fontSize: '11px', fontWeight: '700', color: '#1a1a2e' }}>Coffee To Code</span>
            </div>
          </div>

        </div>

        {/* ── BOTTOM WAVE DECORATION ── */}
        <svg
          width="100%"
          height="54"
          viewBox="0 0 794 54"
          preserveAspectRatio="none"
          style={{ display: 'block' }}
          xmlns="http://www.w3.org/2000/svg"
        >
          {/* Yellow wave (back) */}
          <path d="M0 54 L0 28 Q100 0 200 22 Q350 50 500 18 Q650 -10 794 20 L794 54 Z" fill={yellow} />
          {/* Blue wave (front) */}
          <path d="M0 54 L0 36 Q130 8 280 30 Q420 52 560 26 Q680 4 794 30 L794 54 Z" fill={blue} />
        </svg>
      </div>
    </div>
  );
};
