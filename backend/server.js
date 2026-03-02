require('dotenv').config();
const path = require('path');
const express = require('express');
const cors = require('cors');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { Sequelize, DataTypes } = require('sequelize');

const app = express();
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, '../frontend')));

const JWT_SECRET = process.env.JWT_SECRET || 'apple_store_kolwezi_secret_2024';

// DB Connection
let sequelize;
if (process.env.DATABASE_URL) {
  sequelize = new Sequelize(process.env.DATABASE_URL, {
    dialect: 'postgres',
    logging: false,
    dialectOptions: {
      ssl: {
        require: true,
        rejectUnauthorized: false
      }
    },
    pool: { max: 5, min: 0, acquire: 30000, idle: 10000 }
  });
} else {
  sequelize = new Sequelize(
    process.env.DB_NAME || 'apple_store',
    process.env.DB_USER || 'postgres',
    process.env.DB_PASS || 'postgres123',
    {
      host: process.env.DB_HOST || 'localhost',
      dialect: 'postgres',
      logging: false,
      pool: { max: 5, min: 0, acquire: 30000, idle: 10000 }
    }
  );
}

// Models
const User = sequelize.define('User', {
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  username: { type: DataTypes.STRING, unique: true, allowNull: false },
  password: { type: DataTypes.STRING, allowNull: false },
  role: { type: DataTypes.ENUM('admin', 'cashier'), defaultValue: 'cashier' }
});

const Product = sequelize.define('Product', {
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  name: { type: DataTypes.STRING, allowNull: false },
  category: { type: DataTypes.STRING, defaultValue: 'iPhone' },
  price: { type: DataTypes.DECIMAL(10, 2), allowNull: false },
  stock: { type: DataTypes.INTEGER, defaultValue: 0 },
  sku: { type: DataTypes.STRING, unique: true },
  description: { type: DataTypes.TEXT }
});

const Sale = sequelize.define('Sale', {
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  productId: { type: DataTypes.INTEGER, allowNull: false },
  productName: { type: DataTypes.STRING },
  quantity: { type: DataTypes.INTEGER, allowNull: false },
  unitPrice: { type: DataTypes.DECIMAL(10, 2), allowNull: false },
  total: { type: DataTypes.DECIMAL(10, 2), allowNull: false },
  paymentMethod: { type: DataTypes.ENUM('cash', 'card', 'mobile'), defaultValue: 'cash' },
  cashierId: { type: DataTypes.INTEGER },
  cashierName: { type: DataTypes.STRING },
  saleDate: { type: DataTypes.DATEONLY, defaultValue: DataTypes.NOW }
});

const Expense = sequelize.define('Expense', {
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  description: { type: DataTypes.STRING, allowNull: false },
  amount: { type: DataTypes.DECIMAL(10, 2), allowNull: false },
  category: { type: DataTypes.STRING, defaultValue: 'Général' },
  date: { type: DataTypes.DATEONLY, defaultValue: DataTypes.NOW }
});

// Auth Middleware
const auth = (req, res, next) => {
  const token = req.headers.authorization?.split(' ')[1];
  if (!token) return res.status(401).json({ error: 'Token manquant' });
  try {
    req.user = jwt.verify(token, JWT_SECRET);
    next();
  } catch { res.status(401).json({ error: 'Token invalide' }); }
};

const adminOnly = (req, res, next) => {
  if (req.user.role !== 'admin') return res.status(403).json({ error: 'Accès refusé' });
  next();
};

