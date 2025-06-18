import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  OneToOne,
  OneToMany,
  JoinColumn,
  ManyToOne,
} from "typeorm";
import { Goal } from "./Goal";
import { User } from "./User";
import { KanbanColumn } from "./KanbanColumn";

@Entity()
export class KanbanBoard {
  @PrimaryGeneratedColumn("uuid")
  id: string;

  @Column()
  name: string;

  @Column({ nullable: true })
  description: string;

  @Column({ default: true })
  isActive: boolean;
  @OneToOne(() => Goal, (goal) => goal.kanbanBoard, { nullable: true })
  @JoinColumn()
  goal?: Goal;

  @ManyToOne(() => User, (user) => user.kanbanBoards)
  user: User;

  @OneToMany(() => KanbanColumn, (column) => column.board, {
    cascade: true,
    eager: true,
  })
  columns: KanbanColumn[];

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
