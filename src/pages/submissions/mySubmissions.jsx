import React, { useState, useEffect } from 'react';
import {
  FileText, RefreshCw, CheckCircle2, RotateCcw,
  X, FilePlus, BarChart2, FileCheck, UploadCloud,
  Send, Eye, GraduationCap, Trash2, Inbox
} from 'lucide-react';

import { supabase } from '../../lib/supabaseClient';

export default function MySubmissions() {
  const [activeSubTab, setActiveSubTab] = useState('Author Submission Form');
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [lastUpdated, setLastUpdated] = useState(new Date().toLocaleTimeString());

  const [papers, setPapers] = useState([]);
  const [selectedPaper, setSelectedPaper] = useState(null);
  const [showNoticeViewer, setShowNoticeViewer] = useState(false);
  const [fetchedLetterDoc, setFetchedLetterDoc] = useState(null);
  const [isLoadingNotice, setIsLoadingNotice] = useState(false);

  // Form State
  const [newPaperTitle, setNewPaperTitle] = useState('');
  const [newPaperCategory, setNewPaperCategory] = useState('');
  const [leadAuthor, setLeadAuthor] = useState('');
  const [newPaperAbstract, setNewPaperAbstract] = useState('');
  const [uploadedFile, setUploadedFile] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmittedSuccess, setIsSubmittedSuccess] = useState(false);

  useEffect(() => {
    fetchMySubmissions();
  }, []);

  const fetchMySubmissions = async () => {
    setIsRefreshing(true);
    try {
      if (supabase?.from) {
        const { data: authData } = await supabase.auth.getUser();
        const currentUser = authData?.user;

        let query = supabase
          .from('submissions')
          .select('*')
          .order('created_at', { ascending: false });

        // Filter by author if logged in
        if (currentUser?.id) {
          query = query.eq('author_id', currentUser.id);
        }

        const { data, error } = await query;

        if (error) {
          console.error('Error fetching submissions:', error);
          setPapers([]);
        } else if (data) {
          const mapped = data.map((sub) => ({
            id: sub.tracking_number || sub.id,
            rawId: sub.id,
            title: sub.title,
            authors: [leadAuthor || 'Author'],
            tags: Array.isArray(sub.keywords) ? sub.keywords : [sub.track_sector || 'Research'],
            submittedDate: new Date(sub.created_at).toLocaleDateString(),
            status: sub.status || 'SUBMITTED',
            badgeClass: sub.status === 'ACCEPTED' ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800',
            abstract: sub.abstract
          }));
          setPapers(mapped);
        }
      }
    } catch (err) {
      console.error('Fetch exception:', err);
      setPapers([]);
    } finally {
      setIsRefreshing(false);
      setLastUpdated(new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }));
    }
  };

  // Fixed Form Submission to Supabase
  const handleFormSubmit = async (e) => {
    e.preventDefault();
    if (!newPaperTitle || !newPaperAbstract) {
      alert('Pakipuno ang Title at Abstract summary.');
      return;
    }

    setIsSubmitting(true);

    try {
      const { data: authData, error: authErr } = await supabase.auth.getUser();
      const currentUser = authData?.user;

      if (!currentUser) {
        alert('Mangyaring mag-login muna bago mag-submit.');
        setIsSubmitting(false);
        return;
      }

      if (supabase?.from) {
        const trackingNum = `CSPRMS-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`;

        // 1. Insert directly into public.submissions (track_sector set to null to avoid Foreign Key constraint crash)
        const { data: insertedSub, error: subError } = await supabase
          .from('submissions')
          .insert([{
            author_id: currentUser.id,
            tracking_number: trackingNum,
            title: newPaperTitle,
            abstract: newPaperAbstract,
            keywords: newPaperCategory ? [newPaperCategory] : ['General'],
            track_sector: null, // Set to null to pass Foreign Key constraint if tracks table has strict codes
            status: 'SUBMITTED'
          }])
          .select();

        if (subError) {
          console.error('Submissions insert error:', subError);
          alert(`Failed to save submission: ${subError.message}`);
          setIsSubmitting(false);
          return;
        }

        // 2. Dispatch Notification record to public.notifications
        await supabase.from('notifications').insert([{
          user_id: currentUser.id,
          recipient_email: currentUser.email,
          type: 'SUBMISSION_CREATED',
          title: 'Paper Submission Received',
          message: `Your manuscript "${newPaperTitle}" (${trackingNum}) was successfully submitted for review.`,
          send_email: true,
          email_status: 'pending'
        }]);

        setIsSubmittedSuccess(true);
        setTimeout(() => {
          setIsSubmittedSuccess(false);
          setNewPaperTitle('');
          setNewPaperCategory('');
          setLeadAuthor('');
          setNewPaperAbstract('');
          setUploadedFile(null);
          fetchMySubmissions();
          setActiveSubTab('Author Tracking');
        }, 1200);
      }
    } catch (err) {
      console.error('Submit error:', err);
      alert('Nagkaroon ng error sa pag-save ng submission.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleOpenNotice = async (paper) => {
    setSelectedPaper(paper);
    setShowNoticeViewer(true);
    setIsLoadingNotice(true);

    try {
      if (supabase?.from) {
        const { data } = await supabase
          .from('letters')
          .select('*')
          .eq('submission_id', paper.rawId || paper.id)
          .order('generated_at', { ascending: false })
          .limit(1);

        if (data && data.length > 0) {
          const letterRecord = data[0];
          const parsedContent = typeof letterRecord.content === 'string'
            ? JSON.parse(letterRecord.content)
            : letterRecord.content;

          setFetchedLetterDoc({
            ...parsedContent,
            signatories: letterRecord.signatories_data || parsedContent.signatories || []
          });
        } else {
          setFetchedLetterDoc(null);
        }
      }
    } catch (err) {
      console.error('Error fetching decision letter:', err);
      setFetchedLetterDoc(null);
    } finally {
      setIsLoadingNotice(false);
    }
  };

  return (
    <div className="w-full pt-6 pb-12 px-4 sm:px-6 md:px-8 space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-[#D2C1B6]/30">
        <div>
          <h1 className="text-2xl font-bold text-black">My Submissions</h1>
          <p className="text-xs text-slate-500 mt-1">Track paper status, reviewer telemetry, and official decision notices.</p>
        </div>
        
        <div className="flex items-center space-x-3">
          <div className="flex items-center space-x-2 bg-white px-3 py-1.5 rounded-xl text-xs font-semibold text-slate-600 border shadow-sm">
            <span>Updated: {lastUpdated}</span>
            <button onClick={fetchMySubmissions} className="p-1 hover:bg-[#F9F3EF] rounded"><RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? 'animate-spin' : ''}`} /></button>
          </div>
        </div>
      </div>

      <div className="bg-white p-1.5 rounded-2xl border flex flex-col sm:flex-row gap-1">
        {[
          { id: 'Author Submission Form', label: 'Author Submission Form', icon: FilePlus },
          { id: 'Author Tracking', label: 'Author Tracking', icon: BarChart2 },
          { id: 'Feedback and Revision', label: 'Feedback and Revision', icon: FileCheck },
        ].map(st => {
          const Icon = st.icon;
          return (
            <button
              key={st.id}
              onClick={() => setActiveSubTab(st.id)}
              className={`flex-1 flex items-center justify-center space-x-2 py-2.5 px-4 rounded-xl text-xs font-bold transition-all ${
                activeSubTab === st.id ? 'bg-[#1B3C53] text-white shadow-md' : 'text-slate-600 hover:bg-[#F9F3EF]'
              }`}
            >
              <Icon className="w-4 h-4" /><span>{st.label}</span>
            </button>
          );
        })}
      </div>

      {/* TAB 1: AUTHOR SUBMISSION FORM */}
      {activeSubTab === 'Author Submission Form' && (
        <div className="bg-white rounded-2xl p-6 border border-[#D2C1B6]/40 shadow-sm space-y-6">
          <div className="border-b border-slate-100 pb-4">
            <h3 className="text-lg font-semibold text-black flex items-center space-x-2">
              <FilePlus className="w-5 h-5 text-[#456882]" />
              <span>Submit New Manuscript</span>
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">Complete submission details to enter peer-review workflow.</p>
          </div>

          {isSubmittedSuccess && (
            <div className="p-4 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl flex items-center space-x-3">
              <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
              <span className="text-xs font-semibold">Manuscript successfully saved to database! Redirecting...</span>
            </div>
          )}

          <form onSubmit={handleFormSubmit} className="space-y-5">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1.5 md:col-span-2">
                <label className="text-xs font-bold text-[#1B3C53]">Paper Title *</label>
                <input
                  type="text"
                  required
                  value={newPaperTitle}
                  onChange={(e) => setNewPaperTitle(e.target.value)}
                  placeholder="Enter full title of paper..."
                  className="w-full px-4 py-2.5 bg-[#F9F3EF] border border-[#D2C1B6]/40 rounded-xl text-xs font-medium text-slate-800 focus:outline-none focus:border-[#456882]"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-[#1B3C53]">Research Keywords / Category *</label>
                <input
                  type="text"
                  required
                  value={newPaperCategory}
                  onChange={(e) => setNewPaperCategory(e.target.value)}
                  placeholder="Computer Engineering / IT..."
                  className="w-full px-4 py-2.5 bg-[#F9F3EF] border border-[#D2C1B6]/40 rounded-xl text-xs font-medium text-slate-800 focus:outline-none focus:border-[#456882]"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-[#1B3C53]">Lead Author *</label>
                <input
                  type="text"
                  required
                  value={leadAuthor}
                  onChange={(e) => setLeadAuthor(e.target.value)}
                  placeholder="Kristel Anne E. Soriano..."
                  className="w-full px-4 py-2.5 bg-[#F9F3EF] border border-[#D2C1B6]/40 rounded-xl text-xs font-medium text-slate-800 focus:outline-none focus:border-[#456882]"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-[#1B3C53]">Abstract Summary *</label>
              <textarea
                rows={4}
                required
                value={newPaperAbstract}
                onChange={(e) => setNewPaperAbstract(e.target.value)}
                placeholder="Provide brief abstract (max 250 words)..."
                className="w-full px-4 py-2.5 bg-[#F9F3EF] border border-[#D2C1B6]/40 rounded-xl text-xs font-medium text-slate-800 focus:outline-none focus:border-[#456882]"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-[#1B3C53]">Manuscript File (PDF or DOCX) *</label>
              <div className="border-2 border-dashed border-[#D2C1B6] bg-[#F9F3EF]/50 hover:bg-[#F9F3EF] rounded-2xl p-6 text-center cursor-pointer transition-colors">
                <UploadCloud className="w-8 h-8 text-[#456882] mx-auto mb-2" />
                <p className="text-xs font-bold text-[#1B3C53]">Drag & drop manuscript file here, or click to browse</p>
                <input
                  type="file"
                  className="hidden"
                  id="file-upload"
                  onChange={(e) => setUploadedFile(e.target.files[0]?.name || 'Manuscript_v1.pdf')}
                />
                <label htmlFor="file-upload" className="mt-3 inline-block px-4 py-1.5 bg-[#456882] text-white text-xs font-semibold rounded-lg cursor-pointer">
                  {uploadedFile ? uploadedFile : 'Select File'}
                </label>
              </div>
            </div>

            <div className="flex justify-end space-x-3 pt-3 border-t border-slate-100">
              <button
                type="submit"
                disabled={isSubmitting}
                className="px-6 py-2.5 text-xs font-bold text-white bg-[#1B3C53] hover:bg-[#456882] rounded-xl flex items-center space-x-2 disabled:opacity-50"
              >
                <Send className="w-3.5 h-3.5" />
                <span>{isSubmitting ? 'Saving to Database...' : 'Submit Paper'}</span>
              </button>
            </div>
          </form>
        </div>
      )}

      {/* TAB 2: AUTHOR TRACKING */}
      {activeSubTab === 'Author Tracking' && (
        <div className="space-y-4">
          {papers.length === 0 ? (
            <div className="bg-white rounded-2xl p-12 border border-slate-200 text-center space-y-2">
              <Inbox className="w-10 h-10 text-slate-300 mx-auto" />
              <h4 className="text-sm font-bold text-slate-700">Wala ka pang na-submit na paper</h4>
              <p className="text-xs text-slate-400">Pumunta sa Author Submission Form tab para mag-submit ng bago!</p>
            </div>
          ) : (
            papers.map(paper => (
              <div key={paper.id} className="bg-white rounded-2xl p-5 border shadow-sm space-y-4">
                <div className="flex justify-between items-start">
                  <div>
                    <span className="text-xs font-mono font-bold text-[#456882] bg-[#456882]/10 px-2 py-0.5 rounded">{paper.id}</span>
                    <h3 className="text-base font-bold text-black mt-1">{paper.title}</h3>
                  </div>
                  <span className={`text-xs font-bold px-3 py-1 rounded-full border ${paper.badgeClass}`}>{paper.status}</span>
                </div>

                <div className="flex justify-end pt-2">
                  <button onClick={() => handleOpenNotice(paper)} className="px-4 py-2 bg-[#1B3C53] text-white text-xs font-bold rounded-xl flex items-center space-x-1.5">
                    <Eye className="w-4 h-4" /><span>View Official Notice</span>
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {/* NOTICE VIEWER MODAL */}
      {showNoticeViewer && selectedPaper && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/70 backdrop-blur-md">
          <div className="bg-[#2D3748] rounded-2xl max-w-3xl w-full max-h-[92vh] flex flex-col overflow-hidden shadow-2xl border border-slate-700">
            <div className="px-4 py-2.5 bg-[#1A202C] text-white flex items-center justify-between text-xs border-b border-slate-700">
              <span className="font-mono font-semibold">{selectedPaper.id}_Official_Notice.pdf</span>
              <button onClick={() => setShowNoticeViewer(false)} className="hover:text-white p-1 rounded bg-white/10"><X className="w-4 h-4" /></button>
            </div>

            <div className="p-6 md:p-8 bg-slate-100 overflow-y-auto flex-1 flex justify-center">
              {isLoadingNotice ? (
                <div className="py-12"><RefreshCw className="w-8 h-8 text-[#1B3C53] animate-spin" /></div>
              ) : (
                <div style={{ fontFamily: fetchedLetterDoc?.fontFamily || 'Arial' }} className="bg-white w-full max-w-2xl p-8 md:p-10 shadow-lg rounded-sm border text-slate-800 space-y-6">
                  <div className="text-center pb-4 border-b-2 border-[#1B3C53]">
                    <h2 className="text-2xl font-bold text-[#1B3C53]">{fetchedLetterDoc?.headline || 'CSPRMS OFFICIAL NOTICE'}</h2>
                  </div>

                  <div style={{ fontSize: `${fetchedLetterDoc?.fontSize || 13}px`, textAlign: fetchedLetterDoc?.textAlign || 'left' }} className="space-y-4 leading-relaxed">
                    <p><strong>Paper Title:</strong> "{fetchedLetterDoc?.title || selectedPaper.title}"</p>
                    <div className="p-4 bg-slate-50 border-l-4 border-[#1B3C53] rounded-r-xl">
                      <p className="font-bold text-slate-900">Decision Status: {selectedPaper.status}</p>
                      <p className="text-slate-600 mt-1">{fetchedLetterDoc?.body || 'Official evaluation decision notice.'}</p>
                    </div>

                    <div className="pt-8 border-t border-slate-200">
                      <h4 className="text-[11px] font-bold uppercase text-slate-400 mb-4">Official Signatories</h4>
                      <div className="grid grid-cols-2 sm:grid-cols-3 gap-6">
                        {(fetchedLetterDoc?.signatories || [{ name: 'Dr. Maria Santos', position: 'Editor-in-Chief', signature: null }]).map((sig, idx) => (
                          <div key={idx} className="space-y-1">
                            {sig.signature ? <img src={sig.signature} alt="PNG Signature" className="h-10 object-contain mb-1" /> : <div className="h-10 border-b border-dashed flex items-end text-[10px] text-slate-400">[Digitally Signed]</div>}
                            <p className="font-bold text-slate-900 text-xs">{sig.name}</p>
                            <p className="text-[11px] text-slate-500">{sig.position}</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}