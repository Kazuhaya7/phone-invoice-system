const express = require('express');
const router = express.Router();

module.exports = (db) => {
    // GET all repair invoices
  router.get('/', (req, res) => {
      const sql = `
        SELECT
            ri.invoice_id,
            ri.date,
           ri.issues,
            ri.quantity AS repair_quantity,
            c.name AS customer_name,
            p.brand,
            p.model
        FROM
            repair_invoices ri
        JOIN
            customers c ON ri.cust_id = c.cust_id
        JOIN
            phones p ON ri.phone_id = p.phone_id;
    `;
    db.query(sql, (err, results) => {
      if (err) {
        console.error('Error fetching repair invoices:', err);
        return res.status(500).json({ message: 'Failed to fetch repair invoices' });
      }
      res.json(results);
    });
  });

  // GET a single repair invoice
    router.get('/:invoice_id', (req, res) => {
        const invoiceId = req.params.invoice_id;
        const sql = `
        SELECT
            ri.invoice_id,
            ri.date,
           ri.issues,
            ri.quantity AS repair_quantity,
            c.name AS customer_name,
            p.brand,
            p.model
        FROM
            repair_invoices ri
        JOIN
            customers c ON ri.cust_id = c.cust_id
        JOIN
            phones p ON ri.phone_id = p.phone_id
         WHERE ri.invoice_id = ?
    `;
         db.query(sql, [invoiceId], (err, results) => {
             if (err) {
               console.error('Error fetching repair invoice:', err);
                return res.status(500).json({ message: 'Failed to fetch repair invoice' });
            }
             if (results.length === 0) {
                 return res.status(404).json({ message: 'Repair invoice not found' });
              }
             res.json(results[0]);
         });
     });


  // POST a new repair invoice
  router.post('/', (req, res) => {
    const { cust_id, phone_id, date, issues, quantity } = req.body;
    const sql =
      'INSERT INTO repair_invoices (cust_id, phone_id, date, issues, quantity) VALUES (?, ?, ?, ?, ?)';
    db.query(
      sql,
      [cust_id, phone_id, date, issues, quantity],
      (err, result) => {
        if (err) {
          console.error('Error creating repair invoice:', err);
          return res.status(500).json({ message: 'Failed to create repair invoice' });
        }
        res
          .status(201)
          .json({ message: 'Repair invoice created successfully', invoice_id: result.insertId });
      }
    );
  });

  // PUT update a repair invoice
  router.put('/:invoice_id', (req, res) => {
    const invoiceId = req.params.invoice_id;
    const { cust_id, phone_id, date, issues, quantity } = req.body;
    const sql =
      'UPDATE repair_invoices SET cust_id = ?, phone_id = ?, date = ?, issues = ?, quantity = ? WHERE invoice_id = ?';
    db.query(
      sql,
      [cust_id, phone_id, date, issues, quantity, invoiceId],
      (err, result) => {
        if (err) {
          console.error('Error updating repair invoice:', err);
          return res.status(500).json({ message: 'Failed to update repair invoice' });
        }
         if (result.affectedRows === 0) {
            return res.status(404).json({ message: 'Repair invoice not found' });
          }
        res.json({ message: 'Repair invoice updated successfully' });
      }
    );
  });

  // DELETE a repair invoice
  router.delete('/:invoice_id', (req, res) => {
    const invoiceId = req.params.invoice_id;
    const sql = 'DELETE FROM repair_invoices WHERE invoice_id = ?';
    db.query(sql, [invoiceId], (err, result) => {
      if (err) {
        console.error('Error deleting repair invoice:', err);
        return res.status(500).json({ message: 'Failed to delete repair invoice' });
      }
      if (result.affectedRows === 0) {
        return res.status(404).json({ message: 'Repair invoice not found' });
      }
      res.json({ message: 'Repair invoice deleted successfully' });
    });
  });

  return router;
};