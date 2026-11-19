const jwt = require('jsonwebtoken');
const User = require('../models/User');
const AppError = require('../utils/AppError');
const asyncHandler = require('../utils/asyncHandler');

const protect = asyncHandler(async (req, _res, next) => {
  const authorization = req.get('authorization') || '';
  const [scheme, token] = authorization.split(' ');

  if (scheme !== 'Bearer' || !token) {
    throw new AppError('Debes iniciar sesión para continuar.', 401);
  }

  const secret = process.env.JWT_SECRET;
  if (!secret) {
    throw new AppError('La autenticación del servidor no está configurada.', 500);
  }

  let payload;
  try {
    payload = jwt.verify(token, secret);
  } catch (_error) {
    throw new AppError('La sesión es inválida o ya expiró.', 401);
  }

  const user = await User.findById(payload.sub).select('_id name email');
  if (!user) {
    throw new AppError('El usuario de esta sesión ya no existe.', 401);
  }

  req.user = user;
  next();
});

module.exports = { protect };
