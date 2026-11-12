import React, { useState, useEffect } from 'react';
import { useFlow } from '../state/FlowContext';
import { getTodayDateString } from '../../core/utils/date';
import { TaskPriority } from '../../domain/entities/task';
import { X, CheckSquare, Calendar, StickyNote } from 'lucide-react';

export const QuickCaptureModal: React.FC = () => {
  const { quickCapture, closeQuickCapture, categories, createTask, createSchedule, createNote } = useFlow();
  const [type, setType] = useState<'task' | 'schedule' | 'note'>('task');

  // Form states
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [priority, setPriority] = useState<TaskPriority>('medium');
  const [dueDate, setDueDate] = useState(getTodayDateString());
  const [startTime, setStartTime] = useState('09:00');
  const [endTime, setEndTime] = useState('10:00');
  const [content, setContent] = useState('');
  const [noteColor, setNoteColor] = useState('#F4F1FA');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (quickCapture.isOpen) {
      setType(quickCapture.type);
      setTitle('');
      setDescription('');
      setContent('');
      setDueDate(getTodayDateString());
      if (categories.length > 0 && !categoryId) {
        setCategoryId(categories[0].id);
      }
    }
  }, [quickCapture.isOpen, quickCapture.type, categories]);

  if (!quickCapture.isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() && !content.trim()) return;
    setIsSubmitting(true);

    try {
      const selectedCatId = categoryId || (categories[0]?.id ?? 'cat_1');

      if (type === 'task') {
        await createTask({
          title: title.trim(),
          description: description.trim() || undefined,
          categoryId: selectedCatId,
          priority,
          status: 'todo',
          dueDate,
          startTime: startTime || undefined,
          endTime: endTime || undefined,
          isCompleted: false,
        });
      } else if (type === 'schedule') {
        await createSchedule({
          title: title.trim(),
          description: description.trim() || undefined,
          date: dueDate,
          startDate: dueDate,
          endDate: dueDate,
          startTime: startTime || '09:00',
          endTime: endTime || '10:00',
          categoryId: selectedCatId,
          isAllDay: false,
          reminderEnabled: true,
        });
      } else if (type === 'note') {
        await createNote({
          title: title.trim() || 'Untitled Note',
          content: content.trim(),
          categoryId: selectedCatId,
          color: noteColor,
          isPinned: false,
          isFavorite: false,
          tags: [],
        });
      }
      closeQuickCapture();
    } catch (err) {
      console.error('Failed to quick capture:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#34313D]/40 backdrop-blur-xs">
      <div
        className="w-full max-w-lg bg-white dark:bg-[#201D27] rounded-2xl shadow-xl border border-[#EEEAF2] dark:border-[#2D2838] overflow-hidden animate-in fade-in zoom-in-95 duration-150"
        role="dialog"
        aria-modal="true"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-[#EEEAF2] dark:border-[#2D2838]">
          <div className="flex items-center gap-1.5 p-1 bg-[#FAF9FC] dark:bg-[#17151D] rounded-lg">
            <button
              type="button"
              onClick={() => setType('task')}
              className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${
                type === 'task'
                  ? 'bg-white dark:bg-[#2A2633] text-[#34313D] dark:text-[#F4F2F7] shadow-xs'
                  : 'text-[#898493] hover:text-[#34313D] dark:hover:text-[#F4F2F7]'
              }`}
            >
              <CheckSquare className="w-3.5 h-3.5 text-[#A995D8]" />
              <span>Task</span>
            </button>
            <button
              type="button"
              onClick={() => setType('schedule')}
              className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${
                type === 'schedule'
                  ? 'bg-white dark:bg-[#2A2633] text-[#34313D] dark:text-[#F4F2F7] shadow-xs'
                  : 'text-[#898493] hover:text-[#34313D] dark:hover:text-[#F4F2F7]'
              }`}
            >
              <Calendar className="w-3.5 h-3.5 text-[#A9C8E8]" />
              <span>Schedule</span>
            </button>
            <button
              type="button"
              onClick={() => setType('note')}
              className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${
                type === 'note'
                  ? 'bg-white dark:bg-[#2A2633] text-[#34313D] dark:text-[#F4F2F7] shadow-xs'
                  : 'text-[#898493] hover:text-[#34313D] dark:hover:text-[#F4F2F7]'
              }`}
            >
              <StickyNote className="w-3.5 h-3.5 text-[#F1B8CC]" />
              <span>Note</span>
            </button>
          </div>

          <button
            onClick={closeQuickCapture}
            className="p-1.5 text-[#898493] hover:text-[#34313D] dark:hover:text-white rounded-lg hover:bg-[#FAF9FC] dark:hover:bg-[#2A2633] transition-colors"
            aria-label="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          <div>
            <label className="block text-xs font-medium text-[#898493] dark:text-[#9E99A8] mb-1">
              {type === 'note' ? 'Title (Optional)' : 'Title *'}
            </label>
            <input
              type="text"
              required={type !== 'note'}
              placeholder={
                type === 'task'
                  ? 'e.g., Finalize project architecture proposal'
                  : type === 'schedule'
                  ? 'e.g., Team Sync & Review'
                  : 'e.g., Product Design Insights'
              }
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full px-3.5 py-2 text-sm bg-[#FAF9FC] dark:bg-[#17151D] border border-[#EEEAF2] dark:border-[#2D2838] rounded-xl focus:outline-none focus:border-[#A995D8] dark:focus:border-[#A995D8] transition-colors"
              autoFocus
            />
          </div>

          {type === 'note' ? (
            <div>
              <label className="block text-xs font-medium text-[#898493] dark:text-[#9E99A8] mb-1">
                Content *
              </label>
              <textarea
                required
                rows={4}
                placeholder="Write your thought, idea, or reflection here..."
                value={content}
                onChange={(e) => setContent(e.target.value)}
                className="w-full px-3.5 py-2 text-sm bg-[#FAF9FC] dark:bg-[#17151D] border border-[#EEEAF2] dark:border-[#2D2838] rounded-xl focus:outline-none focus:border-[#A995D8] transition-colors resize-none"
              />
            </div>
          ) : (
            <div>
              <label className="block text-xs font-medium text-[#898493] dark:text-[#9E99A8] mb-1">
                Description (Optional)
              </label>
              <textarea
                rows={2}
                placeholder="Add helpful notes, sub-goals, or context..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="w-full px-3.5 py-2 text-sm bg-[#FAF9FC] dark:bg-[#17151D] border border-[#EEEAF2] dark:border-[#2D2838] rounded-xl focus:outline-none focus:border-[#A995D8] transition-colors resize-none"
              />
            </div>
          )}

          {/* Row for Category & Priority / Color */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-[#898493] dark:text-[#9E99A8] mb-1">
                Category
              </label>
              <select
                value={categoryId}
                onChange={(e) => setCategoryId(e.target.value)}
                className="w-full px-3 py-2 text-xs bg-[#FAF9FC] dark:bg-[#17151D] border border-[#EEEAF2] dark:border-[#2D2838] rounded-xl focus:outline-none focus:border-[#A995D8]"
              >
                {categories.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>

            {type === 'task' ? (
              <div>
                <label className="block text-xs font-medium text-[#898493] dark:text-[#9E99A8] mb-1">
                  Priority
                </label>
                <select
                  value={priority}
                  onChange={(e) => setPriority(e.target.value as TaskPriority)}
                  className="w-full px-3 py-2 text-xs bg-[#FAF9FC] dark:bg-[#17151D] border border-[#EEEAF2] dark:border-[#2D2838] rounded-xl focus:outline-none focus:border-[#A995D8]"
                >
                  <option value="high">High Priority</option>
                  <option value="medium">Medium Priority</option>
                  <option value="low">Low Priority</option>
                </select>
              </div>
            ) : type === 'schedule' ? (
              <div>
                <label className="block text-xs font-medium text-[#898493] dark:text-[#9E99A8] mb-1">
                  Time Slot
                </label>
                <div className="flex items-center gap-1.5">
                  <input
                    type="time"
                    value={startTime}
                    onChange={(e) => setStartTime(e.target.value)}
                    className="w-1/2 px-2.5 py-1.5 text-xs bg-[#FAF9FC] dark:bg-[#17151D] border border-[#EEEAF2] dark:border-[#2D2838] rounded-xl"
                  />
                  <span className="text-[#898493] text-xs">to</span>
                  <input
                    type="time"
                    value={endTime}
                    onChange={(e) => setEndTime(e.target.value)}
                    className="w-1/2 px-2.5 py-1.5 text-xs bg-[#FAF9FC] dark:bg-[#17151D] border border-[#EEEAF2] dark:border-[#2D2838] rounded-xl"
                  />
                </div>
              </div>
            ) : (
              <div>
                <label className="block text-xs font-medium text-[#898493] dark:text-[#9E99A8] mb-1">
                  Pastel Tint
                </label>
                <div className="flex items-center gap-2 pt-1">
                  {[
                    { color: '#F4F1FA', name: 'Lavender' },
                    { color: '#FDF1F5', name: 'Pink' },
                    { color: '#F0F6FC', name: 'Blue' },
                    { color: '#F2F8F5', name: 'Mint' },
                    { color: '#FCF5F1', name: 'Peach' },
                  ].map((tint) => (
                    <button
                      key={tint.color}
                      type="button"
                      onClick={() => setNoteColor(tint.color)}
                      className={`w-6 h-6 rounded-full border transition-all ${
                        noteColor === tint.color ? 'ring-2 ring-[#A995D8] scale-110' : 'border-[#EEEAF2]'
                      }`}
                      style={{ backgroundColor: tint.color }}
                      title={tint.name}
                    />
                  ))}
                </div>
              </div>
            )}
          </div>

          {(type === 'task' || type === 'schedule') && (
            <div>
              <label className="block text-xs font-medium text-[#898493] dark:text-[#9E99A8] mb-1">
                Date
              </label>
              <input
                type="date"
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
                className="w-full px-3 py-2 text-xs bg-[#FAF9FC] dark:bg-[#17151D] border border-[#EEEAF2] dark:border-[#2D2838] rounded-xl"
              />
            </div>
          )}

          {/* Action buttons */}
          <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-[#EEEAF2] dark:border-[#2D2838]">
            <button
              type="button"
              onClick={closeQuickCapture}
              className="px-4 py-2 text-xs font-semibold text-[#898493] hover:text-[#34313D] dark:hover:text-white rounded-xl hover:bg-[#FAF9FC] dark:hover:bg-[#2A2633] transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-4 py-2 text-xs font-semibold text-white bg-[#A995D8] hover:bg-[#9680C9] active:scale-98 rounded-xl shadow-xs transition-all disabled:opacity-50 cursor-pointer"
            >
              {isSubmitting ? 'Saving...' : `Save ${type === 'task' ? 'Task' : type === 'schedule' ? 'Schedule' : 'Note'}`}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
