import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  OneToMany,
} from "typeorm";
import { KanbanBoard } from "./KanbanBoard";
import { Task } from "./Task";

@Entity()
export class KanbanColumn {
  @PrimaryGeneratedColumn("uuid")
  id: string;

  @Column()
  name: string;

  @Column({ nullable: true })
  description: string;

  @Column({ type: "int" })
  position: number;

  @Column({ nullable: true })
  color: string;

  @Column({ default: true })
  isActive: boolean;

  @ManyToOne(() => KanbanBoard, (board) => board.columns, {
    onDelete: "CASCADE",
  })
  board: KanbanBoard;

  @OneToMany(() => Task, (task) => task.kanbanColumn)
  tasks: Task[];

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
