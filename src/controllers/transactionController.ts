import { Request, Response } from "express";
import pool from "../config/database";

export const createTransaction = async (req: Request, res: Response) => {
  const client = await pool.connect();

  try {
    const {
      customer_id,
      items, // Array of { product_id, quantity, unit_price, discount }
      subtotal,
      tax_amount,
      discount_amount,
      total_amount,
      payment_method,
      amount_tendered,
    } = req.body;

    const userId = req.user?.userId;

    // Start transaction
    await client.query("BEGIN");

    // Generate transaction code
    const transactionCode = `TXN-${Date.now()}`;

    // Insert transaction
    const transactionResult = await client.query(
      `INSERT INTO transactions 
       (transaction_code, user_id, customer_id, subtotal, tax_amount, discount_amount, total_amount, status)
       VALUES ($1, $2, $3, $4, $5, $6, $7, 'completed')
       RETURNING *`,
      [
        transactionCode,
        userId,
        customer_id || null,
        subtotal,
        tax_amount,
        discount_amount,
        total_amount,
      ]
    );

    const transaction = transactionResult.rows[0];

    // Insert transaction items and update stock
    for (const item of items) {
      // Insert transaction item
      await client.query(
        `INSERT INTO transaction_items 
         (transaction_id, product_id, quantity, unit_price, subtotal, discount)
         VALUES ($1, $2, $3, $4, $5, $6)`,
        [
          transaction.id,
          item.product_id,
          item.quantity,
          item.unit_price,
          item.quantity * item.unit_price,
          item.discount || 0,
        ]
      );

      // Update product stock
      const stockResult = await client.query(
        `UPDATE products 
         SET stock_quantity = stock_quantity - $1
         WHERE id = $2
         RETURNING stock_quantity`,
        [item.quantity, item.product_id]
      );

      // Log inventory change
      await client.query(
        `INSERT INTO inventory_logs 
         (product_id, user_id, action, quantity_change, previous_quantity, new_quantity, notes)
         VALUES ($1, $2, 'sale', $3, $4, $5, $6)`,
        [
          item.product_id,
          userId,
          -item.quantity,
          stockResult.rows[0].stock_quantity + item.quantity,
          stockResult.rows[0].stock_quantity,
          `Transaction ${transactionCode}`,
        ]
      );
    }

    // Insert payment
    const change = amount_tendered - total_amount;
    await client.query(
      `INSERT INTO payments 
       (transaction_id, payment_method, amount_paid, amount_tendered, change_given)
       VALUES ($1, $2, $3, $4, $5)`,
      [transaction.id, payment_method, total_amount, amount_tendered, change]
    );

    // Commit transaction
    await client.query("COMMIT");

    // Get complete transaction details
    const completeTransaction = await pool.query(
      `SELECT t.*, u.full_name as cashier_name,
              json_agg(json_build_object(
                'product_id', ti.product_id,
                'product_name', p.name,
                'quantity', ti.quantity,
                'unit_price', ti.unit_price,
                'subtotal', ti.subtotal,
                'discount', ti.discount
              )) as items
       FROM transactions t
       JOIN users u ON t.user_id = u.id
       LEFT JOIN transaction_items ti ON t.id = ti.transaction_id
       LEFT JOIN products p ON ti.product_id = p.id
       WHERE t.id = $1
       GROUP BY t.id, u.full_name`,
      [transaction.id]
    );

    res.status(201).json({
      message: "Transaction completed successfully",
      transaction: completeTransaction.rows[0],
      change: change,
    });
  } catch (error) {
    await client.query("ROLLBACK");
    console.error("Transaction error:", error);
    res.status(500).json({ error: "Transaction failed" });
  } finally {
    client.release();
  }
};

export const getTransactions = async (req: Request, res: Response) => {
  try {
    const { limit = 50, offset = 0 } = req.query;

    const result = await pool.query(
      `SELECT t.*, u.full_name as cashier_name, c.full_name as customer_name
       FROM transactions t
       JOIN users u ON t.user_id = u.id
       LEFT JOIN customers c ON t.customer_id = c.id
       ORDER BY t.created_at DESC
       LIMIT $1 OFFSET $2`,
      [limit, offset]
    );

    res.json({ transactions: result.rows });
  } catch (error) {
    console.error("Get transactions error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};

export const getTransactionById = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const result = await pool.query(
      `SELECT t.*, u.full_name as cashier_name, c.full_name as customer_name,
              json_agg(json_build_object(
                'product_id', ti.product_id,
                'product_name', p.name,
                'quantity', ti.quantity,
                'unit_price', ti.unit_price,
                'subtotal', ti.subtotal,
                'discount', ti.discount
              )) as items
       FROM transactions t
       JOIN users u ON t.user_id = u.id
       LEFT JOIN customers c ON t.customer_id = c.id
       LEFT JOIN transaction_items ti ON t.id = ti.transaction_id
       LEFT JOIN products p ON ti.product_id = p.id
       WHERE t.id = $1
       GROUP BY t.id, u.full_name, c.full_name`,
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: "Transaction not found" });
    }

    res.json({ transaction: result.rows[0] });
  } catch (error) {
    console.error("Get transaction error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};
