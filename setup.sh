#!/bin/bash

echo "🚀 Configurando Diffit..."
echo ""

# Verificar si existe .env
if [ ! -f .env ]; then
    echo "📝 Creando archivo .env..."
    cp .env.example .env
    echo "⚠️  IMPORTANTE: Edita el archivo .env con tus credenciales de PostgreSQL"
    echo ""
fi

# Instalar dependencias
echo "📦 Instalando dependencias..."
npm install
echo ""

# Generar Prisma Client
echo "🔧 Generando cliente de Prisma..."
npm run db:generate
echo ""

# Ejecutar migraciones
echo "🗄️  Ejecutando migraciones..."
npm run db:migrate
echo ""

# Ejecutar seed
echo "🌱 Poblando base de datos con datos de prueba..."
npm run db:seed
echo ""

echo "✅ ¡Configuración completada!"
echo ""
echo "🔑 Credenciales de prueba:"
echo "   Entrenador: trainer@diffit.com / password123"
echo "   Cliente: cliente@diffit.com / password123"
echo ""
echo "🚀 Para iniciar la aplicación ejecuta:"
echo "   npm run dev"
echo ""
echo "📱 La aplicación estará disponible en: http://localhost:3000"
