import { useEffect, useRef, useState } from 'react';
import { Eraser, Upload } from 'lucide-react';
import ChairButton from './chairButton';

// Downscale to keep the data URL small (it is stored in letter_signatories.signature_url).
function shrink(img, maxW = 400) {
  const scale = Math.min(1, maxW / img.width);
  const c = document.createElement('canvas');
  c.width = Math.round(img.width * scale);
  c.height = Math.round(img.height * scale);
  c.getContext('2d').drawImage(img, 0, 0, c.width, c.height);
  return c.toDataURL('image/png');
}

// Draw or upload a signature. onSave(dataUrl)
export default function SignaturePad({ onSave, onCancel }) {
  const canvasRef = useRef(null);
  const drawing = useRef(false);
  const [dirty, setDirty] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    const c = canvasRef.current;
    const ctx = c.getContext('2d');
    ctx.lineWidth = 2.2;
    ctx.lineCap = 'round';
    ctx.strokeStyle = '#0f172a';
  }, []);

  const pos = (e) => {
    const r = canvasRef.current.getBoundingClientRect();
    return {
      x: ((e.clientX - r.left) / r.width) * canvasRef.current.width,
      y: ((e.clientY - r.top) / r.height) * canvasRef.current.height,
    };
  };
  const down = (e) => {
    drawing.current = true;
    canvasRef.current.setPointerCapture(e.pointerId);
    const { x, y } = pos(e);
    const ctx = canvasRef.current.getContext('2d');
    ctx.beginPath();
    ctx.moveTo(x, y);
  };
  const move = (e) => {
    if (!drawing.current) return;
    const { x, y } = pos(e);
    const ctx = canvasRef.current.getContext('2d');
    ctx.lineTo(x, y);
    ctx.stroke();
    setDirty(true);
  };
  const up = () => { drawing.current = false; };
  const clear = () => {
    const c = canvasRef.current;
    c.getContext('2d').clearRect(0, 0, c.width, c.height);
    setDirty(false);
  };

  const onFile = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!/^image\/(png|jpe?g|webp)$/.test(file.type)) {
      setError('Upload a PNG, JPG or WebP image.');
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      const img = new Image();
      img.onload = () => onSave(shrink(img));
      img.src = reader.result;
    };
    reader.readAsDataURL(file);
  };

  return (
    <div>
      <p className="mb-2 text-xs font-semibold text-secondary-500">Draw your signature</p>
      <canvas
        ref={canvasRef}
        width={600}
        height={200}
        onPointerDown={down}
        onPointerMove={move}
        onPointerUp={up}
        className="h-36 w-full touch-none rounded-xl border border-dashed border-secondary-300 bg-white"
      />
      <div className="mt-3 flex flex-wrap items-center gap-2">
        <ChairButton size="sm" variant="secondary" icon={Eraser} onClick={clear}>Clear</ChairButton>
        <label className="inline-flex cursor-pointer items-center gap-1.5 rounded-lg border border-secondary-300 px-3 py-1.5 text-sm font-semibold text-secondary-700 hover:bg-secondary-50">
          <Upload className="h-4 w-4" /> Upload image
          <input type="file" accept="image/png,image/jpeg,image/webp" className="hidden" onChange={onFile} />
        </label>
        <div className="ml-auto flex gap-2">
          <ChairButton size="sm" variant="secondary" onClick={onCancel}>Cancel</ChairButton>
          <ChairButton size="sm" disabled={!dirty} onClick={() => onSave(canvasRef.current.toDataURL('image/png'))}>Use drawing</ChairButton>
        </div>
      </div>
      {error && <p className="mt-2 text-xs text-red-600">{error}</p>}
    </div>
  );
}
