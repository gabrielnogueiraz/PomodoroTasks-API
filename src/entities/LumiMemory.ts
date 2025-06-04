import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  OneToOne,
  JoinColumn,
} from "typeorm";
import { User } from "./User";

export enum LumiMoodType {
  ENCOURAGING = "encouraging",
  MOTIVATIONAL = "motivational", 
  ANALYTICAL = "analytical",
  SUPPORTIVE = "supportive",
  CELEBRATORY = "celebratory",
  CORRECTIVE = "corrective"
}

@Entity()
export class LumiMemory {
  @PrimaryGeneratedColumn("uuid")
  id: string;

  @Column("jsonb", { nullable: true })
  personalityProfile: {
    userPreferences: string[];
    communicationStyle: string;
    motivationTriggers: string[];
    goals: string[];
    challenges: string[];
  };

  @Column("jsonb", { nullable: true })
  behaviorPatterns: {
    mostProductiveHours: string[];
    averageTaskDuration: number;
    preferredTaskTypes: string[];
    procrastinationTriggers: string[];
    completionRate: number;
  };

  @Column("jsonb", { nullable: true })
  conversationHistory: Array<{
    timestamp: Date;
    userMessage: string;
    lumiResponse: string;
    context: string;
    mood: LumiMoodType;
  }>;

  @Column("jsonb", { nullable: true })
  achievements: {
    totalTasksCompleted: number;
    longestStreak: number;
    currentStreak: number;
    favoriteFlowerColors: string[];
    milestones: Array<{
      type: string;
      achievedAt: Date;
      description: string;
    }>;
  };
  @Column("jsonb", { nullable: true })
  contextualMemory: {
    recentTasks: Array<{
      id: string;
      title: string;
      status: string;
      completedAt?: Date;
      lumiNotes: string;
    }>;
    recentFlowers: Array<{
      id: string;
      color: string;
      type: string;
      earnedAt: Date;
      lumiComment: string;
    }>;
    recentInterruptions: Array<{
      taskTitle: string;
      timestamp: Date;
      reason: string;
      hour: number;
    }>;
    lastInteraction: Date;
    currentFocus: string;
  };

  @Column("text", { nullable: true })
  personalNotes: string;

  @Column({
    type: "simple-enum",
    enum: LumiMoodType,
    default: LumiMoodType.ENCOURAGING
  })
  currentMood: LumiMoodType;

  @Column({ default: 0 })
  interactionCount: number;

  @Column({ default: 0 })
  helpfulnessScore: number;

  @OneToOne(() => User, user => user.lumiMemory)
  @JoinColumn()
  user: User;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
