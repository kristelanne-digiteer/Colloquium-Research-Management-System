import React, { useState, useMemo } from 'react';
import {
  FileText,
  Search,
  RefreshCw,
  CheckCircle2,
  Clock,
  RotateCcw,
  ChevronRight,
  Cpu,
  Activity,
  Code,
  X,
  Download,
  FilePlus,
  BarChart2,
  FileCheck,
  UploadCloud,
  Send,
  AlertCircle,
  Eye,
  GraduationCap
} from 'lucide-react';

export default function MySubmissions() {
  // Sub-navigation state for "My Submissions"
  const [activeSubTab, setActiveSubTab] = useState('Author Submission Form');

  // Filter & Search State
  const [activeTab, setActiveTab] = useState('All Papers');
  const [searchQuery, setSearchQuery] = useState('');

  // Refresh spinner state
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [lastUpdated, setLastUpdated] = useState('Nov 7, 2026 • 07:48 PM');

  // Selected Paper Modal State
  const [selectedPaper, setSelectedPaper] = useState(null);
  const [showNoticeViewer, setShowNoticeViewer] = useState(false);

  // Form State for Author Submission Form
  const [newPaperTitle, setNewPaperTitle] = useState('');
  const [newPaperCategory, setNewPaperCategory] = useState('');
  const [leadAuthor, setLeadAuthor] = useState('');
  const [newPaperAbstract, setNewPaperAbstract] = useState('');
  const [uploadedFile, setUploadedFile] = useState(null);
  const [isSubmittedSuccess, setIsSubmittedSuccess] = useState(false);

  // Initial Papers Data
  const initialPapers = [
    {
      id: 'CSPRMS-2026-001',
      title: 'Design and Acceptability of a Smart Footwear Insole System with Piezoelectric Harvesting',
      authors: ['Kristel Soriano', 'Juan Santos'],
      tags: ['Computer Engineering', 'Smart Systems'],
      submittedDate: 'Oct 15, 2026',
      status: 'Approved',
      reviewProgress: 2,
      totalReviews: 3,
      iconType: 'cpu',
      borderClass: 'border-l-emerald-500',
      badgeClass: 'bg-emerald-100 text-emerald-800 border-emerald-200',
      reviews: [
        { reviewer: 'Reviewer 1', status: 'Approved', rating: '5/5', comments: 'Excellent hardware methodology and empirical data.', accepted: true },
        { reviewer: 'Reviewer 2', status: 'Approved', rating: '4.5/5', comments: 'Strong execution. Minor formatting requested.', accepted: true },
        { reviewer: 'Reviewer 3', status: 'Pending', rating: '—', comments: 'Awaiting final score input.', accepted: true }
      ],
      abstract: 'This paper presents a smart footwear insole system engineered to harvest kinetic energy via piezoelectric elements. Test results indicate a 14% power conversion improvement suitable for micro-sensor networks.'
    },
    {
      id: 'CSPRMS-2026-002',
      title: 'Predictive Analytics for Diabetes Risk Assessment Using Machine Learning',
      authors: ['Kristel Soriano', 'Juan Santos'],
      tags: ['Computer Engineering', 'Data Science'],
      submittedDate: 'Oct 20, 2026',
      status: 'For Review',
      reviewProgress: 1,
      totalReviews: 3,
      iconType: 'activity',
      borderClass: 'border-l-amber-500',
      badgeClass: 'bg-amber-100 text-amber-800 border-amber-200',
      reviews: [
        { reviewer: 'Reviewer 1', status: 'Approved', rating: '4/5', comments: 'Well-structured dataset preprocessing.', accepted: true },
        { reviewer: 'Reviewer 2', status: 'Under Review', rating: '—', comments: 'Currently evaluating algorithm cross-validation.', accepted: false },
        { reviewer: 'Reviewer 3', status: 'Assigned', rating: '—', comments: 'Review invitation accepted.', accepted: false }
      ],
      abstract: 'A comparative study of gradient boosting classifiers and deep neural networks in early detection of type-2 diabetes using demographic and biometric feature sets.'
    },
    {
      id: 'CSPRMS-2026-003',
      title: 'AI-Powered Conference Management System with Automated Review Workflow',
      authors: ['Kristel Soriano', 'Juan Santos'],
      tags: ['Information Technology', 'Software Engineering'],
      submittedDate: 'Oct 22, 2026',
      status: 'Resubmission',
      reviewProgress: 0,
      totalReviews: 3,
      iconType: 'code',
      borderClass: 'border-l-[#456882]',
      badgeClass: 'bg-[#456882]/15 text-[#1B3C53] border-[#456882]/30',
      feedbackTimestamp: 'Nov 11, 2026 - 14:30',
      resubmissionDeadline: 'Nov 25, 2026 - 23:59',
      reviews: [
        { reviewer: 'Reviewer 1', status: 'Revision Requested', rating: '3/5', comments: 'Please clarify system architecture diagram and database indexing strategy.', accepted: false },
        { reviewer: 'Reviewer 2', status: 'Revision Requested', rating: '3.5/5', comments: 'Expand literature review on natural language processing routing.', accepted: false },
        { reviewer: 'Reviewer 3', status: 'Pending', rating: '—', comments: 'Awaiting resubmission upload.', accepted: false }
      ],
      abstract: 'An automated web architecture designed for scholarly conference tracking, smart paper-reviewer assignment heuristics, and real-time status telemetry.'
    }
  ];

  const [papers, setPapers] = useState(initialPapers);

  // Dynamic Metrics counts
  const metrics = useMemo(() => {
    return {
      total: papers.length,
      approved: papers.filter(p => p.status === 'Approved').length,
      forReview: papers.filter(p => p.status === 'For Review').length,
      resubmission: papers.filter(p => p.status === 'Resubmission').length,
      declined: papers.filter(p => p.status === 'Declined').length
    };
  }, [papers]);

  // Filtered List Logic
  const filteredPapers = useMemo(() => {
    return papers.filter(paper => {
      const matchesTab =
        activeTab === 'All Papers'
          ? true
          : paper.status.toLowerCase() === activeTab.toLowerCase();

      const query = searchQuery.toLowerCase().trim();
      const matchesSearch =
        !query ||
        paper.title.toLowerCase().includes(query) ||
        paper.id.toLowerCase().includes(query) ||
        paper.authors.some(a => a.toLowerCase().includes(query)) ||
        paper.tags.some(t => t.toLowerCase().includes(query));

      return matchesTab && matchesSearch;
    });
  }, [papers, activeTab, searchQuery]);

  const feedbackPapers = papers.filter((paper) =>
    ['Approved', 'Resubmission', 'Declined'].includes(paper.status)
  );

  // Refresh Click Handler
  const handleRefresh = () => {
    setIsRefreshing(true);
    setTimeout(() => {
      const now = new Date();
      const timeStr = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
      setLastUpdated(`Nov 7, 2026 • ${timeStr}`);
      setIsRefreshing(false);
    }, 600);
  };

  // Form Submission Handler
  const handleFormSubmit = (e) => {
    e.preventDefault();
    if (!newPaperTitle) return;
    const newDoc = {
      id: `CSPRMS-2026-00${papers.length + 1}`,
      title: newPaperTitle,
      authors: [leadAuthor || 'Kristel Soriano'],
      tags: [newPaperCategory || 'Computer Engineering'],
      submittedDate: 'Nov 7, 2026',
      status: 'For Review',
      reviewProgress: 0,
      totalReviews: 3,
      iconType: 'code',
      borderClass: 'border-l-amber-500',
      badgeClass: 'bg-amber-100 text-amber-800 border-amber-200',
      reviews: [
        { reviewer: 'Reviewer 1', status: 'Assigned', rating: '—', comments: 'Awaiting initial evaluation.', accepted: false },
        { reviewer: 'Reviewer 2', status: 'Assigned', rating: '—', comments: 'Awaiting initial evaluation.', accepted: false },
        { reviewer: 'Reviewer 3', status: 'Assigned', rating: '—', comments: 'Awaiting initial evaluation.', accepted: false }
      ],
      abstract: newPaperAbstract || 'No abstract summary provided.'
    };
    setPapers([newDoc, ...papers]);
    setIsSubmittedSuccess(true);
    setTimeout(() => {
      setIsSubmittedSuccess(false);
      setNewPaperTitle('');
      setNewPaperCategory('');
      setLeadAuthor('');
      setNewPaperAbstract('');
      setUploadedFile(null);
      setActiveSubTab('Author Tracking');
    }, 1500);
  };

  const renderPaperIcon = (type) => {
    switch (type) {
      case 'cpu':
        return <Cpu className="w-5 h-5 text-[#1B3C53]" />;
      case 'activity':
        return <Activity className="w-5 h-5 text-[#1B3C53]" />;
      case 'code':
        return <Code className="w-5 h-5 text-[#1B3C53]" />;
      default:
        return <FileText className="w-5 h-5 text-[#1B3C53]" />;
    }
  };

  return (
    <div className="w-full pt-6 pb-12 px-4 sm:px-6 md:px-8 space-y-6">
      {/* PAGE HEADER WITH TOP MARGIN & PADDING */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-4 border-b border-[#D2C1B6]/30">
        <div>
          <h1 className="text-2xl sm:text-3xl font-semibold text-black tracking-tight">
            My Submissions
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Track the status of your submitted papers and view their review progress.
          </p>
        </div>

        <div className="flex items-center space-x-2 bg-white px-3 py-1.5 rounded-xl text-xs font-semibold text-slate-600 border border-[#D2C1B6]/50 shadow-sm self-start sm:self-auto shrink-0">
          <span className="text-slate-400 font-normal">Updated:</span>
          <span className="text-[#1B3C53]">{lastUpdated}</span>
          <button
            onClick={handleRefresh}
            title="Refresh Status"
            className="p-1 hover:bg-[#F9F3EF] rounded-md transition-colors text-[#456882]"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? 'animate-spin text-[#1B3C53]' : ''}`} />
          </button>
        </div>
      </div>

      {/* SUB-NAVIGATION TABS */}
      <div className="bg-white p-1.5 rounded-2xl border border-[#D2C1B6]/40 shadow-sm flex flex-col sm:flex-row gap-1">
        {[
          { id: 'Author Submission Form', label: 'Author Submission Form', icon: FilePlus },
          { id: 'Author Tracking', label: 'Author Tracking', icon: BarChart2 },
          { id: 'Feedback and Revision', label: 'Feedback and Revision', icon: FileCheck },
        ].map((subTab) => {
          const SubIcon = subTab.icon;
          const isSubActive = activeSubTab === subTab.id;
          return (
            <button
              key={subTab.id}
              onClick={() => setActiveSubTab(subTab.id)}
              className={`flex-1 flex items-center justify-center space-x-2 py-2.5 px-4 rounded-xl text-xs sm:text-sm font-bold transition-all duration-200 ${
                isSubActive
                  ? 'bg-[#1B3C53] text-white shadow-md'
                  : 'text-slate-600 hover:bg-[#F9F3EF] hover:text-[#1B3C53]'
              }`}
            >
              <SubIcon className={`w-4 h-4 ${isSubActive ? 'text-white' : 'text-[#456882]'}`} />
              <span>{subTab.label}</span>
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
            <p className="text-xs text-slate-500 mt-0.5">
              Complete the submission details below to enter peer-review workflow.
            </p>
          </div>

          {isSubmittedSuccess && (
            <div className="p-4 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl flex items-center space-x-3">
              <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
              <span className="text-xs font-semibold">Manuscript submitted successfully! Redirecting to tracking...</span>
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
                  className="w-full px-4 py-2.5 bg-[#F9F3EF] border border-[#D2C1B6]/40 rounded-xl text-xs font-medium text-slate-800 focus:outline-none focus:border-[#456882] focus:bg-white"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-[#1B3C53]">Research Category / Track *</label>
                <input
                  type="text"
                  required
                  value={newPaperCategory}
                  onChange={(e) => setNewPaperCategory(e.target.value)}
                  placeholder="Enter research category or track..."
                  className="w-full px-4 py-2.5 bg-[#F9F3EF] border border-[#D2C1B6]/40 rounded-xl text-xs font-medium text-slate-800 focus:outline-none focus:border-[#456882] focus:bg-white"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-[#1B3C53]">Lead Author *</label>
                <input
                  type="text"
                  required
                  value={leadAuthor}
                  onChange={(e) => setLeadAuthor(e.target.value)}
                  placeholder="Enter lead author name..."
                  className="w-full px-4 py-2.5 bg-[#F9F3EF] border border-[#D2C1B6]/40 rounded-xl text-xs font-medium text-slate-800 focus:outline-none focus:border-[#456882] focus:bg-white"
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
                className="w-full px-4 py-2.5 bg-[#F9F3EF] border border-[#D2C1B6]/40 rounded-xl text-xs font-medium text-slate-800 focus:outline-none focus:border-[#456882] focus:bg-white"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-[#1B3C53]">Manuscript File (PDF or DOCX) *</label>
              <div className="border-2 border-dashed border-[#D2C1B6] bg-[#F9F3EF]/50 hover:bg-[#F9F3EF] rounded-2xl p-6 text-center cursor-pointer transition-colors">
                <UploadCloud className="w-8 h-8 text-[#456882] mx-auto mb-2" />
                <p className="text-xs font-bold text-[#1B3C53]">Drag & drop manuscript file here, or click to browse</p>
                <p className="text-[11px] text-slate-400 mt-1">Supports PDF, DOCX up to 25MB</p>
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
                type="button"
                onClick={() => setActiveSubTab('Author Tracking')}
                className="px-5 py-2.5 text-xs font-bold text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-xl transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-6 py-2.5 text-xs font-bold text-white bg-[#1B3C53] hover:bg-[#456882] rounded-xl flex items-center space-x-2 transition-colors shadow-sm"
              >
                <Send className="w-3.5 h-3.5" />
                <span>Submit Paper</span>
              </button>
            </div>
          </form>
        </div>
      )}

      {/* TAB 2: AUTHOR TRACKING */}
      {activeSubTab === 'Author Tracking' && (
        <div className="space-y-6">
          {/* Summary Cards Grid */}
          <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div
              onClick={() => setActiveTab('All Papers')}
              className={`bg-white rounded-2xl p-5 border shadow-sm transition-all duration-200 cursor-pointer hover:shadow-md ${
                activeTab === 'All Papers' ? 'border-[#1B3C53] ring-2 ring-[#1B3C53]/10' : 'border-[#D2C1B6]/40'
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">Total Submissions</span>
                <div className="p-2.5 bg-slate-100 text-slate-700 rounded-xl">
                  <FileText className="w-5 h-5" />
                </div>
              </div>
              <div className="mt-3 flex items-baseline justify-between">
                <span className="text-3xl font-semibold text-black">{metrics.total}</span>
                <span className="text-xs font-medium text-slate-400">All submissions</span>
              </div>
            </div>

            <div
              onClick={() => setActiveTab('Approved')}
              className={`bg-white rounded-2xl p-5 border shadow-sm transition-all duration-200 cursor-pointer hover:shadow-md ${
                activeTab === 'Approved' ? 'border-emerald-600 ring-2 ring-emerald-600/10' : 'border-[#D2C1B6]/40'
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">Approved</span>
                <div className="p-2.5 bg-emerald-50 text-emerald-600 rounded-xl">
                  <CheckCircle2 className="w-5 h-5" />
                </div>
              </div>
              <div className="mt-3 flex items-baseline justify-between">
                <span className="text-3xl font-semibold text-emerald-700">{metrics.approved}</span>
                <span className="text-xs font-semibold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full">
                  Ready for Publication
                </span>
              </div>
            </div>

            <div
              onClick={() => setActiveTab('For Review')}
              className={`bg-white rounded-2xl p-5 border shadow-sm transition-all duration-200 cursor-pointer hover:shadow-md ${
                activeTab === 'For Review' ? 'border-amber-500 ring-2 ring-amber-500/10' : 'border-[#D2C1B6]/40'
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">For Review</span>
                <div className="p-2.5 bg-amber-50 text-amber-600 rounded-xl">
                  <Clock className="w-5 h-5" />
                </div>
              </div>
              <div className="mt-3 flex items-baseline justify-between">
                <span className="text-3xl font-semibold text-amber-600">{metrics.forReview}</span>
                <span className="text-xs font-semibold text-amber-600 bg-amber-50 px-2 py-0.5 rounded-full">
                  Peer Reviewing
                </span>
              </div>
            </div>

            <div
              onClick={() => setActiveTab('Resubmission')}
              className={`bg-white rounded-2xl p-5 border shadow-sm transition-all duration-200 cursor-pointer hover:shadow-md ${
                activeTab === 'Resubmission' ? 'border-[#456882] ring-2 ring-[#456882]/10' : 'border-[#D2C1B6]/40'
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">Resubmission</span>
                <div className="p-2.5 bg-[#456882]/10 text-[#456882] rounded-xl">
                  <RotateCcw className="w-5 h-5" />
                </div>
              </div>
              <div className="mt-3 flex items-baseline justify-between">
                <span className="text-3xl font-semibold text-[#456882]">{metrics.resubmission}</span>
                <span className="text-xs font-semibold text-black bg-[#D2C1B6]/30 px-2 py-0.5 rounded-full">
                  Action Required
                </span>
              </div>
            </div>
          </section>

          {/* Search & Filter Toolbar */}
          <section className="bg-white rounded-2xl p-4 border border-[#D2C1B6]/40 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex items-center space-x-1.5 overflow-x-auto pb-1 md:pb-0">
              {[
                { label: 'All Papers', count: metrics.total },
                { label: 'Approved', count: metrics.approved },
                { label: 'For Review', count: metrics.forReview },
                { label: 'Resubmission', count: metrics.resubmission },
                { label: 'Declined', count: metrics.declined },
              ].map((tab) => {
                const isActive = activeTab === tab.label;
                return (
                  <button
                    key={tab.label}
                    onClick={() => setActiveTab(tab.label)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all duration-200 flex items-center space-x-1.5 ${
                      isActive
                        ? 'bg-[#1B3C53] text-white shadow-sm'
                        : 'bg-[#F9F3EF] text-slate-600 hover:bg-[#D2C1B6]/30 hover:text-black'
                    }`}
                  >
                    <span>{tab.label}</span>
                    <span
                      className={`px-1.5 py-0.2 rounded-full text-[10px] font-bold ${
                        isActive ? 'bg-white/20 text-white' : 'bg-slate-200 text-slate-700'
                      }`}
                    >
                      {tab.count}
                    </span>
                  </button>
                );
              })}
            </div>

            <div className="relative min-w-[240px] md:w-72">
              <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search by title, author, or tag..."
                className="w-full pl-10 pr-4 py-2 bg-[#F9F3EF] text-xs font-medium text-slate-800 placeholder-slate-400 rounded-xl border border-transparent focus:border-[#456882] focus:bg-white focus:outline-none transition-all"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          </section>

          {/* Paper Submissions List Cards */}
          <section className="space-y-4">
            {filteredPapers.length === 0 ? (
              <div className="bg-white rounded-2xl p-12 text-center border border-dashed border-[#D2C1B6]">
                <FileText className="w-12 h-12 text-slate-300 mx-auto mb-3" />
                <h3 className="text-base font-semibold text-black">No paper submissions found</h3>
                <p className="text-xs text-slate-500 mt-1">Try adjusting your filters or search keywords.</p>
                <button
                  onClick={() => {
                    setActiveTab('All Papers');
                    setSearchQuery('');
                  }}
                  className="mt-4 px-4 py-2 bg-[#1B3C53] text-white text-xs font-semibold rounded-xl hover:bg-[#456882] transition-colors"
                >
                  Reset Search Filters
                </button>
              </div>
            ) : (
              filteredPapers.map((paper) => (
                <div
                  key={paper.id}
                  className={`bg-white rounded-2xl p-5 border border-[#D2C1B6]/40 shadow-sm border-l-4 ${paper.borderClass} hover:shadow-md transition-all duration-200 flex flex-col lg:flex-row justify-between gap-6`}
                >
                  <div className="flex-1 space-y-3">
                    <div className="flex items-start space-x-3.5">
                      <div className="p-3 bg-[#F9F3EF] rounded-xl shrink-0 border border-[#D2C1B6]/30">
                        {renderPaperIcon(paper.iconType)}
                      </div>
                      <div className="space-y-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="text-xs font-mono font-bold text-[#456882] bg-[#456882]/10 px-2 py-0.5 rounded-md">
                            {paper.id}
                          </span>
                          <span className="text-xs text-slate-400">
                            Submitted on {paper.submittedDate}
                          </span>
                        </div>
                        <h3
                          className="text-base font-semibold text-black leading-snug hover:text-[#456882] transition-colors cursor-pointer"
                          onClick={() => setSelectedPaper(paper)}
                        >
                          {paper.title}
                        </h3>
                      </div>
                    </div>

                    <div className="flex flex-wrap items-center gap-y-2 gap-x-4 sm:pl-14">
                      <div className="flex items-center space-x-1.5 text-xs text-slate-600 font-medium">
                        <span className="text-slate-400">Authors:</span>
                        <span className="text-slate-800 font-semibold">{paper.authors.join(', ')}</span>
                      </div>

                      <div className="flex flex-wrap items-center gap-1.5">
                        {paper.tags.map((tag) => (
                          <span
                            key={tag}
                            className="bg-[#D2C1B6]/20 text-black text-[11px] font-semibold px-2.5 py-0.5 rounded-md border border-[#D2C1B6]/40"
                          >
                            {tag}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>

                  <div className="flex flex-col sm:flex-row lg:flex-col justify-between items-start sm:items-center lg:items-end gap-4 border-t sm:border-t-0 lg:border-t-0 pt-4 sm:pt-0 border-slate-100 shrink-0">
                    <div className="flex items-center space-x-3">
                      <span className={`text-xs font-bold px-3 py-1 rounded-full border ${paper.badgeClass}`}>
                        {paper.status}
                      </span>
                    </div>

                    <div className="w-full sm:w-auto lg:w-44 space-y-1.5 text-left lg:text-right">
                      <div className="flex justify-between items-center text-xs font-semibold text-slate-600">
                        <span>Review Progress</span>
                        <span className="font-bold text-black">{paper.reviewProgress}/{paper.totalReviews} Completed</span>
                      </div>

                      <div className="flex items-center space-x-1.5">
                        {[1, 2, 3].map((step) => {
                          const isCompleted = step <= paper.reviewProgress;
                          return (
                            <div
                              key={step}
                              className={`h-2 flex-1 rounded-full transition-all duration-300 ${
                                isCompleted ? 'bg-[#1B3C53]' : 'bg-slate-200'
                              }`}
                            />
                          );
                        })}
                      </div>
                    </div>

                    <button
                      onClick={() => setSelectedPaper(paper)}
                      className="w-full sm:w-auto px-4 py-2 border-2 border-[#456882] text-[#456882] hover:bg-[#456882] hover:text-white text-xs font-bold rounded-xl transition-all duration-200 flex items-center justify-center space-x-1 shadow-sm"
                    >
                      <span>View Details</span>
                      <ChevronRight className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))
            )}
          </section>
        </div>
      )}

      {/* TAB 3: FEEDBACK AND REVISION */}
      {activeSubTab === 'Feedback and Revision' && (
        <div className="space-y-5">
          <div className="bg-white rounded-2xl p-5 border border-[#D2C1B6]/40 shadow-sm flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div>
              <h3 className="text-base font-semibold text-black">Reviewer Feedback & Manuscript Revision Portal</h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Review evaluation comments from each reviewer, accept them individually, and submit your revised manuscript.
              </p>
            </div>
            <div className="px-3 py-1.5 bg-[#D2C1B6]/20 border border-[#D2C1B6]/50 rounded-xl text-xs font-bold text-black flex items-center space-x-2">
              <AlertCircle className="w-4 h-4 text-[#456882]" />
              <span>
                {feedbackPapers.filter((paper) => paper.status === 'Resubmission').length} Papers Require Resubmission
              </span>
            </div>
          </div>

          {feedbackPapers.length === 0 ? (
            <div className="bg-white rounded-2xl p-8 text-center border border-dashed border-[#D2C1B6]">
              <p className="text-sm font-semibold text-slate-600">
                No approved, resubmission, or declined papers to display.
              </p>
            </div>
          ) : feedbackPapers.map((paper) => {
            const allReviewsAccepted = paper.reviews && paper.reviews.every(r => r.accepted);

            return (
              <div key={paper.id} className="bg-white rounded-2xl p-6 border border-[#D2C1B6]/40 shadow-sm space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-3">
                  <div>
                    <div className="flex items-center space-x-2">
                      <span className="text-xs font-mono font-bold text-[#456882] bg-[#456882]/10 px-2 py-0.5 rounded">
                        {paper.id}
                      </span>
                      <span className="text-[11px] text-slate-400">
                        Feedback Issued: {paper.feedbackTimestamp || 'Nov 11, 2026 - 14:30'}
                      </span>
                    </div>
                    <h4 className="text-sm font-semibold text-black mt-1">{paper.title}</h4>
                  </div>
                  <span className={`text-xs font-bold px-3 py-1 rounded-full border self-start sm:self-auto ${paper.badgeClass}`}>
                    {paper.status}
                  </span>
                </div>

                <div className="space-y-3">
                  <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-1">
                    <h5 className="text-xs font-bold text-slate-500 uppercase tracking-wider">Reviewer Scorecards & Comments</h5>
                    {paper.resubmissionDeadline && (
                      <span className="text-xs font-semibold text-amber-700 bg-amber-50 px-2.5 py-1 rounded-lg border border-amber-200">
                        Resubmission Deadline: {paper.resubmissionDeadline}
                      </span>
                    )}
                  </div>
                  
                  {/* REVIEWER CARDS WITH INDIVIDUAL ACCEPT BUTTONS */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                    {paper.reviews.map((rev, rIdx) => (
                      <div key={rIdx} className="bg-[#F9F3EF] p-3.5 rounded-xl border border-[#D2C1B6]/40 text-xs flex flex-col justify-between space-y-3">
                        <div className="space-y-1.5">
                          <div className="flex justify-between font-bold text-black">
                            <span>{rev.reviewer}</span>
                            <span className="text-[#456882]">{rev.rating}</span>
                          </div>
                          <p className="text-slate-600 italic text-[11px]">"{rev.comments}"</p>
                        </div>

                        <div className="pt-2 border-t border-[#D2C1B6]/30 flex items-center justify-between">
                          <span className="text-[11px] font-semibold text-slate-500">Status:</span>
                          {rev.accepted ? (
                            <span className="text-emerald-700 font-bold bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200 text-[11px]">
                              ✓ Accepted
                            </span>
                          ) : (
                            <button
                              onClick={() => {
                                const updatedPapers = papers.map(p => {
                                  if (p.id === paper.id) {
                                    const updatedReviews = [...p.reviews];
                                    updatedReviews[rIdx] = { ...updatedReviews[rIdx], accepted: true };
                                    return { ...p, reviews: updatedReviews };
                                  }
                                  return p;
                                });
                                setPapers(updatedPapers);
                              }}
                              className="px-2.5 py-1 bg-[#1B3C53] text-white font-bold rounded-lg hover:bg-[#456882] transition-colors text-[10px]"
                            >
                              Accept Comments
                            </button>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {paper.status === 'Resubmission' && (
                  <div className="mt-4 pt-4 border-t border-dashed border-[#D2C1B6] bg-amber-50/50 p-4 rounded-xl space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2 text-xs font-bold text-amber-800">
                        <RotateCcw className="w-4 h-4 text-amber-600" />
                        <span>
                          {allReviewsAccepted 
                            ? 'All comments have been accepted. You may now upload the revised package.' 
                            : 'You must accept comments from all reviewers before you can resubmit.'}
                        </span>
                      </div>
                      <span className={`text-[11px] font-bold px-2.5 py-0.5 rounded-full ${allReviewsAccepted ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'}`}>
                        {allReviewsAccepted ? 'Ready for Upload' : 'Pending All Acceptances'}
                      </span>
                    </div>

                    {allReviewsAccepted && (
                      <div className="flex flex-col sm:flex-row items-center gap-3 pt-2">
                        <input
                          type="file"
                          className="text-xs text-slate-500 file:mr-3 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-xs file:font-semibold file:bg-[#1B3C53] file:text-white hover:file:bg-[#456882] cursor-pointer"
                        />
                        <button
                          onClick={() => alert(`Revised file successfully uploaded for ${paper.id}`)}
                          className="w-full sm:w-auto px-4 py-2 bg-[#456882] text-white text-xs font-bold rounded-xl hover:bg-[#1B3C53] transition-colors"
                        >
                          Submit Revision Package
                        </button>
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* PAPER DETAIL MODAL */}
      {selectedPaper && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto border border-[#D2C1B6] shadow-2xl flex flex-col">
            
            {/* Modal Header */}
            <div className="p-6 bg-[#1B3C53] text-white rounded-t-2xl flex justify-between items-start sticky top-0 z-10">
              <div>
                <div className="flex items-center space-x-2">
                  <span className="text-xs font-mono bg-white/10 text-slate-200 px-2 py-0.5 rounded font-bold">
                    {selectedPaper.id}
                  </span>
                  <span className={`text-xs font-bold px-2.5 py-0.5 rounded-full ${selectedPaper.badgeClass}`}>
                    {selectedPaper.status}
                  </span>
                </div>
                <h3 className="text-lg font-semibold text-white mt-2 leading-tight">
                  {selectedPaper.title}
                </h3>
              </div>
              <button
                onClick={() => setSelectedPaper(null)}
                className="text-slate-300 hover:text-white p-1 rounded-lg hover:bg-white/10 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Content */}
            <div className="p-6 space-y-6">
              <div className="grid grid-cols-2 gap-4 bg-[#F9F3EF] p-4 rounded-xl border border-[#D2C1B6]/30 text-xs">
                <div>
                  <span className="text-slate-400 block font-medium">Authors</span>
                  <span className="font-semibold text-black">{selectedPaper.authors.join(', ')}</span>
                </div>
                <div>
                  <span className="text-slate-400 block font-medium">Submitted Date</span>
                  <span className="font-semibold text-black">{selectedPaper.submittedDate}</span>
                </div>
              </div>

              <div>
                <h4 className="text-xs font-semibold uppercase tracking-wider text-black mb-1.5">Abstract</h4>
                <p className="text-xs text-slate-700 leading-relaxed bg-white p-3.5 rounded-xl border border-slate-200">
                  {selectedPaper.abstract}
                </p>
              </div>

              <div>
                <div className="flex items-center justify-between mb-3">
                  <h4 className="text-xs font-semibold uppercase tracking-wider text-black">
                    Peer Review Reports ({selectedPaper.reviewProgress}/3)
                  </h4>
                  <span className="text-xs font-semibold text-[#456882]">Detailed Telemetry</span>
                </div>

                <div className="space-y-3">
                  {selectedPaper.reviews.map((rev, idx) => (
                    <div key={idx} className="p-3.5 rounded-xl border border-slate-200 bg-slate-50/50 space-y-1.5">
                      <div className="flex justify-between items-center text-xs">
                        <span className="font-semibold text-black">{rev.reviewer}</span>
                        <div className="flex items-center space-x-2">
                          {/* Rating: lalabas lang kapag HINDI "For Review" */}
                          {selectedPaper.status !== 'For Review' && rev.rating && (
                            <span className="text-slate-400">Rating: <strong className="text-slate-700">{rev.rating}</strong></span>
                          )}
                          <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-[#456882]/10 text-[#456882]">
                            {rev.status}
                          </span>
                        </div>
                      </div>
                      
                      {/* Comments/Feedback: lalabas lang kapag HINDI "For Review" */}
                      {selectedPaper.status !== 'For Review' && rev.comments && (
                        <p className="text-xs text-slate-600 italic">"{rev.comments}"</p>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Modal Footer with View Notice Button */}
            <div className="p-4 bg-slate-50 border-t border-slate-200 rounded-b-2xl flex justify-end space-x-3">
              <button
                onClick={() => setSelectedPaper(null)}
                className="px-4 py-2 bg-slate-200 hover:bg-slate-300 text-slate-700 font-bold text-xs rounded-xl transition-colors"
              >
                Close
              </button>
              <button
                onClick={() => setShowNoticeViewer(true)}
                className="px-4 py-2 bg-[#1B3C53] hover:bg-[#456882] text-white font-bold text-xs rounded-xl flex items-center space-x-2 transition-colors shadow-sm"
              >
                <Eye className="w-3.5 h-3.5" />
                <span>View Notice</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* PDF / NOTICE PREVIEWER MODAL */}
      {showNoticeViewer && selectedPaper && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/70 backdrop-blur-md">
          <div className="bg-[#2D3748] rounded-2xl max-w-3xl w-full max-h-[92vh] flex flex-col overflow-hidden shadow-2xl border border-slate-700">
            
            {/* PDF Top Action Bar */}
            <div className="px-4 py-2.5 bg-[#1A202C] text-white flex items-center justify-between text-xs border-b border-slate-700">
              <div className="flex items-center space-x-3">
                <span className="px-2 py-0.5 bg-red-600 text-white font-bold rounded text-[10px]">PDF</span>
                <span className="font-mono font-semibold">{selectedPaper.id}.pdf</span>
                <span className="text-slate-400">1 / 12</span>
              </div>
              
              <div className="flex items-center space-x-3 text-slate-300">
                <button title="Download" className="hover:text-white p-1 rounded">
                  <Download className="w-4 h-4" />
                </button>
                <button 
                  onClick={() => setShowNoticeViewer(false)} 
                  className="hover:text-white p-1 rounded bg-white/10"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Document Viewer Paper Layout */}
            <div className="p-6 md:p-8 bg-slate-100 overflow-y-auto flex-1 flex justify-center">
              <div className="bg-white w-full max-w-2xl p-8 md:p-10 shadow-lg rounded-sm border border-slate-200 text-slate-800 space-y-6">
                
                {/* Notice Header & CSPRMS Logo */}
                <div className="text-center pb-4 border-b-2 border-[#1B3C53] space-y-2">
                  <div className="flex items-center justify-center space-x-3">
                    <div className="p-2.5 bg-[#1B3C53] text-white rounded-xl">
                      <GraduationCap className="w-8 h-8" />
                    </div>
                    <div className="text-left">
                      <h2 className="text-2xl font-semibold text-black tracking-tight leading-none">CSPRMS</h2>
                      <p className="text-[10px] text-slate-500 font-semibold uppercase tracking-wider">
                        Conference Submission & Peer-Review Management System
                      </p>
                    </div>
                  </div>
                </div>

                {/* Paper Title */}
                <div className="text-center space-y-2 py-2">
                  <h3 className="text-xl font-semibold text-black leading-snug">
                    {selectedPaper.title}
                  </h3>
                  <p className="text-xs text-slate-500 font-semibold">
                    Authors: {selectedPaper.authors.join(', ')}
                  </p>
                </div>

                {/* Abstract Section */}
                <div className="space-y-2">
                  <span className="inline-block px-3 py-1 bg-[#D2C1B6]/30 text-black text-xs font-semibold rounded-lg">
                    Abstract
                  </span>
                  <p className="text-xs text-slate-700 leading-relaxed text-justify">
                    {selectedPaper.abstract}
                  </p>
                </div>

                {/* Notice Content / Acceptance Status */}
                <div className="pt-4 border-t border-slate-200 space-y-3">
                  <h4 className="text-xs font-semibold text-black uppercase tracking-wider">Official Status Notice</h4>
                  <div className="p-4 bg-[#F9F3EF] rounded-xl border border-[#D2C1B6]/50 text-xs text-slate-700 space-y-2">
                    <p>
                      <strong>Status:</strong> <span className="text-emerald-700 font-bold">{selectedPaper.status}</span>
                    </p>
                    <p>
                      This manuscript has successfully passed the required peer-review thresholds and evaluation phases under the Conference Submission & Peer-Review Management System (CSPRMS).
                    </p>
                  </div>
                </div>

              </div>
            </div>

          </div>
        </div>
      )}
    </div>
  );
}