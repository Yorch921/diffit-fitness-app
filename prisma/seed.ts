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

  // ============================================================================
  // NUEVO SISTEMA: TEMPLATES Y MESOCICLOS
  // ============================================================================

  // Crear template de entrenamiento (semana tipo)
  const template = await prisma.trainingTemplate.create({
    data: {
      title: 'Fuerza General - 5 Días',
      description: 'Plan de entrenamiento de fuerza para desarrollo muscular general',
      numberOfDays: 5,
      trainerId: trainer.id,
      trainerNotes: 'Enfoque en compuestos básicos con progresión lineal',
    },
  })

  console.log('✅ Training template created')

  // Definir estructura de días
  const daysStructure = [
    {
      dayNumber: 1,
      name: 'Día 1 - Pecho y Tríceps',
      description: 'Enfoque en press horizontal y extensiones de tríceps',
      exercises: [
        { name: 'Press de Banca Plano', description: 'Press con barra, agarre medio', sets: [{ setNumber: 1, minReps: 6, maxReps: 8, restSeconds: 180 }, { setNumber: 2, minReps: 6, maxReps: 8, restSeconds: 180 }, { setNumber: 3, minReps: 6, maxReps: 8, restSeconds: 180 }] },
        { name: 'Press Inclinado con Mancuernas', description: 'Ángulo 30-45 grados', sets: [{ setNumber: 1, minReps: 8, maxReps: 10, restSeconds: 120 }, { setNumber: 2, minReps: 8, maxReps: 10, restSeconds: 120 }, { setNumber: 3, minReps: 8, maxReps: 10, restSeconds: 120 }] },
        { name: 'Fondos en Paralelas', description: 'Inclinación hacia adelante para pecho', sets: [{ setNumber: 1, minReps: 10, maxReps: 12, restSeconds: 90 }, { setNumber: 2, minReps: 10, maxReps: 12, restSeconds: 90 }] },
        { name: 'Press Francés con Barra Z', description: 'Codos fijos, énfasis en cabeza larga', sets: [{ setNumber: 1, minReps: 10, maxReps: 12, restSeconds: 90 }, { setNumber: 2, minReps: 10, maxReps: 12, restSeconds: 90 }, { setNumber: 3, minReps: 10, maxReps: 12, restSeconds: 90 }] },
      ],
    },
    {
      dayNumber: 2,
      name: 'Día 2 - Espalda y Bíceps',
      description: 'Jalones verticales y horizontales',
      exercises: [
        { name: 'Dominadas', description: 'Agarre pronado, ancho de hombros', sets: [{ setNumber: 1, minReps: 6, maxReps: 8, restSeconds: 180 }, { setNumber: 2, minReps: 6, maxReps: 8, restSeconds: 180 }, { setNumber: 3, minReps: 6, maxReps: 8, restSeconds: 180 }] },
        { name: 'Remo con Barra', description: 'Tronco paralelo al suelo, jalón hacia abdomen', sets: [{ setNumber: 1, minReps: 8, maxReps: 10, restSeconds: 120 }, { setNumber: 2, minReps: 8, maxReps: 10, restSeconds: 120 }, { setNumber: 3, minReps: 8, maxReps: 10, restSeconds: 120 }] },
        { name: 'Jalón al Pecho con Polea', description: 'Agarre amplio, jalón hacia clavículas', sets: [{ setNumber: 1, minReps: 10, maxReps: 12, restSeconds: 90 }, { setNumber: 2, minReps: 10, maxReps: 12, restSeconds: 90 }] },
        { name: 'Curl con Barra Z', description: 'Codos pegados al cuerpo', sets: [{ setNumber: 1, minReps: 10, maxReps: 12, restSeconds: 90 }, { setNumber: 2, minReps: 10, maxReps: 12, restSeconds: 90 }, { setNumber: 3, minReps: 10, maxReps: 12, restSeconds: 90 }] },
      ],
    },
    {
      dayNumber: 3,
      name: 'Día 3 - Pierna Completa',
      description: 'Cuádriceps, femoral y glúteo',
      exercises: [
        { name: 'Sentadilla con Barra', description: 'Profundidad completa, ATG si es posible', sets: [{ setNumber: 1, minReps: 6, maxReps: 8, restSeconds: 240 }, { setNumber: 2, minReps: 6, maxReps: 8, restSeconds: 240 }, { setNumber: 3, minReps: 6, maxReps: 8, restSeconds: 240 }] },
        { name: 'Peso Muerto Rumano', description: 'Énfasis en femoral, ligera flexión de rodilla', sets: [{ setNumber: 1, minReps: 8, maxReps: 10, restSeconds: 180 }, { setNumber: 2, minReps: 8, maxReps: 10, restSeconds: 180 }, { setNumber: 3, minReps: 8, maxReps: 10, restSeconds: 180 }] },
        { name: 'Prensa de Pierna', description: 'Pies ancho de hombros, empuje con talones', sets: [{ setNumber: 1, minReps: 10, maxReps: 12, restSeconds: 120 }, { setNumber: 2, minReps: 10, maxReps: 12, restSeconds: 120 }] },
        { name: 'Curl Femoral Acostado', description: 'Contracción completa, evitar impulso', sets: [{ setNumber: 1, minReps: 12, maxReps: 15, restSeconds: 90 }, { setNumber: 2, minReps: 12, maxReps: 15, restSeconds: 90 }, { setNumber: 3, minReps: 12, maxReps: 15, restSeconds: 90 }] },
      ],
    },
    {
      dayNumber: 4,
      name: 'Día 4 - Hombros y Core',
      description: 'Deltoides anterior, lateral y posterior',
      exercises: [
        { name: 'Press Militar con Barra', description: 'De pie, agarre medio, barra por delante', sets: [{ setNumber: 1, minReps: 6, maxReps: 8, restSeconds: 180 }, { setNumber: 2, minReps: 6, maxReps: 8, restSeconds: 180 }, { setNumber: 3, minReps: 6, maxReps: 8, restSeconds: 180 }] },
        { name: 'Elevaciones Laterales con Mancuernas', description: 'Ligera inclinación hacia adelante, codos ligeramente flexionados', sets: [{ setNumber: 1, minReps: 12, maxReps: 15, restSeconds: 90 }, { setNumber: 2, minReps: 12, maxReps: 15, restSeconds: 90 }, { setNumber: 3, minReps: 12, maxReps: 15, restSeconds: 90 }] },
        { name: 'Face Pulls con Polea', description: 'Jalón hacia frente a nivel de nariz', sets: [{ setNumber: 1, minReps: 15, maxReps: 20, restSeconds: 60 }, { setNumber: 2, minReps: 15, maxReps: 20, restSeconds: 60 }] },
        { name: 'Plancha Abdominal', description: 'Mantener espalda neutral, no arquear', sets: [{ setNumber: 1, minReps: 30, maxReps: 60, restSeconds: 90 }, { setNumber: 2, minReps: 30, maxReps: 60, restSeconds: 90 }] },
      ],
    },
    {
      dayNumber: 5,
      name: 'Día 5 - Full Body',
      description: 'Trabajo de todo el cuerpo con énfasis en fuerza',
      exercises: [
        { name: 'Peso Muerto Convencional', description: 'Agarre doble pronado o mixto, espalda recta', sets: [{ setNumber: 1, minReps: 5, maxReps: 6, restSeconds: 240 }, { setNumber: 2, minReps: 5, maxReps: 6, restSeconds: 240 }, { setNumber: 3, minReps: 5, maxReps: 6, restSeconds: 240 }] },
        { name: 'Press de Banca Inclinado', description: 'Ángulo 45 grados', sets: [{ setNumber: 1, minReps: 8, maxReps: 10, restSeconds: 120 }, { setNumber: 2, minReps: 8, maxReps: 10, restSeconds: 120 }] },
        { name: 'Remo con Mancuernas', description: 'Apoyo unilateral, jalón hacia cadera', sets: [{ setNumber: 1, minReps: 10, maxReps: 12, restSeconds: 90 }, { setNumber: 2, minReps: 10, maxReps: 12, restSeconds: 90 }] },
        { name: 'Zancadas con Mancuernas', description: 'Paso largo, rodilla no pasa de punta de pie', sets: [{ setNumber: 1, minReps: 10, maxReps: 12, restSeconds: 90 }, { setNumber: 2, minReps: 10, maxReps: 12, restSeconds: 90 }] },
      ],
    },
  ]

  // Crear días y ejercicios del template
  for (const dayData of daysStructure) {
    const templateDay = await prisma.templateDay.create({
      data: {
        templateId: template.id,
        dayNumber: dayData.dayNumber,
        name: dayData.name,
        description: dayData.description,
        order: dayData.dayNumber,
      },
    })

    for (let i = 0; i < dayData.exercises.length; i++) {
      const exerciseData = dayData.exercises[i]
      const exercise = await prisma.exercise.create({
        data: {
          templateDayId: templateDay.id,
          name: exerciseData.name,
          description: exerciseData.description,
          order: i + 1,
        },
      })

      // Crear series estructuradas
      for (const setData of exerciseData.sets) {
        await prisma.exerciseSet.create({
          data: {
            exerciseId: exercise.id,
            setNumber: setData.setNumber,
            minReps: setData.minReps,
            maxReps: setData.maxReps,
            restSeconds: setData.restSeconds,
          },
        })
      }
    }
  }

  console.log('✅ Template days and exercises created')

  // Crear mesociclo activo para el cliente (20 semanas)
  const startDate = new Date('2026-01-06') // Lunes de esta semana
  const durationWeeks = 20
  const endDate = new Date(startDate)
  endDate.setDate(endDate.getDate() + durationWeeks * 7 - 1)

  const mesocycle = await prisma.clientMesocycle.create({
    data: {
      clientId: client.id,
      templateId: template.id,
      trainerId: trainer.id,
      startDate,
      durationWeeks,
      endDate,
      isActive: true,
      trainerNotes: 'Primer mesociclo del cliente, enfoque en aprender técnica correcta',
    },
  })

  console.log('✅ Client mesocycle created')

  // Crear 20 microciclos
  for (let weekNum = 1; weekNum <= durationWeeks; weekNum++) {
    const microcycleStartDate = new Date(startDate)
    microcycleStartDate.setDate(microcycleStartDate.getDate() + (weekNum - 1) * 7)

    const microcycleEndDate = new Date(microcycleStartDate)
    microcycleEndDate.setDate(microcycleEndDate.getDate() + 6)

    await prisma.microcycle.create({
      data: {
        mesocycleId: mesocycle.id,
        weekNumber: weekNum,
        startDate: microcycleStartDate,
        endDate: microcycleEndDate,
      },
    })
  }

  console.log('✅ Microcycles created (20 weeks)')

  // Crear algunos registros de entrenamiento de ejemplo (semana 1)
  const firstMicrocycle = await prisma.microcycle.findFirst({
    where: { mesocycleId: mesocycle.id, weekNumber: 1 },
  })

  if (firstMicrocycle) {
    const templateDays = await prisma.templateDay.findMany({
      where: { templateId: template.id },
      include: { exercises: { include: { sets: true } } },
      orderBy: { dayNumber: 'asc' },
    })

    // Registrar los primeros 3 días de la semana 1
    for (let dayIndex = 0; dayIndex < 3; dayIndex++) {
      const templateDay = templateDays[dayIndex]
      const workoutDate = new Date(firstMicrocycle.startDate)
      workoutDate.setDate(workoutDate.getDate() + dayIndex)

      const workoutDayLog = await prisma.workoutDayLog.create({
        data: {
          microcycleId: firstMicrocycle.id,
          templateDayId: templateDay.id,
          completedDate: workoutDate,
          durationMinutes: 60 + Math.floor(Math.random() * 20),
          rpe: 7 + Math.floor(Math.random() * 2),
          fatigue: 5 + Math.floor(Math.random() * 3),
          emotionalState: 'BIEN',
          clientNotes: 'Sesión completada con buena energía',
        },
      })

      // Registrar ejercicios
      for (const exercise of templateDay.exercises) {
        const exerciseLog = await prisma.exerciseLog.create({
          data: {
            workoutDayLogId: workoutDayLog.id,
            exerciseId: exercise.id,
          },
        })

        // Registrar series con pesos y reps de ejemplo
        for (const set of exercise.sets) {
          await prisma.setLog.create({
            data: {
              exerciseLogId: exerciseLog.id,
              setNumber: set.setNumber,
              reps: set.minReps + Math.floor(Math.random() * (set.maxReps - set.minReps + 1)),
              weight: 40 + Math.random() * 60, // Peso aleatorio entre 40-100kg
              rir: 1 + Math.floor(Math.random() * 3),
            },
          })
        }
      }
    }

    console.log('✅ Sample workout logs created for week 1 (first 3 days)')
  }

  // Crear plan nutricional
  await prisma.nutritionPlan.create({
    data: {
      title: 'Plan Nutricional - Enero 2026',
      description: 'Plan de alimentación personalizado',
      pdfUrl: '/uploads/plan-nutricional-ejemplo.pdf',
      startDate: new Date('2026-01-01'),
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
        date: new Date(2026, 0, (i + 1) * 2),
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
  console.log('')
  console.log('📊 Data created:')
  console.log('   - 1 Training Template (5 días)')
  console.log('   - 1 Active Mesocycle (20 semanas)')
  console.log('   - 20 Microcycles')
  console.log('   - 3 Workout Day Logs (semana 1, primeros 3 días)')
}

main()
  .catch((e) => {
    console.error('❌ Error seeding database:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
