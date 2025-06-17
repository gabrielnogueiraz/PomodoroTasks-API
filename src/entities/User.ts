import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, OneToMany, OneToOne } from "typeorm";
import { Task } from "./Task";
import { Flower } from "./Flower";
import { Garden } from "./Garden";
import { LumiMemory } from "./LumiMemory";
import { Goal } from "./Goal";
import { PerformanceRecord } from "./PerformanceRecord";
import { Streak } from "./Streak";
import { KanbanBoard } from "./KanbanBoard";
import { ProductivityAnalytics } from "./ProductivityAnalytics";

@Entity()
export class User {
  @PrimaryGeneratedColumn("uuid")
  id: string;

  @Column({ unique: true })
  email: string;

  @Column()
  name: string;

  @Column()
  password: string;

  @OneToMany(() => Task, task => task.user)
  tasks: Task[];

  @OneToMany(() => Flower, flower => flower.user)
  flowers: Flower[];
  @OneToOne(() => Garden, garden => garden.user)
  garden: Garden;
  @OneToOne(() => LumiMemory, lumiMemory => lumiMemory.user)
  lumiMemory: LumiMemory;
  @OneToMany(() => Goal, goal => goal.user)
  goals: Goal[];

  @OneToMany(() => KanbanBoard, kanbanBoard => kanbanBoard.user)
  kanbanBoards: KanbanBoard[];
  @OneToMany(() => PerformanceRecord, performanceRecord => performanceRecord.user)
  performanceRecords: PerformanceRecord[];

  @OneToMany(() => ProductivityAnalytics, analytics => analytics.user)
  productivityAnalytics: ProductivityAnalytics[];

  @OneToOne(() => Streak, streak => streak.user)
  streak: Streak;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
} 