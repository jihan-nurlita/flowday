import React, { useState, useEffect, useRef } from 'react';
import { useFlow } from '../../state/FlowContext';
import { Note } from '../../../domain/entities/note';
import { MarkdownViewer } from './MarkdownViewer';
import { PrimaryButton, SecondaryButton } from '../buttons/AppButtons';
import {
  X,
  Pin,
  Star,
  Bold,
  Italic,
  Heading,
  List,
  ListOrdered,
  CheckSquare,
  Quote,
  Code,
  Tag,
  Palette,
  Eye,
  Edit3,
  AlertTriangle,
  Check,
} from 'lucide-react';

interface NoteEditorModalProps {
  isOpen: boolean;
  onClose: () => void;
  noteToEdit?: Note | null;
  onSuccess?: (note: Note) => void;
}

const PASTEL_NOTE_COLORS = [
  { name: 'Lavender', hex: '#F4F1FA', darkHex: '#252130' },
  { name: 'Soft Pink', hex: '#FDF2F7', darkHex: '#2E1E26' },
  { name: 'Pastel Blue', hex: '#F0F6FC', darkHex: '#1D2530' },
  { name: 'Soft Mint', hex: '#F0F9F5', darkHex: '#1D2D25' },
  { name: 'Peach', hex: '#FFF5F0', darkHex: '#30221E' },
  { name: 'Vanilla', hex: '#FFFBEB', darkHex: '#2C271A' },
  { name: 'Pure Surface', hex: '#FFFFFF', darkHex: '#201D27' },
];

