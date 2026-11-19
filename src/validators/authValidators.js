const { body } = require('express-validator');

const registerRules = [
  body('name')
    .trim()
    .isLength({ min: 2, max: 80 })
    .withMessage('El nombre debe tener entre 2 y 80 caracteres.'),
  body('email')
    .trim()
    .isEmail()
    .withMessage('Escribe un correo electrónico válido.')
    .normalizeEmail(),
  body('password')
    .isString()
    .isLength({ min: 8, max: 72 })
    .withMessage('La contraseña debe tener entre 8 y 72 caracteres.')
    .matches(/[A-Za-z]/)
    .withMessage('La contraseña debe incluir al menos una letra.')
    .matches(/\d/)
    .withMessage('La contraseña debe incluir al menos un número.')
];

const loginRules = [
  body('email')
    .trim()
    .isEmail()
    .withMessage('Escribe un correo electrónico válido.')
    .normalizeEmail(),
  body('password')
    .isString()
    .notEmpty()
    .withMessage('La contraseña es obligatoria.')
];

module.exports = { registerRules, loginRules };
