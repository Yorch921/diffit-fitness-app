import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

/**
 * POST /api/admin/mesocycles/fork
 *
 * Ejecuta el fork-on-write de forma ATÓMICA:
 * 1. Copia todos los días, ejercicios y series del template a ClientDay/ClientExercise/ClientExerciseSet
 * 2. Actualiza el mesociclo: isForked = true, templateId = null
 * 3. Retorna los datos del mesociclo actualizado con sus nuevos días
 *
 * Esta operación es ATÓMICA - si falla cualquier parte, se revierte todo.
 */
export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions)

    if (!session || session.user.role !== 'TRAINER') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { mesocycleId } = body

    if (!mesocycleId) {
      return NextResponse.json(
        { error: 'mesocycleId es requerido' },
        { status: 400 }
      )
    }

    // Verificar que el mesociclo pertenece al trainer y obtener template
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

    // Si ya está forked, no hacer nada (idempotente)
    if (mesocycle.isForked) {
      return NextResponse.json({
        message: 'El plan ya está desvinculado',
        mesocycleId: mesocycle.id,
        isForked: true,
      })
    }

    // Si no hay template (caso edge), error
    if (!mesocycle.template) {
      return NextResponse.json(
        { error: 'El mesociclo no tiene plantilla vinculada' },
        { status: 400 }
      )
    }

    // Ejecutar fork ATÓMICO en una transacción
    const result = await prisma.$transaction(async (tx) => {
      // 1. Crear ClientDays con sus ejercicios y series
      for (const day of mesocycle.template!.days) {
        const clientDay = await tx.clientDay.create({
          data: {
            mesocycleId: mesocycle.id,
            dayNumber: day.dayNumber,
            name: day.name,
            description: day.description,
            order: day.order,
          },
        })

        // Crear ejercicios para este día
        for (const exercise of day.exercises) {
          const clientExercise = await tx.clientExercise.create({
            data: {
              clientDayId: clientDay.id,
              name: exercise.name,
              description: exercise.description,
              videoUrl: exercise.videoUrl,
              trainerComment: exercise.trainerComment,
              order: exercise.order,
              muscleGroup: exercise.muscleGroup,
            },
          })

          // Crear series para este ejercicio
          if (exercise.sets.length > 0) {
            await tx.clientExerciseSet.createMany({
              data: exercise.sets.map((set) => ({
                clientExerciseId: clientExercise.id,
                setNumber: set.setNumber,
                minReps: set.minReps,
                maxReps: set.maxReps,
                restSeconds: set.restSeconds,
              })),
            })
          }
        }
      }

      // 2. Actualizar mesociclo: isForked = true, templateId = null
      const updatedMesocycle = await tx.clientMesocycle.update({
        where: { id: mesocycle.id },
        data: {
          isForked: true,
          templateId: null,
        },
        include: {
          clientDays: {
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
      })

      return updatedMesocycle
    })

    return NextResponse.json({
      message: 'Plan desvinculado exitosamente',
      mesocycleId: result.id,
      isForked: true,
      clientDays: result.clientDays,
    })
  } catch (error) {
    console.error('Error forking mesocycle:', error)
    return NextResponse.json(
      { error: 'Error al desvincular el plan' },
      { status: 500 }
    )
  }
}
