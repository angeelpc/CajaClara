const mongoose = require('mongoose');

const PRODUCT_CATEGORIES = [
  'Cajas y empaques',
  'Alimentos',
  'Bebidas',
  'Cuidado personal',
  'Decoración',
  'Papelería',
  'Otro'
];

const productSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'El nombre del producto es obligatorio.'],
      trim: true,
      minlength: 2,
      maxlength: 100
    },
    sku: {
      type: String,
      required: [true, 'El SKU es obligatorio.'],
      trim: true,
      uppercase: true,
      maxlength: 32
    },
    description: {
      type: String,
      trim: true,
      maxlength: 500,
      default: ''
    },
    category: {
      type: String,
      enum: PRODUCT_CATEGORIES,
      required: [true, 'La categoría es obligatoria.']
    },
    price: {
      type: Number,
      required: [true, 'El precio es obligatorio.'],
      min: [0, 'El precio no puede ser negativo.']
    },
    stock: {
      type: Number,
      required: [true, 'La existencia es obligatoria.'],
      min: [0, 'La existencia no puede ser negativa.'],
      validate: {
        validator: Number.isInteger,
        message: 'La existencia debe ser un número entero.'
      }
    },
    status: {
      type: String,
      enum: ['active', 'archived'],
      default: 'active'
    },
    owner: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true
    }
  },
  { timestamps: true }
);

productSchema.index({ owner: 1, sku: 1 }, { unique: true });
productSchema.index({ owner: 1, name: 'text', description: 'text' });

module.exports = {
  Product: mongoose.model('Product', productSchema),
  PRODUCT_CATEGORIES
};
