const request = require('supertest');
const jwt = require('jsonwebtoken');

jest.mock('../src/models/User', () => ({
  findOne: jest.fn(),
  create: jest.fn(),
  findById: jest.fn()
}));

const User = require('../src/models/User');
const app = require('../src/app');

describe('Autenticación', () => {
  const userId = '507f1f77bcf86cd799439011';

  test('acepta el origen público asignado por Vercel', async () => {
    const previousClientOrigin = process.env.CLIENT_ORIGIN;
    const previousProductionUrl = process.env.VERCEL_PROJECT_PRODUCTION_URL;
    process.env.CLIENT_ORIGIN = 'https://otro-dominio.example';
    process.env.VERCEL_PROJECT_PRODUCTION_URL = 'caja-clara-chi.vercel.app';

    try {
      const response = await request(app)
        .options('/api/auth/register')
        .set('Origin', 'https://caja-clara-chi.vercel.app')
        .set('Access-Control-Request-Method', 'POST');

      expect(response.status).toBe(204);
      expect(response.headers['access-control-allow-origin'])
        .toBe('https://caja-clara-chi.vercel.app');
    } finally {
      if (previousClientOrigin === undefined) delete process.env.CLIENT_ORIGIN;
      else process.env.CLIENT_ORIGIN = previousClientOrigin;

      if (previousProductionUrl === undefined) delete process.env.VERCEL_PROJECT_PRODUCTION_URL;
      else process.env.VERCEL_PROJECT_PRODUCTION_URL = previousProductionUrl;
    }
  });

  test('rechaza un registro con datos inválidos', async () => {
    const response = await request(app)
      .post('/api/auth/register')
      .send({ name: 'A', email: 'correo-invalido', password: 'corta' });

    expect(response.status).toBe(422);
    expect(response.body.success).toBe(false);
    expect(response.body.errors.length).toBeGreaterThan(0);
    expect(User.create).not.toHaveBeenCalled();
  });

  test('registra un usuario y devuelve un JWT', async () => {
    User.findOne.mockResolvedValue(null);
    User.create.mockResolvedValue({
      _id: userId,
      name: 'Ana López',
      email: 'ana@cajaclara.mx'
    });

    const response = await request(app)
      .post('/api/auth/register')
      .send({
        name: 'Ana López',
        email: 'ana@cajaclara.mx',
        password: 'CajaSegura2026'
      });

    expect(response.status).toBe(201);
    expect(response.body.data.token).toBeTruthy();
    expect(response.body.data.user.email).toBe('ana@cajaclara.mx');
    expect(jwt.verify(response.body.data.token, process.env.JWT_SECRET).sub).toBe(userId);
  });

  test('impide registrar dos cuentas con el mismo correo', async () => {
    User.findOne.mockResolvedValue({ _id: userId });

    const response = await request(app)
      .post('/api/auth/register')
      .send({
        name: 'Ana López',
        email: 'ana@cajaclara.mx',
        password: 'CajaSegura2026'
      });

    expect(response.status).toBe(409);
    expect(response.body.message).toMatch(/ya existe/i);
  });

  test('inicia sesión con credenciales correctas', async () => {
    const comparePassword = jest.fn().mockResolvedValue(true);
    const select = jest.fn().mockResolvedValue({
      _id: userId,
      name: 'Ana López',
      email: 'ana@cajaclara.mx',
      comparePassword
    });
    User.findOne.mockReturnValue({ select });

    const response = await request(app)
      .post('/api/auth/login')
      .send({ email: 'ana@cajaclara.mx', password: 'CajaSegura2026' });

    expect(response.status).toBe(200);
    expect(response.body.data.token).toBeTruthy();
    expect(comparePassword).toHaveBeenCalledWith('CajaSegura2026');
  });

  test('rechaza credenciales incorrectas sin revelar cuál dato falló', async () => {
    User.findOne.mockReturnValue({ select: jest.fn().mockResolvedValue(null) });

    const response = await request(app)
      .post('/api/auth/login')
      .send({ email: 'ana@cajaclara.mx', password: 'Incorrecta2026' });

    expect(response.status).toBe(401);
    expect(response.body.message).toBe('El correo o la contraseña no coinciden.');
  });

  test('protege el perfil cuando no se envía un JWT', async () => {
    const response = await request(app).get('/api/auth/me');

    expect(response.status).toBe(401);
    expect(response.body.message).toMatch(/iniciar sesión/i);
  });

  test('permite consultar el perfil con un JWT válido', async () => {
    const token = jwt.sign({ sub: userId }, process.env.JWT_SECRET, { expiresIn: '1h' });
    User.findById.mockReturnValue({
      select: jest.fn().mockResolvedValue({
        _id: userId,
        name: 'Ana López',
        email: 'ana@cajaclara.mx'
      })
    });

    const response = await request(app)
      .get('/api/auth/me')
      .set('Authorization', `Bearer ${token}`);

    expect(response.status).toBe(200);
    expect(response.body.data.user.name).toBe('Ana López');
  });
});
