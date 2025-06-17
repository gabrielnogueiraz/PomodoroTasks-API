import { LumiMoodType } from "../entities/LumiMemory";

export interface LumiContextData {
  user: {
    id: string;
    name: string;
    email?: string;
    memberSince: Date;
  };
  recentTasks: Array<{
    id: string;
    title: string;
    status: string;
    priority: string;
    completedAt?: Date;
    estimatedPomodoros?: number;
    completedPomodoros?: number;
  }>;
  garden: {
    totalFlowers: number;
    recentFlowers: Array<{
      color: string;
      type: string;
      earnedAt: Date;
      taskTitle?: string;
    }>;
  };  statistics: {
    totalTasksCompleted: number;
    currentStreak: number;
    longestStreak: number;
    totalActiveDays: number;
    isActiveToday: boolean;
    averageCompletionRate: number;
    mostProductiveTimeOfDay: string;
    weeklyStats: {
      tasksCompleted: number;
      pomodorosCompleted: number;
      focusTime: number;
      productivityScore: number;
    };
    bestPerformanceDays: number;
    mostProductiveHours: Array<{
      hour: number;
      activityLevel: number;
    }>;
  };  goals: {
    active: Array<{
      id: string;
      title: string;
      category: string;
      targetValue: number;
      currentValue: number;
      endDate: Date;
    }>;
    completed: Array<{
      id: string;
      title: string;
      completedAt: Date;
    }>;
    nearCompletion: Array<{
      id: string;
      title: string;
      progress: number;
    }>;
  };
  kanbanBoards: Array<{
    id: string;
    name: string;
    description?: string;
    goalTitle?: string;
    isActive: boolean;
    columns: Array<{
      id: string;
      name: string;
      position: number;
      taskCount: number;
      tasks: Array<{
        id: string;
        title: string;
        status: string;
        priority: string;
        dueDate?: Date;
      }>;
    }>;
    totalTasks: number;
    completedTasks: number;
    progress: number;
  }>;
  productivityInsights: {
    currentWeekScore: number;
    averageScore: number;
    bestPerformanceDay: string;
    improvementTrend: string;
    recommendations: Array<{
      type: string;
      message: string;
      priority: string;
    }>;
    patterns: {
      mostProductiveHours: Array<{
        hour: number;
        score: number;
      }>;
      bestDaysOfWeek: Array<{
        day: string;
        score: number;
      }>;
      taskCompletionPatterns: {
        averageTimeToComplete: number;
        preferredTaskDuration: number;
        focusSessionEfficiency: number;
      };
    };
    weeklyMetrics: {
      tasksCompleted: number;
      pomodorosCompleted: number;
      focusTimeMinutes: number;
      distractionCount: number;
      productivityScore: number;
    };
  };
  conversationHistory: Array<{
    timestamp: Date;
    userMessage: string;
    lumiResponse: string;
    context: string;
    mood: LumiMoodType;
  }>;
}

export interface LumiRequest {
  userId: string;
  message: string;
  context?: LumiContextData;
  action?: string;
}

export interface LumiResponse {
  response: string;
  mood: LumiMoodType;
  suggestions?: string[];
  confidence?: number;
  is_fallback?: boolean;
}

export interface LumiTaskAction {
  type: "create" | "update" | "delete" | "complete" | "start_pomodoro";
  taskId?: string;
  taskData?: any;
  pomodoroData?: {
    duration?: number;
    notes?: string;
  };
}

export interface LumiActionResponse {
  success: boolean;
  message: string;
  data?: any;
  error?: string;
}
