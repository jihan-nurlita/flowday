export interface Note {
  id: string;
  userId: string;
  title: string;
  content: string;
  categoryId: string;
  tags?: string[];
  color?: string; // pastel background color e.g. #F4F1FA
  isPinned: boolean;
  isFavorite?: boolean;
  isDeleted?: boolean; // soft delete / trash status
  deletedAt?: string; // ISO date string when moved to trash
  createdAt: string;
  updatedAt: string;
}
