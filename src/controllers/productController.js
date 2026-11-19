const { Product } = require('../models/Product');
const AppError = require('../utils/AppError');
const asyncHandler = require('../utils/asyncHandler');

const listProducts = asyncHandler(async (req, res) => {
  const page = Math.max(Number.parseInt(req.query.page, 10) || 1, 1);
  const limit = Math.min(Math.max(Number.parseInt(req.query.limit, 10) || 20, 1), 100);
  const filter = { owner: req.user._id };

  if (req.query.category) {
    filter.category = req.query.category;
  }

  if (req.query.status) {
    filter.status = req.query.status;
  }

  if (req.query.search) {
    const escaped = req.query.search.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    filter.$or = [
      { name: { $regex: escaped, $options: 'i' } },
      { sku: { $regex: escaped, $options: 'i' } }
    ];
  }

  const [products, total] = await Promise.all([
    Product.find(filter)
      .sort({ updatedAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit)
      .lean(),
    Product.countDocuments(filter)
  ]);

  res.json({
    success: true,
    data: products,
    meta: {
      page,
      limit,
      total,
      pages: Math.max(Math.ceil(total / limit), 1)
    }
  });
});

const getProduct = asyncHandler(async (req, res) => {
  const product = await Product.findOne({ _id: req.params.id, owner: req.user._id }).lean();
  if (!product) {
    throw new AppError('No encontré ese producto.', 404);
  }

  res.json({ success: true, data: product });
});

const createProduct = asyncHandler(async (req, res) => {
  const product = await Product.create({ ...req.body, owner: req.user._id });
  res.status(201).json({
    success: true,
    message: 'El producto se agregó al inventario.',
    data: product
  });
});

const updateProduct = asyncHandler(async (req, res) => {
  const allowed = ['name', 'sku', 'description', 'category', 'price', 'stock', 'status'];
  const updates = Object.fromEntries(
    Object.entries(req.body).filter(([key]) => allowed.includes(key))
  );

  if (Object.keys(updates).length === 0) {
    throw new AppError('Envía al menos un campo para actualizar.', 422);
  }

  const product = await Product.findOneAndUpdate(
    { _id: req.params.id, owner: req.user._id },
    updates,
    { new: true, runValidators: true }
  );

  if (!product) {
    throw new AppError('No encontré ese producto.', 404);
  }

  res.json({
    success: true,
    message: 'El producto se actualizó correctamente.',
    data: product
  });
});

const deleteProduct = asyncHandler(async (req, res) => {
  const product = await Product.findOneAndDelete({
    _id: req.params.id,
    owner: req.user._id
  });

  if (!product) {
    throw new AppError('No encontré ese producto.', 404);
  }

  res.json({
    success: true,
    message: 'El producto se eliminó del inventario.'
  });
});

module.exports = {
  listProducts,
  getProduct,
  createProduct,
  updateProduct,
  deleteProduct
};
