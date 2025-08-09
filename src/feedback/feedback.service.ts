import { Injectable } from "@nestjs/common";
import { createConnection } from "mysql2/promise";
import { v4 as uuidv4 } from "uuid";
import {
  CreateFeedbackDto,
  Feedback,
  UpdateFeedbackStatusDto,
} from "./feedback.interface";

@Injectable()
export class FeedbackService {
  private async getConnection() {
    const config: any = {
      host: process.env.DB_HOST || "localhost", // Use environment variable for Cloud Run
      user: "karaoke",
      password: 'GC(*g""\\9SH@{vBr',
      database: "karaoke",
      port: 3306,
    };

    if (process.env.NODE_ENV === "production") {
      config.ssl = { rejectUnauthorized: false };
    }

    return createConnection(config);
  }

  async createFeedback(
    createFeedbackDto: CreateFeedbackDto
  ): Promise<Feedback> {
    const connection = await this.getConnection();

    try {
      const feedback: Feedback = {
        id: uuidv4(),
        ...createFeedbackDto,
        status: "pending",
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      await connection.execute(
        `INSERT INTO feedback (id, username, type, subject, message, status, created_at, updated_at) 
         VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          feedback.id,
          feedback.username,
          feedback.type,
          feedback.subject,
          feedback.message,
          feedback.status,
          feedback.createdAt,
          feedback.updatedAt,
        ]
      );

      return feedback;
    } finally {
      await connection.end();
    }
  }

  async getAllFeedback(): Promise<Feedback[]> {
    const connection = await this.getConnection();

    try {
      const [rows] = await connection.execute(
        "SELECT * FROM feedback ORDER BY created_at DESC"
      );

      return (rows as any[]).map((row) => ({
        id: row.id,
        username: row.username,
        type: row.type,
        subject: row.subject,
        message: row.message,
        status: row.status,
        createdAt: row.created_at,
        updatedAt: row.updated_at,
      }));
    } finally {
      await connection.end();
    }
  }

  async getFeedbackByUsername(username: string): Promise<Feedback[]> {
    const connection = await this.getConnection();

    try {
      const [rows] = await connection.execute(
        "SELECT * FROM feedback WHERE username = ? ORDER BY created_at DESC",
        [username]
      );

      return (rows as any[]).map((row) => ({
        id: row.id,
        username: row.username,
        type: row.type,
        subject: row.subject,
        message: row.message,
        status: row.status,
        createdAt: row.created_at,
        updatedAt: row.updated_at,
      }));
    } finally {
      await connection.end();
    }
  }

  async updateFeedbackStatus(
    updateDto: UpdateFeedbackStatusDto
  ): Promise<Feedback> {
    const connection = await this.getConnection();

    try {
      await connection.execute(
        "UPDATE feedback SET status = ?, updated_at = ? WHERE id = ?",
        [updateDto.status, new Date(), updateDto.id]
      );

      const [rows] = await connection.execute(
        "SELECT * FROM feedback WHERE id = ?",
        [updateDto.id]
      );

      const row = (rows as any[])[0];
      return {
        id: row.id,
        username: row.username,
        type: row.type,
        subject: row.subject,
        message: row.message,
        status: row.status,
        createdAt: row.created_at,
        updatedAt: row.updated_at,
      };
    } finally {
      await connection.end();
    }
  }

  async initializeDatabase(): Promise<void> {
    const connection = await this.getConnection();

    try {
      await connection.execute(`
        CREATE TABLE IF NOT EXISTS feedback (
          id VARCHAR(36) PRIMARY KEY,
          username VARCHAR(255) NOT NULL,
          type ENUM('bug', 'feature', 'improvement', 'general') NOT NULL,
          subject VARCHAR(255) NOT NULL,
          message TEXT NOT NULL,
          status ENUM('pending', 'reviewed', 'resolved', 'rejected') DEFAULT 'pending',
          created_at DATETIME NOT NULL,
          updated_at DATETIME NOT NULL,
          INDEX idx_username (username),
          INDEX idx_status (status),
          INDEX idx_created_at (created_at)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
      `);
    } finally {
      await connection.end();
    }
  }
}
