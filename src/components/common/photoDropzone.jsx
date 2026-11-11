import { useCallback, useRef, useState } from 'react';
import { UploadCloud, X, User } from 'lucide-react';

export default function PhotoDropzone({ value, previewUrl, onChange, size = 'md' }) {
  const inputRef = useRef(null);
  const [isDragging, setIsDragging] = useState(false);
  const [localPreview, setLocalPreview] = useState(previewUrl || '');

  const dimensions = size === 'lg' ? 'h-28 w-28' : 'h-20 w-20';

  const applyFile = useCallback(
    (file) => {
      if (!file || !file.type.startsWith('image/')) return;
      const url = URL.createObjectURL(file);
      setLocalPreview(url);
      onChange(file, url);
    },
    [onChange]
  );

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files?.[0];
    applyFile(file);
  };

  const handleSelect = (e) => {
    const file = e.target.files?.[0];
    applyFile(file);
  };

  const handleRemove = (e) => {
    e.stopPropagation();
    setLocalPreview('');
    onChange(null, '');
    if (inputRef.current) inputRef.current.value = '';
  };

  const currentPreview = localPreview || previewUrl;

  return (
    <div>
      <div
        onClick={() => inputRef.current?.click()}
        onDragOver={(e) => {
          e.preventDefault();
          setIsDragging(true);
        }}
        onDragLeave={() => setIsDragging(false)}
        onDrop={handleDrop}
        className={`group relative flex cursor-pointer items-center gap-4 rounded-xl border-2 border-dashed p-4 transition-colors ${
          isDragging
            ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/20'
            : 'border-secondary-200 hover:border-primary-400 dark:border-secondary-700'
        }`}
      >
        <div
          className={`relative flex ${dimensions} flex-shrink-0 items-center justify-center overflow-hidden rounded-full bg-secondary-100 text-secondary-500 dark:bg-secondary-800`}
        >
          {currentPreview ? (
            <img src={currentPreview} alt="Profile preview" className="h-full w-full object-cover" />
          ) : (
            <User className="h-8 w-8" />
          )}
          {currentPreview && (
            <button
              type="button"
              onClick={handleRemove}
              className="absolute inset-0 flex items-center justify-center bg-black/50 opacity-0 transition-opacity group-hover:opacity-100"
            >
              <X className="h-5 w-5 text-white" />
            </button>
          )}
        </div>

        <div className="min-w-0">
          <p className="flex items-center gap-1.5 text-sm font-semibold text-secondary-700 dark:text-secondary-200">
            <UploadCloud className="h-4 w-4" />
            {currentPreview ? 'Change photo' : 'Upload a photo'}
          </p>
          <p className="mt-0.5 text-xs text-secondary-400">
            Drag and drop an image here, or click to browse. PNG or JPG, up to 5MB.
          </p>
        </div>

        <input
          ref={inputRef}
          type="file"
          accept="image/*"
          onChange={handleSelect}
          className="hidden"
        />
      </div>
    </div>
  );
}