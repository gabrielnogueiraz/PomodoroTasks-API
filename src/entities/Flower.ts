import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
} from "typeorm";
import { User } from "./User";
import { Task } from "./Task";

export enum FlowerType {
  COMMON = "common",
  RARE = "rare",
}

export enum FlowerColor {
  GREEN = "green",
  ORANGE = "orange", 
  RED = "red",
  PURPLE = "purple",
}

@Entity()
export class Flower {
  @PrimaryGeneratedColumn("uuid")
  id: string;

  @Column({
    type: "simple-enum",
    enum: FlowerType,
    default: FlowerType.COMMON,
  })
  type: FlowerType;

  @Column({
    type: "simple-enum",
    enum: FlowerColor,
  })
  color: FlowerColor;

  @Column()
  earnedFromTaskTitle: string;

  @ManyToOne(() => User, (user) => user.flowers)
  user: User;

  @ManyToOne(() => Task, (task) => task.flowers)
  task: Task;

  @CreateDateColumn()
  createdAt: Date;
}
