'use client';

import { useState } from 'react';
import { Globe, Image, Share2, Mail, Save, Loader2 } from 'lucide-react';

const sections = [
  { id: 'general', label: 'General', icon: Globe },
  { id: 'seo', label: 'SEO', icon: Globe },
  { id: 'social', label: 'Social Links', icon: Share2 },
  { id: 'contact', label: 'Contact', icon: Mail },
];

export default function AdminSettingsPage() {
  const [activeTab, setActiveTab] = useState('general');
  const [saving, setSaving] = useState(false);

  const inputStyle: React.CSSProperties = {
    width: '100%', padding: '0.75rem 1rem',
    background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)',
    borderRadius: '10px', color: '#eef0f6', fontSize: '0.875rem',
    outline: 'none', transition: 'all 0.3s ease',
    fontFamily: "'Poppins', sans-serif",
  };

  const labelStyle: React.CSSProperties = {
    display: 'block', fontSize: '0.8125rem', fontWeight: 600,
    color: '#a89ec8', marginBottom: '0.5rem',
  };

  const handleSave = () => {
    setSaving(true);
    setTimeout(() => setSaving(false), 1500);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      <div>
        <h2 style={{ fontSize: '1.5rem', fontWeight: 800, color: '#eef0f6', marginBottom: '0.25rem' }}>Settings</h2>
        <p style={{ fontSize: '0.8125rem', color: '#6b5e88' }}>Manage website configuration</p>
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
        {sections.map((s) => (
          <button key={s.id} onClick={() => setActiveTab(s.id)} style={{
            display: 'flex', alignItems: 'center', gap: '0.5rem',
            padding: '0.5rem 1rem', borderRadius: '10px',
            fontSize: '0.8125rem', fontWeight: 600, cursor: 'pointer',
            background: activeTab === s.id
              ? 'linear-gradient(135deg, rgba(168,85,247,0.15), rgba(124,58,237,0.08))'
              : 'rgba(255,255,255,0.03)',
            border: activeTab === s.id
              ? '1px solid rgba(168,85,247,0.2)'
              : '1px solid rgba(255,255,255,0.06)',
            color: activeTab === s.id ? '#D8B4FE' : '#6b5e88',
            transition: 'all 0.2s ease',
            fontFamily: "'Poppins', sans-serif",
          }}>
            <s.icon style={{ width: 14, height: 14 }} />
            {s.label}
          </button>
        ))}
      </div>

      {/* Settings Form */}
      <div style={{
        background: 'linear-gradient(145deg, rgba(255,255,255,0.04) 0%, rgba(255,255,255,0.01) 100%)',
        border: '1px solid rgba(255,255,255,0.06)',
        borderRadius: '16px', padding: '1.5rem',
      }}>
        {activeTab === 'general' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
            <div>
              <label style={labelStyle}>Site Name</label>
              <input defaultValue="Sushant Ghadge" style={inputStyle}
                onFocus={(e) => e.currentTarget.style.borderColor = 'rgba(168,85,247,0.5)'}
                onBlur={(e) => e.currentTarget.style.borderColor = 'rgba(255,255,255,0.08)'} />
            </div>
            <div>
              <label style={labelStyle}>Site Tagline</label>
              <input defaultValue="Master Content Creation" style={inputStyle}
                onFocus={(e) => e.currentTarget.style.borderColor = 'rgba(168,85,247,0.5)'}
                onBlur={(e) => e.currentTarget.style.borderColor = 'rgba(255,255,255,0.08)'} />
            </div>
            <div>
              <label style={labelStyle}>Logo URL</label>
              <input placeholder="https://example.com/logo.png" style={inputStyle}
                onFocus={(e) => e.currentTarget.style.borderColor = 'rgba(168,85,247,0.5)'}
                onBlur={(e) => e.currentTarget.style.borderColor = 'rgba(255,255,255,0.08)'} />
            </div>
          </div>
        )}

        {activeTab === 'seo' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
            <div>
              <label style={labelStyle}>Meta Title</label>
              <input defaultValue="Sushant Ghadge — Content Creation Masterclass" style={inputStyle}
                onFocus={(e) => e.currentTarget.style.borderColor = 'rgba(168,85,247,0.5)'}
                onBlur={(e) => e.currentTarget.style.borderColor = 'rgba(255,255,255,0.08)'} />
            </div>
            <div>
              <label style={labelStyle}>Meta Description</label>
              <textarea rows={3} defaultValue="Learn content creation from Sushant Ghadge" style={{ ...inputStyle, resize: 'vertical' }}
                onFocus={(e) => e.currentTarget.style.borderColor = 'rgba(168,85,247,0.5)'}
                onBlur={(e) => e.currentTarget.style.borderColor = 'rgba(255,255,255,0.08)'} />
            </div>
            <div>
              <label style={labelStyle}>Google Analytics ID</label>
              <input placeholder="G-XXXXXXXXXX" style={inputStyle}
                onFocus={(e) => e.currentTarget.style.borderColor = 'rgba(168,85,247,0.5)'}
                onBlur={(e) => e.currentTarget.style.borderColor = 'rgba(255,255,255,0.08)'} />
            </div>
          </div>
        )}

        {activeTab === 'social' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
            {['Instagram', 'YouTube', 'Twitter / X', 'Facebook'].map((name) => (
              <div key={name}>
                <label style={labelStyle}>{name} URL</label>
                <input placeholder={`https://${name.toLowerCase().replace(/ \/ /g, '')}.com/...`} style={inputStyle}
                  onFocus={(e) => e.currentTarget.style.borderColor = 'rgba(168,85,247,0.5)'}
                  onBlur={(e) => e.currentTarget.style.borderColor = 'rgba(255,255,255,0.08)'} />
              </div>
            ))}
          </div>
        )}

        {activeTab === 'contact' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
            <div>
              <label style={labelStyle}>Support Email</label>
              <input defaultValue="contactsushantghadge@gmail.com" style={inputStyle}
                onFocus={(e) => e.currentTarget.style.borderColor = 'rgba(168,85,247,0.5)'}
                onBlur={(e) => e.currentTarget.style.borderColor = 'rgba(255,255,255,0.08)'} />
            </div>
            <div>
              <label style={labelStyle}>Phone Number</label>
              <input placeholder="+91 XXXXX XXXXX" style={inputStyle}
                onFocus={(e) => e.currentTarget.style.borderColor = 'rgba(168,85,247,0.5)'}
                onBlur={(e) => e.currentTarget.style.borderColor = 'rgba(255,255,255,0.08)'} />
            </div>
            <div>
              <label style={labelStyle}>Address</label>
              <textarea rows={2} placeholder="Office address..." style={{ ...inputStyle, resize: 'vertical' }}
                onFocus={(e) => e.currentTarget.style.borderColor = 'rgba(168,85,247,0.5)'}
                onBlur={(e) => e.currentTarget.style.borderColor = 'rgba(255,255,255,0.08)'} />
            </div>
          </div>
        )}

        {/* Save Button */}
        <div style={{ marginTop: '1.5rem', display: 'flex', justifyContent: 'flex-end' }}>
          <button onClick={handleSave} disabled={saving} style={{
            display: 'flex', alignItems: 'center', gap: '0.5rem',
            padding: '0.625rem 1.5rem',
            background: 'linear-gradient(135deg, #A855F7, #7C3AED)',
            border: 'none', borderRadius: '10px',
            color: '#fff', fontSize: '0.8125rem', fontWeight: 700,
            cursor: saving ? 'not-allowed' : 'pointer', opacity: saving ? 0.7 : 1,
            boxShadow: '0 4px 16px rgba(168,85,247,0.3)',
            fontFamily: "'Poppins', sans-serif",
          }}>
            {saving ? <Loader2 style={{ width: 16, height: 16, animation: 'spin 1s linear infinite' }} /> : <Save style={{ width: 16, height: 16 }} />}
            {saving ? 'Saving...' : 'Save Changes'}
          </button>
        </div>
      </div>
    </div>
  );
}
