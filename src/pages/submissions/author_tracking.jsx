import React, { useState } from 'react';
import { FileCheck, MessageSquare, UploadCloud, AlertCircle, CheckCircle } from 'lucide-react';

const REVISION_ITEMS = [
  {
    id: 'CSPRMS-2026-003',
    title: 'AI-Powered Conference Management System with Automated Review Workflow',
    status: 'Revision Required',
    dueDate: 'Nov 18, 2026',
    comments: [
      {
        reviewer: 'Reviewer A',
        rating: '4/5',
        feedback: 'Pakilinaw ang algorithm na ginamit sa automated assignment ng reviewers sa Section 3.2.'
      },
      {
        reviewer: 'Reviewer B',
        rating: '3/5',
        feedback: 'Magdagdag ng higit pang mga kaugnay na literatura (Related Works) mula sa taong 2024-2026.'
      }
    ]
  }
];

export default function FeedbackAndRevision() {
  const [selectedFile, setSelectedFile] = useState(null);
  const [authorNotes, setAuthorNotes] = useState('');

  const handleRevisionSubmit = (e) => {
    e.preventDefault();
    if (!selectedFile) {
      alert('Pakipili ang na-revise na PDF manuscript.');
      return;
    }
    alert('Na-upload na ang inyong revision at re-response notes!');
    setSelectedFile(null);
    setAuthorNotes('');
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <div className="bg-white rounded-2xl p-6 border border-[#D2C1B6]/40 shadow-sm">
        <div className="flex items-center gap-3 mb-4 pb-3 border-b border-[#D2C1B6]/30">
          <div className="p-2 bg-[#456882]/10 rounded-xl text-[#1B3C53]">
            <FileCheck className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-[#1B3C53]">Feedback & Revision Hub</h2>
            <p className="text-sm text-slate-500">Tingnan ang komento ng mga reviewer at mag-submit ng mga pagwawasto.</p>
          </div>
        </div>

        {REVISION_ITEMS.map((item) => (
          <div key={item.id} className="space-y-6">
            {/* Paper Header */}
            <div className="bg-[#F9F3EF] p-4 rounded-xl border border-[#D2C1B6]/40 flex flex-col md:flex-row md:items-center justify-between gap-2">
              <div>
                <span className="text-xs font-bold text-[#456882]">{item.id}</span>
                <h3 className="font-bold text-[#1B3C53]">{item.title}</h3>
              </div>
              <div className="flex items-center gap-2">
                <span className="px-3 py-1 rounded-full text-xs font-bold bg-amber-100 text-amber-800 border border-amber-200">
                  {item.status}
                </span>
                <span className="text-xs text-slate-500">Due: {item.dueDate}</span>
              </div>
            </div>

            {/* Reviewer Comments */}
            <div>
              <h4 className="text-sm font-bold text-[#1B3C53] mb-3 flex items-center gap-2">
                <MessageSquare className="w-4 h-4 text-[#456882]" /> Reviewer Comments
              </h4>
              <div className="space-y-3">
                {item.comments.map((c, i) => (
                  <div key={i} className="p-4 rounded-xl border border-slate-200 bg-white">
                    <div className="flex justify-between items-center mb-1">
                      <span className="text-xs font-bold text-[#1B3C53]">{c.reviewer}</span>
                      <span className="text-xs font-bold text-[#456882] bg-[#D2C1B6]/20 px-2 py-0.5 rounded">Score: {c.rating}</span>
                    </div>
                    <p className="text-xs text-slate-600 italic">"{c.feedback}"</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Upload Revision Form */}
            <form onSubmit={handleRevisionSubmit} className="space-y-4 pt-4 border-t border-[#D2C1B6]/30">
              <h4 className="text-sm font-bold text-[#1B3C53]">Submit Revised Document</h4>
              
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">
                  Response to Reviewers (Author Notes)
                </label>
                <textarea
                  rows={3}
                  value={authorNotes}
                  onChange={(e) => setAuthorNotes(e.target.value)}
                  placeholder="Isulat dito kung paano itinama ang mga puntos na binanggit ng reviewers..."
                  className="w-full px-3 py-2 text-xs rounded-xl border border-[#D2C1B6]/60 focus:outline-none focus:ring-2 focus:ring-[#456882]"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">
                  Revised Manuscript (PDF)
                </label>
                <div className="border border-dashed border-[#456882] rounded-xl p-4 text-center bg-[#F9F3EF]/30 relative cursor-pointer">
                  <input
                    type="file"
                    accept=".pdf"
                    onChange={(e) => setSelectedFile(e.target.files[0])}
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                  />
                  <UploadCloud className="w-6 h-6 text-[#456882] mx-auto mb-1" />
                  <span className="text-xs text-[#1B3C53] font-semibold">
                    {selectedFile ? selectedFile.name : 'Pumili ng bagong PDF manuscript file'}
                  </span>
                </div>
              </div>

              <div className="flex justify-end">
                <button
                  type="submit"
                  className="px-5 py-2.5 bg-[#456882] hover:bg-[#1B3C53] text-white font-semibold text-xs rounded-xl shadow-sm transition-all flex items-center gap-1.5"
                >
                  <CheckCircle className="w-4 h-4" /> Resubmit for Re-evaluation
                </button>
              </div>
            </form>
          </div>
        ))}
      </div>
    </div>
  );
}