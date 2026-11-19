function errorHandler(error, _req, res, _next) {
  let statusCode = error.statusCode || 500;
  let message = error.message || 'Ocurrió un error interno.';
  let details = error.details;

  if (error.code === 11000) {
    statusCode = 409;
    const field = Object.keys(error.keyPattern || error.keyValue || {})[0] || 'registro';
    message = field === 'sku'
      ? 'Ya existe un producto con ese SKU.'
      : 'Ya existe un registro con esos datos.';
  }

  if (error.name === 'CastError') {
    statusCode = 400;
    message = 'El identificador enviado no es válido.';
  }

  if (error.name === 'ValidationError') {
    statusCode = 422;
    message = 'No fue posible guardar los datos.';
    details = Object.values(error.errors).map((item) => item.message);
  }

  if (statusCode >= 500) {
    console.error(error);
  }

  res.status(statusCode).json({
    success: false,
    message,
    ...(details ? { details } : {})
  });
}

module.exports = errorHandler;
