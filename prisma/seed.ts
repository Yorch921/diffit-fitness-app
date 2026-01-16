import { PrismaClient, MuscleGroup } from '@prisma/client'
import { hash } from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
  console.log('🌱 Seeding database...')

  // ============================================================================
  // TRAINERS / ADMINISTRADORES
  // ============================================================================

  // Marta - Nutricionista
  const marta = await prisma.user.upsert({
    where: { email: 'marta@diffit.com' },
    update: {},
    create: {
      email: 'marta@diffit.com',
      name: 'Marta',
      password: await hash('marta123', 10),
      role: 'TRAINER',
    },
  })
  console.log('✅ Trainer created:', marta.email)

  // Adri - Entrenador Personal
  const adri = await prisma.user.upsert({
    where: { email: 'adri@diffit.com' },
    update: {},
    create: {
      email: 'adri@diffit.com',
      name: 'Adri',
      password: await hash('adri123', 10),
      role: 'TRAINER',
    },
  })
  console.log('✅ Trainer created:', adri.email)

  // Trainer Demo (original)
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

  // ============================================================================
  // CLIENTES
  // ============================================================================

  // Jorge - Solo Nutrición (Cliente de Marta)
  const jorge = await prisma.user.upsert({
    where: { email: 'jorge@diffit.com' },
    update: {},
    create: {
      email: 'jorge@diffit.com',
      name: 'Jorge',
      password: await hash('jorge123', 10),
      role: 'CLIENT',
      trainerId: marta.id,
      age: 32,
      gender: 'MALE',
      height: 178,
      initialWeight: 85.0,
      goal: 'Pérdida de grasa manteniendo masa muscular',
    },
  })
  console.log('✅ Client created:', jorge.email)

  // Miguel - Solo Entrenamiento (Cliente de Adri)
  const miguel = await prisma.user.upsert({
    where: { email: 'miguel@diffit.com' },
    update: {},
    create: {
      email: 'miguel@diffit.com',
      name: 'Miguel',
      password: await hash('miguel123', 10),
      role: 'CLIENT',
      trainerId: adri.id,
      age: 28,
      gender: 'MALE',
      height: 182,
      initialWeight: 75.0,
      goal: 'Ganancia de fuerza y masa muscular',
    },
  })
  console.log('✅ Client created:', miguel.email)

  // Rafa - Nutrición + Entrenamiento (Cliente de Marta)
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
      gender: 'MALE',
      height: 175,
      initialWeight: 90.0,
      goal: 'Recomposición corporal y mejora de salud',
    },
  })
  console.log('✅ Client created:', rafa.email)

  // Cliente Demo (original)
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
  // PLANES NUTRICIONALES
  // ============================================================================

  // Plan nutricional para Jorge
  await prisma.nutritionPlan.create({
    data: {
      title: 'Plan Nutricional Jorge - Déficit Calórico',
      description: 'Plan enfocado en pérdida de grasa con alto contenido proteico',
      pdfUrl: '/uploads/plan-jorge.pdf',
      startDate: new Date('2026-01-01'),
      userId: jorge.id,
      isActive: true,
      calories: 2200,
      protein: 180,
      carbs: 200,
      fats: 70,
    },
  })
  console.log('✅ Nutrition plan created for Jorge')

  // Plan nutricional para Rafa
  await prisma.nutritionPlan.create({
    data: {
      title: 'Plan Nutricional Rafa - Recomposición',
      description: 'Plan balanceado para recomposición corporal',
      pdfUrl: '/uploads/plan-rafa.pdf',
      startDate: new Date('2026-01-01'),
      userId: rafa.id,
      isActive: true,
      calories: 2400,
      protein: 170,
      carbs: 220,
      fats: 80,
    },
  })
  console.log('✅ Nutrition plan created for Rafa')

  // Plan nutricional para cliente demo
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
  console.log('✅ Nutrition plan created for demo client')

  // ============================================================================
  // REGISTROS DE PESO
  // ============================================================================

  // Registros de peso para Jorge (tendencia a la baja)
  const jorgeWeights = [85.0, 84.5, 84.2, 83.8, 83.5, 83.1, 82.8]
  for (let i = 0; i < jorgeWeights.length; i++) {
    await prisma.weightEntry.create({
      data: {
        weight: jorgeWeights[i],
        date: new Date(2026, 0, (i + 1) * 2),
        userId: jorge.id,
        notes: i === 0 ? 'Peso inicial' : undefined,
      },
    })
  }
  console.log('✅ Weight entries created for Jorge')

  // Registros de peso para Rafa (tendencia a la baja)
  const rafaWeights = [90.0, 89.6, 89.2, 88.9, 88.5, 88.2, 87.9]
  for (let i = 0; i < rafaWeights.length; i++) {
    await prisma.weightEntry.create({
      data: {
        weight: rafaWeights[i],
        date: new Date(2026, 0, (i + 1) * 2),
        userId: rafa.id,
        notes: i === 0 ? 'Peso inicial' : undefined,
      },
    })
  }
  console.log('✅ Weight entries created for Rafa')

  // Registros de peso para cliente demo
  const demoWeights = [80.5, 80.2, 79.8, 79.5, 79.3, 79.0, 78.8]
  for (let i = 0; i < demoWeights.length; i++) {
    await prisma.weightEntry.create({
      data: {
        weight: demoWeights[i],
        date: new Date(2026, 0, (i + 1) * 2),
        userId: client.id,
      },
    })
  }
  console.log('✅ Weight entries created for demo client')

  // ============================================================================
  // TEMPLATES DE ENTRENAMIENTO
  // ============================================================================

  // Template 1: Fuerza General 5 Días (Adri)
  const template5Days = await prisma.trainingTemplate.create({
    data: {
      title: 'Fuerza General - 5 Días',
      description: 'Plan de entrenamiento de fuerza para desarrollo muscular general',
      numberOfDays: 5,
      trainerId: adri.id,
      trainerNotes: 'Enfoque en compuestos básicos con progresión lineal',
    },
  })
  console.log('✅ Training template created: Fuerza General 5 Días')

  // Estructura de días para template de 5 días
  const days5Structure = [
    {
      dayNumber: 1,
      name: 'Día 1 - Pecho y Tríceps',
      description: 'Enfoque en press horizontal y extensiones de tríceps',
      exercises: [
        { name: 'Press de Banca Plano', description: 'Press con barra, agarre medio', muscleGroup: MuscleGroup.UPPER_BODY, sets: [{ setNumber: 1, minReps: 6, maxReps: 8, restSeconds: 180 }, { setNumber: 2, minReps: 6, maxReps: 8, restSeconds: 180 }, { setNumber: 3, minReps: 6, maxReps: 8, restSeconds: 180 }] },
        { name: 'Press Inclinado con Mancuernas', description: 'Ángulo 30-45 grados', muscleGroup: MuscleGroup.UPPER_BODY, sets: [{ setNumber: 1, minReps: 8, maxReps: 10, restSeconds: 120 }, { setNumber: 2, minReps: 8, maxReps: 10, restSeconds: 120 }, { setNumber: 3, minReps: 8, maxReps: 10, restSeconds: 120 }] },
        { name: 'Fondos en Paralelas', description: 'Inclinación hacia adelante para pecho', muscleGroup: MuscleGroup.UPPER_BODY, sets: [{ setNumber: 1, minReps: 10, maxReps: 12, restSeconds: 90 }, { setNumber: 2, minReps: 10, maxReps: 12, restSeconds: 90 }] },
        { name: 'Press Francés con Barra Z', description: 'Codos fijos, énfasis en cabeza larga', muscleGroup: MuscleGroup.UPPER_BODY, sets: [{ setNumber: 1, minReps: 10, maxReps: 12, restSeconds: 90 }, { setNumber: 2, minReps: 10, maxReps: 12, restSeconds: 90 }, { setNumber: 3, minReps: 10, maxReps: 12, restSeconds: 90 }] },
      ],
    },
    {
      dayNumber: 2,
      name: 'Día 2 - Espalda y Bíceps',
      description: 'Jalones verticales y horizontales',
      exercises: [
        { name: 'Dominadas', description: 'Agarre pronado, ancho de hombros', muscleGroup: MuscleGroup.UPPER_BODY, sets: [{ setNumber: 1, minReps: 6, maxReps: 8, restSeconds: 180 }, { setNumber: 2, minReps: 6, maxReps: 8, restSeconds: 180 }, { setNumber: 3, minReps: 6, maxReps: 8, restSeconds: 180 }] },
        { name: 'Remo con Barra', description: 'Tronco paralelo al suelo, jalón hacia abdomen', muscleGroup: MuscleGroup.UPPER_BODY, sets: [{ setNumber: 1, minReps: 8, maxReps: 10, restSeconds: 120 }, { setNumber: 2, minReps: 8, maxReps: 10, restSeconds: 120 }, { setNumber: 3, minReps: 8, maxReps: 10, restSeconds: 120 }] },
        { name: 'Jalón al Pecho con Polea', description: 'Agarre amplio, jalón hacia clavículas', muscleGroup: MuscleGroup.UPPER_BODY, sets: [{ setNumber: 1, minReps: 10, maxReps: 12, restSeconds: 90 }, { setNumber: 2, minReps: 10, maxReps: 12, restSeconds: 90 }] },
        { name: 'Curl con Barra Z', description: 'Codos pegados al cuerpo', muscleGroup: MuscleGroup.UPPER_BODY, sets: [{ setNumber: 1, minReps: 10, maxReps: 12, restSeconds: 90 }, { setNumber: 2, minReps: 10, maxReps: 12, restSeconds: 90 }, { setNumber: 3, minReps: 10, maxReps: 12, restSeconds: 90 }] },
      ],
    },
    {
      dayNumber: 3,
      name: 'Día 3 - Pierna Completa',
      description: 'Cuádriceps, femoral y glúteo',
      exercises: [
        { name: 'Sentadilla con Barra', description: 'Profundidad completa, ATG si es posible', muscleGroup: MuscleGroup.LOWER_BODY, sets: [{ setNumber: 1, minReps: 6, maxReps: 8, restSeconds: 240 }, { setNumber: 2, minReps: 6, maxReps: 8, restSeconds: 240 }, { setNumber: 3, minReps: 6, maxReps: 8, restSeconds: 240 }] },
        { name: 'Peso Muerto Rumano', description: 'Énfasis en femoral, ligera flexión de rodilla', muscleGroup: MuscleGroup.LOWER_BODY, sets: [{ setNumber: 1, minReps: 8, maxReps: 10, restSeconds: 180 }, { setNumber: 2, minReps: 8, maxReps: 10, restSeconds: 180 }, { setNumber: 3, minReps: 8, maxReps: 10, restSeconds: 180 }] },
        { name: 'Prensa de Pierna', description: 'Pies ancho de hombros, empuje con talones', muscleGroup: MuscleGroup.LOWER_BODY, sets: [{ setNumber: 1, minReps: 10, maxReps: 12, restSeconds: 120 }, { setNumber: 2, minReps: 10, maxReps: 12, restSeconds: 120 }] },
        { name: 'Curl Femoral Acostado', description: 'Contracción completa, evitar impulso', muscleGroup: MuscleGroup.LOWER_BODY, sets: [{ setNumber: 1, minReps: 12, maxReps: 15, restSeconds: 90 }, { setNumber: 2, minReps: 12, maxReps: 15, restSeconds: 90 }, { setNumber: 3, minReps: 12, maxReps: 15, restSeconds: 90 }] },
      ],
    },
    {
      dayNumber: 4,
      name: 'Día 4 - Hombros y Core',
      description: 'Deltoides anterior, lateral y posterior',
      exercises: [
        { name: 'Press Militar con Barra', description: 'De pie, agarre medio, barra por delante', muscleGroup: MuscleGroup.UPPER_BODY, sets: [{ setNumber: 1, minReps: 6, maxReps: 8, restSeconds: 180 }, { setNumber: 2, minReps: 6, maxReps: 8, restSeconds: 180 }, { setNumber: 3, minReps: 6, maxReps: 8, restSeconds: 180 }] },
        { name: 'Elevaciones Laterales con Mancuernas', description: 'Ligera inclinación hacia adelante, codos ligeramente flexionados', muscleGroup: MuscleGroup.UPPER_BODY, sets: [{ setNumber: 1, minReps: 12, maxReps: 15, restSeconds: 90 }, { setNumber: 2, minReps: 12, maxReps: 15, restSeconds: 90 }, { setNumber: 3, minReps: 12, maxReps: 15, restSeconds: 90 }] },
        { name: 'Face Pulls con Polea', description: 'Jalón hacia frente a nivel de nariz', muscleGroup: MuscleGroup.UPPER_BODY, sets: [{ setNumber: 1, minReps: 15, maxReps: 20, restSeconds: 60 }, { setNumber: 2, minReps: 15, maxReps: 20, restSeconds: 60 }] },
        { name: 'Plancha Abdominal', description: 'Mantener espalda neutral, no arquear', muscleGroup: MuscleGroup.CORE, sets: [{ setNumber: 1, minReps: 30, maxReps: 60, restSeconds: 90 }, { setNumber: 2, minReps: 30, maxReps: 60, restSeconds: 90 }] },
      ],
    },
    {
      dayNumber: 5,
      name: 'Día 5 - Full Body',
      description: 'Trabajo de todo el cuerpo con énfasis en fuerza',
      exercises: [
        { name: 'Peso Muerto Convencional', description: 'Agarre doble pronado o mixto, espalda recta', muscleGroup: MuscleGroup.FULL_BODY, sets: [{ setNumber: 1, minReps: 5, maxReps: 6, restSeconds: 240 }, { setNumber: 2, minReps: 5, maxReps: 6, restSeconds: 240 }, { setNumber: 3, minReps: 5, maxReps: 6, restSeconds: 240 }] },
        { name: 'Press de Banca Inclinado', description: 'Ángulo 45 grados', muscleGroup: MuscleGroup.UPPER_BODY, sets: [{ setNumber: 1, minReps: 8, maxReps: 10, restSeconds: 120 }, { setNumber: 2, minReps: 8, maxReps: 10, restSeconds: 120 }] },
        { name: 'Remo con Mancuernas', description: 'Apoyo unilateral, jalón hacia cadera', muscleGroup: MuscleGroup.UPPER_BODY, sets: [{ setNumber: 1, minReps: 10, maxReps: 12, restSeconds: 90 }, { setNumber: 2, minReps: 10, maxReps: 12, restSeconds: 90 }] },
        { name: 'Zancadas con Mancuernas', description: 'Paso largo, rodilla no pasa de punta de pie', muscleGroup: MuscleGroup.LOWER_BODY, sets: [{ setNumber: 1, minReps: 10, maxReps: 12, restSeconds: 90 }, { setNumber: 2, minReps: 10, maxReps: 12, restSeconds: 90 }] },
      ],
    },
  ]

  // Crear días y ejercicios para template de 5 días
  for (const dayData of days5Structure) {
    const templateDay = await prisma.templateDay.create({
      data: {
        templateId: template5Days.id,
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
          muscleGroup: exerciseData.muscleGroup,
          order: i + 1,
        },
      })

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
  console.log('✅ Template days and exercises created for 5-day template')

  // Template 2: Hipertrofia 4 Días (Marta)
  const template4Days = await prisma.trainingTemplate.create({
    data: {
      title: 'Hipertrofia - 4 Días',
      description: 'Plan de hipertrofia muscular con volumen moderado-alto',
      numberOfDays: 4,
      trainerId: marta.id,
      trainerNotes: 'Enfoque en hipertrofia con rangos de 8-12 reps',
    },
  })
  console.log('✅ Training template created: Hipertrofia 4 Días')

  // Estructura simplificada para template de 4 días
  const days4Structure = [
    {
      dayNumber: 1,
      name: 'Día 1 - Tren Superior A',
      exercises: [
        { name: 'Press de Banca', muscleGroup: MuscleGroup.UPPER_BODY, sets: [{ setNumber: 1, minReps: 8, maxReps: 10, restSeconds: 120 }, { setNumber: 2, minReps: 8, maxReps: 10, restSeconds: 120 }, { setNumber: 3, minReps: 8, maxReps: 10, restSeconds: 120 }] },
        { name: 'Remo con Barra', muscleGroup: MuscleGroup.UPPER_BODY, sets: [{ setNumber: 1, minReps: 8, maxReps: 10, restSeconds: 120 }, { setNumber: 2, minReps: 8, maxReps: 10, restSeconds: 120 }, { setNumber: 3, minReps: 8, maxReps: 10, restSeconds: 120 }] },
        { name: 'Press Militar', muscleGroup: MuscleGroup.UPPER_BODY, sets: [{ setNumber: 1, minReps: 10, maxReps: 12, restSeconds: 90 }, { setNumber: 2, minReps: 10, maxReps: 12, restSeconds: 90 }] },
      ],
    },
    {
      dayNumber: 2,
      name: 'Día 2 - Tren Inferior A',
      exercises: [
        { name: 'Sentadilla', muscleGroup: MuscleGroup.LOWER_BODY, sets: [{ setNumber: 1, minReps: 8, maxReps: 10, restSeconds: 180 }, { setNumber: 2, minReps: 8, maxReps: 10, restSeconds: 180 }, { setNumber: 3, minReps: 8, maxReps: 10, restSeconds: 180 }] },
        { name: 'Peso Muerto Rumano', muscleGroup: MuscleGroup.LOWER_BODY, sets: [{ setNumber: 1, minReps: 10, maxReps: 12, restSeconds: 120 }, { setNumber: 2, minReps: 10, maxReps: 12, restSeconds: 120 }] },
        { name: 'Curl Femoral', muscleGroup: MuscleGroup.LOWER_BODY, sets: [{ setNumber: 1, minReps: 12, maxReps: 15, restSeconds: 90 }, { setNumber: 2, minReps: 12, maxReps: 15, restSeconds: 90 }] },
      ],
    },
    {
      dayNumber: 3,
      name: 'Día 3 - Tren Superior B',
      exercises: [
        { name: 'Press Inclinado', muscleGroup: MuscleGroup.UPPER_BODY, sets: [{ setNumber: 1, minReps: 8, maxReps: 10, restSeconds: 120 }, { setNumber: 2, minReps: 8, maxReps: 10, restSeconds: 120 }] },
        { name: 'Dominadas', muscleGroup: MuscleGroup.UPPER_BODY, sets: [{ setNumber: 1, minReps: 6, maxReps: 8, restSeconds: 120 }, { setNumber: 2, minReps: 6, maxReps: 8, restSeconds: 120 }] },
        { name: 'Elevaciones Laterales', muscleGroup: MuscleGroup.UPPER_BODY, sets: [{ setNumber: 1, minReps: 12, maxReps: 15, restSeconds: 60 }, { setNumber: 2, minReps: 12, maxReps: 15, restSeconds: 60 }] },
      ],
    },
    {
      dayNumber: 4,
      name: 'Día 4 - Tren Inferior B',
      exercises: [
        { name: 'Prensa de Pierna', muscleGroup: MuscleGroup.LOWER_BODY, sets: [{ setNumber: 1, minReps: 10, maxReps: 12, restSeconds: 120 }, { setNumber: 2, minReps: 10, maxReps: 12, restSeconds: 120 }] },
        { name: 'Zancadas', muscleGroup: MuscleGroup.LOWER_BODY, sets: [{ setNumber: 1, minReps: 10, maxReps: 12, restSeconds: 90 }, { setNumber: 2, minReps: 10, maxReps: 12, restSeconds: 90 }] },
        { name: 'Extensiones de Cuádriceps', muscleGroup: MuscleGroup.LOWER_BODY, sets: [{ setNumber: 1, minReps: 12, maxReps: 15, restSeconds: 60 }, { setNumber: 2, minReps: 12, maxReps: 15, restSeconds: 60 }] },
      ],
    },
  ]

  // Crear días y ejercicios para template de 4 días
  const template4DaysDays = []
  for (const dayData of days4Structure) {
    const templateDay = await prisma.templateDay.create({
      data: {
        templateId: template4Days.id,
        dayNumber: dayData.dayNumber,
        name: dayData.name,
        order: dayData.dayNumber,
      },
    })
    template4DaysDays.push(templateDay)

    for (let i = 0; i < dayData.exercises.length; i++) {
      const exerciseData = dayData.exercises[i]
      const exercise = await prisma.exercise.create({
        data: {
          templateDayId: templateDay.id,
          name: exerciseData.name,
          muscleGroup: exerciseData.muscleGroup,
          order: i + 1,
        },
      })

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
  console.log('✅ Template days and exercises created for 4-day template')

  // ============================================================================
  // MESOCICLOS Y REGISTROS
  // ============================================================================

  // Mesociclo para Miguel (20 semanas con template de 4 días)
  const miguelStartDate = new Date('2026-01-12')
  const miguelMeso = await prisma.clientMesocycle.create({
    data: {
      clientId: miguel.id,
      templateId: template4Days.id,
      trainerId: adri.id,
      startDate: miguelStartDate,
      durationWeeks: 20,
      endDate: new Date(new Date(miguelStartDate).setDate(miguelStartDate.getDate() + 20 * 7 - 1)),
      isActive: true,
      trainerNotes: 'Primer mesociclo de Miguel, enfoque en técnica y progresión',
    },
  })

  // Crear 20 microciclos para Miguel y registrar entrenamientos hasta semana 11
  const miguelMicrocycles = []
  for (let weekNum = 1; weekNum <= 20; weekNum++) {
    const microStart = new Date(miguelStartDate)
    microStart.setDate(microStart.getDate() + (weekNum - 1) * 7)
    const microEnd = new Date(microStart)
    microEnd.setDate(microEnd.getDate() + 6)

    const micro = await prisma.microcycle.create({
      data: {
        mesocycleId: miguelMeso.id,
        weekNumber: weekNum,
        startDate: microStart,
        endDate: microEnd,
      },
    })
    miguelMicrocycles.push(micro)
  }
  console.log('✅ Mesocycle created for Miguel (20 weeks)')

  // Generar workout logs para Miguel hasta semana 11 (4 días por semana)
  for (let weekNum = 1; weekNum <= 11; weekNum++) {
    const micro = miguelMicrocycles[weekNum - 1]

    // Entrenar 4 días por semana (días 1, 2, 3, 4 del template)
    for (let dayIdx = 0; dayIdx < 4; dayIdx++) {
      const templateDay = template4DaysDays[dayIdx]
      const workoutDate = new Date(micro.startDate)
      workoutDate.setDate(workoutDate.getDate() + dayIdx)

      // Crear workout log con todos sus ejercicios
      const workoutLog = await prisma.workoutDayLog.create({
        data: {
          microcycleId: micro.id,
          templateDayId: templateDay.id,
          completedDate: workoutDate,
          durationMinutes: 60 + Math.floor(Math.random() * 30), // 60-90 min
          rpe: 6 + Math.floor(Math.random() * 3), // RPE 6-8
          fatigue: 3 + Math.floor(Math.random() * 3), // Fatigue 3-5
          emotionalState: 'BIEN',
          clientNotes: weekNum === 1 && dayIdx === 0
            ? 'Primer día, me siento bien y con ganas'
            : weekNum === 11 && dayIdx === 3
            ? 'Progresando bastante bien, me siento más fuerte cada semana'
            : null,
        },
      })

      // Obtener ejercicios del día del template
      const dayExercises = await prisma.exercise.findMany({
        where: { templateDayId: templateDay.id },
        include: { sets: { orderBy: { setNumber: 'asc' } } },
        orderBy: { order: 'asc' },
      })

      // Crear logs de ejercicios y series con pesos progresivos
      for (const exercise of dayExercises) {
        const exerciseLog = await prisma.exerciseLog.create({
          data: {
            workoutDayLogId: workoutLog.id,
            exerciseId: exercise.id,
          },
        })

        // Calcular peso base y progresión (incremento cada 2 semanas aprox)
        const baseWeight = 20 + Math.random() * 40 // 20-60kg base
        const weekProgression = Math.floor(weekNum / 2) * 2.5 // +2.5kg cada 2 semanas

        for (const set of exercise.sets) {
          const setWeight = baseWeight + weekProgression + (Math.random() * 5 - 2.5) // Variación ±2.5kg
          const reps = set.minReps + Math.floor(Math.random() * (set.maxReps - set.minReps + 1))

          await prisma.setLog.create({
            data: {
              exerciseLogId: exerciseLog.id,
              setNumber: set.setNumber,
              reps: reps,
              weight: Math.round(setWeight * 2) / 2, // Redondear a 0.5kg
              rir: Math.floor(Math.random() * 3), // RIR 0-2
              notes: set.setNumber === exercise.sets.length && Math.random() > 0.8
                ? 'Última serie al fallo'
                : null,
            },
          })
        }
      }
    }
  }
  console.log('✅ Workout logs created for Miguel (weeks 1-11, 4 days/week)')

  // Mesociclo para Rafa (con template de 4 días de Marta)
  const rafaStartDate = new Date('2026-01-06')
  const rafaMeso = await prisma.clientMesocycle.create({
    data: {
      clientId: rafa.id,
      templateId: template4Days.id,
      trainerId: marta.id,
      startDate: rafaStartDate,
      durationWeeks: 8,
      endDate: new Date(new Date(rafaStartDate).setDate(rafaStartDate.getDate() + 8 * 7 - 1)),
      isActive: true,
      trainerNotes: 'Plan combinado con nutrición para recomposición',
    },
  })

  // Crear 8 microciclos para Rafa
  for (let weekNum = 1; weekNum <= 8; weekNum++) {
    const microStart = new Date(rafaStartDate)
    microStart.setDate(microStart.getDate() + (weekNum - 1) * 7)
    const microEnd = new Date(microStart)
    microEnd.setDate(microEnd.getDate() + 6)

    await prisma.microcycle.create({
      data: {
        mesocycleId: rafaMeso.id,
        weekNumber: weekNum,
        startDate: microStart,
        endDate: microEnd,
      },
    })
  }
  console.log('✅ Mesocycle created for Rafa (8 weeks)')

  // Mesociclo para cliente demo (20 semanas)
  const demoStartDate = new Date('2026-01-06')
  const demoMeso = await prisma.clientMesocycle.create({
    data: {
      clientId: client.id,
      templateId: template5Days.id,
      trainerId: trainer.id,
      startDate: demoStartDate,
      durationWeeks: 20,
      endDate: new Date(new Date(demoStartDate).setDate(demoStartDate.getDate() + 20 * 7 - 1)),
      isActive: true,
      trainerNotes: 'Primer mesociclo del cliente, enfoque en aprender técnica correcta',
    },
  })

  // Crear 20 microciclos para demo
  for (let weekNum = 1; weekNum <= 20; weekNum++) {
    const microStart = new Date(demoStartDate)
    microStart.setDate(microStart.getDate() + (weekNum - 1) * 7)
    const microEnd = new Date(microStart)
    microEnd.setDate(microEnd.getDate() + 6)

    await prisma.microcycle.create({
      data: {
        mesocycleId: demoMeso.id,
        weekNumber: weekNum,
        startDate: microStart,
        endDate: microEnd,
      },
    })
  }
  console.log('✅ Mesocycle created for demo client (20 weeks)')

  // Crear algunos logs de ejemplo para la semana 1 del cliente demo
  const firstMicro = await prisma.microcycle.findFirst({
    where: { mesocycleId: demoMeso.id, weekNumber: 1 },
  })

  if (firstMicro) {
    const templateDays = await prisma.templateDay.findMany({
      where: { templateId: template5Days.id },
      include: { exercises: { include: { sets: true } } },
      orderBy: { dayNumber: 'asc' },
    })

    for (let dayIndex = 0; dayIndex < 3; dayIndex++) {
      const templateDay = templateDays[dayIndex]
      const workoutDate = new Date(firstMicro.startDate)
      workoutDate.setDate(workoutDate.getDate() + dayIndex)

      const workoutLog = await prisma.workoutDayLog.create({
        data: {
          microcycleId: firstMicro.id,
          templateDayId: templateDay.id,
          completedDate: workoutDate,
          durationMinutes: 60 + Math.floor(Math.random() * 20),
          rpe: 7 + Math.floor(Math.random() * 2),
          fatigue: 5 + Math.floor(Math.random() * 3),
          emotionalState: 'BIEN',
          clientNotes: 'Sesión completada con buena energía',
        },
      })

      for (const exercise of templateDay.exercises) {
        const exerciseLog = await prisma.exerciseLog.create({
          data: {
            workoutDayLogId: workoutLog.id,
            exerciseId: exercise.id,
          },
        })

        for (const set of exercise.sets) {
          await prisma.setLog.create({
            data: {
              exerciseLogId: exerciseLog.id,
              setNumber: set.setNumber,
              reps: set.minReps + Math.floor(Math.random() * (set.maxReps - set.minReps + 1)),
              weight: 40 + Math.random() * 60,
              rir: 1 + Math.floor(Math.random() * 3),
            },
          })
        }
      }
    }
    console.log('✅ Sample workout logs created for demo client (week 1)')
  }

  // ============================================================================
  // RESUMEN FINAL
  // ============================================================================

  console.log('')
  console.log('✨ Seeding completed!')
  console.log('')
  console.log('👥 TRAINERS:')
  console.log('   Marta (Nutricionista): marta@diffit.com / marta123')
  console.log('   Adri (Entrenador): adri@diffit.com / adri123')
  console.log('   Trainer Demo: trainer@diffit.com / password123')
  console.log('')
  console.log('👤 CLIENTS:')
  console.log('   Jorge (Solo Nutrición): jorge@diffit.com / jorge123')
  console.log('   Miguel (Solo Entrenamiento): miguel@diffit.com / miguel123')
  console.log('   Rafa (Nutrición + Entrenamiento): rafa@diffit.com / rafa123')
  console.log('   Cliente Demo: cliente@diffit.com / password123')
  console.log('')
  console.log('📊 DATA CREATED:')
  console.log('   - 2 Training Templates (5 días y 4 días)')
  console.log('   - 3 Active Mesocycles (Miguel: 4 weeks, Rafa: 8 weeks, Demo: 20 weeks)')
  console.log('   - 3 Nutrition Plans (Jorge, Rafa, Demo)')
  console.log('   - Weight entries for Jorge, Rafa, and Demo')
  console.log('   - Sample workout logs for Demo client')
}

main()
  .catch((e) => {
    console.error('❌ Error seeding database:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
