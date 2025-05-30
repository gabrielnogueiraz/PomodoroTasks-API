import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  OneToOne,
  JoinColumn,
  ManyToOne,
} from "typeorm";
import { User } from "./User";

@Entity()
export class Garden {
  @PrimaryGeneratedColumn("uuid")
  id: string;

  @Column({ default: 0 })
  totalFlowers: number;

  @Column({ default: 0 })
  greenFlowers: number;

  @Column({ default: 0 })
  orangeFlowers: number;

  @Column({ default: 0 })
  redFlowers: number;

  @Column({ default: 0 })
  rareFlowers: number;

  @Column({ default: 0 })
  consecutiveHighPriorityPomodoros: number;

  @OneToOne(() => User, (user) => user.garden)
  @JoinColumn()
  user: User;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
