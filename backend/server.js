const express = require('express');
const cors = require('cors');
const { Sequelize, DataTypes } = require('sequelize');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const app = express();
app.use(cors());
app.use(express.json());

// ─── Database Connection ───────────────────────────────────────────────────────
let sequelize;

if (process.env.DATABASE_URL) {
  console.log('Connecting to DB via DATABASE_URL...');
  const dbUrl = process.env.DATABASE_URL;
  const isInternalUrl = dbUrl.includes('.railway.internal') || dbUrl.includes('localhost') || dbUrl.includes('127.0.0.1');
  sequelize = new Sequelize(dbUrl, {
    dialect: 'postgres',
    logging: false,
    dialectOptions: isInternalUrl ? {} : {
      ssl: {
        require: true,
        rejectUnauthorized: false
      }
    }
  });
} else {
  const host = process.env.PGHOST || 'localhost';
  const port = parseInt(process.env.PGPORT) || 5432;
  const user = process.env.PGUSER || 'postgres';
  const password = process.env.PGPASSWORD || '';
  const database = process.env.PGDATABASE || 'railway';

  console.log(`Connecting to DB via individual vars: ${host}:${port}/${database}`);

  // Use SSL only for external hosts, not for Railway internal network
  const isInternal = host.includes('.railway.internal') || host === 'localhost' || host === '127.0.0.1';

  sequelize = new Sequelize(database, user, password, {
    host,
    port,
    dialect: 'postgres',
    logging: false,
    dialectOptions: isInternal ? {} : {
      ssl: {
        require: true,
        rejectUnauthorized: false
      }
    }
  });
}

// ─── Models ────────────────────────────────────────────────────────────────────
const User = sequelize.define('User', {
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  username: { type: DataTypes.STRING, unique: true, allowNull: false },
  password: { type: DataTypes.STRING, allowNull: false },
  role: { type: DataTypes.ENUM('admin', 'manager', 'cashier'), defaultValue: 'cashier' }
}, { tableName: 'users' });

const Product = sequelize.define('Product', {
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  name: { type: DataTypes.STRING, allowNull: false },
  category: { type: DataTypes.STRING },
  sku: { type: DataTypes.STRING, unique: true },
  price: { type: DataTypes.DECIMAL(10, 2), allowNull: false },
  cost: { type: DataTypes.DECIMAL(10, 2) },
  stock: { type: DataTypes.INTEGER, defaultValue: 0 },
  minStock: { type: DataTypes.INTEGER, defaultValue: 5 },
  description: { type: DataTypes.TEXT }
}, { tableName: 'products' });

const Sale = sequelize.define('Sale', {
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  total: { type: DataTypes.DECIMAL(10, 2), allowNull: false },
  paymentMethod: { type: DataTypes.ENUM('cash', 'card', 'mobile'), defaultValue: 'cash' },
  notes: { type: DataTypes.TEXT }
}, { tableName: 'sales' });

const SaleItem = sequelize.define('SaleItem', {
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  quantity: { type: DataTypes.INTEGER, allowNull: false },
  unitPrice: { type: DataTypes.DECIMAL(10, 2), allowNull: false },
  subtotal: { type: DataTypes.DECIMAL(10, 2), allowNull: false }
}, { tableName: 'sale_items' });

const Expense = sequelize.define('Expense', {
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  description: { type: DataTypes.STRING, allowNull: false },
  amount: { type: DataTypes.DECIMAL(10, 2), allowNull: false },
  category: { type: DataTypes.STRING },
  date: { type: DataTypes.DATEONLY, defaultValue: DataTypes.NOW }
}, { tableName: 'expenses' });

const StockMovement = sequelize.define('StockMovement', {
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  type: { type: DataTypes.ENUM('in', 'out', 'adjustment'), allowNull: false },
  quantity: { type: DataTypes.INTEGER, allowNull: false },
  reason: { type: DataTypes.STRING },
  previousStock: { type: DataTypes.INTEGER },
  newStock: { type: DataTypes.INTEGER }
}, { tableName: 'stock_movements' });

// Associations
Sale.hasMany(SaleItem, { foreignKey: 'saleId', as: 'items' });
SaleItem.belongsTo(Sale, { foreignKey: 'saleId' });
SaleItem.belongsTo(Product, { foreignKey: 'productId' });
Product.hasMany(SaleItem, { foreignKey: 'productId' });
StockMovement.belongsTo(Product, { foreignKey: 'productId' });
Product.hasMany(StockMovement, { foreignKey: 'productId' });

// ─── Auth Middleware ───────────────────────────────────────────────────────────
const JWT_SECRET = process.env.JWT_SECRET || 'apple-store-kolwezi-secret-2024';

const auth = (req, res, next) => {
  const token = req.headers.authorization?.split(' ')[1];
  if (!token) return res.status(401).json({ error: 'No token' });
  try {
    req.user = jwt.verify(token, JWT_SECRET);
    next();
  } catch {
    res.status(401).json({ error: 'Invalid token' });
  }
};

// ─── Routes ────────────────────────────────────────────────────────────────────

// Health check
app.get('/api/health', (req, res) => res.json({ status: 'ok', timestamp: new Date() }));

