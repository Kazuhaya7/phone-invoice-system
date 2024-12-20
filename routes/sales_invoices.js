const express = require('express');
const router = express.Router();

module.exports = (db) => {
  // GET all sales invoices
  router.get('/', (req, res) => {
      const sql = `
        SELECT
            si.invoice_id,
            si.date,
            si.quantity AS sales_quantity,
            c.name AS customer_name,
            p.brand,
            p.model,
            p.price
        FROM
            sales_invoices si
        JOIN
            customers c ON si.cust_id = c.cust_id
        JOIN
            phones p ON si.phone_id = p.phone_id;
    `;
    db.query(sql, (err, results) => {
      if (err) {
        console.error('Error fetching sales invoices:', err);
        return res.status(500).json({ message: 'Failed to fetch sales invoices' });
      }
      res.json(results);
    });
  });

    // GET a single sales invoice by invoice_id
  router.get('/:invoice_id', (req, res) => {
    const invoiceId = req.params.invoice_id;
      const sql = `
        SELECT
            si.invoice_id,
            si.date,
            si.quantity AS sales_quantity,
            c.name AS customer_name,
            p.brand,
            p.model,
             p.price
        FROM
            sales_invoices si
        JOIN
            customers c ON si.cust_id = c.cust_id
        JOIN
            phones p ON si.phone_id = p.phone_id
         WHERE si.invoice_id = ?
    `;
    db.query(sql, [invoiceId], (err, results) => {
      if (err) {
        console.error('Error fetching sales invoice:', err);
        return res.status(500).json({ message: 'Failed to fetch sales invoice' });
      }
       if (results.length === 0) {
        return res.status(404).json({ message: 'Sales invoice not found' });
      }
      res.json(results[0]);
    });
  });

  // POST a new sales invoice
 router.post('/', (req, res) => {
    const { cust_id, phone_id, date, quantity } = req.body;

    // 1. Check if phone exists and there is enough stock
      const sql_checkPhone = 'SELECT quantity FROM phones WHERE phone_id = ?';
      db.query(sql_checkPhone, [phone_id], (err, phoneResult) => {
           if (err) {
              console.error('Error checking phone stock:', err);
               return res.status(500).json({ message: 'Error checking phone stock' });
            }
            if (!phoneResult || phoneResult.length === 0) {
              return res.status(400).json({ message: 'Phone does not exist' });
             }
           const availableQuantity = phoneResult[0].quantity;
           if (availableQuantity < quantity) {
                 return res.status(400).json({message: 'Not enough stock available' });
              }
             //2. Reduce the stock in phones table
            const newQuantity = availableQuantity - quantity;
            const sql_updatePhone = 'UPDATE phones SET quantity = ? WHERE phone_id = ?';
            db.query(sql_updatePhone, [newQuantity, phone_id], (err, updateResult) => {
                  if (err) {
                     console.error('Error updating phone stock:', err);
                    return res.status(500).json({ message: 'Failed to update phone stock' });
                    }
                  // 3. Create sales invoice
                    const sql_insert =
                        'INSERT INTO sales_invoices (cust_id, phone_id, date, quantity) VALUES (?, ?, ?, ?)';
                   db.query(sql_insert, [cust_id, phone_id, date, quantity], (err, result) => {
                        if (err) {
                           console.error('Error creating sales invoice:', err);
                            return res.status(500).json({ message: 'Failed to create sales invoice' });
                         }
                           res.status(201).json({
                                 message: 'Sales invoice created successfully',
                              invoice_id: result.insertId,
                          });
                    });
            });

      })
    });


  // PUT update a sales invoice
  router.put('/:invoice_id', (req, res) => {
    const invoiceId = req.params.invoice_id;
    const { cust_id, phone_id, date, quantity } = req.body;
       // 1. Check current invoice quantity and phone to restore stock
    const sql_getInvoice = "SELECT phone_id, quantity FROM sales_invoices WHERE invoice_id = ?";
    db.query(sql_getInvoice, [invoiceId], (err, invoiceResults) => {
        if (err) {
           console.error('Error fetching sales invoice data:', err);
            return res.status(500).json({ message: 'Failed to fetch sales invoice data' });
          }
          if (!invoiceResults || invoiceResults.length === 0) {
           return res.status(404).json({ message: 'Sales invoice not found' });
          }
         const currentPhoneId = invoiceResults[0].phone_id;
         const currentQuantity = invoiceResults[0].quantity;

        // 2. Get the current quantity of the product
        const sql_getPhone = "SELECT quantity FROM phones WHERE phone_id = ?";
         db.query(sql_getPhone, [currentPhoneId], (err, phoneResults) => {
              if(err) {
                  console.error('Error fetching phone data:', err);
                   return res.status(500).json({message: 'Failed to fetch phone data'});
                 }
              if (!phoneResults || phoneResults.length === 0) {
                   return res.status(404).json({ message: 'Phone for invoice not found' });
                }
              const currentPhoneQuantity = phoneResults[0].quantity;

              // 3. Restore the previous quantity
              const restoreQuantity = currentPhoneQuantity + currentQuantity;
              const sql_restorePhone = 'UPDATE phones SET quantity = ? WHERE phone_id = ?';
              db.query(sql_restorePhone, [restoreQuantity, currentPhoneId], (err, restoreResult) => {
                 if (err) {
                    console.error('Error restoring phone stock:', err);
                    return res.status(500).json({ message: 'Failed to restore phone stock' });
                  }

                   // 4. Check the new phone and quantity
                  const sql_checkPhone = 'SELECT quantity FROM phones WHERE phone_id = ?';
                  db.query(sql_checkPhone, [phone_id], (err, newPhoneResult) => {
                         if (err) {
                            console.error('Error checking phone stock:', err);
                             return res.status(500).json({ message: 'Error checking phone stock' });
                            }
                         if (!newPhoneResult || newPhoneResult.length === 0) {
                              return res.status(400).json({ message: 'New phone does not exist' });
                            }
                       const availableNewQuantity = newPhoneResult[0].quantity;
                            if (availableNewQuantity < quantity) {
                                   return res.status(400).json({message: 'Not enough stock available' });
                                }

                        //5. Update the phone quantity
                            const newPhoneQuantity = availableNewQuantity - quantity;
                             const sql_updatePhone = 'UPDATE phones SET quantity = ? WHERE phone_id = ?';
                            db.query(sql_updatePhone, [newPhoneQuantity, phone_id], (err, updateResult) => {
                                  if(err) {
                                     console.error('Error updating phone stock:', err);
                                       return res.status(500).json({ message: 'Failed to update phone stock' });
                                    }
                                    // 6. Update the invoice
                                    const sql =
                                        'UPDATE sales_invoices SET cust_id = ?, phone_id = ?, date = ?, quantity = ? WHERE invoice_id = ?';
                                    db.query(sql, [cust_id, phone_id, date, quantity, invoiceId], (err, result) => {
                                      if (err) {
                                          console.error('Error updating sales invoice:', err);
                                          return res.status(500).json({ message: 'Failed to update sales invoice' });
                                      }
                                      if (result.affectedRows === 0) {
                                          return res.status(404).json({ message: 'Sales invoice not found' });
                                      }
                                      res.json({ message: 'Sales invoice updated successfully' });
                                    });
                             });
                    });
              });
          });
      });
  });

  // DELETE a sales invoice
    router.delete('/:invoice_id', (req, res) => {
         const invoiceId = req.params.invoice_id;
        // 1. Get the current phone_id and quantity of the invoice before deletion
         const sql_getInvoice = "SELECT phone_id, quantity FROM sales_invoices WHERE invoice_id = ?";
        db.query(sql_getInvoice, [invoiceId], (err, invoiceResults) => {
            if (err) {
                 console.error('Error fetching sales invoice data:', err);
                return res.status(500).json({ message: 'Failed to fetch sales invoice data' });
              }
               if (!invoiceResults || invoiceResults.length === 0) {
                   return res.status(404).json({ message: 'Sales invoice not found' });
              }
           const currentPhoneId = invoiceResults[0].phone_id;
           const currentQuantity = invoiceResults[0].quantity;

           // 2. Get the current quantity of the product
           const sql_getPhone = "SELECT quantity FROM phones WHERE phone_id = ?";
              db.query(sql_getPhone, [currentPhoneId], (err, phoneResults) => {
                  if(err) {
                        console.error('Error fetching phone data:', err);
                        return res.status(500).json({message: 'Failed to fetch phone data'});
                    }
                     if (!phoneResults || phoneResults.length === 0) {
                            return res.status(404).json({ message: 'Phone for invoice not found' });
                     }
                   const currentPhoneQuantity = phoneResults[0].quantity;

                    // 3. Restore the previous quantity
                   const restoreQuantity = currentPhoneQuantity + currentQuantity;
                    const sql_restorePhone = 'UPDATE phones SET quantity = ? WHERE phone_id = ?';
                   db.query(sql_restorePhone, [restoreQuantity, currentPhoneId], (err, restoreResult) => {
                           if (err) {
                                console.error('Error restoring phone stock:', err);
                                return res.status(500).json({ message: 'Failed to restore phone stock' });
                            }
                             // 4. Delete the invoice
                            const sql_deleteInvoice = 'DELETE FROM sales_invoices WHERE invoice_id = ?';
                                db.query(sql_deleteInvoice, [invoiceId], (err, result) => {
                                  if (err) {
                                        console.error('Error deleting sales invoice:', err);
                                        return res.status(500).json({ message: 'Failed to delete sales invoice' });
                                    }
                                     if (result.affectedRows === 0) {
                                       return res.status(404).json({ message: 'Sales invoice not found' });
                                    }
                                    res.json({ message: 'Sales invoice deleted successfully' });
                                });
                     });
            });
        });
    });

  return router;
};