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
import { Flower } from "./Flower";
import { KanbanColumn } from "./KanbanColumn";
import { KanbanBoard } from "./KanbanBoard";
import { Goal } from "./Goal";

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

  @Column({ nullable: true })
  startDate: Date;

  @Column({ nullable: true })
  endDate: Date;

  @Column({ nullable: true })
  startTime: string; 

  @Column({ nullable: true })
  endTime: string; 
  @Column({ default: 0 })
  estimatedPomodoros: number;

  @Column({ default: 0 })
  completedPomodoros: number;

  @Column({ type: "int", nullable: true })
  position: number;

  @Column({ nullable: true })
  completedAt: Date;
  @OneToMany(() => Pomodoro, (pomodoro) => pomodoro.task)
  pomodoros: Pomodoro[];

  @OneToMany(() => Flower, (flower) => flower.task)
  flowers: Flower[];
  @ManyToOne(() => User, (user) => user.tasks)
  user: User;
  @ManyToOne(() => KanbanColumn, (column) => column.tasks, {
    nullable: true,
    onDelete: "SET NULL",
  })
  kanbanColumn: KanbanColumn;

  @ManyToOne(() => KanbanBoard, { nullable: true, onDelete: "CASCADE" })
  kanbanBoard: KanbanBoard;

  @ManyToOne(() => Goal, { nullable: true, onDelete: "CASCADE" })
  goal: Goal;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
