const express = require('express');
const cors = require('cors');
const { Sequelize, DataTypes, Op } = require('sequelize');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const app = express();
app.use(cors());
app.use(express.json());

// ─── DB Connection ─────────────────────────────────────────────────────────────
const dbUrl = process.env.DATABASE_URL || '';
const maskedUrl = dbUrl.replace(/:([^:@]+)@/, ':***@');
console.log('=== DB STARTUP DIAGNOSTICS ===');
console.log('DATABASE_URL (masked):', maskedUrl || '(not set)');
console.log('NODE_ENV:', process.env.NODE_ENV || '(not set)');
console.log('==============================');

let sequelize;
if (dbUrl) {
  const isInternal = dbUrl.includes('.railway.internal') || dbUrl.includes('localhost') || dbUrl.includes('127.0.0.1');
  sequelize = new Sequelize(dbUrl, {
    dialect: 'postgres', logging: false,
    dialectOptions: isInternal ? { ssl: false } : { ssl: { require: true, rejectUnauthorized: false } }
  });
} else {
  const host = process.env.PGHOST || 'localhost';
  const port = parseInt(process.env.PGPORT) || 5432;
  const user = process.env.PGUSER || 'postgres';
  const password = process.env.PGPASSWORD || '';
  const database = process.env.PGDATABASE || 'railway';
  const isInternal = host.includes('.railway.internal') || host === 'localhost' || host === '127.0.0.1';
  sequelize = new Sequelize(database, user, password, {
    host, port, dialect: 'postgres', logging: false,
    dialectOptions: isInternal ? { ssl: false } : { ssl: { require: true, rejectUnauthorized: false } }
  });
}

// ─── Models ────────────────────────────────────────────────────────────────────
const User = sequelize.define('User', {
  username: { type: DataTypes.STRING, unique: true, allowNull: false },
  password: { type: DataTypes.STRING, allowNull: false },
  role: { type: DataTypes.STRING, defaultValue: 'user' }
});

const Product = sequelize.define('Product', {
  name: { type: DataTypes.STRING, allowNull: false },
  category: { type: DataTypes.STRING, defaultValue: 'Accessoire' },
  buyPrice: { type: DataTypes.DECIMAL(10, 2), defaultValue: 0 },
  sellPrice: { type: DataTypes.DECIMAL(10, 2), defaultValue: 0 },
  stock: { type: DataTypes.INTEGER, defaultValue: 0 },
  minStock: { type: DataTypes.INTEGER, defaultValue: 5 },
  description: { type: DataTypes.TEXT }
});

const Sale = sequelize.define('Sale', {
  total: { type: DataTypes.DECIMAL(10, 2), defaultValue: 0 },
  paymentMethod: { type: DataTypes.STRING, defaultValue: 'cash' },
  notes: { type: DataTypes.TEXT }
});

const SaleItem = sequelize.define('SaleItem', {
  quantity: { type: DataTypes.INTEGER, allowNull: false },
  unitPrice: { type: DataTypes.DECIMAL(10, 2), allowNull: false },
  subtotal: { type: DataTypes.DECIMAL(10, 2), allowNull: false }
});

const Expense = sequelize.define('Expense', {
  description: { type: DataTypes.STRING, allowNull: false },
  amount: { type: DataTypes.DECIMAL(10, 2), allowNull: false },
  category: { type: DataTypes.STRING, defaultValue: 'Autre' },
  date: { type: DataTypes.DATEONLY, defaultValue: DataTypes.NOW }
});

const StockMovement = sequelize.define('StockMovement', {
  type: { type: DataTypes.STRING, allowNull: false },
  quantity: { type: DataTypes.INTEGER, allowNull: false },
  reason: { type: DataTypes.STRING },
  previousStock: { type: DataTypes.INTEGER },
  newStock: { type: DataTypes.INTEGER }
});

const Supplier = sequelize.define('Supplier', {
  name: { type: DataTypes.STRING, allowNull: false },
  contact: { type: DataTypes.STRING },
  phone: { type: DataTypes.STRING },
  email: { type: DataTypes.STRING },
  address: { type: DataTypes.TEXT },
  notes: { type: DataTypes.TEXT }
});

const Purchase = sequelize.define('Purchase', {
  total: { type: DataTypes.DECIMAL(10, 2), defaultValue: 0 },
  paymentMethod: { type: DataTypes.STRING, defaultValue: 'cash' },
  notes: { type: DataTypes.TEXT },
  status: { type: DataTypes.STRING, defaultValue: 'completed' }
});

