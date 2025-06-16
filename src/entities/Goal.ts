import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
} from "typeorm";
import { User } from "./User";

export enum GoalType {
  DAILY = "daily",
  WEEKLY = "weekly",
  MONTHLY = "monthly",
  YEARLY = "yearly",
}

export enum GoalCategory {
  TASKS_COMPLETED = "tasks_completed",
  POMODOROS_COMPLETED = "pomodoros_completed",
  FOCUS_TIME = "focus_time",
  PRODUCTIVITY_SCORE = "productivity_score",
}

export enum GoalStatus {
  ACTIVE = "active",
  COMPLETED = "completed",
  FAILED = "failed",
  PAUSED = "paused",
}

@Entity()
export class Goal {
  @PrimaryGeneratedColumn("uuid")
  id: string;

  @Column()
  title: string;

  @Column({ nullable: true })
  description: string;

  @Column({
    type: "simple-enum",
    enum: GoalType,
  })
  type: GoalType;

  @Column({
    type: "simple-enum",
    enum: GoalCategory,
  })
  category: GoalCategory;

  @Column({
    type: "simple-enum",
    enum: GoalStatus,
    default: GoalStatus.ACTIVE,
  })
  status: GoalStatus;

  @Column({ type: "decimal", precision: 10, scale: 2 })
  targetValue: number;

  @Column({ type: "decimal", precision: 10, scale: 2, default: 0 })
  currentValue: number;

  @Column()
  startDate: Date;

  @Column()
  endDate: Date;

  @Column({ nullable: true })
  completedAt: Date;

  @ManyToOne(() => User, (user) => user.goals)
  user: User;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
