const express = require('express');
const mysql = require('mysql');
const dotenv = require('dotenv');
const cors = require('cors');
dotenv.config();

const app = express();
const port = process.env.PORT || 3000;

app.use(express.json());
app.use(cors());

const db = mysql.createConnection({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_DATABASE,
});

db.connect((err) => {
  if (err) {
    console.error('Database connection failed:', err);
    return;
  }
  console.log('Connected to the database.');
});

// Import routes
const customerRoutes = require('./routes/customers')(db);
const phoneRoutes = require('./routes/phones')(db);
const salesInvoiceRoutes = require('./routes/sales_invoices')(db);
const repairInvoiceRoutes = require('./routes/repair_invoices')(db);

// Use routes
app.use('/api/customers', customerRoutes);
app.use('/api/phones', phoneRoutes);
app.use('/api/sales-invoices', salesInvoiceRoutes);
app.use('/api/repair-invoices', repairInvoiceRoutes);

app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});