// Auth
app.post('/api/auth/login', async (req, res) => {
  try {
    const { username, password } = req.body;
    const user = await User.findOne({ where: { username } });
    if (!user || !await bcrypt.compare(password, user.password)) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }
    const token = jwt.sign({ id: user.id, username: user.username, role: user.role }, JWT_SECRET, { expiresIn: '24h' });
    res.json({ token, user: { id: user.id, username: user.username, role: user.role } });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Products
app.get('/api/products', auth, async (req, res) => {
  try {
    const products = await Product.findAll({ order: [['name', 'ASC']] });
    res.json(products);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

app.post('/api/products', auth, async (req, res) => {
  try {
    const product = await Product.create(req.body);
    res.status(201).json(product);
  } catch (err) { res.status(400).json({ error: err.message }); }
});

app.put('/api/products/:id', auth, async (req, res) => {
  try {
    const product = await Product.findByPk(req.params.id);
    if (!product) return res.status(404).json({ error: 'Not found' });
    await product.update(req.body);
    res.json(product);
  } catch (err) { res.status(400).json({ error: err.message }); }
});

app.delete('/api/products/:id', auth, async (req, res) => {
  try {
    const product = await Product.findByPk(req.params.id);
    if (!product) return res.status(404).json({ error: 'Not found' });
    await product.destroy();
    res.json({ message: 'Deleted' });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// Sales
app.get('/api/sales', auth, async (req, res) => {
  try {
    const sales = await Sale.findAll({
      include: [{ model: SaleItem, as: 'items', include: [Product] }],
      order: [['createdAt', 'DESC']],
      limit: 100
    });
    res.json(sales);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

app.post('/api/sales', auth, async (req, res) => {
  const t = await sequelize.transaction();
  try {
    const { items, paymentMethod, notes } = req.body;
    let total = 0;
    for (const item of items) {
      total += item.quantity * item.unitPrice;
    }
    const sale = await Sale.create({ total, paymentMethod, notes }, { transaction: t });
    for (const item of items) {
      const subtotal = item.quantity * item.unitPrice;
      await SaleItem.create({ saleId: sale.id, productId: item.productId, quantity: item.quantity, unitPrice: item.unitPrice, subtotal }, { transaction: t });
      const product = await Product.findByPk(item.productId, { transaction: t });
      if (product) {
        const previousStock = product.stock;
        const newStock = previousStock - item.quantity;
        await product.update({ stock: newStock }, { transaction: t });
        await StockMovement.create({ productId: item.productId, type: 'out', quantity: item.quantity, reason: `Sale #${sale.id}`, previousStock, newStock }, { transaction: t });
      }
    }
    await t.commit();
    res.status(201).json(sale);
  } catch (err) {
    await t.rollback();
    res.status(400).json({ error: err.message });
  }
});

// Expenses
app.get('/api/expenses', auth, async (req, res) => {
  try {
    const expenses = await Expense.findAll({ order: [['date', 'DESC']] });
    res.json(expenses);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

app.post('/api/expenses', auth, async (req, res) => {
  try {
    const expense = await Expense.create(req.body);
    res.status(201).json(expense);
  } catch (err) { res.status(400).json({ error: err.message }); }
});

app.delete('/api/expenses/:id', auth, async (req, res) => {
  try {
    const expense = await Expense.findByPk(req.params.id);
    if (!expense) return res.status(404).json({ error: 'Not found' });
    await expense.destroy();
    res.json({ message: 'Deleted' });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// Stock movements
app.get('/api/stock-movements', auth, async (req, res) => {
  try {
    const movements = await StockMovement.findAll({
      include: [Product],
      order: [['createdAt', 'DESC']],
      limit: 200
    });
    res.json(movements);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

app.post('/api/stock-movements', auth, async (req, res) => {
  const t = await sequelize.transaction();
  try {
    const { productId, type, quantity, reason } = req.body;
    const product = await Product.findByPk(productId, { transaction: t });
    if (!product) return res.status(404).json({ error: 'Product not found' });
    const previousStock = product.stock;
    const newStock = type === 'in' ? previousStock + quantity : previousStock - quantity;
    await product.update({ stock: newStock }, { transaction: t });
    const movement = await StockMovement.create({ productId, type, quantity, reason, previousStock, newStock }, { transaction: t });
    await t.commit();
    res.status(201).json(movement);
  } catch (err) {
    await t.rollback();
    res.status(400).json({ error: err.message });
  }
});

// Dashboard stats
app.get('/api/dashboard', auth, async (req, res) => {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const [totalProducts, lowStockProducts, todaySales, totalExpenses, recentSales] = await Promise.all([
      Product.count(),
      Product.count({ where: { stock: { [Sequelize.Op.lte]: sequelize.col('minStock') } } }),
      Sale.sum('total', { where: { createdAt: { [Sequelize.Op.gte]: today } } }),
      Expense.sum('amount'),
      Sale.findAll({ include: [{ model: SaleItem, as: 'items', include: [Product] }], order: [['createdAt', 'DESC']], limit: 5 })
    ]);
    res.json({ totalProducts, lowStockProducts, todaySales: todaySales || 0, totalExpenses: totalExpenses || 0, recentSales });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// ─── Start ─────────────────────────────────────────────────────────────────────
const PORT = process.env.PORT || 3000;

sequelize.authenticate()
  .then(() => {
    console.log('Database connected successfully!');
    return sequelize.sync({ alter: true });
  })
  .then(async () => {
    console.log('Database synced!');
    // Create default admin if not exists
    const adminExists = await User.findOne({ where: { username: 'admin' } });
    if (!adminExists) {
      const hashedPassword = await bcrypt.hash('admin123', 10);
      await User.create({ username: 'admin', password: hashedPassword, role: 'admin' });
      console.log('Default admin created: admin / admin123');
    }
    app.listen(PORT, '0.0.0.0', () => {
      console.log(`Server running on port ${PORT}`);
    });
  })
  .catch(err => {
    console.error('DB Error:', err.message);
    process.exit(1);
  });
