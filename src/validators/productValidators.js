const { body, param } = require('express-validator');
const { PRODUCT_CATEGORIES } = require('../models/Product');

const productIdRule = [
  param('id').isMongoId().withMessage('El identificador del producto no es válido.')
];

const productRules = [
  body('name')
    .trim()
    .isLength({ min: 2, max: 100 })
    .withMessage('El nombre debe tener entre 2 y 100 caracteres.'),
  body('sku')
    .trim()
    .matches(/^[A-Za-z0-9][A-Za-z0-9_-]{1,31}$/)
    .withMessage('El SKU debe tener entre 2 y 32 caracteres y sólo usar letras, números, guion o guion bajo.')
    .toUpperCase(),
  body('description')
    .optional({ checkFalsy: true })
    .trim()
    .isLength({ max: 500 })
    .withMessage('La descripción no puede superar 500 caracteres.'),
  body('category')
    .isIn(PRODUCT_CATEGORIES)
    .withMessage('Selecciona una categoría válida.'),
  body('price')
    .isFloat({ min: 0, max: 1000000 })
    .withMessage('El precio debe estar entre 0 y 1,000,000.')
    .toFloat(),
  body('stock')
    .isInt({ min: 0, max: 1000000 })
    .withMessage('La existencia debe ser un entero entre 0 y 1,000,000.')
    .toInt(),
  body('status')
    .optional()
    .isIn(['active', 'archived'])
    .withMessage('El estado debe ser active o archived.')
];

const updateProductRules = [
  ...productIdRule,
  ...productRules.map((rule) => rule.optional())
];

module.exports = { productIdRule, productRules, updateProductRules };