// Seed Data
async function seedData() {
  const count = await User.count();
  if (count === 0) {
    const hash = await bcrypt.hash('admin123', 10);
    await User.create({ username: 'admin', password: hash, role: 'admin' });
    const cashHash = await bcrypt.hash('caisse123', 10);
    await User.create({ username: 'caissier1', password: cashHash, role: 'cashier' });

    const products = [
      { name: 'iPhone 15 Pro Max 256GB', category: 'iPhone', price: 1299.99, stock: 15, sku: 'IPH15PM256', description: 'Titane naturel, puce A17 Pro' },
      { name: 'iPhone 15 Pro 128GB', category: 'iPhone', price: 999.99, stock: 20, sku: 'IPH15P128', description: 'Titane noir, puce A17 Pro' },
      { name: 'iPhone 15 128GB', category: 'iPhone', price: 799.99, stock: 25, sku: 'IPH15128', description: 'Noir, puce A16 Bionic' },
      { name: 'iPhone 14 128GB', category: 'iPhone', price: 699.99, stock: 10, sku: 'IPH14128', description: 'Minuit, puce A15 Bionic' },
      { name: 'MacBook Pro 14" M3', category: 'Mac', price: 1999.99, stock: 8, sku: 'MBP14M3', description: 'Puce M3, 8GB RAM, 512GB SSD' },
      { name: 'MacBook Air 13" M2', category: 'Mac', price: 1299.99, stock: 12, sku: 'MBA13M2', description: 'Puce M2, 8GB RAM, 256GB SSD' },
      { name: 'iPad Pro 12.9" M2', category: 'iPad', price: 1099.99, stock: 10, sku: 'IPADPRO129M2', description: 'Puce M2, 128GB, WiFi' },
      { name: 'iPad Air 10.9" M1', category: 'iPad', price: 749.99, stock: 15, sku: 'IPADAIRM1', description: 'Puce M1, 64GB, WiFi' },
      { name: 'Apple Watch Series 9 45mm', category: 'Watch', price: 429.99, stock: 20, sku: 'AWS945', description: 'Aluminium minuit, GPS' },
      { name: 'AirPods Pro 2ème gen', category: 'Accessoires', price: 249.99, stock: 30, sku: 'AIRPODSPRO2', description: 'Réduction de bruit active' },
      { name: 'AirPods 3ème gen', category: 'Accessoires', price: 179.99, stock: 25, sku: 'AIRPODS3', description: 'Audio spatial' },
      { name: 'Apple TV 4K 3ème gen', category: 'Accessoires', price: 129.99, stock: 18, sku: 'APPLETV4K3', description: 'WiFi + Ethernet, 64GB' }
    ];
    await Product.bulkCreate(products);

    // Sample sales for last 7 days
    const today = new Date();
    for (let i = 6; i >= 0; i--) {
      const d = new Date(today);
      d.setDate(d.getDate() - i);
      const dateStr = d.toISOString().split('T')[0];
      const numSales = Math.floor(Math.random() * 5) + 2;
      for (let j = 0; j < numSales; j++) {
        const prodIdx = Math.floor(Math.random() * products.length);
        const prod = products[prodIdx];
        const qty = Math.floor(Math.random() * 3) + 1;
        const price = parseFloat(prod.price);
        await Sale.create({
          productId: prodIdx + 1,
          productName: prod.name,
          quantity: qty,
          unitPrice: price,
          total: price * qty,
          paymentMethod: ['cash', 'card', 'mobile'][Math.floor(Math.random() * 3)],
          cashierId: 1,
          cashierName: 'admin',
          saleDate: dateStr
        });
      }
    }

    await Expense.bulkCreate([
      { description: 'Loyer boutique', amount: 500, category: 'Loyer', date: new Date().toISOString().split('T')[0] },
      { description: 'Électricité', amount: 120, category: 'Charges', date: new Date().toISOString().split('T')[0] },
      { description: 'Salaires', amount: 800, category: 'Personnel', date: new Date().toISOString().split('T')[0] }
    ]);

    console.log('✅ Données de démo créées');
  }
}

// Routes
app.get('/api/health', (req, res) => res.json({ status: 'OK', app: 'Apple Store Kolwezi' }));

