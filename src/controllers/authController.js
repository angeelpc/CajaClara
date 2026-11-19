const jwt = require('jsonwebtoken');
const User = require('../models/User');
const AppError = require('../utils/AppError');
const asyncHandler = require('../utils/asyncHandler');

function createToken(userId) {
  return jwt.sign(
    { sub: userId.toString() },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRES_IN || '8h' }
  );
}

const register = asyncHandler(async (req, res) => {
  const { name, email, password } = req.body;
  const existingUser = await User.findOne({ email });

  if (existingUser) {
    throw new AppError('Ya existe una cuenta con ese correo.', 409);
  }

  const user = await User.create({ name, email, password });
  const token = createToken(user._id);

  res.status(201).json({
    success: true,
    message: 'La cuenta se creó correctamente.',
    data: {
      token,
      user: { id: user._id, name: user.name, email: user.email }
    }
  });
});

const login = asyncHandler(async (req, res) => {
  const { email, password } = req.body;
  const user = await User.findOne({ email }).select('+password');

  if (!user || !(await user.comparePassword(password))) {
    throw new AppError('El correo o la contraseña no coinciden.', 401);
  }

  const token = createToken(user._id);

  res.json({
    success: true,
    message: 'La sesión se inició correctamente.',
    data: {
      token,
      user: { id: user._id, name: user.name, email: user.email }
    }
  });
});

const profile = asyncHandler(async (req, res) => {
  res.json({
    success: true,
    data: {
      user: { id: req.user._id, name: req.user.name, email: req.user.email }
    }
  });
});

module.exports = { register, login, profile };
