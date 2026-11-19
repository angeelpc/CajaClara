const app = require('../src/app');
const { connectDB } = require('../src/config/database');

module.exports = async (req, res) => {
  try {
    await connectDB();
    return app(req, res);
  } catch (error) {
    console.error('No fue posible iniciar la función:', error.message);
    return res.status(503).json({
      success: false,
      message: 'El servicio no pudo conectarse a la base de datos.'
    });
  }
};
