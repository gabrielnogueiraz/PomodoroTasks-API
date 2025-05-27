import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  OneToMany,
  ManyToOne,
} from "typeorm";
import { Pomodoro } from "./Pomodoro";
import { User } from "./User";

export enum TaskStatus {
  PENDING = "pending",
  IN_PROGRESS = "in_progress",
  COMPLETED = "completed",
  CANCELLED = "cancelled",
}

export enum TaskPriority {
  LOW = "low",
  MEDIUM = "medium",
  HIGH = "high",
}

@Entity()
export class Task {
  @PrimaryGeneratedColumn("uuid")
  id: string;

  @Column()
  title: string;

  @Column({ nullable: true })
  description: string;

  @Column({
    type: "simple-enum",
    enum: TaskStatus,
    default: TaskStatus.PENDING,
  })
  status: TaskStatus;

  @Column({
    type: "simple-enum",
    enum: TaskPriority,
    default: TaskPriority.MEDIUM,
  })
  priority: TaskPriority;

  @Column({ nullable: true })
  dueDate: Date;

  // Novas colunas para data/hora inicial e final
  @Column({ nullable: true })
  startDate: Date;

  @Column({ nullable: true })
  endDate: Date;

  @Column({ nullable: true })
  startTime: string; // Formato: "HH:mm"

  @Column({ nullable: true })
  endTime: string; // Formato: "HH:mm"

  @Column({ default: 0 })
  estimatedPomodoros: number;

  @Column({ default: 0 })
  completedPomodoros: number;

  // Nova coluna para data de conclusão
  @Column({ nullable: true })
  completedAt: Date;

  @OneToMany(() => Pomodoro, (pomodoro) => pomodoro.task)
  pomodoros: Pomodoro[];

  @ManyToOne(() => User, (user) => user.tasks)
  user: User;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
