import React, { useState } from 'react';
import { useFlow } from '../../state/FlowContext';
import { Category } from '../../../domain/entities/category';
import { PASTEL_COLOR_SWATCHES } from '../../../core/constants/theme';
import { ConfirmationDialog } from '../feedback/AppFeedback';
import { X, Plus, Edit2, Trash2, Check, Tag } from 'lucide-react';

interface CategoryManagerModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const CategoryManagerModal: React.FC<CategoryManagerModalProps> = ({
  isOpen,
  onClose,
}) => {
  const { categories, createCategory, updateCategory, deleteCategory } = useFlow();

  const [editingCatId, setEditingCatId] = useState<string | null>(null);
  const [name, setName] = useState('');
  const [selectedColor, setSelectedColor] = useState(PASTEL_COLOR_SWATCHES[0].color);
  const [error, setError] = useState<string | null>(null);

  // Category deletion confirmation state
  const [deletingCat, setDeletingCat] = useState<Category | null>(null);

  if (!isOpen) return null;

  const handleStartEdit = (cat: Category) => {
    setEditingCatId(cat.id);
    setName(cat.name);
    setSelectedColor(cat.color);
    setError(null);
  };

  const handleCancelEdit = () => {
    setEditingCatId(null);
    setName('');
    setSelectedColor(PASTEL_COLOR_SWATCHES[0].color);
    setError(null);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setError('Category name cannot be empty');
      return;
    }

    try {
      if (editingCatId) {
        await updateCategory(editingCatId, {
          name: name.trim(),
          color: selectedColor,
        });
      } else {
        await createCategory({
          name: name.trim(),
          color: selectedColor,
        });
      }
      handleCancelEdit();
    } catch (err: any) {
      setError(err?.message || 'Failed to save category');
    }
  };

  const confirmDeleteCategory = async () => {
    if (!deletingCat) return;
    try {
      await deleteCategory(deletingCat.id);
      if (editingCatId === deletingCat.id) {
        handleCancelEdit();
      }
    } catch (err) {
      console.error('Failed to delete category:', err);
    } finally {
      setDeletingCat(null);
    }
  };

  return (
    <>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#34313D]/40 backdrop-blur-xs">
        <div
          className="w-full max-w-md bg-white dark:bg-[#201D27] rounded-3xl shadow-xl border border-[#EEEAF2] dark:border-[#2D2838] overflow-hidden animate-in fade-in zoom-in-95 duration-150"
          role="dialog"
          aria-modal="true"
        >
          {/* Header */}
          <div className="flex items-center justify-between px-5 py-4 border-b border-[#EEEAF2] dark:border-[#2D2838]">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-xl bg-[#F4F1FA] dark:bg-[#2C253B] flex items-center justify-center text-[#A995D8]">
                <Tag className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-[#34313D] dark:text-[#F4F2F7]">
                  Manage Categories
                </h3>
                <p className="text-[11px] text-[#898493] dark:text-[#9E99A8]">
                  Personalize pastel colors and task tags
                </p>
              </div>
            </div>

            <button
              onClick={onClose}
              className="p-1.5 text-[#898493] hover:text-[#34313D] dark:hover:text-white rounded-lg hover:bg-[#FAF9FC] dark:hover:bg-[#2A2633] transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="p-5 space-y-4 max-h-[70vh] overflow-y-auto">
            {/* Create / Edit Form */}
            <form onSubmit={handleSave} className="p-3.5 bg-[#FAF9FC] dark:bg-[#1A1823] rounded-2xl border border-[#EEEAF2] dark:border-[#2D2838] space-y-3">
              <span className="text-xs font-bold text-[#34313D] dark:text-[#F4F2F7]">
                {editingCatId ? 'Edit Category' : 'Create New Category'}
              </span>

              {error && (
                <div className="p-2 rounded-lg bg-[#FCF3F0] dark:bg-[#381E19] text-[#E07A5F] text-xs font-medium">
                  {error}
                </div>
              )}

              <div>
                <input
                  type="text"
                  placeholder="Category Name (e.g., Side Hustle, Creative, Fitness)"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full px-3 py-2 text-xs bg-white dark:bg-[#201D27] border border-[#EEEAF2] dark:border-[#2D2838] rounded-xl focus:outline-none focus:border-[#A995D8] dark:focus:border-[#A995D8]"
                />
              </div>

              {/* Pastel Color Swatches */}
              <div>
                <label className="block text-[11px] font-medium text-[#898493] dark:text-[#9E99A8] mb-1.5">
                  Select Pastel Tint
                </label>
                <div className="flex items-center gap-2 flex-wrap">
                  {PASTEL_COLOR_SWATCHES.map((swatch) => (
                    <button
                      key={swatch.color}
                      type="button"
                      onClick={() => setSelectedColor(swatch.color)}
                      className={`w-6 h-6 rounded-full border transition-all cursor-pointer flex items-center justify-center ${
                        selectedColor === swatch.color
                          ? 'ring-2 ring-[#A995D8] ring-offset-2 dark:ring-offset-[#1A1823] scale-110'
                          : 'border-[#EEEAF2] hover:scale-105'
                      }`}
                      style={{ backgroundColor: swatch.color }}
                      title={swatch.name}
                    >
                      {selectedColor === swatch.color && (
                        <Check className="w-3 h-3 text-[#34313D]" />
                      )}
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-1">
                {editingCatId && (
                  <button
                    type="button"
                    onClick={handleCancelEdit}
                    className="px-3 py-1.5 text-xs font-semibold text-[#898493] hover:text-[#34313D] rounded-xl cursor-pointer"
                  >
                    Cancel
                  </button>
                )}
                <button
                  type="submit"
                  className="px-3.5 py-1.5 text-xs font-semibold text-white bg-[#A995D8] hover:bg-[#9680C9] rounded-xl shadow-xs transition-all cursor-pointer flex items-center gap-1"
                >
                  {editingCatId ? <Check className="w-3.5 h-3.5" /> : <Plus className="w-3.5 h-3.5" />}
                  <span>{editingCatId ? 'Update' : 'Add Category'}</span>
                </button>
              </div>
            </form>

            {/* Existing Categories List */}
            <div>
              <label className="block text-xs font-bold text-[#34313D] dark:text-[#F4F2F7] mb-2">
                Your Categories ({categories.length})
              </label>
              <div className="space-y-2">
                {categories.map((cat) => (
                  <div
                    key={cat.id}
                    className="flex items-center justify-between p-2.5 rounded-xl bg-white dark:bg-[#201D27] border border-[#EEEAF2] dark:border-[#2D2838] group"
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <span
                        className="w-3.5 h-3.5 rounded-full shrink-0 shadow-xs"
                        style={{ backgroundColor: cat.color }}
                      />
                      <span className="text-xs font-semibold text-[#34313D] dark:text-[#F4F2F7] truncate">
                        {cat.name}
                      </span>
                    </div>

                    <div className="flex items-center gap-1">
                      <button
                        type="button"
                        onClick={() => handleStartEdit(cat)}
                        className="p-1 text-[#898493] hover:text-[#A995D8] rounded-md transition-colors cursor-pointer"
                        title="Edit category"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={() => setDeletingCat(cat)}
                        className="p-1 text-[#898493] hover:text-[#E07A5F] rounded-md transition-colors cursor-pointer"
                        title="Delete category"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Confirmation Dialog for Category Deletion */}
      <ConfirmationDialog
        isOpen={!!deletingCat}
        title="Delete Category?"
        message={`Are you sure you want to delete "${deletingCat?.name}"? Any existing tasks under this category will safely be reassigned to "Other" so you will never lose work.`}
        confirmLabel="Delete Category"
        cancelLabel="Cancel"
        isDestructive={true}
        onConfirm={confirmDeleteCategory}
        onCancel={() => setDeletingCat(null)}
      />
    </>
  );
};
