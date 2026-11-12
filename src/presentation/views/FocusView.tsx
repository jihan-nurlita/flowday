import React, { useState } from 'react';
import { useFlow } from '../state/FlowContext';
import { FocusSessionType } from '../../domain/entities/focus_session';
import { formatReadableDate } from '../../core/utils/date';
import { BaseCard } from '../components/cards/AppCards';
import { PrimaryButton, SecondaryButton, IconButton } from '../components/buttons/AppButtons';
import { DropdownField } from '../components/inputs/AppInputs';
import { EmptyState } from '../components/feedback/AppFeedback';
import {
  Play,
  Pause,
  RotateCcw,
  Sparkles,
  CheckCircle,
  Flame,
  Target,
  Timer,
} from 'lucide-react';

export const FocusView: React.FC = () => {
  const { timerState, tasks, focusSessions, recordFocusSession } = useFlow();

  const [selectedTask, setSelectedTask] = useState<string>('');

  const activeTasks = tasks.filter((t) => !t.isCompleted);

  const formatTimeDisplay = (totalSecs: number) => {
    const mins = Math.floor(totalSecs / 60);
    const secs = totalSecs % 60;
    return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
  };

  const progressPercentage =
    timerState.totalDuration > 0
      ? ((timerState.totalDuration - timerState.timeLeft) / timerState.totalDuration) * 100
      : 0;

  const handleFinishEarly = async () => {
    const elapsed = timerState.totalDuration - timerState.timeLeft;
    if (elapsed > 30) {
      await recordFocusSession({
        duration: elapsed,
        sessionType: timerState.mode,
        taskId: selectedTask || undefined,
      });
    }
    timerState.reset();
  };

  const taskOptions = [
    { value: '', label: 'General Flow / No Task Attached' },
    ...activeTasks.map((t) => ({ value: t.id, label: t.title })),
  ];

  return (
    <div className="space-y-6">
      {/* 1. Header */}
      <div>
        <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-[#34313D] dark:text-[#F4F2F7]">
          Focus & Pomodoro
        </h2>
        <p className="text-xs sm:text-sm text-[#898493] dark:text-[#9E99A8] mt-0.5">
          Eliminate digital noise, focus on one intention, and track real completed flow blocks.
        </p>
      </div>

      {/* 2. Timer Area & History Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Focus Timer Area */}
        <div className="lg:col-span-2">
          <BaseCard className="flex flex-col items-center justify-center text-center p-6 sm:p-10 relative overflow-hidden">
            {/* Ambient Pastel Background Glow */}
            <div
              className="absolute -top-24 -right-24 w-64 h-64 rounded-full bg-[#A995D8]/10 blur-3xl pointer-events-none"
              aria-hidden="true"
            />
            <div
              className="absolute -bottom-24 -left-24 w-64 h-64 rounded-full bg-[#F1B8CC]/10 blur-3xl pointer-events-none"
              aria-hidden="true"
            />

            {/* Mode Selector Tabs */}
            <div className="flex items-center gap-1.5 p-1.5 bg-[#FAF9FC] dark:bg-[#17151D] border border-[#EEEAF2] dark:border-[#2D2838] rounded-2xl mb-8 select-none overflow-x-auto max-w-full">
              {[
                { id: 'pomodoro' as FocusSessionType, label: 'Pomodoro (25m)' },
                { id: 'short_break' as FocusSessionType, label: 'Short Break (5m)' },
                { id: 'long_break' as FocusSessionType, label: 'Long Break (15m)' },
                { id: 'deep_work' as FocusSessionType, label: 'Deep Work (45m)' },
              ].map((m) => (
                <button
                  key={m.id}
                  onClick={() => timerState.setMode(m.id)}
                  className={`px-3.5 py-1.5 text-xs font-semibold rounded-xl whitespace-nowrap transition-all cursor-pointer ${
                    timerState.mode === m.id
                      ? 'bg-[#A995D8] text-white shadow-xs'
                      : 'text-[#898493] hover:text-[#34313D] dark:hover:text-[#F4F2F7]'
                  }`}
                >
                  {m.label}
                </button>
              ))}
            </div>

            {/* Circular Visual Countdown */}
            <div className="relative w-64 h-64 sm:w-72 sm:h-72 flex items-center justify-center my-2">
              <svg className="w-full h-full -rotate-90 transform" viewBox="0 0 100 100">
                <circle
                  cx="50"
                  cy="50"
                  r="44"
                  className="stroke-[#EEEAF2] dark:stroke-[#2D2838]"
                  strokeWidth="5"
                  fill="transparent"
                />
                <circle
                  cx="50"
                  cy="50"
                  r="44"
                  className="stroke-[#A995D8] transition-all duration-500 ease-linear"
                  strokeWidth="5"
                  strokeDasharray="276.46"
                  strokeDashoffset={276.46 - (276.46 * progressPercentage) / 100}
                  strokeLinecap="round"
                  fill="transparent"
                />
              </svg>

              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className="text-5xl sm:text-6xl font-mono font-bold tracking-tight text-[#34313D] dark:text-[#F4F2F7] tabular-nums">
                  {formatTimeDisplay(timerState.timeLeft)}
                </span>
                <span className="text-xs text-[#898493] dark:text-[#9E99A8] mt-2 font-semibold capitalize">
                  {timerState.isRunning ? 'Flow state active' : 'Paused / Ready'}
                </span>
              </div>
            </div>

            {/* Session Information: Linked Task Selector */}
            <div className="w-full max-w-sm my-6 text-left">
              <DropdownField
                label="Target Task for this Session:"
                options={taskOptions}
                value={selectedTask}
                onChange={(e) => {
                  setSelectedTask(e.target.value);
                  timerState.setActiveTaskId(e.target.value || null);
                }}
              />
            </div>

            {/* Controls */}
            <div className="flex items-center gap-3">
              <IconButton
                icon={RotateCcw}
                label="Reset Timer"
                onClick={timerState.reset}
                size="lg"
                variant="outlined"
              />

              {timerState.isRunning ? (
                <SecondaryButton
                  icon={Pause}
                  onClick={timerState.pause}
                  size="lg"
                >
                  Pause Session
                </SecondaryButton>
              ) : (
                <PrimaryButton
                  icon={Play}
                  onClick={timerState.start}
                  size="lg"
                >
                  Start Flow
                </PrimaryButton>
              )}

              {timerState.timeLeft < timerState.totalDuration && (
                <IconButton
                  icon={CheckCircle}
                  label="Log Session"
                  onClick={handleFinishEarly}
                  size="lg"
                  variant="filled"
                />
              )}
            </div>
          </BaseCard>
        </div>

        {/* Focus History Area */}
        <div className="space-y-6">
          <BaseCard>
            <h3 className="text-xs font-bold text-[#898493] dark:text-[#9E99A8] uppercase tracking-wider mb-4">
              Focus Metrics
            </h3>

            <div className="grid grid-cols-2 gap-3">
              <div className="p-3.5 rounded-xl bg-[#FAF9FC] dark:bg-[#17151D] border border-[#EEEAF2] dark:border-[#2D2838]">
                <div className="flex items-center gap-1.5 text-xs text-[#898493]">
                  <Flame className="w-3.5 h-3.5 text-[#F1B8CC]" />
                  <span>Sessions</span>
                </div>
                <div className="text-xl font-bold font-mono text-[#34313D] dark:text-[#F4F2F7] mt-1">
                  {focusSessions.length}
                </div>
              </div>

              <div className="p-3.5 rounded-xl bg-[#FAF9FC] dark:bg-[#17151D] border border-[#EEEAF2] dark:border-[#2D2838]">
                <div className="flex items-center gap-1.5 text-xs text-[#898493]">
                  <Target className="w-3.5 h-3.5 text-[#B5DCCB]" />
                  <span>Total Time</span>
                </div>
                <div className="text-xl font-bold font-mono text-[#34313D] dark:text-[#F4F2F7] mt-1">
                  {Math.round(
                    focusSessions.reduce((acc, curr) => acc + (curr.duration || 0), 0) / 60
                  )}
                  m
                </div>
              </div>
            </div>
          </BaseCard>

          <BaseCard>
            <h3 className="text-sm font-bold text-[#34313D] dark:text-[#F4F2F7] mb-3">
              Recorded Focus History
            </h3>

            {focusSessions.length === 0 ? (
              <EmptyState
                icon={Timer}
                title="No focus history yet"
                description="Complete your first flow session to record duration and streak progress."
              />
            ) : (
              <div className="space-y-2.5 max-h-72 overflow-y-auto pr-1">
                {focusSessions.map((s) => (
                  <div
                    key={s.id}
                    className="p-3 rounded-xl bg-[#FAF9FC] dark:bg-[#17151D] border border-[#EEEAF2] dark:border-[#2D2838] flex items-center justify-between text-xs"
                  >
                    <div>
                      <span className="font-semibold text-[#34313D] dark:text-[#F4F2F7] capitalize">
                        {s.sessionType.replace('_', ' ')}
                      </span>
                      <p className="text-[11px] text-[#898493] dark:text-[#9E99A8]">
                        {formatReadableDate(s.createdAt)}
                      </p>
                    </div>

                    <span className="font-mono font-bold text-[#A995D8]">
                      {Math.round(s.duration / 60)} min
                    </span>
                  </div>
                ))}
              </div>
            )}
          </BaseCard>
        </div>
      </div>
    </div>
  );
};