const PurchaseItem = sequelize.define('PurchaseItem', {
  quantity: { type: DataTypes.INTEGER, allowNull: false },
  unitPrice: { type: DataTypes.DECIMAL(10, 2), allowNull: false },
  subtotal: { type: DataTypes.DECIMAL(10, 2), allowNull: false }
});

// ─── Associations ──────────────────────────────────────────────────────────────
Sale.hasMany(SaleItem, { as: 'items', foreignKey: 'saleId' });
SaleItem.belongsTo(Sale, { foreignKey: 'saleId' });
SaleItem.belongsTo(Product, { foreignKey: 'productId' });
Product.hasMany(SaleItem, { foreignKey: 'productId' });
StockMovement.belongsTo(Product, { foreignKey: 'productId' });
Product.hasMany(StockMovement, { foreignKey: 'productId' });
Supplier.hasMany(Purchase, { foreignKey: 'supplierId' });
Purchase.belongsTo(Supplier, { foreignKey: 'supplierId' });
Purchase.hasMany(PurchaseItem, { as: 'items', foreignKey: 'purchaseId' });
PurchaseItem.belongsTo(Purchase, { foreignKey: 'purchaseId' });
PurchaseItem.belongsTo(Product, { foreignKey: 'productId' });
Product.hasMany(PurchaseItem, { foreignKey: 'productId' });

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
app.get('/api/health', (req, res) => res.json({ status: 'ok', timestamp: new Date() }));

