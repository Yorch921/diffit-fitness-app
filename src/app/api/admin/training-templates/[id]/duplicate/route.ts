import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

// POST /api/admin/training-templates/[id]/duplicate - Duplicar plantilla
export async function POST(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)

    if (!session || session.user.role !== 'TRAINER') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json().catch(() => ({}))
    const { newTitle, mesocycleId } = body

    // Obtener la plantilla original con todos sus datos
    const originalTemplate = await prisma.trainingTemplate.findFirst({
      where: {
        id: params.id,
        trainerId: session.user.id,
      },
      include: {
        days: {
          orderBy: { dayNumber: 'asc' },
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
    })

    if (!originalTemplate) {
      return NextResponse.json(
        { error: 'Plantilla no encontrada' },
        { status: 404 }
      )
    }

    // Crear la plantilla duplicada
    const duplicatedTemplate = await prisma.trainingTemplate.create({
      data: {
        trainerId: session.user.id,
        title: newTitle || `${originalTemplate.title} (copia)`,
        description: originalTemplate.description,
        numberOfDays: originalTemplate.numberOfDays,
        trainerNotes: originalTemplate.trainerNotes,
        days: {
          create: originalTemplate.days.map((day) => ({
            dayNumber: day.dayNumber,
            name: day.name,
            description: day.description,
            order: day.order,
            exercises: {
              create: day.exercises.map((exercise) => ({
                name: exercise.name,
                description: exercise.description,
                videoUrl: exercise.videoUrl,
                trainerComment: exercise.trainerComment,
                order: exercise.order,
                muscleGroup: exercise.muscleGroup,
                sets: {
                  create: exercise.sets.map((set) => ({
                    setNumber: set.setNumber,
                    minReps: set.minReps,
                    maxReps: set.maxReps,
                    restSeconds: set.restSeconds,
                  })),
                },
              })),
            },
          })),
        },
      },
      include: {
        days: {
          orderBy: { dayNumber: 'asc' },
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
    })

    // Si se proporciona mesocycleId, actualizar el mesociclo para que use la nueva plantilla
    if (mesocycleId) {
      // Verificar que el mesociclo pertenece al trainer y usa la plantilla original
      const mesocycle = await prisma.clientMesocycle.findFirst({
        where: {
          id: mesocycleId,
          trainerId: session.user.id,
          templateId: params.id,
        },
      })

      if (mesocycle) {
        await prisma.clientMesocycle.update({
          where: { id: mesocycleId },
          data: { templateId: duplicatedTemplate.id },
        })
      }
    }

    return NextResponse.json({
      success: true,
      template: duplicatedTemplate,
      templateId: duplicatedTemplate.id,
    })
  } catch (error) {
    console.error('Error duplicating template:', error)
    return NextResponse.json(
      { error: 'Error al duplicar la plantilla' },
      { status: 500 }
    )
  }
}