export const NoteEditorModal: React.FC<NoteEditorModalProps> = ({
  isOpen,
  onClose,
  noteToEdit,
  onSuccess,
}) => {
  const { categories, createNote, updateNote } = useFlow();

  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [tags, setTags] = useState<string[]>([]);
  const [tagInput, setTagInput] = useState('');
  const [color, setColor] = useState('#FFFFFF');
  const [isPinned, setIsPinned] = useState(false);
  const [isFavorite, setIsFavorite] = useState(false);

  // Editor mode: write or preview
  const [activeTab, setActiveTab] = useState<'write' | 'preview'>('write');

  // Unsaved changes confirmation
  const [isDirty, setIsDirty] = useState(false);
  const [showExitConfirm, setShowExitConfirm] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Initialize or reset form
  useEffect(() => {
    if (isOpen) {
      if (noteToEdit) {
        setTitle(noteToEdit.title);
        setContent(noteToEdit.content);
        setCategoryId(noteToEdit.categoryId || categories[0]?.id || 'cat_1');
        setTags(noteToEdit.tags || []);
        setColor(noteToEdit.color || '#FFFFFF');
        setIsPinned(Boolean(noteToEdit.isPinned));
        setIsFavorite(Boolean(noteToEdit.isFavorite));
      } else {
        setTitle('');
        setContent('');
        setCategoryId(categories[0]?.id || 'cat_1');
        setTags([]);
        setColor('#FFFFFF');
        setIsPinned(false);
        setIsFavorite(false);
      }
      setTagInput('');
      setActiveTab('write');
      setIsDirty(false);
      setShowExitConfirm(false);
      setError(null);
    }
  }, [isOpen, noteToEdit, categories]);

  if (!isOpen) return null;

  // Insert formatting markup into textarea
  const insertFormatting = (prefix: string, suffix = '') => {
    const textarea = textareaRef.current;
    if (!textarea) return;

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const text = textarea.value;
    const selected = text.substring(start, end);

    const replacement = `${prefix}${selected || 'text'}${suffix}`;
    const newContent = text.substring(0, start) + replacement + text.substring(end);

    setContent(newContent);
    setIsDirty(true);

    setTimeout(() => {
      textarea.focus();
      textarea.setSelectionRange(
        start + prefix.length,
        start + prefix.length + (selected.length || 4)
      );
    }, 0);
  };

  const handleAddTag = () => {
    const trimmed = tagInput.trim().replace(/^#/, '');
    if (trimmed && !tags.includes(trimmed)) {
      setTags([...tags, trimmed]);
      setTagInput('');
      setIsDirty(true);
    }
  };

  const handleRemoveTag = (tagToRemove: string) => {
    setTags(tags.filter((t) => t !== tagToRemove));
    setIsDirty(true);
  };

  const handleClose = () => {
    if (isDirty) {
      setShowExitConfirm(true);
    } else {
      onClose();
    }
  };

  const handleSubmit = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setError(null);

    // If both title and content are empty
    if (!title.trim() && !content.trim()) {
      setError('Please add a title or some note content.');
      return;
    }

    setIsSubmitting(true);
    try {
      const payload = {
        title: title.trim(),
        content: content.trim(),
        categoryId: categoryId || categories[0]?.id || 'cat_default',
        tags,
        color,
        isPinned,
        isFavorite,
      };

      let resultNote: Note;
      if (noteToEdit) {
        resultNote = await updateNote(noteToEdit.id, payload);
      } else {
        resultNote = await createNote(payload);
      }

      setIsDirty(false);
      if (onSuccess) onSuccess(resultNote);
      onClose();
    } catch (err: any) {
      setError(err?.message || 'Failed to save note.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const wordCount = content.trim() ? content.trim().split(/\s+/).length : 0;
  const charCount = content.length;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/40 backdrop-blur-xs overflow-y-auto"
      onClick={handleClose}
    >
      <div
        className="w-full max-w-2xl bg-white dark:bg-[#201D27] rounded-3xl border border-[#EEEAF2] dark:border-[#2D2838] shadow-2xl p-5 sm:p-7 max-h-[92vh] overflow-y-auto flex flex-col justify-between"
        style={{ backgroundColor: color }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* 1. Header Toolbar */}
        <div>
          <div className="flex items-center justify-between pb-3 border-b border-black/5 dark:border-white/5 mb-4">
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold uppercase tracking-wider text-[#A995D8]">
                {noteToEdit ? 'Edit Note' : 'New Note'}
              </span>

              {/* Pin button */}
              <button
                type="button"
                onClick={() => {
                  setIsPinned(!isPinned);
                  setIsDirty(true);
                }}
                className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
                  isPinned
                    ? 'text-[#A995D8] bg-[#A995D8]/15'
                    : 'text-[#898493] hover:text-[#34313D] hover:bg-black/5'
                }`}
                title={isPinned ? 'Unpin note' : 'Pin note to top'}
              >
                <Pin className={`w-4 h-4 ${isPinned ? 'fill-current' : ''}`} />
              </button>

              {/* Favorite button */}
              <button
                type="button"
                onClick={() => {
                  setIsFavorite(!isFavorite);
                  setIsDirty(true);
                }}
                className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
                  isFavorite
                    ? 'text-[#F1B8CC] bg-[#F1B8CC]/20'
                    : 'text-[#898493] hover:text-[#D96B91] hover:bg-black/5'
                }`}
                title={isFavorite ? 'Remove from favorites' : 'Add to favorites'}
              >
                <Star className={`w-4 h-4 ${isFavorite ? 'fill-current' : ''}`} />
              </button>
            </div>

            <div className="flex items-center gap-2">
              {/* Tab Switcher: Write vs Preview */}
              <div className="flex items-center p-0.5 rounded-xl bg-black/5 dark:bg-white/10 text-xs">
                <button
                  type="button"
                  onClick={() => setActiveTab('write')}
                  className={`flex items-center gap-1 px-2.5 py-1 rounded-lg font-semibold transition-all cursor-pointer ${
                    activeTab === 'write'
                      ? 'bg-white dark:bg-[#201D27] text-[#34313D] dark:text-[#F4F2F7] shadow-2xs'
                      : 'text-[#898493] hover:text-[#34313D]'
                  }`}
                >
                  <Edit3 className="w-3.5 h-3.5" />
                  <span>Write</span>
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTab('preview')}
                  className={`flex items-center gap-1 px-2.5 py-1 rounded-lg font-semibold transition-all cursor-pointer ${
                    activeTab === 'preview'
                      ? 'bg-white dark:bg-[#201D27] text-[#34313D] dark:text-[#F4F2F7] shadow-2xs'
                      : 'text-[#898493] hover:text-[#34313D]'
                  }`}
                >
                  <Eye className="w-3.5 h-3.5" />
                  <span>Preview</span>
                </button>
              </div>

              <button
                type="button"
                onClick={handleClose}
                className="p-1.5 rounded-lg text-[#898493] hover:text-[#34313D] transition-colors cursor-pointer"
                aria-label="Close editor"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Error Banner */}
          {error && (
            <div className="mb-3 p-3 rounded-xl bg-[#FCF3F0] text-xs text-[#E07A5F] flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Title Input */}
          <input
            type="text"
            value={title}
            onChange={(e) => {
              setTitle(e.target.value);
              setIsDirty(true);
            }}
            placeholder="Note title (leave empty for auto-title)..."
            className="w-full text-base sm:text-lg font-bold text-[#34313D] dark:text-[#F4F2F7] placeholder-[#898493]/60 bg-transparent border-0 border-b border-black/5 dark:border-white/5 pb-2.5 focus:outline-hidden focus:border-[#A995D8] transition-colors mb-3"
            autoFocus
          />

          {/* Category, Pastel Colors & Tags Toolbar */}
          <div className="flex flex-wrap items-center justify-between gap-2.5 py-2 mb-2 text-xs">
            {/* Category Select */}
            <div className="flex items-center gap-2">
              <span className="text-[11px] font-semibold text-[#898493]">Category:</span>
              <select
                value={categoryId}
                onChange={(e) => {
                  setCategoryId(e.target.value);
                  setIsDirty(true);
                }}
                className="px-2.5 py-1 rounded-xl border border-black/10 dark:border-white/10 bg-white/70 dark:bg-black/30 text-xs font-semibold text-[#34313D] dark:text-[#F4F2F7] cursor-pointer"
              >
                {categories.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Pastel Color Swatches */}
            <div className="flex items-center gap-1.5">
              <Palette className="w-3.5 h-3.5 text-[#898493]" />
              {PASTEL_NOTE_COLORS.map((swatch) => (
                <button
                  key={swatch.hex}
                  type="button"
                  onClick={() => {
                    setColor(swatch.hex);
                    setIsDirty(true);
                  }}
                  className={`w-5 h-5 rounded-full border transition-all cursor-pointer ${
                    color === swatch.hex
                      ? 'ring-2 ring-[#A995D8] scale-110 shadow-xs'
                      : 'border-black/10 hover:scale-105'
                  }`}
                  style={{ backgroundColor: swatch.hex }}
                  title={swatch.name}
                />
              ))}
            </div>
          </div>

          {/* Tags input & chips */}
          <div className="flex items-center gap-2 flex-wrap mb-3">
            <Tag className="w-3.5 h-3.5 text-[#898493] shrink-0" />
            {tags.map((t) => (
              <span
                key={t}
                className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-medium bg-black/5 dark:bg-white/10 text-[#34313D] dark:text-[#F4F2F7]"
              >
                #{t}
                <button
                  type="button"
                  onClick={() => handleRemoveTag(t)}
                  className="hover:text-[#E07A5F] cursor-pointer"
                >
                  <X className="w-3 h-3" />
                </button>
              </span>
            ))}
            <div className="inline-flex items-center gap-1">
              <input
                type="text"
                value={tagInput}
                onChange={(e) => setTagInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    handleAddTag();
                  }
                }}
                placeholder="+ Add tag..."
                className="w-24 px-2 py-0.5 text-xs bg-transparent border-b border-black/10 dark:border-white/10 text-[#34313D] dark:text-[#F4F2F7] placeholder-[#898493]/60 focus:outline-hidden focus:border-[#A995D8]"
              />
              {tagInput && (
                <button
                  type="button"
                  onClick={handleAddTag}
                  className="text-[10px] font-bold text-[#A995D8] cursor-pointer"
                >
                  Add
                </button>
              )}
            </div>
          </div>

          {/* Markdown Formatting Toolbar (visible only in Write tab) */}
          {activeTab === 'write' && (
            <div className="flex items-center gap-1 p-1.5 rounded-xl bg-black/4 dark:bg-white/5 border border-black/5 dark:border-white/5 mb-2 flex-wrap">
              <button
                type="button"
                onClick={() => insertFormatting('**', '**')}
                className="p-1 rounded-md text-[#34313D] dark:text-[#F4F2F7] hover:bg-black/5 cursor-pointer"
                title="Bold (**text**)"
              >
                <Bold className="w-3.5 h-3.5" />
              </button>
              <button
                type="button"
                onClick={() => insertFormatting('*', '*')}
                className="p-1 rounded-md text-[#34313D] dark:text-[#F4F2F7] hover:bg-black/5 cursor-pointer"
                title="Italic (*text*)"
              >
                <Italic className="w-3.5 h-3.5" />
              </button>
              <button
                type="button"
                onClick={() => insertFormatting('## ')}
                className="p-1 rounded-md text-[#34313D] dark:text-[#F4F2F7] hover:bg-black/5 cursor-pointer"
                title="Heading (## Heading)"
              >
                <Heading className="w-3.5 h-3.5" />
              </button>
              <span className="w-[1px] h-3.5 bg-black/10 dark:bg-white/10 mx-0.5" />
              <button
                type="button"
                onClick={() => insertFormatting('- ')}
                className="p-1 rounded-md text-[#34313D] dark:text-[#F4F2F7] hover:bg-black/5 cursor-pointer"
                title="Bullet List (- item)"
              >
                <List className="w-3.5 h-3.5" />
              </button>
              <button
                type="button"
                onClick={() => insertFormatting('1. ')}
                className="p-1 rounded-md text-[#34313D] dark:text-[#F4F2F7] hover:bg-black/5 cursor-pointer"
                title="Numbered List (1. item)"
              >
                <ListOrdered className="w-3.5 h-3.5" />
              </button>
              <button
                type="button"
                onClick={() => insertFormatting('- [ ] ')}
                className="p-1 rounded-md text-[#34313D] dark:text-[#F4F2F7] hover:bg-black/5 cursor-pointer"
                title="Checklist (- [ ] Task)"
              >
                <CheckSquare className="w-3.5 h-3.5 text-[#B5DCCB]" />
              </button>
              <span className="w-[1px] h-3.5 bg-black/10 dark:bg-white/10 mx-0.5" />
              <button
                type="button"
                onClick={() => insertFormatting('> ')}
                className="p-1 rounded-md text-[#34313D] dark:text-[#F4F2F7] hover:bg-black/5 cursor-pointer"
                title="Quote (> quote)"
              >
                <Quote className="w-3.5 h-3.5" />
              </button>
              <button
                type="button"
                onClick={() => insertFormatting('`', '`')}
                className="p-1 rounded-md text-[#34313D] dark:text-[#F4F2F7] hover:bg-black/5 cursor-pointer"
                title="Inline Code (`code`)"
              >
                <Code className="w-3.5 h-3.5" />
              </button>
            </div>
          )}

          {/* 2. Main Content Editor / Preview */}
          <div className="min-h-[220px] max-h-[360px] overflow-y-auto mb-4">
            {activeTab === 'write' ? (
              <textarea
                ref={textareaRef}
                value={content}
                onChange={(e) => {
                  setContent(e.target.value);
                  setIsDirty(true);
                }}
                rows={10}
                placeholder="Start writing your thoughts, checklists (- [ ] task), or ideas..."
                className="w-full h-full p-2 text-xs sm:text-sm text-[#34313D] dark:text-[#F4F2F7] bg-transparent border-0 focus:outline-hidden resize-none leading-relaxed font-sans placeholder-[#898493]/60"
              />
            ) : (
              <div className="p-3 rounded-2xl bg-white/60 dark:bg-black/20 border border-black/5 min-h-[220px]">
                <MarkdownViewer
                  content={content}
                  onToggleChecklist={(lineIdx, newChecked) => {
                    const lines = content.split('\n');
                    const target = lines[lineIdx];
                    if (target) {
                      lines[lineIdx] = target.replace(
                        /^(\s*[-*]\s*\[)([ xX])(\])/,
                        `$1${newChecked ? 'x' : ' '}$3`
                      );
                      setContent(lines.join('\n'));
                      setIsDirty(true);
                    }
                  }}
                />
              </div>
            )}
          </div>
        </div>

        {/* 3. Bottom Footer & Action Buttons */}
        <div>
          {/* Word count & timestamp */}
          <div className="flex items-center justify-between text-[11px] text-[#898493] dark:text-[#9E99A8] pb-3 border-t border-black/5 dark:border-white/5 font-mono">
            <span>
              {wordCount} words · {charCount} characters
            </span>
            {noteToEdit && (
              <span>Last updated: {new Date(noteToEdit.updatedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
            )}
          </div>

          {/* Unsaved Changes Confirmation Bar */}
          {showExitConfirm ? (
            <div className="p-3.5 rounded-2xl bg-[#FFF9E6] dark:bg-[#332B18] border border-[#F3E2A9] text-xs flex items-center justify-between gap-3">
              <span className="text-[#846618] dark:text-[#F1D07A] font-semibold">
                You have unsaved changes. Discard them?
              </span>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setShowExitConfirm(false)}
                  className="px-2.5 py-1 text-xs font-semibold rounded-lg bg-white/80 text-[#34313D] cursor-pointer"
                >
                  Keep Editing
                </button>
                <button
                  type="button"
                  onClick={onClose}
                  className="px-2.5 py-1 text-xs font-bold rounded-lg bg-[#E07A5F] text-white cursor-pointer"
                >
                  Discard
                </button>
              </div>
            </div>
          ) : (
            <div className="flex items-center justify-end gap-2.5 pt-1">
              <SecondaryButton type="button" onClick={handleClose} disabled={isSubmitting}>
                Cancel
              </SecondaryButton>
              <PrimaryButton
                type="button"
                onClick={() => handleSubmit()}
                disabled={isSubmitting}
                icon={Check}
              >
                {isSubmitting ? 'Saving...' : noteToEdit ? 'Save Changes' : 'Create Note'}
              </PrimaryButton>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
