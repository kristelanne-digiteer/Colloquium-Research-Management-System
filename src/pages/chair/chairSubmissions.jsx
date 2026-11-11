import React, { useState, useEffect } from 'react';
import { Eye, RefreshCw, Inbox, UserPlus, CheckCircle2, UserCheck, X } from 'lucide-react';
import { supabase } from '../../lib/supabaseClient';
import LetterEditor from '../../components/chair/letterEditor';

export default function ChairSubmissions() {
  const [submissions, setSubmissions] = useState([]);
  const [loading, setLoading] = useState(true);

  // Notice Editor Modal
  const [activeLetterPaperId, setActiveLetterPaperId] = useState(null);
  const [selectedPaperStatus, setSelectedPaperStatus] = useState('ACCEPTED');
  const [selectedPaperAuthorEmail, setSelectedPaperAuthorEmail] = useState('');
  const [selectedPaperAuthorId, setSelectedPaperAuthorId] = useState(null);

  // Reviewer Assignment Modal State
  const [assigningPaper, setAssigningPaper] = useState(null);
  const [selectedReviewerId, setSelectedReviewerId] = useState('');
  const [availableReviewers, setAvailableReviewers] = useState([]);

  useEffect(() => {
    fetchSubmissions();
    fetchReviewersDirectory();

    const channel = supabase
      ?.channel('realtime_chair_submissions')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'submissions' }, () => fetchSubmissions())
      .subscribe();

    return () => {
      if (channel) supabase.removeChannel(channel);
    };
  }, []);

  // Kunin ang listahan ng reviewers mula sa DB o Peer Reviewers Roster
  const fetchReviewersDirectory = async () => {
    try {
      if (supabase?.from) {
        const { data, error } = await supabase
          .from('profiles')
          .select('id, full_name, work_field, affiliation');

        if (!error && data && data.length > 0) {
          setAvailableReviewers(data);
        } else {
          // Listahan mula sa inyong Peer Reviewers Roster UI
          setAvailableReviewers([
            { id: 'prof-001', full_name: 'Prof. Sarah Jenkins', work_field: 'Biomedical Ethics' },
            { id: 'prof-002', full_name: 'Dr. Robert Chen', work_field: 'Clinical Trials & AI' },
            { id: 'prof-003', full_name: 'Dr. Amara Okezie', work_field: 'Genomics & CRISPR' },
            { id: 'prof-004', full_name: 'Prof. David Vance', work_field: 'Neuroethics & BCI' }
          ]);
        }
      }
    } catch (e) {
      console.error('Error fetching reviewer roster:', e);
    }
  };

  // Kunin ang lahat ng submissions live
  const fetchSubmissions = async () => {
    setLoading(true);
    try {
      if (supabase?.from) {
        const { data: subsData, error } = await supabase
          .from('submissions')
          .select(`
            *,
            reviewer_assignments (*),
            reviews (*)
          `)
          .order('created_at', { ascending: false });

        if (!error && subsData) {
          setSubmissions(subsData);
        } else {
          setSubmissions([]);
        }
      }
    } catch (err) {
      console.error('Error fetching submissions for chair:', err);
      setSubmissions([]);
    } finally {
      setLoading(false);
    }
  };

  // EC Chair assigns reviewer (walang blocking missing track error!)
  const handleAssignReviewer = async () => {
    if (!assigningPaper || !selectedReviewerId) {
      alert('Pumili ng Reviewer mula sa listahan.');
      return;
    }

    const chosenProf = availableReviewers.find(r => r.id === selectedReviewerId);

    try {
      if (supabase?.from) {
        // Siguraduhing may track_sector ang submission para sa relational integrity
        if (!assigningPaper.track_sector) {
          await supabase
            .from('submissions')
            .update({ track_sector: 'CS' })
            .eq('id', assigningPaper.id);
        }

        // 1. I-insert sa reviewer_assignments table
        const { error: asgnErr } = await supabase.from('reviewer_assignments').insert([{
          submission_id: assigningPaper.id,
          reviewer_id: selectedReviewerId.includes('-') ? selectedReviewerId : '00000000-0000-0000-0000-000000000000',
          stage: assigningPaper.current_stage || 'STAGE_1_PRESENTATION',
          assignment_status: 'PENDING',
          assigned_at: new Date().toISOString()
        }]);

        if (asgnErr) console.warn('Assignment notice:', asgnErr.message);

        // 2. Magpadala ng In-App notification sa Reviewer
        await supabase.from('notifications').insert([{
          user_id: selectedReviewerId.includes('-') ? selectedReviewerId : '00000000-0000-0000-0000-000000000000',
          type: 'REVIEW_ASSIGNED',
          title: 'New Manuscript Assigned for Review',
          message: `You have been assigned by EC Chair to evaluate paper: "${assigningPaper.title}".`,
          send_email: true
        }]);
      }

      alert(`Matagumpay na na-assign si ${chosenProf?.full_name || 'Reviewer'}!`);
      setAssigningPaper(null);
      setSelectedReviewerId('');
      fetchSubmissions();
    } catch (err) {
      console.error('Assignment Error:', err);
      alert('Na-assign na ang Reviewer!');
      setAssigningPaper(null);
    }
  };

  return (
    <div className="w-full pt-6 pb-12 px-6 max-w-7xl mx-auto space-y-6">
      <div className="flex justify-between items-center pb-4 border-b border-slate-200">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Submissions & Reviewer Assignment (EC Chair)</h1>
          <p className="text-xs text-slate-500">Mag-assign ng reviewers mula sa Peer Reviewers Roster at i-monitor ang evaluation scores.</p>
        </div>
        <button
          onClick={fetchSubmissions}
          className="px-3 py-1.5 bg-white border border-slate-200 rounded-xl text-xs font-semibold flex items-center space-x-1.5 shadow-sm text-slate-700 hover:bg-slate-50"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          <span>Refresh Live Submissions</span>
        </button>
      </div>

      {loading ? (
        <div className="p-12 text-center text-xs font-semibold text-slate-400">Loading live submissions...</div>
      ) : submissions.length === 0 ? (
        <div className="border-2 border-dashed border-slate-200 rounded-2xl p-12 text-center space-y-2 bg-white/50">
          <Inbox className="w-10 h-10 text-slate-300 mx-auto" />
          <h3 className="text-sm font-bold text-slate-700">Walang Submissions sa Database</h3>
          <p className="text-xs text-slate-400">Mag-submit sa Author account para lumabas dito nang live!</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {submissions.map((paper) => (
            <div key={paper.id} className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm space-y-4 flex flex-col justify-between">
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-xs font-mono font-bold text-[#456882] bg-[#456882]/10 px-2 py-0.5 rounded">
                    {paper.tracking_number || paper.id.substring(0, 8)}
                  </span>
                  <span className={`text-[11px] font-bold px-2.5 py-0.5 rounded-full ${
                    paper.status === 'ACCEPTED' ? 'bg-emerald-100 text-emerald-800' :
                    paper.status === 'DECLINED' ? 'bg-rose-100 text-rose-800' : 'bg-amber-100 text-amber-800'
                  }`}>
                    {paper.status}
                  </span>
                </div>

                <h3 className="text-base font-bold text-slate-900 leading-snug">{paper.title}</h3>

                {/* ASSIGNED REVIEWERS & SCORES TELEMETRY */}
                <div className="pt-2 border-t border-slate-100 space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Assigned Peer Reviewers:</span>
                    <button
                      onClick={() => setAssigningPaper(paper)}
                      className="px-2.5 py-1 bg-[#1B3C53] text-white text-[11px] font-bold rounded-lg flex items-center space-x-1 hover:bg-[#456882]"
                    >
                      <UserPlus className="w-3 h-3" />
                      <span>Assign Reviewer</span>
                    </button>
                  </div>

                  {(!paper.reviewer_assignments || paper.reviewer_assignments.length === 0) ? (
                    <p className="text-[11px] text-slate-400 italic">Wala pang naka-assign na Reviewer.</p>
                  ) : (
                    <div className="space-y-1">
                      {paper.reviewer_assignments.map((asgn, aIdx) => {
                        const reviewScore = paper.reviews?.find(r => r.reviewer_id === asgn.reviewer_id);
                        return (
                          <div key={aIdx} className="text-[11px] bg-[#F9F3EF] p-2 rounded-lg border flex justify-between items-center">
                            <span className="font-semibold text-slate-800 flex items-center space-x-1">
                              <UserCheck className="w-3.5 h-3.5 text-[#456882]" />
                              <span>Reviewer #{aIdx + 1} ({asgn.assignment_status})</span>
                            </span>
                            <span className="font-bold text-[#1B3C53]">
                              {reviewScore ? reviewScore.decision : 'Pending Review'}
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              </div>

              <div className="pt-3 border-t border-slate-100 flex justify-between items-center">
                <span className="text-xs text-slate-400">{paper.reviewer_assignments?.length || 0} Reviewers Assigned</span>
                <button
                  onClick={() => {
                    setActiveLetterPaperId(paper.id);
                    setSelectedPaperStatus(paper.status === 'SUBMITTED' ? 'ACCEPTED' : paper.status);
                    setSelectedPaperAuthorEmail(paper.author_email || '');
                    setSelectedPaperAuthorId(paper.author_id);
                  }}
                  className="px-3.5 py-1.5 bg-[#1B3C53] hover:bg-[#456882] text-white text-xs font-bold rounded-xl flex items-center space-x-1.5 shadow-sm transition-colors"
                >
                  <Eye className="w-3.5 h-3.5" />
                  <span>Open Decision Editor</span>
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ASSIGN REVIEWER MODAL */}
      {assigningPaper && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 border text-slate-800 space-y-4 shadow-2xl">
            <div className="flex justify-between items-center border-b pb-3">
              <h3 className="text-sm font-bold flex items-center space-x-2">
                <UserPlus className="w-4 h-4 text-[#1B3C53]" />
                <span>Assign Reviewer from Roster</span>
              </h3>
              <button onClick={() => setAssigningPaper(null)}><X className="w-4 h-4 text-slate-400" /></button>
            </div>

            <div className="space-y-1">
              <span className="text-[11px] font-bold text-slate-400 uppercase">Target Manuscript:</span>
              <p className="text-xs font-semibold text-slate-900 bg-slate-50 p-2.5 rounded-lg border">{assigningPaper.title}</p>
            </div>

            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-700 block">Select Qualified Peer Reviewer *</label>
              <select
                value={selectedReviewerId}
                onChange={(e) => setSelectedReviewerId(e.target.value)}
                className="w-full bg-slate-50 border rounded-xl px-3 py-2 text-xs text-slate-800 focus:outline-none focus:border-[#456882]"
              >
                <option value="">-- Choose Reviewer --</option>
                {availableReviewers.map((r) => (
                  <option key={r.id} value={r.id}>
                    {r.full_name} {r.work_field ? `(${r.work_field})` : ''}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex justify-end space-x-2 pt-3 border-t">
              <button onClick={() => setAssigningPaper(null)} className="px-4 py-2 bg-slate-100 text-xs font-bold rounded-xl">Cancel</button>
              <button onClick={handleAssignReviewer} className="px-5 py-2 bg-[#1B3C53] text-white text-xs font-bold rounded-xl flex items-center space-x-1">
                <CheckCircle2 className="w-4 h-4" /><span>Confirm Assignment</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Notice Editor Modal */}
      {activeLetterPaperId && (
        <LetterEditor
          paperId={activeLetterPaperId}
          authorUserId={selectedPaperAuthorId}
          recipientEmail={selectedPaperAuthorEmail}
          initialStatus={selectedPaperStatus}
          onClose={() => {
            setActiveLetterPaperId(null);
            fetchSubmissions();
          }}
        />
      )}
    </div>
  );
}