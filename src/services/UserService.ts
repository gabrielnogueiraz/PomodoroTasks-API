import { AppDataSource } from "../data-source";
import { User } from "../entities/User";
import { Repository } from "typeorm";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";

export class UserService {
  private userRepository: Repository<User>;

  constructor() {
    this.userRepository = AppDataSource.getRepository(User);
  }
  async create(userData: { email: string; name: string; password: string }): Promise<User> {
    // Validar força da senha
    if (userData.password.length < 8) {
      throw new Error("Senha deve ter pelo menos 8 caracteres");
    }

    const hashedPassword = await bcrypt.hash(userData.password, 12); // Aumentar rounds para 12
    
    const user = this.userRepository.create({
      ...userData,
      password: hashedPassword,
    });

    return this.userRepository.save(user);
  }

  async findByEmail(email: string): Promise<User | null> {
    return this.userRepository.findOne({ where: { email } });
  }

  async findById(id: string): Promise<User | null> {
    return this.userRepository.findOne({ where: { id } });
  }

  async validatePassword(user: User, password: string): Promise<boolean> {
    return bcrypt.compare(password, user.password);
  }
  generateToken(user: User): string {
    const secret = process.env.JWT_SECRET;
    if (!secret) {
      throw new Error("JWT_SECRET não configurado");
    }

    const token = jwt.sign(
      { id: user.id, email: user.email },
      secret,
      { expiresIn: "24h" }
    );

    return token;
  }
} 