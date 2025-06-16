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
  };
  goals: {
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
