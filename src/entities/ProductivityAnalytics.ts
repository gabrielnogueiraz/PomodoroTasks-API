import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
} from "typeorm";
import { User } from "./User";
import { Goal } from "./Goal";

export enum ProductivityMetricType {
  HOURLY_PRODUCTIVITY = "hourly_productivity",
  DAILY_PRODUCTIVITY = "daily_productivity",
  WEEKLY_PRODUCTIVITY = "weekly_productivity",
  TASK_COMPLETION_RATE = "task_completion_rate",
  FOCUS_DURATION = "focus_duration",
  BREAK_PATTERN = "break_pattern",
  GOAL_PROGRESS_RATE = "goal_progress_rate",
}

@Entity()
export class ProductivityAnalytics {
  @PrimaryGeneratedColumn("uuid")
  id: string;

  @Column({
    type: "simple-enum",
    enum: ProductivityMetricType,
  })
  metricType: ProductivityMetricType;

  @Column({ type: "decimal", precision: 10, scale: 2 })
  value: number;

  @Column()
  date: Date;

  @Column({ type: "int", nullable: true })
  hour: number; // 0-23 for hourly metrics

  @Column({ type: "int", nullable: true })
  dayOfWeek: number; // 0-6 (Sunday-Saturday)

  @Column({ type: "json", nullable: true })
  metadata: Record<string, any>;

  @ManyToOne(() => User, (user) => user.productivityAnalytics)
  user: User;

  @ManyToOne(() => Goal, { nullable: true })
  goal: Goal;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
