# CajaClara

CajaClara es la aplicación web que desarrollé para la Actividad 4. La enfoqué en pequeños negocios que preparan cajas de regalo personalizadas, porque un inventario con productos, SKU, categorías, precios y existencias puede convertirse en una herramienta útil para un cliente real.

La aplicación permite registrar usuarios, iniciar y cerrar sesión, y administrar productos mediante las operaciones de crear, consultar, actualizar y eliminar. Cada cuenta sólo puede acceder a sus propios productos. Protegí las rutas privadas con JSON Web Tokens y guardé las contraseñas con un hash de bcrypt.

## Funciones incluidas

- Registro e inicio de sesión con validación de datos.
- Contraseñas protegidas con bcrypt y factor de costo 12.
- Tokens JWT con tiempo de expiración configurable.
- CRUD completo de productos.
- Separación del inventario por usuario.
- Búsqueda por nombre o SKU y filtro por categoría.
- Validación en el frontend, las rutas y los modelos de MongoDB.
- Manejo centralizado de errores y códigos HTTP.
- Límite de intentos en las rutas de autenticación.
- Interfaz adaptable a computadora, tableta y teléfono.
- Pruebas unitarias con Jest y Supertest.
- Pipeline de CI/CD con GitHub Actions y despliegue en Vercel.

## Tecnologías

- Node.js 22.13 o posterior
- Express.js
- MongoDB Atlas y Mongoose
- JSON Web Token
- bcryptjs
- express-validator
- Jest y Supertest
- GitHub Actions
- Vercel

## Estructura del proyecto

```text
CajaClara/
├── .github/workflows/ci-cd.yml
├── api/index.js
├── docs/
├── public/
│   ├── app.js
│   ├── index.html
│   └── styles.css
├── src/
│   ├── config/
│   ├── controllers/
│   ├── middleware/
│   ├── models/
│   ├── routes/
│   ├── utils/
│   ├── validators/
│   ├── app.js
│   └── server.js
├── tests/
├── .env.example
├── package.json
└── vercel.json
```

## Ejecución local

1. Clono el repositorio y entro a la carpeta del proyecto.

   ```bash
   git clone URL_DEL_REPOSITORIO
   cd CajaClara
   ```

2. Instalo las dependencias.

   ```bash
   pnpm install
   ```

3. Copio `.env.example` como `.env` y reemplazo los valores de ejemplo.

   ```bash
   cp .env.example .env
   ```

4. Inicio la aplicación.

   ```bash
   pnpm start
   ```

5. Abro `http://localhost:3000` en el navegador.

## Variables de entorno

| Variable | Uso |
| --- | --- |
| `PORT` | Puerto del servidor local. |
| `NODE_ENV` | Entorno de ejecución. En producción uso `production`. |
| `MONGODB_URI` | Cadena privada de conexión a MongoDB Atlas. |
| `JWT_SECRET` | Clave larga y aleatoria para firmar los JWT. |
| `JWT_EXPIRES_IN` | Duración de la sesión, por ejemplo `8h`. |
| `CLIENT_ORIGIN` | Origen permitido por CORS. Acepta varios valores separados por coma. |

No guardo `.env` en Git. El archivo incluido es sólo una guía y no contiene credenciales reales.

## Endpoints de la API

### Autenticación

| Método | Ruta | Acceso | Función |
| --- | --- | --- | --- |
| `POST` | `/api/auth/register` | Público | Registra un usuario. |
| `POST` | `/api/auth/login` | Público | Inicia sesión y entrega un JWT. |
| `GET` | `/api/auth/me` | JWT | Consulta el perfil de la sesión. |

### Productos

| Método | Ruta | Acceso | Función |
| --- | --- | --- | --- |
| `GET` | `/api/products` | JWT | Lista los productos del usuario. |
| `POST` | `/api/products` | JWT | Agrega un producto. |
| `GET` | `/api/products/:id` | JWT | Consulta un producto propio. |
| `PUT` | `/api/products/:id` | JWT | Modifica un producto propio. |
| `DELETE` | `/api/products/:id` | JWT | Elimina un producto propio. |
| `GET` | `/api/health` | Público | Informa el estado del servicio y la conexión. |

Para las rutas privadas envío el token en este encabezado:

```http
Authorization: Bearer TOKEN_JWT
```

## Pruebas

Ejecuto las pruebas unitarias con:

```bash
pnpm test
```

Para generar el reporte de cobertura uso:

```bash
pnpm test:coverage
```

Las pruebas no necesitan una base de datos real. Uso mocks para revisar la autenticación, las validaciones, la separación de datos por usuario y las operaciones CRUD sin exponer credenciales de MongoDB Atlas.

## Configuración de MongoDB Atlas

1. Creo un clúster en MongoDB Atlas.
2. Creo un usuario de base de datos con una contraseña segura.
3. Autorizo la IP del entorno que ejecutará la aplicación. Para una práctica en Vercel puedo usar `0.0.0.0/0`, pero mantengo un usuario con permisos limitados y una contraseña exclusiva.
4. Copio la cadena de conexión y la guardo como `MONGODB_URI` en el archivo `.env` local y en las variables protegidas de Vercel.
5. Inicio el servidor y consulto `/api/health` para comprobar la conexión.

## Despliegue en Vercel

Elegí Vercel porque se integra con GitHub, admite funciones de Node.js, administra variables de entorno y permite publicar una versión nueva después de que las pruebas terminan. Su plan inicial también es suficiente para demostrar esta actividad sin mantener un servidor propio.

Para desplegar:

1. Creo un proyecto en Vercel a partir del repositorio.
2. Configuro `MONGODB_URI`, `JWT_SECRET`, `JWT_EXPIRES_IN`, `NODE_ENV=production` y `CLIENT_ORIGIN` en Production.
3. Realizo el primer despliegue y pruebo `/api/health`.
4. Copio `VERCEL_ORG_ID` y `VERCEL_PROJECT_ID` desde `.vercel/project.json` después de vincular el proyecto.
5. Creo los secretos `VERCEL_TOKEN`, `VERCEL_ORG_ID` y `VERCEL_PROJECT_ID` en GitHub Actions.

## Pipeline de CI/CD

El flujo `.github/workflows/ci-cd.yml` se ejecuta en cada pull request y cada envío a `main`.

1. Descarga el código.
2. Configura Node.js y pnpm.
3. Instala las dependencias desde el archivo de bloqueo.
4. Ejecuta Jest con cobertura.
5. Si las pruebas pasan y el evento es un push a `main`, construye y publica la versión de producción en Vercel.

Las credenciales de Vercel se guardan como secretos del repositorio y no aparecen en el código ni en los registros de Git.

## Enlaces de entrega

- Repositorio de GitHub: https://github.com/angeelpc/CajaClara
- Aplicación desplegada: https://caja-clara-chi.vercel.app/

## Documentación académica

El documento Word de la carpeta `docs` incluye los requerimientos funcionales y no funcionales, el diagrama entidad-relación, la explicación de la arquitectura, las pruebas y la justificación de Vercel.
