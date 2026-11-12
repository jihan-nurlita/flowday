import React, { useState, useEffect } from 'react';
import { useFlow } from '../state/FlowContext';
import { BaseCard, SummaryCard, StatisticsCard } from '../components/cards/AppCards';
import { PrimaryButton } from '../components/buttons/AppButtons';
import { getTodayDateString } from '../../core/utils/date';
import {
  BarChart3,
  CheckCircle2,
  Flame,
  Award,
  BookOpen,
} from 'lucide-react';

export const AnalyticsView: React.FC = () => {
  const { tasks, focusSessions, categories, todayReview, saveDailyReview, stats } = useFlow();

  const [reflectionInput, setReflectionInput] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  useEffect(() => {
    if (todayReview) {
      setReflectionInput(todayReview.reflection || '');
    }
  }, [todayReview]);

  const handleSaveReflection = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!reflectionInput.trim()) return;
    setIsSaving(true);
    try {
      await saveDailyReview(reflectionInput.trim());
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 2500);
    } catch (err) {
      console.error('Failed to save reflection:', err);
    } finally {
      setIsSaving(false);
    }
  };

  // Category task distribution (computed live from tasks table in local database)
  const categoryStats = categories.map((cat) => {
    const catTasks = tasks.filter((t) => t.categoryId === cat.id);
    const completed = catTasks.filter((t) => t.isCompleted).length;
    return {
      id: cat.id,
      name: cat.name,
      color: cat.color,
      total: catTasks.length,
      completed,
      percent: tasks.length > 0 ? Math.round((catTasks.length / tasks.length) * 100) : 0,
    };
  });

  return (
    <div className="space-y-6">
      {/* 1. Header */}
      <div>
        <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-[#34313D] dark:text-[#F4F2F7]">
          Productivity Statistics & Review
        </h2>
        <p className="text-xs sm:text-sm text-[#898493] dark:text-[#9E99A8] mt-0.5">
          Genuine metrics calculated strictly from your recorded tasks, time blocks, and focus sessions.
        </p>
      </div>

      {/* 2. Overview Section: Key Performance Indicators */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <SummaryCard
          label="Task Velocity"
          value={stats.todayTasksCompleted}
          subValue={`/ ${stats.todayTasksTotal} tasks done`}
          icon={CheckCircle2}
          iconColor="#A995D8"
          progressPercent={stats.todayCompletionRate}
          progressColor="#A995D8"
        />

        <SummaryCard
          label="Focus Investment"
          value={Math.round(stats.todayFocusSeconds / 60)}
          subValue="minutes today"
          icon={Flame}
          iconColor="#F1B8CC"
        />

        <SummaryCard
          label="Efficiency Index"
          value={`${stats.todayCompletionRate}%`}
          subValue={
            stats.todayCompletionRate >= 80
              ? 'Peak Flow'
              : stats.todayCompletionRate >= 50
              ? 'Steady Momentum'
              : 'Starting Out'
          }
          icon={Award}
          iconColor="#B5DCCB"
        />
      </div>

      {/* 3. Productivity Charts & Activity Summaries Split */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Productivity Charts Area: Category Distribution */}
        <StatisticsCard
          title="Task Distribution by Category"
          subtitle={`Calculated from ${tasks.length} recorded items in your database`}
        >
          <div className="space-y-4 pt-2">
            {categoryStats.map((cat) => (
              <div key={cat.id}>
                <div className="flex items-center justify-between text-xs mb-1">
                  <div className="flex items-center gap-2">
                    <span
                      className="w-2.5 h-2.5 rounded-full"
                      style={{ backgroundColor: cat.color }}
                    />
                    <span className="font-semibold text-[#34313D] dark:text-[#F4F2F7]">{cat.name}</span>
                  </div>
                  <div className="flex items-center gap-2 text-[#898493] dark:text-[#9E99A8] font-mono text-[11px]">
                    <span>{cat.completed}/{cat.total} done</span>
                    <span>({cat.percent}%)</span>
                  </div>
                </div>

                <div className="w-full bg-[#FAF9FC] dark:bg-[#17151D] h-2 rounded-full overflow-hidden border border-[#EEEAF2] dark:border-[#2D2838]">
                  <div
                    className="h-full rounded-full transition-all duration-300"
                    style={{
                      width: `${cat.percent}%`,
                      backgroundColor: cat.color,
                    }}
                  />
                </div>
              </div>
            ))}
          </div>
        </StatisticsCard>

        {/* Activity Summaries: Daily Review Reflection Journal */}
        <BaseCard className="flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <BookOpen className="w-4 h-4 text-[#A995D8]" />
              <h3 className="text-sm font-bold text-[#34313D] dark:text-[#F4F2F7]">
                Today's Reflection Journal
              </h3>
            </div>
            <p className="text-xs text-[#898493] dark:text-[#9E99A8] mb-4">
              Evaluate what went well, obstacles encountered, and your top priority for tomorrow.
            </p>

            <form onSubmit={handleSaveReflection}>
              <textarea
                rows={5}
                placeholder="What went well today? What distracted you? What is your single top priority for tomorrow morning?"
                value={reflectionInput}
                onChange={(e) => setReflectionInput(e.target.value)}
                className="w-full p-3.5 text-xs bg-[#FAF9FC] dark:bg-[#17151D] border border-[#EEEAF2] dark:border-[#2D2838] rounded-xl focus:outline-none focus:border-[#A995D8] resize-none transition-colors"
              />

              <div className="flex items-center justify-between mt-3">
                <span className="text-[11px] text-[#898493]">
                  {saveSuccess && <span className="text-[#B5DCCB] font-medium">✓ Reflection saved!</span>}
                </span>

                <PrimaryButton
                  type="submit"
                  size="sm"
                  disabled={isSaving || !reflectionInput.trim()}
                  isLoading={isSaving}
                >
                  Save Reflection
                </PrimaryButton>
              </div>
            </form>
          </div>

          <div className="mt-6 pt-4 border-t border-[#EEEAF2] dark:border-[#2D2838] flex items-center justify-between text-[11px] text-[#898493]">
            <span>Date: {getTodayDateString()}</span>
            <span>Recorded in DailyReviews Table</span>
          </div>
        </BaseCard>
      </div>
    </div>
  );
};
