import React, { useState } from 'react';
import { Upload, X, Image as ImageIcon, Plus } from 'lucide-react';

interface ImageUploaderProps {
  images: string[];
  onChange: (images: string[]) => void;
}

export default function ImageUploader({ images, onChange }: ImageUploaderProps) {
  const [urlInput, setUrlInput] = useState('');

  const handleAddUrl = (e: React.FormEvent) => {
    e.preventDefault();
    if (!urlInput.trim()) return;
    onChange([...images, urlInput.trim()]);
    setUrlInput('');
  };

  const handleRemove = (index: number) => {
    onChange(images.filter((_, i) => i !== index));
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    const file = files[0];
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        onChange([...images, reader.result]);
      }
    };
    reader.readAsDataURL(file);
  };

  // Quick preset sample images for students/demo
  const presets = [
    { label: 'Laptop / Tech', url: 'https://images.unsplash.com/photo-1517336714731-489689fd1ca8?auto=format&fit=crop&w=800&q=80' },
    { label: 'Textbook / Notes', url: 'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?auto=format&fit=crop&w=800&q=80' },
    { label: 'Dorm Kettle / Pot', url: 'https://images.unsplash.com/photo-1574269909862-7e1d70bb8078?auto=format&fit=crop&w=800&q=80' },
    { label: 'Desk Chair', url: 'https://images.unsplash.com/photo-1580481077195-c3a821a506cb?auto=format&fit=crop&w=800&q=80' },
  ];

  return (
    <div className="space-y-3">
      {/* Previews grid */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {images.map((img, idx) => (
          <div key={idx} className="relative aspect-square rounded-xl overflow-hidden border border-slate-200 bg-slate-100 group">
            <img src={img} alt="Preview" className="w-full h-full object-cover" />
            <button
              type="button"
              onClick={() => handleRemove(idx)}
              className="absolute top-1.5 right-1.5 p-1 rounded-full bg-slate-900/75 text-white hover:bg-rose-600 transition"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        ))}

        {images.length < 5 && (
          <label className="border-2 border-dashed border-slate-300 hover:border-indigo-500 rounded-xl aspect-square flex flex-col items-center justify-center cursor-pointer p-3 text-center transition group bg-slate-50/50 hover:bg-indigo-50/30">
            <Upload className="w-6 h-6 text-slate-400 group-hover:text-indigo-600 mb-1" />
            <span className="text-[11px] font-medium text-slate-600 group-hover:text-indigo-600">
              Upload Photo
            </span>
            <input
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleFileUpload}
            />
          </label>
        )}
      </div>

      {/* URL or Preset Selector */}
      <div className="space-y-2 pt-2">
        <form onSubmit={handleAddUrl} className="flex gap-2">
          <input
            type="url"
            value={urlInput}
            onChange={(e) => setUrlInput(e.target.value)}
            placeholder="Or paste photo URL (https://...)"
            className="flex-1 px-3 py-1.5 rounded-lg border border-slate-300 text-xs focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
          />
          <button
            type="submit"
            className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-lg transition"
          >
            Add URL
          </button>
        </form>

        <div className="flex items-center gap-1.5 flex-wrap">
          <span className="text-[11px] text-slate-400">Presets:</span>
          {presets.map((p) => (
            <button
              key={p.label}
              type="button"
              onClick={() => onChange([...images, p.url])}
              className="text-[10px] px-2 py-0.5 rounded bg-slate-100 text-slate-600 hover:bg-indigo-50 hover:text-indigo-600 border border-slate-200"
            >
              + {p.label}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
