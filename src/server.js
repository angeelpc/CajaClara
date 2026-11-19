require('dotenv').config();

const app = require('./app');
const { connectDB, disconnectDB } = require('./config/database');

const port = Number.parseInt(process.env.PORT, 10) || 3000;
let server;

async function startServer() {
  try {
    await connectDB();
    server = app.listen(port, () => {
      console.log(`CajaClara está disponible en http://localhost:${port}`);
    });
  } catch (error) {
    console.error('No fue posible iniciar CajaClara:', error.message);
    process.exitCode = 1;
  }
}

async function shutdown(signal) {
  console.log(`${signal} recibido. Cerrando el servidor...`);

  if (server) {
    await new Promise((resolve) => server.close(resolve));
  }

  await disconnectDB();
  process.exit(0);
}

process.on('SIGINT', () => shutdown('SIGINT'));
process.on('SIGTERM', () => shutdown('SIGTERM'));

startServer();
