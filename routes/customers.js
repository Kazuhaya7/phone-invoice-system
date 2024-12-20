const express = require('express');
const router = express.Router();

module.exports = (db) => {
  // GET all customers
  router.get('/', (req, res) => {
    const sql = 'SELECT * FROM customers';
    db.query(sql, (err, results) => {
      if (err) {
        console.error('Error fetching customers:', err);
        return res.status(500).json({ message: 'Failed to fetch customers' });
      }
      res.json(results);
    });
  });

  // GET a single customer by cust_id
  router.get('/:cust_id', (req, res) => {
    const custId = req.params.cust_id;
    const sql = 'SELECT * FROM customers WHERE cust_id = ?';
    db.query(sql, [custId], (err, results) => {
      if (err) {
        console.error('Error fetching customer:', err);
        return res.status(500).json({ message: 'Failed to fetch customer' });
      }
       if (results.length === 0) {
        return res.status(404).json({ message: 'Customer not found' });
      }
      res.json(results[0]);
    });
  });

  // POST a new customer
  router.post('/', (req, res) => {
    const { name, phone_number, address, email } = req.body;
    const sql =
      'INSERT INTO customers (name, phone_number, address, email) VALUES (?, ?, ?, ?)';
    db.query(sql, [name, phone_number, address, email], (err, result) => {
      if (err) {
        console.error('Error creating customer:', err);
        return res.status(500).json({ message: 'Failed to create customer' });
      }
      res
        .status(201)
        .json({ message: 'Customer created successfully', cust_id: result.insertId });
    });
  });

  // PUT update a customer
  router.put('/:cust_id', (req, res) => {
    const custId = req.params.cust_id;
    const { name, phone_number, address, email } = req.body;
    const sql =
      'UPDATE customers SET name = ?, phone_number = ?, address = ?, email = ? WHERE cust_id = ?';
    db.query(sql, [name, phone_number, address, email, custId], (err, result) => {
      if (err) {
        console.error('Error updating customer:', err);
        return res.status(500).json({ message: 'Failed to update customer' });
      }
       if (result.affectedRows === 0) {
        return res.status(404).json({ message: 'Customer not found' });
      }
      res.json({ message: 'Customer updated successfully' });
    });
  });

  // DELETE a customer
  router.delete('/:cust_id', (req, res) => {
    const custId = req.params.cust_id;
    const sql = 'DELETE FROM customers WHERE cust_id = ?';
    db.query(sql, [custId], (err, result) => {
      if (err) {
        console.error('Error deleting customer:', err);
        return res.status(500).json({ message: 'Failed to delete customer' });
      }
       if (result.affectedRows === 0) {
        return res.status(404).json({ message: 'Customer not found' });
      }
      res.json({ message: 'Customer deleted successfully' });
    });
  });

  return router;
};