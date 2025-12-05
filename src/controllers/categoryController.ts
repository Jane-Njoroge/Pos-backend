import { Request, Response } from "express";
import pool from "../config/database";

export const getAllCategories = async (req: Request, res: Response) => {
  try {
    const result = await pool.query("SELECT * FROM categories ORDER BY name");

    res.json({ categories: result.rows });
  } catch (error) {
    console.error("Get categories error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};

export const createCategory = async (req: Request, res: Response) => {
  try {
    const { name, description } = req.body;

    const result = await pool.query(
      `INSERT INTO categories (name, description)
       VALUES ($1, $2)
       RETURNING *`,
      [name, description]
    );

    res.status(201).json({ category: result.rows[0] });
  } catch (error) {
    console.error("Create category error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};
