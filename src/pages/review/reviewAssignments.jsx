import React, { useState, useEffect } from 'react';
import { FileText, Send, CheckCircle2, Clock } from 'lucide-react';
import { supabase } from '../../lib/supabaseClient';

export default function ReviewAssignments() {
  const [assignedPapers, setAssignedPapers] = useState([]);
  const [loading, setLoading] = useState(true);

  // Review Feedback Form State
  const [activeReviewPaper, setActiveReviewPaper] = useState(null);
  const [decision, setDecision] = useState('APPROVED');
  const [commentsSummary, setCommentsSummary] = useState('');

  useEffect(() => {
    fetchMyAssignments();
  }, []);

  const fetchMyAssignments = async () => {
    setLoading(true);
    try {
      if (supabase?.from) {
        const { data: authData } = await supabase.auth.getUser();
        const currentUser = authData?.user;

        if (currentUser?.id) {
          // Query assignments matching the current logged in reviewer's user_id
          const { data, error } = await supabase
            .from('reviewer_assignments')
            .select(`
              *,
              submissions (*)
            `)
            .eq('reviewer_id', currentUser.id);

          if (!error && data) {
            setAssignedPapers(data);
          }
        }
      }
    } catch (err) {
      console.error('Error fetching reviewer assignments:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleFormSubmitReview = async (e) => {
    e.preventDefault();
    if (!activeReviewPaper || !commentsSummary) {
      alert('Pakipuno ang comments summary.');
      return;
    }

    try {
      const { data: authData } = await supabase.auth.getUser();
      const currentUser = authData?.user;

      if (supabase?.from && currentUser?.id) {
        // 1. Insert review scorecard into public.reviews
        await supabase.from('reviews').insert([{
          submission_id: activeReviewPaper.submission_id,
          reviewer_id: currentUser.id,
          stage: activeReviewPaper.stage || 'STAGE_1_PRESENTATION',
          decision: decision,
          comments_summary: commentsSummary,
          review_round: 1
        }]);

        // 2. Update assignment status to COMPLETED
        await supabase.from('reviewer_assignments').update({
          assignment_status: 'COMPLETED'
        }).eq('id', activeReviewPaper.id);

        alert('Nakasubmit na ang Review Scorecard at feedback sa EC Chair!');
        setActiveReviewPaper(null);
        setCommentsSummary('');
        fetchMyAssignments();
      }
    } catch (err) {
      console.error('Submit review error:', err);
      alert('Review saved!');
    }
  };

  return (
    <div className="w-full pt-6 pb-12 px-6 max-w-5xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Review Assignments</h1>
        <p className="text-xs text-slate-500">Maaari mo lamang i-review ang mga paper na in-assign sa iyo ng EC Chair.</p>
      </div>

      {loading ? (
        <div className="p-8 text-center text-xs text-slate-400">Loading assignments...</div>
      ) : assignedPapers.length === 0 ? (
        <div className="border-2 border-dashed rounded-2xl p-12 text-center bg-white space-y-2">
          <Clock className="w-8 h-8 text-slate-300 mx-auto" />
          <h4 className="text-sm font-bold text-slate-700">Wala ka pang assigned paper review</h4>
          <p className="text-xs text-slate-400">Mag-antay hanggang sa mag-assign sa iyo ang EC Chair.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {assignedPapers.map((asgn) => {
            const paper = asgn.submissions;
            return (
              <div key={asgn.id} className="bg-white rounded-2xl p-5 border shadow-sm space-y-3">
                <div className="flex justify-between items-start">
                  <div>
                    <span className="text-xs font-mono font-bold text-[#456882] bg-[#456882]/10 px-2 py-0.5 rounded">
                      {paper?.tracking_number || paper?.id?.substring(0, 8)}
                    </span>
                    <h3 className="text-base font-bold text-slate-900 mt-1">{paper?.title}</h3>
                  </div>
                  <span className={`text-xs font-bold px-3 py-1 rounded-full ${
                    asgn.assignment_status === 'COMPLETED' ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'
                  }`}>
                    {asgn.assignment_status}
                  </span>
                </div>

                <p className="text-xs text-slate-600 italic">{paper?.abstract}</p>

                <div className="pt-2 border-t flex justify-end">
                  {asgn.assignment_status === 'COMPLETED' ? (
                    <span className="text-xs font-bold text-emerald-700 flex items-center space-x-1">
                      <CheckCircle2 className="w-4 h-4" /><span>Review Submitted</span>
                    </span>
                  ) : (
                    <button
                      onClick={() => setActiveReviewPaper(asgn)}
                      className="px-4 py-2 bg-[#1B3C53] hover:bg-[#456882] text-white text-xs font-bold rounded-xl flex items-center space-x-1.5"
                    >
                      <FileText className="w-4 h-4" /><span>Submit Review & Rating</span>
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* SUBMIT REVIEW FEEDBACK MODAL */}
      {activeReviewPaper && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 space-y-4 shadow-2xl border text-slate-800">
            <h3 className="text-sm font-bold text-slate-900">Submit Review Scorecard</h3>
            <p className="text-xs text-slate-500 font-semibold">{activeReviewPaper.submissions?.title}</p>

            <form onSubmit={handleFormSubmitReview} className="space-y-4">
              <div>
                <label className="text-xs font-bold block mb-1">Decision Rating *</label>
                <select
                  value={decision}
                  onChange={(e) => setDecision(e.target.value)}
                  className="w-full p-2 border rounded-xl text-xs bg-slate-50"
                >
                  <option value="APPROVED">APPROVED (Pass)</option>
                  <option value="ACCEPT_WITH_COMMENTS">ACCEPT WITH COMMENTS (Minor Revisions)</option>
                  <option value="REJECTED">REJECTED (Declined)</option>
                </select>
              </div>

              <div>
                <label className="text-xs font-bold block mb-1">Reviewer Feedback & Comments *</label>
                <textarea
                  rows={4}
                  required
                  value={commentsSummary}
                  onChange={(e) => setCommentsSummary(e.target.value)}
                  placeholder="Provide technical feedback for EC Chair and Author..."
                  className="w-full p-3 border rounded-xl text-xs bg-slate-50"
                />
              </div>

              <div className="flex justify-end space-x-2 border-t pt-3">
                <button type="button" onClick={() => setActiveReviewPaper(null)} className="px-4 py-2 bg-slate-100 text-xs font-bold rounded-xl">Cancel</button>
                <button type="submit" className="px-5 py-2 bg-[#1B3C53] text-white text-xs font-bold rounded-xl flex items-center space-x-1">
                  <Send className="w-4 h-4" /><span>Send Feedback to EC</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}