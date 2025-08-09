import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from './entities/user.entity';

@Injectable()
export class UserService {
  constructor(
    @InjectRepository(User)
    private userRepository: Repository<User>,
  ) {}

  async findOrCreateUser(username: string): Promise<User> {
    let user = await this.userRepository.findOne({ 
      where: { username },
      relations: ['ratings']
    });

    if (!user) {
      user = this.userRepository.create({ username });
      user = await this.userRepository.save(user);
    }

    return user;
  }

  async findByUsername(username: string): Promise<User | null> {
    return this.userRepository.findOne({ 
      where: { username },
      relations: ['ratings']
    });
  }

  async getAllUsers(): Promise<User[]> {
    return this.userRepository.find({
      relations: ['ratings'],
      order: { createdAt: 'DESC' }
    });
  }
}
