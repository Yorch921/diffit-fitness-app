import { PrismaClient } from '@prisma/client'
import { hash } from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
  console.log('🌱 Creando usuarios de prueba...')

  // 1. Marta - Nutricionista (TRAINER/ADMIN)
  const marta = await prisma.user.upsert({
    where: { email: 'marta@diffit.com' },
    update: {},
    create: {
      email: 'marta@diffit.com',
      name: 'Marta',
      password: await hash('marta123', 10),
      role: 'TRAINER',
      specialty: 'Nutricionista',
      phone: '+34 600 111 222',
    },
  })
  console.log('✅ Marta (Nutricionista) creada')

  // 2. Adri - Entrenador (TRAINER/ADMIN)
  const adri = await prisma.user.upsert({
    where: { email: 'adri@diffit.com' },
    update: {},
    create: {
      email: 'adri@diffit.com',
      name: 'Adri',
      password: await hash('adri123', 10),
      role: 'TRAINER',
      specialty: 'Entrenador Personal',
      phone: '+34 600 333 444',
    },
  })
  console.log('✅ Adri (Entrenador) creado')

  // 3. Jorge - Cliente (solo nutrición - asignado a Marta)
  const jorge = await prisma.user.upsert({
    where: { email: 'jorge@diffit.com' },
    update: {},
    create: {
      email: 'jorge@diffit.com',
      name: 'Jorge',
      password: await hash('jorge123', 10),
      role: 'CLIENT',
      trainerId: marta.id,
      age: 28,
      height: 175,
      initialWeight: 82.5,
      goal: 'Perder grasa y mejorar composición corporal',
    },
  })
  console.log('✅ Jorge (Cliente - Nutrición) creado')

  // Crear plan nutricional para Jorge
  await prisma.nutritionPlan.create({
    data: {
      title: 'Plan Nutricional - Jorge',
      description: 'Plan de déficit calórico controlado',
      pdfUrl: '/uploads/plan-jorge.pdf',
      startDate: new Date('2024-01-15'),
      userId: jorge.id,
      isActive: true,
      goal: 'FAT_LOSS',
      calories: 2000,
      protein: 150,
      carbs: 180,
      fats: 65,
    },
  })

  // Crear entradas de peso para Jorge
  const jorgeWeights = [82.5, 82.1, 81.8, 81.5, 81.2, 80.9]
  for (let i = 0; i < jorgeWeights.length; i++) {
    await prisma.weightEntry.create({
      data: {
        weight: jorgeWeights[i],
        date: new Date(2024, 0, 15 + i * 5),
        userId: jorge.id,
      },
    })
  }

  // 4. Miguel - Cliente (solo entrenamiento - asignado a Adri)
  const miguel = await prisma.user.upsert({
    where: { email: 'miguel@diffit.com' },
    update: {},
    create: {
      email: 'miguel@diffit.com',
      name: 'Miguel',
      password: await hash('miguel123', 10),
      role: 'CLIENT',
      trainerId: adri.id,
      age: 32,
      height: 180,
      initialWeight: 75.0,
      goal: 'Ganar masa muscular',
    },
  })
  console.log('✅ Miguel (Cliente - Entrenamiento) creado')

  // Crear plan de entrenamiento para Miguel
  const miguelPlan = await prisma.trainingPlan.create({
    data: {
      title: 'Plan de Hipertrofia - Miguel',
      description: 'Plan de 4 semanas enfocado en ganancia muscular',
      startDate: new Date('2024-01-08'),
      userId: miguel.id,
      isActive: true,
    },
  })

  // Crear 4 semanas de entrenamiento para Miguel
  for (let weekNum = 1; weekNum <= 4; weekNum++) {
    const weekStart = new Date(2024, 0, 8 + (weekNum - 1) * 7)
    const weekEnd = new Date(2024, 0, 14 + (weekNum - 1) * 7)

    const week = await prisma.trainingWeek.create({
      data: {
        weekNumber: weekNum,
        startDate: weekStart,
        endDate: weekEnd,
        trainingPlanId: miguelPlan.id,
      },
    })

    // 5 sesiones por semana
    const sessionNames = [
      'Pecho y Tríceps',
      'Espalda y Bíceps',
      'Pierna Completa',
      'Hombros y Abdomen',
      'Fullbody'
    ]

    for (let dayNum = 1; dayNum <= 5; dayNum++) {
      await prisma.trainingSession.create({
        data: {
          dayNumber: dayNum,
          name: sessionNames[dayNum - 1],
          description: `Sesión de ${sessionNames[dayNum - 1]} - Semana ${weekNum}`,
          weekId: week.id,
        },
      })
    }
  }

  // 5. Rafa - Cliente (nutrición + entrenamiento - asignado a Marta)
  const rafa = await prisma.user.upsert({
    where: { email: 'rafa@diffit.com' },
    update: {},
    create: {
      email: 'rafa@diffit.com',
      name: 'Rafa',
      password: await hash('rafa123', 10),
      role: 'CLIENT',
      trainerId: marta.id,
      age: 35,
      height: 178,
      initialWeight: 88.0,
      goal: 'Recomposición corporal - perder grasa y ganar músculo',
    },
  })
  console.log('✅ Rafa (Cliente - Nutrición + Entrenamiento) creado')

  // Crear plan nutricional para Rafa
  await prisma.nutritionPlan.create({
    data: {
      title: 'Plan Nutricional - Rafa',
      description: 'Plan de recomposición corporal',
      pdfUrl: '/uploads/plan-rafa.pdf',
      startDate: new Date('2024-01-10'),
      userId: rafa.id,
      isActive: true,
      goal: 'MUSCLE_GAIN',
      calories: 2400,
      protein: 180,
      carbs: 220,
      fats: 75,
    },
  })

  // Crear plan de entrenamiento para Rafa
  const rafaPlan = await prisma.trainingPlan.create({
    data: {
      title: 'Plan de Fuerza y Definición - Rafa',
      description: 'Plan combinado de fuerza e hipertrofia',
      startDate: new Date('2024-01-10'),
      userId: rafa.id,
      isActive: true,
    },
  })

  // Crear 4 semanas de entrenamiento para Rafa
  for (let weekNum = 1; weekNum <= 4; weekNum++) {
    const weekStart = new Date(2024, 0, 10 + (weekNum - 1) * 7)
    const weekEnd = new Date(2024, 0, 16 + (weekNum - 1) * 7)

    const week = await prisma.trainingWeek.create({
      data: {
        weekNumber: weekNum,
        startDate: weekStart,
        endDate: weekEnd,
        trainingPlanId: rafaPlan.id,
      },
    })

    const sessionNames = [
      'Torso Superior',
      'Pierna y Core',
      'Empuje',
      'Tracción',
      'Fullbody Metabólico'
    ]

    for (let dayNum = 1; dayNum <= 5; dayNum++) {
      await prisma.trainingSession.create({
        data: {
          dayNumber: dayNum,
          name: sessionNames[dayNum - 1],
          description: `Sesión de ${sessionNames[dayNum - 1]} - Semana ${weekNum}`,
          weekId: week.id,
        },
      })
    }
  }

  // Crear entradas de peso para Rafa
  const rafaWeights = [88.0, 87.6, 87.3, 87.1, 86.8, 86.5, 86.2]
  for (let i = 0; i < rafaWeights.length; i++) {
    await prisma.weightEntry.create({
      data: {
        weight: rafaWeights[i],
        date: new Date(2024, 0, 10 + i * 4),
        userId: rafa.id,
      },
    })
  }

  // Crear algunas notificaciones de ejemplo
  await prisma.notification.create({
    data: {
      userId: jorge.id,
      title: 'Bienvenido a Diffit',
      message: 'Hola Jorge, bienvenido a tu plan nutricional. Recuerda seguir las pautas y registrar tu peso semanalmente.',
      type: 'message',
      sentAt: new Date(),
      read: false,
    },
  })

  await prisma.notification.create({
    data: {
      userId: rafa.id,
      title: 'Plan actualizado',
      message: 'Hola Rafa, he actualizado tu plan nutricional con algunos ajustes en los carbohidratos. Revisa el nuevo PDF.',
      type: 'message',
      sentAt: new Date(),
      read: false,
    },
  })

  console.log('✅ Planes y datos de ejemplo creados')
  console.log('')
  console.log('✨ Usuarios creados exitosamente!')
  console.log('')
  console.log('📝 CREDENCIALES DE ACCESO:')
  console.log('═══════════════════════════════════════════════════════')
  console.log('')
  console.log('👩‍⚕️ ADMINISTRADORES (TRAINERS):')
  console.log('───────────────────────────────────────────────────────')
  console.log('   Marta (Nutricionista)')
  console.log('   Email: marta@diffit.com')
  console.log('   Password: marta123')
  console.log('')
  console.log('   Adri (Entrenador Personal)')
  console.log('   Email: adri@diffit.com')
  console.log('   Password: adri123')
  console.log('')
  console.log('👤 CLIENTES:')
  console.log('───────────────────────────────────────────────────────')
  console.log('   Jorge (Solo Nutrición - Cliente de Marta)')
  console.log('   Email: jorge@diffit.com')
  console.log('   Password: jorge123')
  console.log('')
  console.log('   Miguel (Solo Entrenamiento - Cliente de Adri)')
  console.log('   Email: miguel@diffit.com')
  console.log('   Password: miguel123')
  console.log('')
  console.log('   Rafa (Nutrición + Entrenamiento - Cliente de Marta)')
  console.log('   Email: rafa@diffit.com')
  console.log('   Password: rafa123')
  console.log('')
  console.log('═══════════════════════════════════════════════════════')
}

main()
  .catch((e) => {
    console.error('❌ Error creando usuarios:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
