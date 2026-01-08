# Guía Rápida de Instalación - Diffit

## 1️⃣ Verificar Requisitos

```bash
# Verificar Node.js (debe ser 18+)
node --version

# Verificar PostgreSQL
psql --version
```

## 2️⃣ Instalar Dependencias

```bash
npm install
```

## 3️⃣ Configurar Base de Datos

### Crear base de datos PostgreSQL:
```bash
# Conectar a PostgreSQL
psql -U postgres

# Crear base de datos
CREATE DATABASE diffit;

# Salir
\q
```

### Configurar variables de entorno:
```bash
# Copiar archivo de ejemplo
cp .env.example .env
```

Edita el archivo `.env` con tus credenciales:
```env
DATABASE_URL="postgresql://postgres:tu_password@localhost:5432/diffit"
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="cambia-esto-por-algo-seguro-y-aleatorio"
NODE_ENV="development"
```

## 4️⃣ Configurar Prisma y Base de Datos

```bash
# Generar cliente de Prisma
npm run db:generate

# Ejecutar migraciones (crear tablas)
npm run db:migrate

# Poblar base de datos con datos de prueba
npm run db:seed
```

## 5️⃣ Iniciar Aplicación

```bash
npm run dev
```

La aplicación estará disponible en: http://localhost:3000

## 🔑 Credenciales de Prueba

Después de ejecutar el seed (`npm run db:seed`), puedes usar:

### Entrenador:
- **Email:** trainer@diffit.com
- **Contraseña:** password123

### Cliente:
- **Email:** cliente@diffit.com
- **Contraseña:** password123

## ⚠️ Solución de Problemas

### Error: "Credenciales inválidas"
➡️ Asegúrate de haber ejecutado `npm run db:seed`

### Error: "Can't reach database server"
➡️ Verifica que PostgreSQL esté corriendo y las credenciales en `.env` sean correctas

### Error al ejecutar migraciones
➡️ Prueba resetear la base de datos:
```bash
npm run db:generate
npx prisma migrate reset
npm run db:seed
```

### Si necesitas crear un usuario manualmente
Puedes usar Prisma Studio:
```bash
npm run db:studio
```
Esto abrirá una interfaz gráfica en http://localhost:5555 donde puedes crear usuarios manualmente.

## 📝 Notas Importantes

- La contraseña debe tener mínimo 8 caracteres
- El seed crea datos de ejemplo para probar la aplicación
- Los planes de entrenamiento de ejemplo están configurados para 2024
