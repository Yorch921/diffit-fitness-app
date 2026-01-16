import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

// POST /api/admin/mesocycles/save-as-template - Guardar mesociclo como plantilla reutilizable
export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions)

    if (!session || session.user.role !== 'TRAINER') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { mesocycleId, templateTitle } = body

    // Validaciones
    if (!mesocycleId || !templateTitle) {
      return NextResponse.json(
        { error: 'Faltan datos obligatorios' },
        { status: 400 }
      )
    }

    // Obtener el mesociclo con su template
    const mesocycle = await prisma.clientMesocycle.findFirst({
      where: {
        id: mesocycleId,
        trainerId: session.user.id,
      },
      include: {
        template: {
          include: {
            days: {
              orderBy: { order: 'asc' },
              include: {
                exercises: {
                  orderBy: { order: 'asc' },
                  include: {
                    sets: {
                      orderBy: { setNumber: 'asc' },
                    },
                  },
                },
              },
            },
          },
        },
      },
    })

    if (!mesocycle) {
      return NextResponse.json(
        { error: 'Mesociclo no encontrado' },
        { status: 404 }
      )
    }

    // Crear nueva plantilla copiando la estructura del template actual
    const newTemplate = await prisma.trainingTemplate.create({
      data: {
        title: templateTitle,
        description: `Plantilla creada a partir del plan de ${mesocycle.template.title}`,
        trainerId: session.user.id,
        numberOfDays: mesocycle.template.numberOfDays,
        trainerNotes: mesocycle.template.trainerNotes,
      },
    })

    // Copiar días y ejercicios
    for (const day of mesocycle.template.days) {
      const newDay = await prisma.templateDay.create({
        data: {
          templateId: newTemplate.id,
          dayNumber: day.dayNumber,
          name: day.name,
          description: day.description,
          order: day.order,
        },
      })

      // Copiar ejercicios del día
      for (const exercise of day.exercises) {
        const newExercise = await prisma.exercise.create({
          data: {
            templateDayId: newDay.id,
            name: exercise.name,
            description: exercise.description,
            videoUrl: exercise.videoUrl,
            trainerComment: exercise.trainerComment,
            order: exercise.order,
          },
        })

        // Copiar sets del ejercicio
        const setsData = exercise.sets.map((set) => ({
          exerciseId: newExercise.id,
          setNumber: set.setNumber,
          minReps: set.minReps,
          maxReps: set.maxReps,
          restSeconds: set.restSeconds,
        }))

        await prisma.exerciseSet.createMany({
          data: setsData,
        })
      }
    }

    return NextResponse.json(
      {
        success: true,
        templateId: newTemplate.id,
        message: 'Plantilla creada exitosamente',
      },
      { status: 201 }
    )
  } catch (error) {
    console.error('Error saving mesocycle as template:', error)
    return NextResponse.json(
      { error: 'Error al guardar como plantilla' },
      { status: 500 }
    )
  }
}
