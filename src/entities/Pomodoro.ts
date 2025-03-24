import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, CreateDateColumn } from "typeorm";
import { Task } from "./Task";

export enum PomodoroStatus {
  COMPLETED = "completed",
  INTERRUPTED = "interrupted",
  IN_PROGRESS = "in_progress"
}

@Entity()
export class Pomodoro {
  @PrimaryGeneratedColumn("uuid")
  id: string;

  @Column({ default: 25 * 60 }) // 25 minutos em segundos
  duration: number;

  @Column({ nullable: true })
  startTime: Date;

  @Column({ nullable: true })
  endTime: Date;

  @Column({
    type: "simple-enum",
    enum: PomodoroStatus,
    default: PomodoroStatus.IN_PROGRESS
  })
  status: PomodoroStatus;

  @Column({ nullable: true })
  notes: string;

  @ManyToOne(() => Task, task => task.pomodoros)
  task: Task;

  @CreateDateColumn()
  createdAt: Date;
}