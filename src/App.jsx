import React from 'react';

function App() {
  return (
    <div className="min-h-screen bg-cream text-primary p-8 font-sans">
      <div className="max-w-4xl mx-auto bg-white p-6 rounded-xl shadow-md border border-sand">
        <h1 className="text-3xl font-bold text-primary mb-2">
          Colloquium Research Management System
        </h1>
        <p className="text-secondary mb-6">
          eme eme muna.
        </p>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="p-4 bg-cream rounded-lg border border-sand">
            <h2 className="font-semibold text-primary">Theme Colors Test</h2>
            <div className="flex gap-2 mt-2">
              <span className="w-8 h-8 rounded bg-primary inline-block" title="Primary"></span>
              <span className="w-8 h-8 rounded bg-secondary inline-block" title="Secondary"></span>
              <span className="w-8 h-8 rounded bg-sand inline-block" title="Warm Sand"></span>
              <span className="w-8 h-8 rounded bg-cream border border-gray-300 inline-block" title="Soft Cream"></span>
            </div>
          </div>
          
          <div className="p-4 bg-cream rounded-lg border border-sand">
            <h2 className="font-semibold text-primary">example ni bestie test run</h2>
            <div className="flex flex-wrap gap-2 mt-2">
              <span className="px-3 py-1 bg-green-100 text-green-800 text-xs font-medium rounded-full">Approved</span>
              <span className="px-3 py-1 bg-yellow-100 text-yellow-800 text-xs font-medium rounded-full">For Review</span>
              <span className="px-3 py-1 bg-red-100 text-red-800 text-xs font-medium rounded-full">Rejected</span>
              <span className="px-3 py-1 bg-gray-100 text-gray-800 text-xs font-medium rounded-full">Resubmission</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default App;