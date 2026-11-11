import { FileText, Printer } from 'lucide-react';
import Modal from '../common/modal';
import ChairButton from './chairButton';
import { useChair } from '../../context/chairContext';

// docType: 'Acceptance' | 'Endorsement'
export default function DocumentModal({ paper, docType, date, onClose }) {
  const { chairName } = useChair();
  const isAcceptance = docType === 'Acceptance';

  return (
    <Modal
      open
      onClose={onClose}
      size="lg"
      icon={FileText}
      title="Formal Document Generator"
      subtitle="Pre-populated official committee documentation"
      footer={
        <>
          <ChairButton variant="secondary" onClick={onClose}>Close</ChairButton>
          <ChairButton variant="accent" icon={Printer} onClick={() => window.print()}>
            Print / Download PDF
          </ChairButton>
        </>
      }
    >
      {/* .print-area is the only thing shown when printing (see index.css) */}
      <div className="print-area mx-auto bg-white p-10 font-serif text-slate-900 shadow-card">
        <div className="border-b-2 border-primary-600 pb-4 text-center">
          <h2 className="text-xl font-bold text-primary-600">Institutional Ethics Committee</h2>
          <p className="text-sm text-slate-500">
            {isAcceptance ? 'Certificate of Ethics Clearance & Acceptance' : 'Official Committee Endorsement Memorandum'}
          </p>
        </div>

        <div className="my-6 space-y-1 text-sm">
          <p><strong>Date:</strong> {date}</p>
          <p>
            <strong>{isAcceptance ? 'Tracking Number:' : 'Reference Code:'}</strong>{' '}
            {isAcceptance ? paper.id : `END-${paper.id}`}
          </p>
          <p>
            <strong>{isAcceptance ? 'Principal Investigator:' : 'Recipient:'}</strong> {paper.author}
          </p>
        </div>

        <div className="space-y-4 text-sm leading-relaxed">
          <h3 className="text-center text-base font-bold tracking-wide">
            {isAcceptance ? 'OFFICIAL ACCEPTANCE LETTER' : 'LETTER OF ENDORSEMENT'}
          </h3>
          {isAcceptance ? (
            <>
              <p>
                This document verifies that the research protocol titled <strong>"{paper.title}"</strong> has been
                thoroughly reviewed and formally <strong>APPROVED</strong> by the Institutional Ethics Committee.
              </p>
              <p>
                The panel confirms that the proposed study meets all national and institutional guidelines for human
                and data protection ethics.
              </p>
            </>
          ) : (
            <>
              <p>
                The Ethics Committee hereby grants formal endorsement for the implementation of research study{' '}
                <strong>"{paper.title}"</strong>.
              </p>
              <p>Keywords / Scope: <em>{paper.keywords.join(', ')}</em></p>
              <p>This endorsement remains valid for 12 calendar months from the date of issuance.</p>
            </>
          )}
        </div>

        <div className="mt-12 text-sm">
          <div className="mb-2 h-12 w-56 border-b border-slate-400" />
          <p>
            <strong>{chairName}</strong>
            <br />
            Chairperson, Ethics Committee
          </p>
        </div>
      </div>
    </Modal>
  );
}
