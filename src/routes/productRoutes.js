const express = require('express');
const {
  listProducts,
  getProduct,
  createProduct,
  updateProduct,
  deleteProduct
} = require('../controllers/productController');
const { protect } = require('../middleware/auth');
const validateRequest = require('../middleware/validate');
const {
  productIdRule,
  productRules,
  updateProductRules
} = require('../validators/productValidators');

const router = express.Router();

router.use(protect);
router.route('/')
  .get(listProducts)
  .post(productRules, validateRequest, createProduct);

router.route('/:id')
  .get(productIdRule, validateRequest, getProduct)
  .put(updateProductRules, validateRequest, updateProduct)
  .delete(productIdRule, validateRequest, deleteProduct);

module.exports = router;
