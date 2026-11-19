function notFound(req, res) {
  res.status(404).json({
    success: false,
    message: `No existe la ruta ${req.method} ${req.originalUrl}.`
  });
}

module.exports = notFound;
