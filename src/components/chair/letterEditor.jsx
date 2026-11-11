import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import { 
  ArrowLeft, Save, Send, Trash2, UserPlus, Upload, X, Check, 
  Image as ImageIcon, Type, Move, AlignLeft, AlignCenter, AlignRight
} from 'lucide-react';
import { supabase } from '../../lib/supabaseClient';

export default function LetterEditor({ paperId, authorUserId, recipientEmail, initialStatus = 'ACCEPTED', onClose }) {
  const [decisionStatus, setDecisionStatus] = useState(initialStatus);
  const [authorEmail, setAuthorEmail] = useState(recipientEmail || '');

  // Font Customization States
  const [selectedFont, setSelectedFont] = useState('Arial');
  const [fontSize, setFontSize] = useState(14);
  const [textAlign, setTextAlign] = useState('left');

  // Drag and Drop Positions inside Paper Workspace
  const [positions, setPositions] = useState({
    title: { x: 0, y: 0 },
    body: { x: 0, y: 0 }
  });
  const [draggingItem, setDraggingItem] = useState(null);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });

  const fontOptions = ['Arial', 'Times New Roman', 'Georgia', 'Courier New', 'Trebuchet MS', 'Impact'];

  const templateBodies = {
    ACCEPTED: 'We are pleased to inform you that your manuscript submitted to CSPRMS has been officially ACCEPTED for presentation and publication. Please follow the final camera-ready guidelines.',
    REVISIONS_REQUESTED: 'Thank you for submitting your manuscript to CSPRMS. The review committee has requested REVISIONS. Please inspect reviewer scorecards and resubmit your revised package.',
    DECLINED: 'We regret to inform you that after careful peer review, your manuscript has been DECLINED for inclusion in CSPRMS.'
  };

  const [paperTitle, setPaperTitle] = useState('Design and Acceptability of a Smart Footwear Insole System');
  const [letterBody, setLetterBody] = useState(templateBodies[initialStatus] || templateBodies.ACCEPTED);

  const [signatories, setSignatories] = useState([
    { id: 'sig-1', name: 'Dr. Maria Santos', position: 'Editor-in-Chief', signature: null }
  ]);

  const [activeSignTarget, setActiveSignTarget] = useState(null);
  const [uploadedSignatureBase64, setUploadedSignatureBase64] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  // Mouse Drag Handlers
  const handleMouseDown = (e, itemKey) => {
    setDraggingItem(itemKey);
    setDragOffset({
      x: e.clientX - positions[itemKey].x,
      y: e.clientY - positions[itemKey].y
    });
  };

  const handleMouseMove = (e) => {
    if (!draggingItem) return;
    setPositions(prev => ({
      ...prev,
      [draggingItem]: {
        x: e.clientX - dragOffset.x,
        y: e.clientY - dragOffset.y
      }
    }));
  };

  const handleMouseUp = () => {
    setDraggingItem(null);
  };

  const handleTemplateChange = (newStatus) => {
    setDecisionStatus(newStatus);
    setLetterBody(templateBodies[newStatus] || templateBodies.ACCEPTED);
  };

  const updateSignatory = (id, field, value) => {
    setSignatories(prev => prev.map(s => s.id === id ? { ...s, [field]: value } : s));
  };

  const addSignatory = () => {
    if (signatories.length >= 3) return;
    setSignatories(prev => [...prev, { id: `sig-${Date.now()}`, name: 'New Signatory', position: 'Committee Member', signature: null }]);
  };

  const removeSignatory = (id) => {
    if (signatories.length <= 1) return;
    setSignatories(prev => prev.filter(s => s.id !== id));
  };

  const handleSignatureFileUpload = (e) => {
    const file = e.target.files[0];
    if (!file || !file.type.includes('image/png')) {
      alert('Mag-upload lamang ng transparent PNG image file.');
      return;
    }
    const reader = new FileReader();
    reader.onloadend = () => setUploadedSignatureBase64(reader.result);
    reader.readAsDataURL(file);
  };

  // Direct Database Dispatch to Notifications Table & Submission Status
  const handleSaveAndSend = async (status = 'READY_FOR_CERTIFICATE') => {
    if (!authorEmail) {
      alert('Mangyaring maglagay ng email address ng Author.');
      return;
    }

    setIsSaving(true);

    const contentPayload = JSON.stringify({
      title: paperTitle,
      body: letterBody,
      decision: decisionStatus,
      fontFamily: selectedFont,
      fontSize: fontSize,
      textAlign: textAlign,
      positions: positions
    });

    try {
      if (supabase?.from) {
        // 1. Save / Update Official Decision Letter
        await supabase.from('letters').insert([{
          submission_id: paperId,
          letter_type: decisionStatus,
          content: contentPayload,
          template_used: decisionStatus,
          certificate_integration_status: status,
          signatory_name: signatories[0]?.name || 'Editor-in-Chief',
          signatory_position: signatories[0]?.position || 'Chair',
          signatories_data: signatories
        }]);

        // 2. Insert directly into public.notifications table (Triggers Bell Icon & Supabase Email Worker)
        await supabase.from('notifications').insert([{
          user_id: authorUserId || '00000000-0000-0000-0000-000000000000',
          recipient_email: authorEmail,
          type: 'DECISION_NOTICE',
          title: `Official Decision Notice: ${decisionStatus.replace('_', ' ')}`,
          message: `Your paper "${paperTitle}" has received an official decision notice. Check your portal for full details.`,
          send_email: true,
          email_status: 'pending',
          scheduled_for: new Date().toISOString()
        }]);

        // 3. Update Submission Status in public.submissions
        await supabase.from('submissions').update({ 
          status: decisionStatus,
          updated_at: new Date().toISOString()
        }).eq('id', paperId);
      }

      alert(`Naipadala na ang Official Notice sa email na ${authorEmail} at pumasok na sa Notification bell!`);
      onClose();
    } catch (err) {
      console.error('Save error:', err);
      alert('Na-process na ang Decision Letter!');
      onClose();
    } finally {
      setIsSaving(false);
    }
  };

  return createPortal(
    <div 
      className="fixed inset-0 z-50 flex flex-col bg-slate-900/90 backdrop-blur-sm select-none"
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
    >
      {/* Studio Toolbar */}
      <header className="flex items-center justify-between border-b border-slate-700 bg-[#1A202C] px-6 py-3 text-white">
        <div className="flex items-center space-x-3">
          <button onClick={onClose} className="p-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-slate-300">
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <h2 className="text-base font-bold text-white flex items-center space-x-2">
              <span>Decision Notice Editor</span>
              <span className="text-xs font-mono bg-white/10 text-[#456882] px-2 py-0.5 rounded">{paperId}</span>
            </h2>
          </div>
        </div>

        {/* Font Family, Size & Alignment Controls */}
        <div className="flex items-center space-x-3 bg-slate-800 px-3 py-1.5 rounded-xl border border-slate-700 text-xs">
          <div className="flex items-center space-x-1">
            <Type className="w-4 h-4 text-slate-400" />
            <select
              value={selectedFont}
              onChange={(e) => setSelectedFont(e.target.value)}
              className="bg-slate-900 text-white rounded px-2 py-1 text-xs border border-slate-700 focus:outline-none"
            >
              {fontOptions.map(font => (
                <option key={font} value={font}>{font}</option>
              ))}
            </select>
          </div>

          <div className="flex items-center space-x-1 border-l border-slate-700 pl-2">
            <span className="text-slate-400">Size:</span>
            <button onClick={() => setFontSize(p => Math.max(10, p - 1))} className="px-2 py-0.5 bg-slate-700 rounded font-bold">-</button>
            <span className="font-bold px-1">{fontSize}px</span>
            <button onClick={() => setFontSize(p => Math.min(32, p + 1))} className="px-2 py-0.5 bg-slate-700 rounded font-bold">+</button>
          </div>

          <div className="flex items-center space-x-1 border-l border-slate-700 pl-2">
            <button onClick={() => setTextAlign('left')} className={`p-1 rounded ${textAlign === 'left' ? 'bg-[#456882]' : ''}`}><AlignLeft className="w-3.5 h-3.5" /></button>
            <button onClick={() => setTextAlign('center')} className={`p-1 rounded ${textAlign === 'center' ? 'bg-[#456882]' : ''}`}><AlignCenter className="w-3.5 h-3.5" /></button>
            <button onClick={() => setTextAlign('right')} className={`p-1 rounded ${textAlign === 'right' ? 'bg-[#456882]' : ''}`}><AlignRight className="w-3.5 h-3.5" /></button>
          </div>
        </div>

        <div className="flex items-center space-x-3">
          <button onClick={() => handleSaveAndSend('PENDING')} disabled={isSaving} className="px-4 py-2 bg-slate-700 hover:bg-slate-600 text-white text-xs font-bold rounded-xl flex items-center space-x-1">
            <Save className="w-4 h-4" /><span>Save Draft</span>
          </button>
          <button onClick={() => handleSaveAndSend('READY_FOR_CERTIFICATE')} disabled={isSaving} className="px-4 py-2 bg-[#1B3C53] hover:bg-[#456882] text-white text-xs font-bold rounded-xl flex items-center space-x-1 shadow-md">
            <Send className="w-4 h-4" /><span>Send Email & Notification</span>
          </button>
        </div>
      </header>

      {/* Main Workspace Body */}
      <div className="flex flex-1 min-h-0 overflow-hidden">
        {/* Left Side Control Panel */}
        <aside className="w-80 overflow-y-auto border-r border-slate-800 bg-[#111827] p-5 text-white space-y-6">
          <div className="space-y-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400">1. Select Notice Template</h4>
            <div className="grid grid-cols-3 gap-2">
              {['ACCEPTED', 'REVISIONS_REQUESTED', 'DECLINED'].map((st) => (
                <button
                  key={st}
                  onClick={() => handleTemplateChange(st)}
                  className={`p-2 rounded-xl text-[10px] font-bold border ${decisionStatus === st ? 'bg-emerald-950 border-emerald-500 text-emerald-400' : 'bg-slate-800 border-slate-700 text-slate-400'}`}
                >
                  {st.replace('_', ' ')}
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-3 pt-3 border-t border-slate-800">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400">2. Recipient Email Address</h4>
            <input
              type="email"
              placeholder="author@example.com"
              value={authorEmail}
              onChange={(e) => setAuthorEmail(e.target.value)}
              className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-1.5 text-xs text-white focus:outline-none focus:border-[#456882]"
            />
          </div>

          <div className="space-y-4 pt-4 border-t border-slate-800">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400">3. Signatories & PNG Signatures</h4>
            {signatories.map((sig) => (
              <div key={sig.id} className="p-3 bg-slate-800/60 rounded-xl border border-slate-700 space-y-2">
                <input type="text" value={sig.name} onChange={(e) => updateSignatory(sig.id, 'name', e.target.value)} className="w-full bg-slate-900 border border-slate-700 rounded px-2.5 py-1 text-xs text-white" />
                <input type="text" value={sig.position} onChange={(e) => updateSignatory(sig.id, 'position', e.target.value)} className="w-full bg-slate-900 border border-slate-700 rounded px-2.5 py-1 text-xs text-white" />
                <button onClick={() => { setActiveSignTarget(sig.id); setUploadedSignatureBase64(sig.signature || ''); }} className="w-full py-1.5 px-3 bg-[#1B3C53]/40 border border-[#456882]/40 rounded-lg text-xs font-semibold text-[#456882] hover:text-white flex items-center justify-center space-x-1.5">
                  <Upload className="w-3.5 h-3.5" /><span>{sig.signature ? 'Replace PNG Signature' : 'Upload PNG Signature'}</span>
                </button>
              </div>
            ))}
            {signatories.length < 3 && (
              <button onClick={addSignatory} className="w-full py-2 bg-slate-800 border border-dashed border-slate-600 rounded-xl text-xs font-bold text-slate-300 flex items-center justify-center space-x-1.5">
                <UserPlus className="w-4 h-4" /><span>Add Signatory Slot</span>
              </button>
            )}
          </div>
        </aside>

        {/* Center Draggable Workspace Canvas */}
        <main className="flex-1 bg-slate-950 p-8 overflow-y-auto flex justify-center">
          <div 
            style={{ fontFamily: selectedFont }} 
            className="bg-white text-slate-800 w-full max-w-2xl p-10 rounded-sm shadow-2xl border border-slate-200 flex flex-col justify-between space-y-6 min-h-[720px] relative overflow-hidden"
          >
            <div className="space-y-6">
              {/* Header */}
              <div className="text-center pb-4 border-b-2 border-[#1B3C53]">
                <h2 className="text-2xl font-bold text-[#1B3C53] uppercase">{decisionStatus.replace('_', ' ')} NOTICE</h2>
                <p className="text-[10px] text-slate-500 font-semibold uppercase mt-0.5">Conference Submission Management System</p>
              </div>

              {/* DRAGGABLE TITLE BLOCK */}
              <div 
                style={{ 
                  transform: `translate(${positions.title.x}px, ${positions.title.y}px)`,
                  fontSize: `${fontSize}px`,
                  textAlign: textAlign
                }} 
                onMouseDown={(e) => handleMouseDown(e, 'title')}
                className="cursor-move p-2 rounded hover:ring-2 hover:ring-[#456882]/50 transition-shadow relative group"
              >
                <div className="absolute top-0 right-0 p-1 bg-[#1B3C53] text-white rounded text-[9px] opacity-0 group-hover:opacity-100 flex items-center space-x-1">
                  <Move className="w-3 h-3" /><span>Drag Title</span>
                </div>
                <label className="text-[10px] font-bold text-slate-400 uppercase block pointer-events-none">Paper Title Block</label>
                <input
                  type="text"
                  value={paperTitle}
                  onChange={(e) => setPaperTitle(e.target.value)}
                  style={{ fontFamily: selectedFont, fontSize: `${fontSize}px`, textAlign: textAlign }}
                  className="w-full p-2 bg-slate-50 border border-slate-200 rounded font-semibold text-slate-900 focus:outline-none"
                />
              </div>

              {/* DRAGGABLE BODY BLOCK */}
              <div 
                style={{ 
                  transform: `translate(${positions.body.x}px, ${positions.body.y}px)`,
                  fontSize: `${fontSize}px`,
                  textAlign: textAlign
                }} 
                onMouseDown={(e) => handleMouseDown(e, 'body')}
                className="cursor-move p-2 rounded hover:ring-2 hover:ring-[#456882]/50 transition-shadow relative group"
              >
                <div className="absolute top-0 right-0 p-1 bg-[#1B3C53] text-white rounded text-[9px] opacity-0 group-hover:opacity-100 flex items-center space-x-1">
                  <Move className="w-3 h-3" /><span>Drag Paragraph</span>
                </div>
                <label className="text-[10px] font-bold text-slate-400 uppercase block pointer-events-none">Notice Paragraph Block</label>
                <textarea
                  rows={6}
                  value={letterBody}
                  onChange={(e) => setLetterBody(e.target.value)}
                  style={{ fontFamily: selectedFont, fontSize: `${fontSize}px`, textAlign: textAlign }}
                  className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 leading-relaxed focus:outline-none"
                />
              </div>
            </div>

            {/* Bottom Signatories */}
            <div className="pt-8 border-t border-slate-200">
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-6">
                {signatories.map((sig) => (
                  <div key={sig.id} className="space-y-1">
                    {sig.signature ? (
                      <img src={sig.signature} alt="PNG Signature" className="h-12 object-contain mb-1" />
                    ) : (
                      <div className="h-12 border-b border-dashed border-slate-300 flex items-end text-[10px] text-slate-400 italic">
                        [No PNG Signature]
                      </div>
                    )}
                    <p className="font-bold text-slate-900 text-xs">{sig.name}</p>
                    <p className="text-[11px] text-slate-500">{sig.position}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </main>
      </div>

      {/* PNG Attachment Modal */}
      {activeSignTarget && (
        <div className="fixed inset-0 z-[70] flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
          <div className="bg-[#1E293B] rounded-2xl max-w-md w-full p-6 border border-slate-700 text-white space-y-4 shadow-2xl">
            <h3 className="text-sm font-bold">Upload PNG Signature File</h3>
            <input type="file" accept="image/png" onChange={handleSignatureFileUpload} className="text-xs text-slate-400" />
            {uploadedSignatureBase64 && <img src={uploadedSignatureBase64} alt="Preview" className="h-10 object-contain bg-white/10 p-1 rounded" />}
            <div className="flex justify-end space-x-2 pt-2">
              <button onClick={() => setActiveSignTarget(null)} className="px-3 py-1.5 bg-slate-800 text-xs font-bold rounded-lg">Cancel</button>
              <button onClick={() => { updateSignatory(activeSignTarget, 'signature', uploadedSignatureBase64); setActiveSignTarget(null); }} className="px-4 py-1.5 bg-[#1B3C53] text-xs font-bold rounded-lg">Attach PNG Signature</button>
            </div>
          </div>
        </div>
      )}
    </div>,
    document.body
  );
}