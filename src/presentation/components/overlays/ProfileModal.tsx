import React from 'react';
import { useFlow } from '../../state/FlowContext';
import { formatReadableDate } from '../../../core/utils/date';
import { X, ShieldCheck, Flame, CheckCircle2, Award } from 'lucide-react';

interface ProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
  onOpenSettings: () => void;
}

export const ProfileModal: React.FC<ProfileModalProps> = ({
  isOpen,
  onClose,
}) => {
  const { user, stats, tasks } = useFlow();

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 bg-[#34313D]/40 backdrop-blur-xs flex items-center justify-center p-4"
      onClick={onClose}
    >
      <div
        className="w-full max-w-md bg-white dark:bg-[#201D27] rounded-3xl border border-[#EEEAF2] dark:border-[#2D2838] p-6 shadow-2xl animate-in zoom-in-95 duration-150"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-[#EEEAF2] dark:border-[#2D2838]">
          <h3 className="text-base font-bold text-[#34313D] dark:text-[#F4F2F7]">
            User Profile
          </h3>
          <button
            onClick={onClose}
            className="p-1.5 text-[#898493] hover:text-[#34313D] dark:hover:text-white rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Profile Card */}
        <div className="py-5 flex flex-col items-center text-center">
          <div className="w-18 h-18 rounded-3xl bg-gradient-to-tr from-[#A995D8] to-[#F1B8CC] flex items-center justify-center text-white text-2xl font-bold shadow-md mb-3">
            {user?.name ? user.name.charAt(0).toUpperCase() : 'F'}
          </div>
          <h4 className="text-lg font-bold text-[#34313D] dark:text-[#F4F2F7]">
            {user?.name || 'FlowDay Explorer'}
          </h4>
          <p className="text-xs text-[#898493] dark:text-[#9E99A8] mt-0.5">
            {user?.email || 'user@flowday.app'}
          </p>
          <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-[#F2F8F5] dark:bg-[#1C3127] text-[#B5DCCB] text-[11px] font-medium mt-2">
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>Personal Pro Workspace</span>
          </div>
        </div>

        {/* Real Statistics Quick Snapshot */}
        <div className="grid grid-cols-3 gap-2.5 p-3 rounded-2xl bg-[#FAF9FC] dark:bg-[#17151D] border border-[#EEEAF2] dark:border-[#2D2838] text-center my-2">
          <div>
            <div className="flex items-center justify-center gap-1 text-[11px] text-[#898493] mb-0.5">
              <CheckCircle2 className="w-3 h-3 text-[#A995D8]" />
              <span>Tasks</span>
            </div>
            <span className="font-mono font-bold text-sm text-[#34313D] dark:text-[#F4F2F7]">
              {tasks.filter((t) => t.isCompleted).length}
            </span>
          </div>

          <div>
            <div className="flex items-center justify-center gap-1 text-[11px] text-[#898493] mb-0.5">
              <Flame className="w-3 h-3 text-[#F1B8CC]" />
              <span>Focus</span>
            </div>
            <span className="font-mono font-bold text-sm text-[#34313D] dark:text-[#F4F2F7]">
              {Math.round(stats.todayFocusSeconds / 60)}m
            </span>
          </div>

          <div>
            <div className="flex items-center justify-center gap-1 text-[11px] text-[#898493] mb-0.5">
              <Award className="w-3 h-3 text-[#B5DCCB]" />
              <span>Goal</span>
            </div>
            <span className="font-mono font-bold text-sm text-[#34313D] dark:text-[#F4F2F7]">
              {stats.todayCompletionRate}%
            </span>
          </div>
        </div>

        {/* Member Details */}
        <div className="py-3 text-xs text-[#898493] dark:text-[#9E99A8] space-y-1.5">
          <div className="flex items-center justify-between">
            <span>Joined:</span>
            <span className="font-mono text-[#34313D] dark:text-[#F4F2F7]">
              {formatReadableDate(user?.createdAt)}
            </span>
          </div>
          <div className="flex items-center justify-between">
            <span>Data Storage:</span>
            <span className="text-[#B5DCCB] font-medium">Local DB + Firestore Ready</span>
          </div>
        </div>
      </div>
    </div>
  );
};
