import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  OneToOne,
  JoinColumn,
} from "typeorm";
import { User } from "./User";

@Entity()
export class Streak {
  @PrimaryGeneratedColumn("uuid")
  id: string;

  @Column({ default: 0 })
  currentStreak: number;

  @Column({ default: 0 })
  longestStreak: number;

  @Column({ nullable: true })
  lastActivityDate: Date;

  @Column({ nullable: true })
  streakStartDate: Date;

  @Column({ default: 0 })
  totalActiveDays: number;

  @Column({ type: "json", nullable: true })
  streakHistory: Array<{
    startDate: Date;
    endDate: Date;
    length: number;
  }>;

  @OneToOne(() => User, (user) => user.streak)
  @JoinColumn()
  user: User;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