// Auth
app.post('/api/auth/login', async (req, res) => {
  try {
    const { username, password } = req.body;
    const user = await User.findOne({ where: { username } });
    if (!user || !await bcrypt.compare(password, user.password))
      return res.status(401).json({ error: 'Identifiants incorrects' });
    const token = jwt.sign({ id: user.id, username: user.username, role: user.role }, JWT_SECRET, { expiresIn: '24h' });
    res.json({ token, user: { id: user.id, username: user.username, role: user.role } });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// Products
app.get('/api/products', auth, async (req, res) => {
  try { res.json(await Product.findAll({ order: [['category', 'ASC'], ['name', 'ASC']] })); }
  catch (e) { res.status(500).json({ error: e.message }); }
});

app.post('/api/products', auth, adminOnly, async (req, res) => {
  try { res.status(201).json(await Product.create(req.body)); }
  catch (e) { res.status(400).json({ error: e.message }); }
});

app.put('/api/products/:id', auth, adminOnly, async (req, res) => {
  try {
    const p = await Product.findByPk(req.params.id);
    if (!p) return res.status(404).json({ error: 'Produit non trouvé' });
    await p.update(req.body);
    res.json(p);
  } catch (e) { res.status(400).json({ error: e.message }); }
});

app.delete('/api/products/:id', auth, adminOnly, async (req, res) => {
  try {
    const p = await Product.findByPk(req.params.id);
    if (!p) return res.status(404).json({ error: 'Produit non trouvé' });
    await p.destroy();
    res.json({ message: 'Produit supprimé' });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// Sales
app.get('/api/sales', auth, async (req, res) => {
  try {
    const { startDate, endDate, limit } = req.query;
    const where = {};
    if (startDate && endDate) {
      const { Op } = require('sequelize');
      where.saleDate = { [Op.between]: [startDate, endDate] };
    }
    const opts = { where, order: [['createdAt', 'DESC']] };
    if (limit) opts.limit = parseInt(limit);
    res.json(await Sale.findAll(opts));
  } catch (e) { res.status(500).json({ error: e.message }); }
});

app.post('/api/sales', auth, async (req, res) => {
  try {
    const { productId, quantity, paymentMethod } = req.body;
    const product = await Product.findByPk(productId);
    if (!product) return res.status(404).json({ error: 'Produit non trouvé' });
    if (product.stock < quantity) return res.status(400).json({ error: 'Stock insuffisant' });
    const total = parseFloat(product.price) * quantity;
    const sale = await Sale.create({
      productId, quantity, paymentMethod,
      productName: product.name,
      unitPrice: product.price,
      total,
      cashierId: req.user.id,
      cashierName: req.user.username,
      saleDate: new Date().toISOString().split('T')[0]
    });
    await product.update({ stock: product.stock - quantity });
    res.status(201).json(sale);
  } catch (e) { res.status(400).json({ error: e.message }); }
});

app.delete('/api/sales/:id', auth, adminOnly, async (req, res) => {
  try {
    const s = await Sale.findByPk(req.params.id);
    if (!s) return res.status(404).json({ error: 'Vente non trouvée' });
    // Restore stock
    const product = await Product.findByPk(s.productId);
    if (product) await product.update({ stock: product.stock + s.quantity });
    await s.destroy();
    res.json({ message: 'Vente supprimée' });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// Expenses
app.get('/api/expenses', auth, async (req, res) => {
  try { res.json(await Expense.findAll({ order: [['date', 'DESC']] })); }
  catch (e) { res.status(500).json({ error: e.message }); }
});

app.post('/api/expenses', auth, adminOnly, async (req, res) => {
  try { res.status(201).json(await Expense.create(req.body)); }
  catch (e) { res.status(400).json({ error: e.message }); }
});

app.delete('/api/expenses/:id', auth, adminOnly, async (req, res) => {
  try {
    const e = await Expense.findByPk(req.params.id);
    if (!e) return res.status(404).json({ error: 'Dépense non trouvée' });
    await e.destroy();
    res.json({ message: 'Dépense supprimée' });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// Dashboard Stats
app.get('/api/dashboard', auth, async (req, res) => {
  try {
    const { Op } = require('sequelize');
    const today = new Date().toISOString().split('T')[0];
    const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
    const monthStart = new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split('T')[0];

    const [todaySales, weekSales, monthSales, totalProducts, lowStock, allExpenses] = await Promise.all([
      Sale.findAll({ where: { saleDate: today } }),
      Sale.findAll({ where: { saleDate: { [Op.between]: [weekAgo, today] } } }),
      Sale.findAll({ where: { saleDate: { [Op.gte]: monthStart } } }),
      Product.count(),
      Product.count({ where: { stock: { [Op.lt]: 5 } } }),
      Expense.findAll({ where: { date: { [Op.gte]: monthStart } } })
    ]);

    const todayRevenue = todaySales.reduce((s, x) => s + parseFloat(x.total), 0);
    const weekRevenue = weekSales.reduce((s, x) => s + parseFloat(x.total), 0);
    const monthRevenue = monthSales.reduce((s, x) => s + parseFloat(x.total), 0);
    const monthExpenses = allExpenses.reduce((s, x) => s + parseFloat(x.amount), 0);

    // Daily chart data (last 7 days)
    const chartData = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date(Date.now() - i * 24 * 60 * 60 * 1000);
      const dateStr = d.toISOString().split('T')[0];
      const label = d.toLocaleDateString('fr-FR', { weekday: 'short', day: 'numeric' });
      const daySales = weekSales.filter(s => s.saleDate === dateStr);
      chartData.push({ date: dateStr, label, revenue: daySales.reduce((s, x) => s + parseFloat(x.total), 0), count: daySales.length });
    }

    // Top products
    const productSales = {};
    monthSales.forEach(s => {
      if (!productSales[s.productName]) productSales[s.productName] = { name: s.productName, revenue: 0, qty: 0 };
      productSales[s.productName].revenue += parseFloat(s.total);
      productSales[s.productName].qty += s.quantity;
    });
    const topProducts = Object.values(productSales).sort((a, b) => b.revenue - a.revenue).slice(0, 5);

    res.json({
      today: { revenue: todayRevenue, sales: todaySales.length },
      week: { revenue: weekRevenue, sales: weekSales.length },
      month: { revenue: monthRevenue, sales: monthSales.length, expenses: monthExpenses, profit: monthRevenue - monthExpenses },
      inventory: { total: totalProducts, lowStock },
      chartData,
      topProducts,
      recentSales: weekSales.slice(0, 10)
    });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// Users (admin only)
app.get('/api/users', auth, adminOnly, async (req, res) => {
  try { res.json(await User.findAll({ attributes: ['id', 'username', 'role', 'createdAt'] })); }
  catch (e) { res.status(500).json({ error: e.message }); }
});

app.post('/api/users', auth, adminOnly, async (req, res) => {
  try {
    const { username, password, role } = req.body;
    const hash = await bcrypt.hash(password, 10);
    const user = await User.create({ username, password: hash, role });
    res.status(201).json({ id: user.id, username: user.username, role: user.role });
  } catch (e) { res.status(400).json({ error: e.message }); }
});

// Start
const PORT = process.env.PORT || 3000;
// Catch-all: serve frontend for any non-API route
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, '../frontend/index.html'));
});

sequelize.sync({ alter: true }).then(async () => {
  await seedData();
  app.listen(PORT, () => console.log(`🍎 Apple Store Kolwezi API running on port ${PORT}`));
}).catch(err => { console.error('DB Error:', err); process.exit(1); });
