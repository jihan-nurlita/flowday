import React, { useState, useMemo } from 'react';
import { useFlow } from '../state/FlowContext';
import { Note } from '../../domain/entities/note';
import { NoteCard } from '../components/cards/AppCards';
import { PrimaryButton, SecondaryButton } from '../components/buttons/AppButtons';
import { EmptyState } from '../components/feedback/AppFeedback';
import { NoteEditorModal } from '../components/notes/NoteEditorModal';
import { NoteDetailModal } from '../components/notes/NoteDetailModal';
import { TrashConfirmationModal } from '../components/notes/TrashConfirmationModal';
import { CategoryManagerModal } from '../components/tasks/CategoryManagerModal';
import {
  StickyNote,
  Plus,
  Search,
  Pin,
  Star,
  Trash2,
  LayoutGrid,
  List,
  X,
  Filter,
  Tag,
  RotateCcw,
  Settings,
  Folder,
} from 'lucide-react';

type NoteTab = 'all' | 'pinned' | 'favorites' | 'trash';
type NoteSortOption = 'updated_desc' | 'created_desc' | 'created_asc' | 'alpha_asc' | 'alpha_desc';

export const NotesView: React.FC = () => {
  const {
    notes,
    trashNotes,
    categories,
    stats,
    toggleNotePin,
    toggleNoteFavorite,
    deleteNote,
    restoreNote,
    deleteNotePermanently,
    emptyTrashNotes,
  } = useFlow();

  // Navigation & View Mode
  const [activeTab, setActiveTab] = useState<NoteTab>('all');
  const [layoutMode, setLayoutMode] = useState<'grid' | 'list'>('grid');

  // Search & Filter
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedTag, setSelectedTag] = useState<string | null>(null);
  const [sortBy, setSortBy] = useState<NoteSortOption>('updated_desc');
  const [isFilterDrawerOpen, setIsFilterDrawerOpen] = useState(false);

  // Modals
  const [isEditorOpen, setIsEditorOpen] = useState(false);
  const [noteToEdit, setNoteToEdit] = useState<Note | null>(null);

  const [activeDetailNote, setActiveDetailNote] = useState<Note | null>(null);
  const [isDetailOpen, setIsDetailOpen] = useState(false);

  const [isCategoryManagerOpen, setIsCategoryManagerOpen] = useState(false);

  // Trash modals
  const [trashConfirmConfig, setTrashConfirmConfig] = useState<{
    isOpen: boolean;
    mode: 'empty_trash' | 'delete_single';
    noteId?: string;
  }>({
    isOpen: false,
    mode: 'empty_trash',
  });
  const [isTrashProcessing, setIsTrashProcessing] = useState(false);

  // Extract all unique tags across all active notes
  const allUniqueTags = useMemo(() => {
    const set = new Set<string>();
    notes.forEach((n) => {
      n.tags?.forEach((t) => set.add(t));
    });
    return Array.from(set);
  }, [notes]);

  // Active pool of notes based on current tab
  const poolNotes = useMemo(() => {
    if (activeTab === 'trash') return trashNotes;
    if (activeTab === 'pinned') return notes.filter((n) => n.isPinned);
    if (activeTab === 'favorites') return notes.filter((n) => n.isFavorite);
    return notes;
  }, [activeTab, notes, trashNotes]);

  // Filtered & sorted notes
  const displayedNotes = useMemo(() => {
    return poolNotes
      .filter((n) => {
        // Search query (title, content, tags, category)
        if (searchQuery.trim()) {
          const q = searchQuery.toLowerCase();
          const cat = categories.find((c) => c.id === n.categoryId);
          const matchTitle = n.title.toLowerCase().includes(q);
          const matchContent = n.content.toLowerCase().includes(q);
          const matchCategory = cat?.name.toLowerCase().includes(q) || false;
          const matchTag = n.tags?.some((t) => t.toLowerCase().includes(q)) || false;
          if (!matchTitle && !matchContent && !matchCategory && !matchTag) return false;
        }

        // Category filter
        if (selectedCategory !== 'all' && n.categoryId !== selectedCategory) {
          return false;
        }

        // Tag filter
        if (selectedTag && (!n.tags || !n.tags.includes(selectedTag))) {
          return false;
        }

        return true;
      })
      .sort((a, b) => {
        if (sortBy === 'alpha_asc') return a.title.localeCompare(b.title);
        if (sortBy === 'alpha_desc') return b.title.localeCompare(a.title);
        if (sortBy === 'created_desc') return b.createdAt.localeCompare(a.createdAt);
        if (sortBy === 'created_asc') return a.createdAt.localeCompare(b.createdAt);
        // Default updated_desc (pinned notes stay on top in all tab)
        if (activeTab === 'all' && a.isPinned !== b.isPinned) {
          return a.isPinned ? -1 : 1;
        }
        return (b.updatedAt || b.createdAt).localeCompare(a.updatedAt || a.createdAt);
      });
  }, [poolNotes, searchQuery, selectedCategory, selectedTag, sortBy, activeTab, categories]);

  // Handlers
  const handleOpenNewNote = () => {
    setNoteToEdit(null);
    setIsEditorOpen(true);
  };

  const handleOpenEditNote = (note: Note) => {
    setNoteToEdit(note);
    setIsEditorOpen(true);
  };

  const handleOpenDetailNote = (note: Note) => {
    if (activeTab === 'trash') return; // Cannot preview deleted notes
    setActiveDetailNote(note);
    setIsDetailOpen(true);
  };

  const handleConfirmEmptyTrash = async () => {
    setIsTrashProcessing(true);
    try {
      await emptyTrashNotes();
      setTrashConfirmConfig({ isOpen: false, mode: 'empty_trash' });
    } finally {
      setIsTrashProcessing(false);
    }
  };

  const handleConfirmDeleteSingle = async () => {
    if (!trashConfirmConfig.noteId) return;
    setIsTrashProcessing(true);
    try {
      await deleteNotePermanently(trashConfirmConfig.noteId);
      setTrashConfirmConfig({ isOpen: false, mode: 'delete_single' });
    } finally {
      setIsTrashProcessing(false);
    }
  };

  const hasActiveFilters =
    searchQuery.trim() !== '' ||
    selectedCategory !== 'all' ||
    selectedTag !== null ||
    sortBy !== 'updated_desc';

  const clearAllFilters = () => {
    setSearchQuery('');
    setSelectedCategory('all');
    setSelectedTag(null);
    setSortBy('updated_desc');
  };

  return (
    <div className="space-y-6">
      {/* 1. Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-[#34313D] dark:text-[#F4F2F7]">
            My Notes
          </h2>
          <p className="text-xs sm:text-sm text-[#898493] dark:text-[#9E99A8] mt-0.5">
            Organize your thoughts, ideas, and reflections in soft pastel cards.
          </p>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-auto flex-wrap">
          <button
            type="button"
            onClick={() => setIsCategoryManagerOpen(true)}
            className="p-2.5 rounded-2xl bg-white dark:bg-[#201D27] border border-[#EEEAF2] dark:border-[#2D2838] text-[#898493] hover:text-[#34313D] dark:hover:text-white transition-colors cursor-pointer shadow-2xs"
            title="Manage Categories"
            aria-label="Manage Categories"
          >
            <Folder className="w-4 h-4" />
          </button>

          <PrimaryButton
            icon={Plus}
            size="md"
            onClick={handleOpenNewNote}
          >
            New Note
          </PrimaryButton>
        </div>
      </div>

      {/* 2. Dynamic Metric Summary Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {/* All Notes */}
        <div
          onClick={() => setActiveTab('all')}
          className={`p-3.5 sm:p-4 rounded-2xl border transition-all cursor-pointer ${
            activeTab === 'all'
              ? 'bg-[#F4F1FA] dark:bg-[#2C253B] border-[#A995D8] shadow-xs'
              : 'bg-white dark:bg-[#201D27] border-[#EEEAF2] dark:border-[#2D2838] hover:border-[#A995D8]/40'
          }`}
        >
          <div className="flex items-center justify-between mb-1">
            <span className="text-[11px] font-semibold text-[#898493] dark:text-[#9E99A8]">
              Active Notes
            </span>
            <StickyNote className="w-4 h-4 text-[#A995D8]" />
          </div>
          <div className="text-lg sm:text-2xl font-bold font-mono text-[#34313D] dark:text-[#F4F2F7]">
            {stats.activeNotesCount}
          </div>
        </div>

        {/* Pinned Notes */}
        <div
          onClick={() => setActiveTab('pinned')}
          className={`p-3.5 sm:p-4 rounded-2xl border transition-all cursor-pointer ${
            activeTab === 'pinned'
              ? 'bg-[#F4F1FA] dark:bg-[#2C253B] border-[#A995D8] shadow-xs'
              : 'bg-white dark:bg-[#201D27] border-[#EEEAF2] dark:border-[#2D2838] hover:border-[#A995D8]/40'
          }`}
        >
          <div className="flex items-center justify-between mb-1">
            <span className="text-[11px] font-semibold text-[#898493] dark:text-[#9E99A8]">
              Pinned Notes
            </span>
            <Pin className="w-4 h-4 text-[#A995D8]" />
          </div>
          <div className="text-lg sm:text-2xl font-bold font-mono text-[#34313D] dark:text-[#F4F2F7]">
            {stats.pinnedNotesCount}
          </div>
        </div>

        {/* Favorites */}
        <div
          onClick={() => setActiveTab('favorites')}
          className={`p-3.5 sm:p-4 rounded-2xl border transition-all cursor-pointer ${
            activeTab === 'favorites'
              ? 'bg-[#FDF2F7] dark:bg-[#301E26] border-[#F1B8CC] shadow-xs'
              : 'bg-white dark:bg-[#201D27] border-[#EEEAF2] dark:border-[#2D2838] hover:border-[#F1B8CC]/50'
          }`}
        >
          <div className="flex items-center justify-between mb-1">
            <span className="text-[11px] font-semibold text-[#898493] dark:text-[#9E99A8]">
              Favorites
            </span>
            <Star className="w-4 h-4 text-[#F1B8CC]" />
          </div>
          <div className="text-lg sm:text-2xl font-bold font-mono text-[#34313D] dark:text-[#F4F2F7]">
            {stats.favoriteNotesCount}
          </div>
        </div>

        {/* Trash */}
        <div
          onClick={() => setActiveTab('trash')}
          className={`p-3.5 sm:p-4 rounded-2xl border transition-all cursor-pointer ${
            activeTab === 'trash'
              ? 'bg-[#FCF3F0] dark:bg-[#381E19] border-[#F7C5BA] shadow-xs'
              : 'bg-white dark:bg-[#201D27] border-[#EEEAF2] dark:border-[#2D2838] hover:border-[#F7C5BA]/50'
          }`}
        >
          <div className="flex items-center justify-between mb-1">
            <span className="text-[11px] font-semibold text-[#898493] dark:text-[#9E99A8]">
              Trash Bin
            </span>
            <Trash2 className="w-4 h-4 text-[#E07A5F]" />
          </div>
          <div className="text-lg sm:text-2xl font-bold font-mono text-[#34313D] dark:text-[#F4F2F7]">
            {stats.trashNotesCount}
          </div>
        </div>
      </div>

      {/* 3. Navigation Tabs, Search Bar & View Mode Switcher */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
        {/* Tabs: All / Pinned / Favorites / Trash */}
        <div className="flex items-center gap-1.5 p-1 rounded-2xl bg-white dark:bg-[#201D27] border border-[#EEEAF2] dark:border-[#2D2838] shadow-2xs self-start overflow-x-auto max-w-full">
          <button
            type="button"
            onClick={() => setActiveTab('all')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
              activeTab === 'all'
                ? 'bg-[#A995D8] text-white shadow-2xs'
                : 'text-[#898493] hover:text-[#34313D] dark:hover:text-white'
            }`}
          >
            All Notes ({stats.activeNotesCount})
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('pinned')}
            className={`flex items-center gap-1 px-3 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
              activeTab === 'pinned'
                ? 'bg-[#A995D8] text-white shadow-2xs'
                : 'text-[#898493] hover:text-[#34313D] dark:hover:text-white'
            }`}
          >
            <Pin className="w-3 h-3" />
            <span>Pinned ({stats.pinnedNotesCount})</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('favorites')}
            className={`flex items-center gap-1 px-3 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
              activeTab === 'favorites'
                ? 'bg-[#F1B8CC] text-white shadow-2xs'
                : 'text-[#898493] hover:text-[#34313D] dark:hover:text-white'
            }`}
          >
            <Star className="w-3 h-3" />
            <span>Favorites ({stats.favoriteNotesCount})</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('trash')}
            className={`flex items-center gap-1 px-3 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
              activeTab === 'trash'
                ? 'bg-[#E07A5F] text-white shadow-2xs'
                : 'text-[#898493] hover:text-[#34313D] dark:hover:text-white'
            }`}
          >
            <Trash2 className="w-3 h-3" />
            <span>Trash ({stats.trashNotesCount})</span>
          </button>
        </div>

        {/* Right Toolbar Controls: Search, Filter Drawer Toggle & Layout Switcher */}
        <div className="flex items-center gap-2">
          {/* Quick Search */}
          <div className="relative min-w-[200px] sm:min-w-[240px]">
            <Search className="w-3.5 h-3.5 text-[#898493] absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search title, content, tag..."
              className="w-full pl-8 pr-7 py-2 text-xs rounded-xl border border-[#EEEAF2] dark:border-[#2D2838] bg-white dark:bg-[#201D27] text-[#34313D] dark:text-[#F4F2F7] focus:outline-hidden focus:border-[#A995D8] transition-colors"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className="absolute right-2 top-1/2 -translate-y-1/2 text-[#898493] hover:text-[#34313D] cursor-pointer"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Filter Drawer Toggle */}
          <button
            type="button"
            onClick={() => setIsFilterDrawerOpen(!isFilterDrawerOpen)}
            className={`p-2 rounded-xl border transition-all cursor-pointer ${
              hasActiveFilters || isFilterDrawerOpen
                ? 'border-[#A995D8] bg-[#F4F1FA] text-[#A995D8] dark:bg-[#2C253B]'
                : 'border-[#EEEAF2] dark:border-[#2D2838] bg-white dark:bg-[#201D27] text-[#898493] hover:text-[#34313D]'
            }`}
            title="Filter and Sort"
            aria-label="Filter and Sort"
          >
            <Filter className="w-4 h-4" />
          </button>

          {/* View Mode Switcher: Grid vs List */}
          <div className="flex items-center p-0.5 rounded-xl bg-white dark:bg-[#201D27] border border-[#EEEAF2] dark:border-[#2D2838]">
            <button
              type="button"
              onClick={() => setLayoutMode('grid')}
              className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
                layoutMode === 'grid'
                  ? 'bg-[#A995D8] text-white'
                  : 'text-[#898493] hover:text-[#34313D]'
              }`}
              title="Grid View"
            >
              <LayoutGrid className="w-3.5 h-3.5" />
            </button>
            <button
              type="button"
              onClick={() => setLayoutMode('list')}
              className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
                layoutMode === 'list'
                  ? 'bg-[#A995D8] text-white'
                  : 'text-[#898493] hover:text-[#34313D]'
              }`}
              title="List View"
            >
              <List className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Empty Trash Button (only in Trash tab) */}
          {activeTab === 'trash' && trashNotes.length > 0 && (
            <button
              type="button"
              onClick={() =>
                setTrashConfirmConfig({
                  isOpen: true,
                  mode: 'empty_trash',
                })
              }
              className="px-3 py-1.5 rounded-xl text-xs font-bold text-white bg-[#E07A5F] hover:bg-[#D0694E] transition-colors cursor-pointer flex items-center gap-1.5 shrink-0"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Empty Trash</span>
            </button>
          )}
        </div>
      </div>

      {/* 4. Filter & Sort Drawer (Expandable) */}
      {isFilterDrawerOpen && (
        <div className="p-4 sm:p-5 rounded-3xl bg-white dark:bg-[#201D27] border border-[#EEEAF2] dark:border-[#2D2838] shadow-xs space-y-4">
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 pb-3 border-b border-[#EEEAF2] dark:border-[#2D2838]">
            <span className="text-xs font-bold text-[#34313D] dark:text-[#F4F2F7]">
              Filter & Sort Notes
            </span>
            {hasActiveFilters && (
              <button
                type="button"
                onClick={clearAllFilters}
                className="text-xs font-semibold text-[#E07A5F] hover:underline self-end sm:self-auto cursor-pointer"
              >
                Reset All Filters
              </button>
            )}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
            {/* Category Filter */}
            <div>
              <label className="block text-[11px] font-semibold text-[#898493] dark:text-[#9E99A8] mb-1">
                Category
              </label>
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-[#EEEAF2] dark:border-[#2D2838] bg-[#FAF9FC] dark:bg-[#1A1823] text-xs font-semibold text-[#34313D] dark:text-[#F4F2F7] cursor-pointer"
              >
                <option value="all">All Categories</option>
                {categories.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Sort Dropdown */}
            <div>
              <label className="block text-[11px] font-semibold text-[#898493] dark:text-[#9E99A8] mb-1">
                Sort By
              </label>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as NoteSortOption)}
                className="w-full px-3 py-2 rounded-xl border border-[#EEEAF2] dark:border-[#2D2838] bg-[#FAF9FC] dark:bg-[#1A1823] text-xs font-semibold text-[#34313D] dark:text-[#F4F2F7] cursor-pointer"
              >
                <option value="updated_desc">Recently Updated</option>
                <option value="created_desc">Recently Created</option>
                <option value="created_asc">Oldest First</option>
                <option value="alpha_asc">Alphabetical (A–Z)</option>
                <option value="alpha_desc">Alphabetical (Z–A)</option>
              </select>
            </div>

            {/* Tag Quick Selector */}
            <div>
              <label className="block text-[11px] font-semibold text-[#898493] dark:text-[#9E99A8] mb-1">
                Filter by Tag
              </label>
              <select
                value={selectedTag || 'all'}
                onChange={(e) => setSelectedTag(e.target.value === 'all' ? null : e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-[#EEEAF2] dark:border-[#2D2838] bg-[#FAF9FC] dark:bg-[#1A1823] text-xs font-semibold text-[#34313D] dark:text-[#F4F2F7] cursor-pointer"
              >
                <option value="all">All Tags</option>
                {allUniqueTags.map((t) => (
                  <option key={t} value={t}>
                    #{t}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Tag Quick Chips */}
          {allUniqueTags.length > 0 && (
            <div className="pt-2 flex items-center gap-1.5 flex-wrap">
              <span className="text-[10px] font-semibold text-[#898493]">Quick Tags:</span>
              {allUniqueTags.map((tag) => (
                <button
                  key={tag}
                  type="button"
                  onClick={() => setSelectedTag(selectedTag === tag ? null : tag)}
                  className={`px-2 py-0.5 rounded-full text-[10px] font-semibold transition-colors cursor-pointer ${
                    selectedTag === tag
                      ? 'bg-[#A995D8] text-white shadow-2xs'
                      : 'bg-[#FAF9FC] dark:bg-[#1A1823] border border-[#EEEAF2] dark:border-[#2D2838] text-[#898493] hover:text-[#34313D]'
                  }`}
                >
                  #{tag}
                </button>
              ))}
            </div>
          )}
        </div>
      )}

      {/* 5. Notes Content Display */}
      {displayedNotes.length === 0 ? (
        <div className="p-8 sm:p-12 bg-white dark:bg-[#201D27] rounded-3xl border border-[#EEEAF2] dark:border-[#2D2838] shadow-xs">
          {activeTab === 'trash' ? (
            <EmptyState
              icon={Trash2}
              title="Trash is empty"
              description="Deleted notes will appear here. You can restore them anytime or permanently delete them."
              iconColor="#E07A5F"
            />
          ) : activeTab === 'pinned' ? (
            <EmptyState
              icon={Pin}
              title="No pinned notes"
              description="Keep essential notes at your fingertips by pinning them."
              actionLabel="+ Create Note"
              onAction={handleOpenNewNote}
              iconColor="#A995D8"
            />
          ) : activeTab === 'favorites' ? (
            <EmptyState
              icon={Star}
              title="No favorite notes yet"
              description="Star your most cherished reflections and insights to find them quickly here."
              actionLabel="+ Create Note"
              onAction={handleOpenNewNote}
              iconColor="#F1B8CC"
            />
          ) : searchQuery.trim() || selectedCategory !== 'all' || selectedTag ? (
            <EmptyState
              icon={Search}
              title="No matching notes found"
              description="Try adjusting your search query, clearing filters, or picking a different category."
              actionLabel="Clear Filters"
              onAction={clearAllFilters}
              iconColor="#A9C8E8"
            />
          ) : (
            <EmptyState
              icon={StickyNote}
              title="No notes created yet"
              description="Capture spontaneous thoughts, meeting highlights, checklists, and project brainstorming."
              actionLabel="+ Create Your First Note"
              onAction={handleOpenNewNote}
              iconColor="#A995D8"
            />
          )}
        </div>
      ) : layoutMode === 'grid' ? (
        /* Grid Layout */
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5">
          {displayedNotes.map((note) => (
            <NoteCard
              key={note.id}
              note={note}
              layout="grid"
              isTrashView={activeTab === 'trash'}
              onTogglePin={toggleNotePin}
              onToggleFavorite={toggleNoteFavorite}
              onDelete={deleteNote}
              onRestore={restoreNote}
              onDeletePermanent={(id) =>
                setTrashConfirmConfig({
                  isOpen: true,
                  mode: 'delete_single',
                  noteId: id,
                })
              }
              onClick={handleOpenDetailNote}
            />
          ))}
        </div>
      ) : (
        /* List Layout */
        <div className="space-y-2.5">
          {displayedNotes.map((note) => (
            <NoteCard
              key={note.id}
              note={note}
              layout="list"
              isTrashView={activeTab === 'trash'}
              onTogglePin={toggleNotePin}
              onToggleFavorite={toggleNoteFavorite}
              onDelete={deleteNote}
              onRestore={restoreNote}
              onDeletePermanent={(id) =>
                setTrashConfirmConfig({
                  isOpen: true,
                  mode: 'delete_single',
                  noteId: id,
                })
              }
              onClick={handleOpenDetailNote}
            />
          ))}
        </div>
      )}

      {/* 6. Modals */}
      {/* Note Editor Modal */}
      <NoteEditorModal
        isOpen={isEditorOpen}
        onClose={() => {
          setIsEditorOpen(false);
          setNoteToEdit(null);
        }}
        noteToEdit={noteToEdit}
      />

      {/* Note Detail Modal */}
      <NoteDetailModal
        isOpen={isDetailOpen}
        onClose={() => {
          setIsDetailOpen(false);
          setActiveDetailNote(null);
        }}
        note={activeDetailNote}
        onEdit={(note) => {
          setIsDetailOpen(false);
          handleOpenEditNote(note);
        }}
      />

      {/* Category Manager Modal */}
      <CategoryManagerModal
        isOpen={isCategoryManagerOpen}
        onClose={() => setIsCategoryManagerOpen(false)}
      />

      {/* Trash Confirmation Modal */}
      <TrashConfirmationModal
        isOpen={trashConfirmConfig.isOpen}
        onClose={() => setTrashConfirmConfig((prev) => ({ ...prev, isOpen: false }))}
        onConfirm={
          trashConfirmConfig.mode === 'empty_trash'
            ? handleConfirmEmptyTrash
            : handleConfirmDeleteSingle
        }
        title={
          trashConfirmConfig.mode === 'empty_trash'
            ? 'Empty Trash Bin?'
            : 'Delete Note Permanently?'
        }
        description={
          trashConfirmConfig.mode === 'empty_trash'
            ? `This action will permanently delete all ${trashNotes.length} notes in your trash. This action cannot be undone.`
            : 'This note will be permanently deleted from your account and cannot be recovered.'
        }
        confirmLabel={
          trashConfirmConfig.mode === 'empty_trash' ? 'Empty Trash' : 'Delete Permanently'
        }
        isLoading={isTrashProcessing}
      />
    </div>
  );
};
