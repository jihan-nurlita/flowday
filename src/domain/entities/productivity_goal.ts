export interface GoalTargetConfig {
  enabled: boolean;
  target: number;
}

export interface ProductivityGoals {
  id: string;
  userId: string;
  dailyTaskGoal: GoalTargetConfig;
  weeklyTaskGoal: GoalTargetConfig;
  dailyFocusGoalMinutes: GoalTargetConfig;
  weeklyFocusGoalMinutes: GoalTargetConfig;
  createdAt: string;
  updatedAt: string;
}

export const DEFAULT_PRODUCTIVITY_GOALS: Omit<ProductivityGoals, 'id' | 'userId' | 'createdAt' | 'updatedAt'> = {
  dailyTaskGoal: { enabled: false, target: 5 },
  weeklyTaskGoal: { enabled: false, target: 25 },
  dailyFocusGoalMinutes: { enabled: false, target: 90 },
  weeklyFocusGoalMinutes: { enabled: false, target: 450 },
};
