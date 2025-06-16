import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  Index,
} from "typeorm";
import { User } from "./User";

@Entity()
@Index(["userId", "date"], { unique: true })
export class PerformanceRecord {
  @PrimaryGeneratedColumn("uuid")
  id: string;

  @Column()
  date: Date;

  @Column({ default: 0 })
  tasksCompleted: number;

  @Column({ default: 0 })
  pomodorosCompleted: number;

  @Column({ type: "decimal", precision: 10, scale: 2, default: 0 })
  focusTimeMinutes: number;

  @Column({ type: "decimal", precision: 3, scale: 2, default: 0 })
  productivityScore: number;

  @Column({ type: "json", nullable: true })
  hourlyActivity: Record<number, number>;

  @Column({ default: false })
  goalsMet: boolean;

  @Column({ default: 0 })
  activeGoalsCount: number;

  @Column({ default: 0 })
  completedGoalsCount: number;

  @Column()
  userId: string;

  @ManyToOne(() => User, (user) => user.performanceRecords)
  user: User;

  @CreateDateColumn()
  createdAt: Date;
}
