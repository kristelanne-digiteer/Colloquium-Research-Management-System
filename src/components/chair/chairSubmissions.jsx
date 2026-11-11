// 1. Import LetterEditor sa top
import LetterEditor from '../../components/chair/letterEditor';

// 2. Add state sa loob ng ChairSubmissions component
const [activeLetterPaperId, setActiveLetterPaperId] = useState(null);

// 3. Mag-add ng Action Button sa bawat row/card para mabuksan ang Letter Editor
<button
  onClick={() => setActiveLetterPaperId(paper.id)}
  className="px-3 py-1 bg-primary-600 text-white rounded-lg text-xs font-semibold hover:bg-primary-700"
>
  Manage / Edit Decision Letter
</button>

// 4. Render modal sa dulo ng JSX:
{activeLetterPaperId && (
  <LetterEditor
    paperId={activeLetterPaperId}
    onClose={() => setActiveLetterPaperId(null)}
  />
)}