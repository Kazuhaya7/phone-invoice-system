const express = require('express');
const router = express.Router();

module.exports = (db) => {
  // GET all phones
  router.get('/', (req, res) => {
    const sql = 'SELECT * FROM phones';
    db.query(sql, (err, results) => {
      if (err) {
        console.error('Error fetching phones:', err);
        return res.status(500).json({ message: 'Failed to fetch phones' });
      }
      res.json(results);
    });
  });

  // GET a single phone by phone_id
   router.get('/:phone_id', (req, res) => {
    const phoneId = req.params.phone_id;
    const sql = 'SELECT * FROM phones WHERE phone_id = ?';
    db.query(sql, [phoneId], (err, results) => {
      if (err) {
        console.error('Error fetching phone:', err);
        return res.status(500).json({ message: 'Failed to fetch phone' });
      }
      if (results.length === 0) {
        return res.status(404).json({ message: 'Phone not found' });
      }
      res.json(results[0]);
    });
  });


  // POST a new phone
  router.post('/', (req, res) => {
    const { brand, model, imei1, imei2, color, quantity, price } = req.body;
    const sql =
      'INSERT INTO phones (brand, model, imei1, imei2, color, quantity, price) VALUES (?, ?, ?, ?, ?, ?, ?)';
    db.query(
      sql,
      [brand, model, imei1, imei2, color, quantity, price],
      (err, result) => {
        if (err) {
          console.error('Error creating phone:', err);
          return res.status(500).json({ message: 'Failed to create phone' });
        }
        res
          .status(201)
          .json({ message: 'Phone created successfully', phone_id: result.insertId });
      }
    );
  });

  // PUT update a phone
  router.put('/:phone_id', (req, res) => {
    const phoneId = req.params.phone_id;
    const { brand, model, imei1, imei2, color, quantity, price } = req.body;
    const sql =
      'UPDATE phones SET brand = ?, model = ?, imei1 = ?, imei2 = ?, color = ?, quantity = ?, price = ? WHERE phone_id = ?';
    db.query(
      sql,
      [brand, model, imei1, imei2, color, quantity, price, phoneId],
      (err, result) => {
        if (err) {
          console.error('Error updating phone:', err);
          return res.status(500).json({ message: 'Failed to update phone' });
        }
         if (result.affectedRows === 0) {
        return res.status(404).json({ message: 'Phone not found' });
      }
        res.json({ message: 'Phone updated successfully' });
      }
    );
  });

  // DELETE a phone
  router.delete('/:phone_id', (req, res) => {
    const phoneId = req.params.phone_id;
    const sql = 'DELETE FROM phones WHERE phone_id = ?';
    db.query(sql, [phoneId], (err, result) => {
      if (err) {
        console.error('Error deleting phone:', err);
        return res.status(500).json({ message: 'Failed to delete phone' });
      }
       if (result.affectedRows === 0) {
        return res.status(404).json({ message: 'Phone not found' });
      }
      res.json({ message: 'Phone deleted successfully' });
    });
  });

  return router;
};