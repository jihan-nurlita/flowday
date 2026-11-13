import React, { useState } from 'react';
import { useFlow } from '../../state/FlowContext';
import { Note } from '../../../domain/entities/note';
import { CategoryBadge } from '../CategoryBadge';
import { MarkdownViewer } from './MarkdownViewer';
import { formatFullDate, formatRelativeTime } from '../../../core/utils/date';
import {
  X,
  Edit2,
  Trash2,
  Pin,
  Star,
  Tag,
  Clock,
  Calendar,
  AlertTriangle,
} from 'lucide-react';
import { PrimaryButton, SecondaryButton } from '../buttons/AppButtons';

interface NoteDetailModalProps {
  note: Note | null;
  isOpen: boolean;
  onClose: () => void;
  onEdit: (note: Note) => void;
}

export const NoteDetailModal: React.FC<NoteDetailModalProps> = ({
  note,
  isOpen,
  onClose,
  onEdit,
}) => {
  const { toggleNotePin, toggleNoteFavorite, deleteNote, updateNote } = useFlow();
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  if (!isOpen || !note) return null;

  const handleToggleChecklist = async (lineIdx: number, newChecked: boolean) => {
    const lines = note.content.split('\n');
    const target = lines[lineIdx];
    if (target) {
      lines[lineIdx] = target.replace(
        /^(\s*[-*]\s*\[)([ xX])(\])/,
        `$1${newChecked ? 'x' : ' '}$3`
      );
      const updatedContent = lines.join('\n');
      await updateNote(note.id, { content: updatedContent });
    }
  };

  const handleDelete = async () => {
    setIsDeleting(true);
    try {
      await deleteNote(note.id);
      setShowDeleteConfirm(false);
      onClose();
    } finally {
      setIsDeleting(false);
    }
  };

  const cardColor = note.color || '#FFFFFF';

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/40 backdrop-blur-xs overflow-y-auto"
      onClick={onClose}
    >
      <div
        className="w-full max-w-xl bg-white dark:bg-[#201D27] rounded-3xl border border-[#EEEAF2] dark:border-[#2D2838] shadow-2xl p-6 sm:p-7 max-h-[90vh] overflow-y-auto flex flex-col justify-between"
        style={{ backgroundColor: cardColor }}
        onClick={(e) => e.stopPropagation()}
      >
        <div>
          {/* Top Header */}
          <div className="flex items-start justify-between gap-3 pb-3 border-b border-black/10 mb-4">
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2 mb-2 flex-wrap">
                <CategoryBadge categoryId={note.categoryId} className="!text-[#4E485B]" />
                {note.isPinned && (
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-[#A995D8]/25 text-[#593F94]">
                    <Pin className="w-2.5 h-2.5 fill-current" />
                    Pinned
                  </span>
                )}
                {note.isFavorite && (
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-[#F1B8CC]/35 text-[#A63A60]">
                    <Star className="w-2.5 h-2.5 fill-current" />
                    Favorite
                  </span>
                )}
              </div>

              <h2 className="text-lg sm:text-xl font-bold text-[#292536] leading-snug break-words">
                {note.title}
              </h2>
            </div>

            <div className="flex items-center gap-1 shrink-0">
              {/* Quick toggle pin */}
              <button
                type="button"
                onClick={() => toggleNotePin(note.id)}
                className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
                  note.isPinned ? 'text-[#593F94]' : 'text-[#5D5868] hover:text-[#292536]'
                }`}
                title={note.isPinned ? 'Unpin note' : 'Pin note'}
              >
                <Pin className={`w-4 h-4 ${note.isPinned ? 'fill-current' : ''}`} />
              </button>

              {/* Quick toggle favorite */}
              <button
                type="button"
                onClick={() => toggleNoteFavorite(note.id)}
                className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
                  note.isFavorite ? 'text-[#D96B91]' : 'text-[#5D5868] hover:text-[#A63A60]'
                }`}
                title={note.isFavorite ? 'Remove from favorites' : 'Add to favorites'}
              >
                <Star className={`w-4 h-4 ${note.isFavorite ? 'fill-current' : ''}`} />
              </button>

              <button
                type="button"
                onClick={onClose}
                className="p-1.5 rounded-lg text-[#5D5868] hover:text-[#292536] transition-colors cursor-pointer"
                aria-label="Close"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Tags */}
          {note.tags && note.tags.length > 0 && (
            <div className="flex items-center gap-1.5 flex-wrap mb-4">
              <Tag className="w-3.5 h-3.5 text-[#5D5868] shrink-0" />
              {note.tags.map((tag, idx) => (
                <span
                  key={idx}
                  className="px-2 py-0.5 rounded-full bg-black/8 text-[11px] font-medium text-[#4E485B]"
                >
                  #{tag}
                </span>
              ))}
            </div>
          )}

          {/* Content Viewer with Interactive Checklists */}
          <div className="py-2 min-h-[140px] max-h-[420px] overflow-y-auto leading-relaxed">
            <MarkdownViewer
              content={note.content}
              onToggleChecklist={handleToggleChecklist}
            />
          </div>
        </div>

        {/* Footer Meta & Actions */}
        <div className="pt-4 border-t border-black/10 mt-4 space-y-3">
          {/* Timestamps */}
          <div className="flex items-center justify-between text-[11px] text-[#5D5868] font-mono">
            <div className="flex items-center gap-1">
              <Calendar className="w-3 h-3 text-[#A9C8E8]" />
              <span>Created {formatFullDate(note.createdAt)}</span>
            </div>
            <div className="flex items-center gap-1">
              <Clock className="w-3 h-3 text-[#F1B8CC]" />
              <span>Updated {formatRelativeTime(note.updatedAt || note.createdAt)}</span>
            </div>
          </div>

          {/* Delete Confirmation Sub-banner */}
          {showDeleteConfirm ? (
            <div className="p-3.5 rounded-2xl bg-[#FCF3F0] border border-[#F7C5BA] text-xs space-y-2">
              <div className="flex items-center gap-2 text-[#E07A5F] font-bold">
                <AlertTriangle className="w-4 h-4 shrink-0" />
                <span>Move this note to trash?</span>
              </div>
              <p className="text-[11px] text-[#5D5868]">
                You can restore it later from the Trash tab anytime before permanent deletion.
              </p>
              <div className="flex items-center justify-end gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => setShowDeleteConfirm(false)}
                  disabled={isDeleting}
                  className="px-2.5 py-1 text-xs font-semibold rounded-lg bg-white text-[#292536] cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleDelete}
                  disabled={isDeleting}
                  className="px-3 py-1 text-xs font-bold rounded-lg bg-[#E07A5F] text-white cursor-pointer"
                >
                  {isDeleting ? 'Moving...' : 'Move to Trash'}
                </button>
              </div>
            </div>
          ) : (
            /* Bottom Action Buttons */
            <div className="flex items-center justify-between gap-2 pt-1">
              <button
                type="button"
                onClick={() => setShowDeleteConfirm(true)}
                className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold text-[#E07A5F] hover:bg-[#FCF3F0] transition-colors cursor-pointer"
              >
                <Trash2 className="w-4 h-4" />
                <span>Move to Trash</span>
              </button>

              <PrimaryButton
                size="sm"
                icon={Edit2}
                onClick={() => {
                  onClose();
                  onEdit(note);
                }}
              >
                Edit Note
              </PrimaryButton>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
