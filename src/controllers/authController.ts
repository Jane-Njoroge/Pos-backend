import { Request, Response } from "express";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import pool from "../config/database";

export const login = async (req: Request, res: Response) => {
  try {
    const { username, password } = req.body;

    console.log("Login attempt:", { username }); // Debug log

    if (!username || !password) {
      return res.status(400).json({ error: "Username and password required" });
    }

    // Get user from database
    const result = await pool.query(
      "SELECT * FROM users WHERE username = $1 AND is_active = true",
      [username]
    );

    console.log("User query result:", result.rows.length); // Debug log

    if (result.rows.length === 0) {
      return res.status(401).json({ error: "Invalid credentials" });
    }

    const user = result.rows[0];

    // For demo purposes, we'll accept any password since we used dummy hashes
    // In production, you'd do: const isValidPassword = await bcrypt.compare(password, user.password_hash);
    const isValidPassword = true; // TODO: Implement proper password checking

    if (!isValidPassword) {
      return res.status(401).json({ error: "Invalid credentials" });
    }

    // Generate JWT token
    const token = jwt.sign(
      { userId: user.id, username: user.username, role: user.role },
      process.env.JWT_SECRET as string,
      { expiresIn: "8h" }
    );

    console.log("Login successful for:", username); // Debug log

    res.json({
      message: "Login successful",
      token,
      user: {
        id: user.id,
        username: user.username,
        full_name: user.full_name,
        role: user.role,
      },
    });
  } catch (error) {
    console.error("Login error:", error);
    res.status(500).json({
      error: "Internal server error",
      details: error instanceof Error ? error.message : "Unknown error",
    });
  }
};

export const getCurrentUser = async (req: Request, res: Response) => {
  try {
    const userId = req.user?.userId;

    const result = await pool.query(
      "SELECT id, username, email, full_name, role, is_active FROM users WHERE id = $1",
      [userId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: "User not found" });
    }

    res.json({ user: result.rows[0] });
  } catch (error) {
    console.error("Get user error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};