app.post('/api/auth/login', async (req, res) => {
  try {
    const { username, password } = req.body;
    const user = await User.findOne({ where: { username } });
    if (!user || !await bcrypt.compare(password, user.password))
      return res.status(401).json({ error: 'Invalid credentials' });
    const token = jwt.sign({ id: user.id, username: user.username, role: user.role }, JWT_SECRET, { expiresIn: '24h' });
    res.json({ token, user: { id: user.id, username: user.username, role: user.role } });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// ─── Products ──────────────────────────────────────────────────────────────────
app.get('/api/products', auth, async (req, res) => {
  try { res.json(await Product.findAll({ order: [['name', 'ASC']] })); }
  catch (err) { res.status(500).json({ error: err.message }); }
});
app.post('/api/products', auth, async (req, res) => {
  try { res.status(201).json(await Product.create(req.body)); }
  catch (err) { res.status(400).json({ error: err.message }); }
});
app.put('/api/products/:id', auth, async (req, res) => {
  try {
    const p = await Product.findByPk(req.params.id);
    if (!p) return res.status(404).json({ error: 'Not found' });
    res.json(await p.update(req.body));
  } catch (err) { res.status(400).json({ error: err.message }); }
});
app.delete('/api/products/:id', auth, async (req, res) => {
  try {
    const p = await Product.findByPk(req.params.id);
    if (!p) return res.status(404).json({ error: 'Not found' });
    await p.destroy(); res.json({ message: 'Deleted' });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// ─── Sales ─────────────────────────────────────────────────────────────────────
app.get('/api/sales', auth, async (req, res) => {
  try {
    res.json(await Sale.findAll({
      include: [{ model: SaleItem, as: 'items', include: [Product] }],
      order: [['createdAt', 'DESC']], limit: 100
    }));
  } catch (err) { res.status(500).json({ error: err.message }); }
});
app.post('/api/sales', auth, async (req, res) => {
  const t = await sequelize.transaction();
  try {
    const { items, paymentMethod, notes } = req.body;
    let total = 0;
    for (const item of items) total += item.quantity * item.unitPrice;
    const sale = await Sale.create({ total, paymentMethod, notes }, { transaction: t });
    for (const item of items) {
      const subtotal = item.quantity * item.unitPrice;
      await SaleItem.create({ saleId: sale.id, productId: item.productId, quantity: item.quantity, unitPrice: item.unitPrice, subtotal }, { transaction: t });
      const product = await Product.findByPk(item.productId, { transaction: t });
      if (product) {
        const previousStock = product.stock;
        const newStock = previousStock - item.quantity;
        await product.update({ stock: newStock }, { transaction: t });
        await StockMovement.create({ productId: item.productId, type: 'out', quantity: item.quantity, reason: `Vente #${sale.id}`, previousStock, newStock }, { transaction: t });
      }
    }
    await t.commit(); res.status(201).json(sale);
  } catch (err) { await t.rollback(); res.status(400).json({ error: err.message }); }
});

// ─── Expenses ──────────────────────────────────────────────────────────────────
app.get('/api/expenses', auth, async (req, res) => {
  try { res.json(await Expense.findAll({ order: [['date', 'DESC']] })); }
  catch (err) { res.status(500).json({ error: err.message }); }
});
app.post('/api/expenses', auth, async (req, res) => {
  try { res.status(201).json(await Expense.create(req.body)); }
  catch (err) { res.status(400).json({ error: err.message }); }
});
app.put('/api/expenses/:id', auth, async (req, res) => {
  try {
    const e = await Expense.findByPk(req.params.id);
    if (!e) return res.status(404).json({ error: 'Not found' });
    res.json(await e.update(req.body));
  } catch (err) { res.status(400).json({ error: err.message }); }
});
app.delete('/api/expenses/:id', auth, async (req, res) => {
  try {
    const e = await Expense.findByPk(req.params.id);
    if (!e) return res.status(404).json({ error: 'Not found' });
    await e.destroy(); res.json({ message: 'Deleted' });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// ─── Stock Movements ───────────────────────────────────────────────────────────
app.get('/api/stock-movements', auth, async (req, res) => {
  try {
    res.json(await StockMovement.findAll({
      include: [Product], order: [['createdAt', 'DESC']], limit: 200
    }));
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
    await t.commit(); res.status(201).json(movement);
  } catch (err) { await t.rollback(); res.status(400).json({ error: err.message }); }
});

// ─── Suppliers ─────────────────────────────────────────────────────────────────
app.get('/api/suppliers', auth, async (req, res) => {
  try { res.json(await Supplier.findAll({ order: [['name', 'ASC']] })); }
  catch (err) { res.status(500).json({ error: err.message }); }
});
app.post('/api/suppliers', auth, async (req, res) => {
  try { res.status(201).json(await Supplier.create(req.body)); }
  catch (err) { res.status(400).json({ error: err.message }); }
});
app.put('/api/suppliers/:id', auth, async (req, res) => {
  try {
    const s = await Supplier.findByPk(req.params.id);
    if (!s) return res.status(404).json({ error: 'Not found' });
    res.json(await s.update(req.body));
  } catch (err) { res.status(400).json({ error: err.message }); }
});
app.delete('/api/suppliers/:id', auth, async (req, res) => {
  try {
    const s = await Supplier.findByPk(req.params.id);
    if (!s) return res.status(404).json({ error: 'Not found' });
    await s.destroy(); res.json({ message: 'Deleted' });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// ─── Purchases ─────────────────────────────────────────────────────────────────
app.get('/api/purchases', auth, async (req, res) => {
  try {
    res.json(await Purchase.findAll({
      include: [Supplier, { model: PurchaseItem, as: 'items', include: [Product] }],
      order: [['createdAt', 'DESC']], limit: 100
    }));
  } catch (err) { res.status(500).json({ error: err.message }); }
});
app.post('/api/purchases', auth, async (req, res) => {
  const t = await sequelize.transaction();
  try {
    const { supplierId, items, paymentMethod, notes } = req.body;
    let total = 0;
    for (const item of items) total += item.quantity * item.unitPrice;
    const purchase = await Purchase.create({ supplierId, total, paymentMethod, notes }, { transaction: t });
    for (const item of items) {
      const subtotal = item.quantity * item.unitPrice;
      await PurchaseItem.create({ purchaseId: purchase.id, productId: item.productId, quantity: item.quantity, unitPrice: item.unitPrice, subtotal }, { transaction: t });
      const product = await Product.findByPk(item.productId, { transaction: t });
      if (product) {
        const previousStock = product.stock;
        const newStock = previousStock + item.quantity;
        await product.update({ stock: newStock, buyPrice: item.unitPrice }, { transaction: t });
        await StockMovement.create({ productId: item.productId, type: 'in', quantity: item.quantity, reason: `Achat #${purchase.id}`, previousStock, newStock }, { transaction: t });
      }
    }
    await t.commit(); res.status(201).json(purchase);
  } catch (err) { await t.rollback(); res.status(400).json({ error: err.message }); }
});
app.delete('/api/purchases/:id', auth, async (req, res) => {
  try {
    const p = await Purchase.findByPk(req.params.id);
    if (!p) return res.status(404).json({ error: 'Not found' });
    await p.destroy(); res.json({ message: 'Deleted' });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// ─── Dashboard ─────────────────────────────────────────────────────────────────
app.get('/api/dashboard', auth, async (req, res) => {
  try {
    const today = new Date(); today.setHours(0, 0, 0, 0);
    const [totalProducts, lowStockProducts, todaySales, totalExpenses, recentSales] = await Promise.all([
      Product.count(),
      Product.count({ where: { stock: { [Op.lte]: sequelize.col('minStock') } } }),
      Sale.sum('total', { where: { createdAt: { [Op.gte]: today } } }),
      Expense.sum('amount'),
      Sale.findAll({ include: [{ model: SaleItem, as: 'items', include: [Product] }], order: [['createdAt', 'DESC']], limit: 5 })
    ]);
    res.json({ totalProducts, lowStockProducts, todaySales: todaySales || 0, totalExpenses: totalExpenses || 0, recentSales });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// ─── Accounting ────────────────────────────────────────────────────────────────
app.get('/api/accounting/summary', auth, async (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    const dateFilter = {};
    if (startDate) dateFilter[Op.gte] = new Date(startDate);
    if (endDate) { const end = new Date(endDate); end.setHours(23,59,59,999); dateFilter[Op.lte] = end; }

    const salesWhere = Object.keys(dateFilter).length ? { createdAt: dateFilter } : {};
    const expenseWhere = Object.keys(dateFilter).length ? { date: { ...(startDate ? { [Op.gte]: startDate } : {}), ...(endDate ? { [Op.lte]: endDate } : {}) } } : {};

    const [totalRevenue, totalExpenses, totalPurchases, salesCount, expensesCount] = await Promise.all([
      Sale.sum('total', { where: salesWhere }),
      Expense.sum('amount', { where: expenseWhere }),
      Purchase.sum('total', { where: salesWhere }),
      Sale.count({ where: salesWhere }),
      Expense.count({ where: expenseWhere })
    ]);

    const revenue = parseFloat(totalRevenue) || 0;
    const expenses = parseFloat(totalExpenses) || 0;
    const purchases = parseFloat(totalPurchases) || 0;
    const grossProfit = revenue - purchases;
    const netProfit = grossProfit - expenses;

    res.json({ totalRevenue: revenue, totalExpenses: expenses, totalPurchases: purchases, grossProfit, netProfit, salesCount, expensesCount });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

app.get('/api/accounting/monthly', auth, async (req, res) => {
  try {
    const year = req.query.year || new Date().getFullYear();
    const months = [];
    for (let m = 0; m < 12; m++) {
      const start = new Date(year, m, 1);
      const end = new Date(year, m + 1, 0, 23, 59, 59, 999);
      const startStr = start.toISOString().split('T')[0];
      const endStr = end.toISOString().split('T')[0];
      const [revenue, expenses, purchases] = await Promise.all([
        Sale.sum('total', { where: { createdAt: { [Op.between]: [start, end] } } }),
        Expense.sum('amount', { where: { date: { [Op.between]: [startStr, endStr] } } }),
        Purchase.sum('total', { where: { createdAt: { [Op.between]: [start, end] } } })
      ]);
      months.push({
        month: m + 1,
        monthName: start.toLocaleString('fr-FR', { month: 'long' }),
        revenue: parseFloat(revenue) || 0,
        expenses: parseFloat(expenses) || 0,
        purchases: parseFloat(purchases) || 0,
        profit: (parseFloat(revenue) || 0) - (parseFloat(expenses) || 0) - (parseFloat(purchases) || 0)
      });
    }
    res.json(months);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// ─── Reports ───────────────────────────────────────────────────────────────────
app.get('/api/reports/sales', auth, async (req, res) => {
  try {
    const { period = '30' } = req.query;
    const days = parseInt(period);
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    const sales = await Sale.findAll({
      include: [{ model: SaleItem, as: 'items', include: [Product] }],
      where: { createdAt: { [Op.gte]: startDate } },
      order: [['createdAt', 'ASC']]
    });

    // Group by day
    const byDay = {};
    for (const sale of sales) {
      const day = sale.createdAt.toISOString().split('T')[0];
      if (!byDay[day]) byDay[day] = { date: day, revenue: 0, count: 0 };
      byDay[day].revenue += parseFloat(sale.total);
      byDay[day].count += 1;
    }

    // Top products
    const productSales = {};
    for (const sale of sales) {
      for (const item of sale.items || []) {
        const pid = item.productId;
        if (!productSales[pid]) productSales[pid] = { name: item.Product?.name || 'Unknown', quantity: 0, revenue: 0 };
        productSales[pid].quantity += item.quantity;
        productSales[pid].revenue += parseFloat(item.subtotal);
      }
    }
    const topProducts = Object.values(productSales).sort((a, b) => b.revenue - a.revenue).slice(0, 10);

    res.json({
      dailySales: Object.values(byDay),
      topProducts,
      totalRevenue: sales.reduce((s, x) => s + parseFloat(x.total), 0),
      totalTransactions: sales.length
    });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

app.get('/api/reports/inventory', auth, async (req, res) => {
  try {
    const products = await Product.findAll({ order: [['name', 'ASC']] });
    const lowStock = products.filter(p => p.stock <= p.minStock);
    const outOfStock = products.filter(p => p.stock === 0);
    const totalValue = products.reduce((s, p) => s + (parseFloat(p.buyPrice) * p.stock), 0);
    const totalRetailValue = products.reduce((s, p) => s + (parseFloat(p.sellPrice) * p.stock), 0);

    const byCategory = {};
    for (const p of products) {
      if (!byCategory[p.category]) byCategory[p.category] = { category: p.category, count: 0, value: 0 };
      byCategory[p.category].count += 1;
      byCategory[p.category].value += parseFloat(p.buyPrice) * p.stock;
    }

    res.json({
      totalProducts: products.length,
      lowStockCount: lowStock.length,
      outOfStockCount: outOfStock.length,
      totalValue,
      totalRetailValue,
      potentialProfit: totalRetailValue - totalValue,
      byCategory: Object.values(byCategory),
      lowStockProducts: lowStock,
      products
    });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

app.get('/api/reports/profit', auth, async (req, res) => {
  try {
    const { year } = req.query;
    const targetYear = parseInt(year) || new Date().getFullYear();
    const start = new Date(targetYear, 0, 1);
    const end = new Date(targetYear, 11, 31, 23, 59, 59, 999);

    const [sales, expenses, purchases] = await Promise.all([
      Sale.findAll({ include: [{ model: SaleItem, as: 'items', include: [Product] }], where: { createdAt: { [Op.between]: [start, end] } } }),
      Expense.findAll({ where: { date: { [Op.between]: [start.toISOString().split('T')[0], end.toISOString().split('T')[0]] } } }),
      Purchase.findAll({ where: { createdAt: { [Op.between]: [start, end] } } })
    ]);

    const totalRevenue = sales.reduce((s, x) => s + parseFloat(x.total), 0);
    const totalExpenses = expenses.reduce((s, x) => s + parseFloat(x.amount), 0);
    const totalPurchases = purchases.reduce((s, x) => s + parseFloat(x.total), 0);

    // Expense by category
    const expByCategory = {};
    for (const e of expenses) {
      if (!expByCategory[e.category]) expByCategory[e.category] = 0;
      expByCategory[e.category] += parseFloat(e.amount);
    }

    res.json({
      totalRevenue,
      totalExpenses,
      totalPurchases,
      grossProfit: totalRevenue - totalPurchases,
      netProfit: totalRevenue - totalPurchases - totalExpenses,
      expensesByCategory: Object.entries(expByCategory).map(([name, value]) => ({ name, value }))
    });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// ─── Start ─────────────────────────────────────────────────────────────────────
const PORT = process.env.PORT || 3000;
sequelize.authenticate()
  .then(() => { console.log('Database connected!'); return sequelize.sync({ alter: true }); })
  .then(async () => {
    console.log('Database synced!');
    const adminExists = await User.findOne({ where: { username: 'admin' } });
    if (!adminExists) {
      const hashedPassword = await bcrypt.hash('admin123', 10);
      await User.create({ username: 'admin', password: hashedPassword, role: 'admin' });
      console.log('Default admin created: admin / admin123');
    }
    app.listen(PORT, '0.0.0.0', () => console.log(`Server running on port ${PORT}`));
  })
  .catch(err => { console.error('DB Error:', err.message); process.exit(1); });
