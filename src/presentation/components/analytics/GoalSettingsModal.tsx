import React, { useState, useEffect } from 'react';
import {
  ProductivityGoals,
  DEFAULT_PRODUCTIVITY_GOALS,
  GoalTargetConfig,
} from '../../../domain/entities/productivity_goal';
import { PrimaryButton, SecondaryButton } from '../buttons/AppButtons';
import { X, Target, CheckCircle2, Flame } from 'lucide-react';

interface GoalSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  goals: ProductivityGoals | null;
  onSave: (
    updates: Partial<
      Pick<
        ProductivityGoals,
        'dailyTaskGoal' | 'weeklyTaskGoal' | 'dailyFocusGoalMinutes' | 'weeklyFocusGoalMinutes'
      >
    >
  ) => Promise<void>;
}

export const GoalSettingsModal: React.FC<GoalSettingsModalProps> = ({
  isOpen,
  onClose,
  goals,
  onSave,
}) => {
  const [dailyTask, setDailyTask] = useState<GoalTargetConfig>(
    DEFAULT_PRODUCTIVITY_GOALS.dailyTaskGoal
  );
  const [weeklyTask, setWeeklyTask] = useState<GoalTargetConfig>(
    DEFAULT_PRODUCTIVITY_GOALS.weeklyTaskGoal
  );
  const [dailyFocus, setDailyFocus] = useState<GoalTargetConfig>(
    DEFAULT_PRODUCTIVITY_GOALS.dailyFocusGoalMinutes
  );
  const [weeklyFocus, setWeeklyFocus] = useState<GoalTargetConfig>(
    DEFAULT_PRODUCTIVITY_GOALS.weeklyFocusGoalMinutes
  );
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      const source = goals || DEFAULT_PRODUCTIVITY_GOALS;
      setDailyTask({ ...source.dailyTaskGoal });
      setWeeklyTask({ ...source.weeklyTaskGoal });
      setDailyFocus({ ...source.dailyFocusGoalMinutes });
      setWeeklyFocus({ ...source.weeklyFocusGoalMinutes });
      setError(null);
    }
  }, [isOpen, goals]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const list = [dailyTask, weeklyTask, dailyFocus, weeklyFocus];
    if (list.some((g) => g.enabled && (!Number.isFinite(g.target) || g.target < 1))) {
      setError('Enabled targets must be at least 1.');
      return;
    }

    setIsSaving(true);
    setError(null);
    try {
      await onSave({
        dailyTaskGoal: {
          enabled: dailyTask.enabled,
          target: Math.max(1, Math.round(dailyTask.target)),
        },
        weeklyTaskGoal: {
          enabled: weeklyTask.enabled,
          target: Math.max(1, Math.round(weeklyTask.target)),
        },
        dailyFocusGoalMinutes: {
          enabled: dailyFocus.enabled,
          target: Math.max(1, Math.round(dailyFocus.target)),
        },
        weeklyFocusGoalMinutes: {
          enabled: weeklyFocus.enabled,
          target: Math.max(1, Math.round(weeklyFocus.target)),
        },
      });
      onClose();
    } catch (err) {
      setError('Could not save productivity goals. Please try again.');
      console.error(err);
    } finally {
      setIsSaving(false);
    }
  };

  const renderRow = (
    title: string,
    subtitle: string,
    unit: string,
    max: number,
    config: GoalTargetConfig,
    setConfig: React.Dispatch<React.SetStateAction<GoalTargetConfig>>,
    accentColor: string,
    icon: React.ReactNode
  ) => (
    <div className="p-4 rounded-2xl bg-[#FAF9FC] dark:bg-[#17151D] border border-[#EEEAF2] dark:border-[#2D2838] flex flex-col sm:flex-row sm:items-center justify-between gap-3">
      <div className="flex items-start gap-3">
        <div
          className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0 mt-0.5"
          style={{ backgroundColor: `${accentColor}22`, color: accentColor }}
        >
          {icon}
        </div>
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-[#34313D] dark:text-[#F4F2F7]">{title}</span>
          </div>
          <p className="text-[11px] text-[#898493] dark:text-[#9E99A8] mt-0.5">{subtitle}</p>
        </div>
      </div>

      <div className="flex items-center gap-3 self-end sm:self-center">
        <div className="flex items-center gap-1.5">
          <input
            type="number"
            min={1}
            max={max}
            disabled={!config.enabled}
            value={config.target}
            onChange={(e) =>
              setConfig((prev) => ({
                ...prev,
                target: Math.max(1, Number(e.target.value) || 1),
              }))
            }
            className="w-20 px-2.5 py-1.5 text-xs font-mono tabular-nums font-bold text-right rounded-xl bg-white dark:bg-[#201D27] border border-[#EEEAF2] dark:border-[#2D2838] text-[#34313D] dark:text-[#F4F2F7] focus:outline-none focus:border-[#A995D8] disabled:opacity-45"
          />
          <span className="text-[11px] font-medium text-[#898493] dark:text-[#9E99A8] w-10">
            {unit}
          </span>
        </div>

        <button
          type="button"
          role="switch"
          aria-checked={config.enabled}
          aria-label={`Toggle ${title}`}
          onClick={() => setConfig((prev) => ({ ...prev, enabled: !prev.enabled }))}
          className={`relative w-10 h-5.5 rounded-full transition-colors cursor-pointer shrink-0 ${
            config.enabled ? 'bg-[#A995D8]' : 'bg-[#DDD7E6] dark:bg-[#2D2838]'
          }`}
        >
          <span
            className={`absolute top-0.5 left-0.5 w-4.5 h-4.5 rounded-full bg-white transition-transform shadow-xs ${
              config.enabled ? 'translate-x-4.5' : 'translate-x-0'
            }`}
          />
        </button>
      </div>
    </div>
  );

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#34313D]/35 backdrop-blur-xs"
      onClick={onClose}
    >
      <div
        className="w-full max-w-lg bg-white dark:bg-[#201D27] rounded-3xl border border-[#EEEAF2] dark:border-[#2D2838] shadow-xl overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-6 py-4 border-b border-[#EEEAF2] dark:border-[#2D2838]">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-[#F4F1FA] dark:bg-[#2C253B] flex items-center justify-center text-[#A995D8]">
              <Target className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-[#34313D] dark:text-[#F4F2F7]">
                Productivity Goals
              </h3>
              <p className="text-[11px] text-[#898493] dark:text-[#9E99A8]">
                Set realistic targets to track daily & weekly consistency
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-xl text-[#898493] hover:text-[#34313D] dark:hover:text-[#F4F2F7] hover:bg-[#FAF9FC] dark:hover:bg-[#17151D] transition-colors cursor-pointer"
            aria-label="Close goal settings"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-3">
          {error && (
            <div className="p-3 rounded-xl bg-[#FCF3F0] dark:bg-[#331C18] text-xs font-medium text-[#E07A5F]">
              {error}
            </div>
          )}

          {renderRow(
            'Daily Task Goal',
            'Number of tasks completed per day',
            'tasks',
            100,
            dailyTask,
            setDailyTask,
            '#A995D8',
            <CheckCircle2 className="w-4 h-4" />
          )}

          {renderRow(
            'Weekly Task Goal',
            'Total tasks completed across the week',
            'tasks',
            500,
            weeklyTask,
            setWeeklyTask,
            '#B5DCCB',
            <CheckCircle2 className="w-4 h-4" />
          )}

          {renderRow(
            'Daily Focus Goal',
            'Deep work or Pomodoro minutes per day',
            'mins',
            720,
            dailyFocus,
            setDailyFocus,
            '#F1B8CC',
            <Flame className="w-4 h-4" />
          )}

          {renderRow(
            'Weekly Focus Goal',
            'Cumulative focus minutes each week',
            'mins',
            5000,
            weeklyFocus,
            setWeeklyFocus,
            '#A9C8E8',
            <Flame className="w-4 h-4" />
          )}

          <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-[#EEEAF2] dark:border-[#2D2838]">
            <SecondaryButton type="button" size="sm" onClick={onClose}>
              Cancel
            </SecondaryButton>
            <PrimaryButton type="submit" size="sm" isLoading={isSaving}>
              Save Targets
            </PrimaryButton>
          </div>
        </form>
      </div>
    </div>
  );
};
