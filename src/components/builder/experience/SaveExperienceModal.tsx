'use client';

import React, { useState } from 'react';
import { X, BookmarkPlus, Check, Sparkles, Layers } from 'lucide-react';
import type { BuilderNode } from '../../../../packages/builder-core/src/BuilderDocument';
import type { ExperienceMood, ExperienceMotionLevel, ExperienceType } from '@/lib/experience/ExperienceTypes';
import { saveUserExperience } from '@/lib/experience/ExperienceCatalog';
import { SectionPreviewRenderer, ScaleToFitContainer } from '../library/SectionPreviewRenderer';
import { EXPERIENCE_MOODS, EXPERIENCE_MOTION_LEVELS } from '@/lib/experience/ExperienceCategories';

interface SaveExperienceModalProps {
  isOpen: boolean;
  onClose: () => void;
  sectionNode: BuilderNode | null;
  onSaved?: (newExperienceId: string) => void;
}

export function SaveExperienceModal({
  isOpen,
  onClose,
  sectionNode,
  onSaved,
}: SaveExperienceModalProps) {
  const [name, setName] = useState(sectionNode?.label || 'Custom Experience');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState(
    (sectionNode?.metadata as any)?.category || sectionNode?.type || 'section'
  );
  const [mood, setMood] = useState<ExperienceMood>('dark');
  const [motionLevel, setMotionLevel] = useState<ExperienceMotionLevel>('subtle');
  const [tagsInput, setTagsInput] = useState('custom, user-saved');
  const [savedSuccess, setSavedSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen || !sectionNode) return null;

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setError('Please provide an experience name.');
      return;
    }

    try {
      const tags = tagsInput
        .split(',')
        .map(t => t.trim().toLowerCase())
        .filter(Boolean);

      const savedItem = saveUserExperience({
        name: name.trim(),
        description: description.trim() || undefined,
        type: (sectionNode.type === 'section' ? 'section' : 'section') as ExperienceType,
        category,
        mood,
        motionLevel,
        tags,
        node: sectionNode,
      });

      setSavedSuccess(true);
      if (onSaved) onSaved(savedItem.id);

      setTimeout(() => {
        setSavedSuccess(false);
        onClose();
      }, 700);
    } catch (err: any) {
      setError(err.message || 'Failed to save experience');
    }
  };

  return (
    <div className="fixed inset-0 z-[1200] flex items-center justify-center bg-black/85 backdrop-blur-md p-4 animate-in fade-in select-none">
      <div
        className="w-full max-w-xl bg-[#2A2A2F] border border-[#44444B] rounded-2xl shadow-2xl flex flex-col overflow-hidden text-white"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-6 py-4 border-b border-[#3A3A40] bg-[#252529] flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-[#D9A86C]/20 border border-[#D9A86C]/30 flex items-center justify-center text-[#F2C27F]">
              <BookmarkPlus className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-white">Save as Experience</h3>
              <p className="text-[11px] text-zinc-400">Add this composition to your personal My Experiences library</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-zinc-400 hover:text-white hover:bg-white/10 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSave} className="p-6 space-y-4">
          {error && (
            <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/30 text-xs text-red-400">
              {error}
            </div>
          )}

          {/* Mini preview */}
          <div className="rounded-xl overflow-hidden border border-[#1F1F24] bg-[#18181B] p-2">
            <ScaleToFitContainer targetWidth={800} maxHeight={160}>
              <SectionPreviewRenderer sectionNode={sectionNode} />
            </ScaleToFitContainer>
          </div>

          {/* Name Field */}
          <div>
            <label className="block text-xs font-semibold text-zinc-300 mb-1.5">
              Experience Name <span className="text-[#F2C27F]">*</span>
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => {
                setName(e.target.value);
                setError(null);
              }}
              placeholder="e.g. Minimal Hero with Glowing Badges"
              className="w-full px-3.5 py-2.5 bg-[#202024] border border-[#1F1F24] rounded-xl text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-[#D9A86C]"
              required
            />
          </div>

          {/* Description */}
          <div>
            <label className="block text-xs font-semibold text-zinc-300 mb-1.5">Description (Optional)</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Brief description of the layout, intended mood, or purpose..."
              rows={2}
              className="w-full px-3.5 py-2 bg-[#202024] border border-[#1F1F24] rounded-xl text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-[#D9A86C] resize-none"
            />
          </div>

          {/* Mood & Motion Level */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-zinc-300 mb-1.5">Mood</label>
              <select
                value={mood}
                onChange={(e) => setMood(e.target.value as ExperienceMood)}
                className="w-full px-3 py-2 bg-[#202024] border border-[#1F1F24] rounded-xl text-xs text-white focus:outline-none focus:border-[#D9A86C] capitalize"
              >
                {EXPERIENCE_MOODS.filter(m => m.id !== 'all').map(m => (
                  <option key={m.id} value={m.id}>{m.label}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-zinc-300 mb-1.5">Motion Level</label>
              <select
                value={motionLevel}
                onChange={(e) => setMotionLevel(e.target.value as ExperienceMotionLevel)}
                className="w-full px-3 py-2 bg-[#202024] border border-[#1F1F24] rounded-xl text-xs text-white focus:outline-none focus:border-[#D9A86C] capitalize"
              >
                {EXPERIENCE_MOTION_LEVELS.filter(m => m.id !== 'all').map(m => (
                  <option key={m.id} value={m.id}>{m.label}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Tags */}
          <div>
            <label className="block text-xs font-semibold text-zinc-300 mb-1.5">Tags (Comma-separated)</label>
            <input
              type="text"
              value={tagsInput}
              onChange={(e) => setTagsInput(e.target.value)}
              placeholder="e.g. hero, luxury, dark, gradient"
              className="w-full px-3.5 py-2 bg-[#202024] border border-[#1F1F24] rounded-xl text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-[#D9A86C]"
            />
          </div>

          {/* Footer Actions */}
          <div className="pt-3 border-t border-[#3A3A40] flex items-center justify-end gap-2.5">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-xs font-semibold text-zinc-400 hover:text-white hover:bg-white/5 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={savedSuccess}
              className="px-5 py-2.5 rounded-xl text-xs font-bold bg-[#D9A86C] hover:bg-[#C99A4A] text-white shadow-lg shadow-[#D9A86C]/30 flex items-center gap-1.5 transition-transform active:scale-95 disabled:opacity-50"
            >
              {savedSuccess ? (
                <>
                  <Check className="w-3.5 h-3.5 text-emerald-300" />
                  <span>Saved to My Experiences!</span>
                </>
              ) : (
                <>
                  <BookmarkPlus className="w-3.5 h-3.5" />
                  <span>Save Experience</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
