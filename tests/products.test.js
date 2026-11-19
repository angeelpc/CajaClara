const request = require('supertest');
const jwt = require('jsonwebtoken');

jest.mock('../src/models/User', () => ({
  findById: jest.fn()
}));

jest.mock('../src/models/Product', () => ({
  Product: {
    find: jest.fn(),
    countDocuments: jest.fn(),
    findOne: jest.fn(),
    create: jest.fn(),
    findOneAndUpdate: jest.fn(),
    findOneAndDelete: jest.fn()
  },
  PRODUCT_CATEGORIES: [
    'Cajas y empaques',
    'Alimentos',
    'Bebidas',
    'Cuidado personal',
    'Decoración',
    'Papelería',
    'Otro'
  ]
}));

const User = require('../src/models/User');
const { Product } = require('../src/models/Product');
const app = require('../src/app');

describe('CRUD de productos protegido', () => {
  const userId = '507f1f77bcf86cd799439011';
  const productId = '507f191e810c19729de860ea';
  const token = jwt.sign({ sub: userId }, process.env.JWT_SECRET, { expiresIn: '1h' });
  const auth = { Authorization: `Bearer ${token}` };
  const product = {
    _id: productId,
    owner: userId,
    name: 'Vela aromática',
    sku: 'VELA-001',
    category: 'Decoración',
    price: 129.9,
    stock: 8,
    status: 'active',
    description: 'Vela de vainilla'
  };

  beforeEach(() => {
    User.findById.mockReturnValue({
      select: jest.fn().mockResolvedValue({
        _id: userId,
        name: 'Ana López',
        email: 'ana@cajaclara.mx'
      })
    });
  });

  test('rechaza el listado sin autenticación', async () => {
    const response = await request(app).get('/api/products');

    expect(response.status).toBe(401);
    expect(Product.find).not.toHaveBeenCalled();
  });

  test('lista únicamente los productos del usuario autenticado', async () => {
    const query = {
      sort: jest.fn().mockReturnThis(),
      skip: jest.fn().mockReturnThis(),
      limit: jest.fn().mockReturnThis(),
      lean: jest.fn().mockResolvedValue([product])
    };
    Product.find.mockReturnValue(query);
    Product.countDocuments.mockResolvedValue(1);

    const response = await request(app).get('/api/products').set(auth);

    expect(response.status).toBe(200);
    expect(response.body.data).toHaveLength(1);
    expect(Product.find).toHaveBeenCalledWith({ owner: userId });
    expect(response.body.meta.total).toBe(1);
  });

  test('crea un producto válido y asigna el propietario', async () => {
    Product.create.mockResolvedValue(product);

    const response = await request(app)
      .post('/api/products')
      .set(auth)
      .send({
        name: product.name,
        sku: product.sku,
        category: product.category,
        price: product.price,
        stock: product.stock,
        description: product.description
      });

    expect(response.status).toBe(201);
    expect(Product.create).toHaveBeenCalledWith(expect.objectContaining({
      owner: userId,
      sku: product.sku
    }));
  });

  test('rechaza un producto con precio o existencia negativos', async () => {
    const response = await request(app)
      .post('/api/products')
      .set(auth)
      .send({
        name: 'Producto inválido',
        sku: 'INVALIDO-1',
        category: 'Otro',
        price: -1,
        stock: -4
      });

    expect(response.status).toBe(422);
    expect(Product.create).not.toHaveBeenCalled();
  });

  test('consulta un producto por id dentro de la cuenta', async () => {
    Product.findOne.mockReturnValue({ lean: jest.fn().mockResolvedValue(product) });

    const response = await request(app)
      .get(`/api/products/${productId}`)
      .set(auth);

    expect(response.status).toBe(200);
    expect(response.body.data.sku).toBe('VELA-001');
    expect(Product.findOne).toHaveBeenCalledWith({ _id: productId, owner: userId });
  });

  test('actualiza un producto sin permitir cambiar el propietario', async () => {
    Product.findOneAndUpdate.mockResolvedValue({ ...product, stock: 4 });

    const response = await request(app)
      .put(`/api/products/${productId}`)
      .set(auth)
      .send({ stock: 4, owner: '507f1f77bcf86cd799439099' });

    expect(response.status).toBe(200);
    expect(Product.findOneAndUpdate).toHaveBeenCalledWith(
      { _id: productId, owner: userId },
      { stock: 4 },
      { new: true, runValidators: true }
    );
  });

  test('devuelve 404 cuando el producto no pertenece a la cuenta', async () => {
    Product.findOneAndUpdate.mockResolvedValue(null);

    const response = await request(app)
      .put(`/api/products/${productId}`)
      .set(auth)
      .send({ stock: 4 });

    expect(response.status).toBe(404);
  });

  test('elimina un producto de la cuenta', async () => {
    Product.findOneAndDelete.mockResolvedValue(product);

    const response = await request(app)
      .delete(`/api/products/${productId}`)
      .set(auth);

    expect(response.status).toBe(200);
    expect(response.body.message).toMatch(/eliminó/i);
    expect(Product.findOneAndDelete).toHaveBeenCalledWith({
      _id: productId,
      owner: userId
    });
  });

  test('rechaza identificadores con formato incorrecto', async () => {
    const response = await request(app)
      .get('/api/products/id-invalido')
      .set(auth);

    expect(response.status).toBe(422);
    expect(Product.findOne).not.toHaveBeenCalled();
  });
});
