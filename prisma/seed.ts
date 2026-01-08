import { PrismaClient } from '@prisma/client'
import { hash } from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
  console.log('🌱 Seeding database...')

  // Crear entrenador
  const trainer = await prisma.user.upsert({
    where: { email: 'trainer@diffit.com' },
    update: {},
    create: {
      email: 'trainer@diffit.com',
      name: 'Entrenador Demo',
      password: await hash('password123', 10),
      role: 'TRAINER',
    },
  })

  console.log('✅ Trainer created:', trainer.email)

  // Crear cliente de prueba
  const client = await prisma.user.upsert({
    where: { email: 'cliente@diffit.com' },
    update: {},
    create: {
      email: 'cliente@diffit.com',
      name: 'Cliente Demo',
      password: await hash('password123', 10),
      role: 'CLIENT',
      trainerId: trainer.id,
    },
  })

  console.log('✅ Client created:', client.email)

  // Crear plan de entrenamiento
  const trainingPlan = await prisma.trainingPlan.create({
    data: {
      title: 'Plan de Entrenamiento - Mes 1',
      description: 'Plan inicial de entrenamiento de fuerza',
      startDate: new Date('2024-01-01'),
      userId: client.id,
      isActive: true,
    },
  })

  console.log('✅ Training plan created')

  // Crear 4 semanas de entrenamiento
  for (let weekNum = 1; weekNum <= 4; weekNum++) {
    const weekStart = new Date(2024, 0, (weekNum - 1) * 7 + 1)
    const weekEnd = new Date(2024, 0, (weekNum - 1) * 7 + 7)

    const week = await prisma.trainingWeek.create({
      data: {
        weekNumber: weekNum,
        startDate: weekStart,
        endDate: weekEnd,
        trainingPlanId: trainingPlan.id,
      },
    })

    // Crear 5 sesiones por semana
    for (let dayNum = 1; dayNum <= 5; dayNum++) {
      const session = await prisma.trainingSession.create({
        data: {
          dayNumber: dayNum,
          name: `Día ${dayNum} - Semana ${weekNum}`,
          description: `Sesión de entrenamiento del día ${dayNum}`,
          weekId: week.id,
        },
      })

      // Crear 4-6 ejercicios por sesión
      const exercises = [
        { name: 'Sentadilla', description: 'Ejercicio de pierna principal' },
        { name: 'Press de Banca', description: 'Ejercicio de pecho' },
        { name: 'Peso Muerto', description: 'Ejercicio de espalda baja' },
        { name: 'Press Militar', description: 'Ejercicio de hombros' },
        { name: 'Dominadas', description: 'Ejercicio de espalda' },
      ]

      for (let i = 0; i < exercises.length; i++) {
        await prisma.exercise.create({
          data: {
            name: exercises[i].name,
            description: exercises[i].description,
            order: i + 1,
            sessionId: session.id,
          },
        })
      }
    }
  }

  console.log('✅ Training weeks and sessions created')

  // Crear plan nutricional
  await prisma.nutritionPlan.create({
    data: {
      title: 'Plan Nutricional - Enero 2024',
      description: 'Plan de alimentación personalizado',
      pdfUrl: '/uploads/plan-nutricional-ejemplo.pdf',
      startDate: new Date('2024-01-01'),
      userId: client.id,
      isActive: true,
    },
  })

  console.log('✅ Nutrition plan created')

  // Crear algunas entradas de peso
  const weights = [80.5, 80.2, 79.8, 79.5, 79.3, 79.0, 78.8]
  for (let i = 0; i < weights.length; i++) {
    await prisma.weightEntry.create({
      data: {
        weight: weights[i],
        date: new Date(2024, 0, (i + 1) * 4),
        userId: client.id,
      },
    })
  }

  console.log('✅ Weight entries created')

  console.log('✨ Seeding completed!')
  console.log('')
  console.log('📝 Login credentials:')
  console.log('   Trainer: trainer@diffit.com / password123')
  console.log('   Client: cliente@diffit.com / password123')
}

main()
  .catch((e) => {
    console.error('❌ Error seeding database:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
