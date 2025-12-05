import { Request, Response } from "express";
import pool from "../config/database";

export const getAllProducts = async (req: Request, res: Response) => {
  try {
    const result = await pool.query(`
      SELECT p.*, c.name as category_name 
      FROM products p
      LEFT JOIN categories c ON p.category_id = c.id
      WHERE p.is_active = true
      ORDER BY p.name
    `);

    res.json({ products: result.rows });
  } catch (error) {
    console.error("Get products error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};

export const getProductByBarcode = async (req: Request, res: Response) => {
  try {
    const { barcode } = req.params;

    const result = await pool.query(
      `SELECT p.*, c.name as category_name 
       FROM products p
       LEFT JOIN categories c ON p.category_id = c.id
       WHERE p.barcode = $1 AND p.is_active = true`,
      [barcode]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: "Product not found" });
    }

    res.json({ product: result.rows[0] });
  } catch (error) {
    console.error("Get product error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};

export const searchProducts = async (req: Request, res: Response) => {
  try {
    const { query } = req.query;

    const result = await pool.query(
      `SELECT p.*, c.name as category_name 
       FROM products p
       LEFT JOIN categories c ON p.category_id = c.id
       WHERE p.is_active = true 
       AND (p.name ILIKE $1 OR p.sku ILIKE $1 OR p.barcode ILIKE $1)
       ORDER BY p.name
       LIMIT 20`,
      [`%${query}%`]
    );

    res.json({ products: result.rows });
  } catch (error) {
    console.error("Search products error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};

export const createProduct = async (req: Request, res: Response) => {
  try {
    const {
      sku,
      barcode,
      name,
      description,
      category_id,
      price,
      cost_price,
      stock_quantity,
      reorder_level,
    } = req.body;

    const result = await pool.query(
      `INSERT INTO products 
       (sku, barcode, name, description, category_id, price, cost_price, stock_quantity, reorder_level)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
       RETURNING *`,
      [
        sku,
        barcode,
        name,
        description,
        category_id,
        price,
        cost_price,
        stock_quantity,
        reorder_level,
      ]
    );

    res.status(201).json({ product: result.rows[0] });
  } catch (error) {
    console.error("Create product error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};

export const updateProduct = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { name, price, stock_quantity, is_active } = req.body;

    const result = await pool.query(
      `UPDATE products 
       SET name = COALESCE($1, name),
           price = COALESCE($2, price),
           stock_quantity = COALESCE($3, stock_quantity),
           is_active = COALESCE($4, is_active),
           updated_at = CURRENT_TIMESTAMP
       WHERE id = $5
       RETURNING *`,
      [name, price, stock_quantity, is_active, id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: "Product not found" });
    }

    res.json({ product: result.rows[0] });
  } catch (error) {
    console.error("Update product error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};
