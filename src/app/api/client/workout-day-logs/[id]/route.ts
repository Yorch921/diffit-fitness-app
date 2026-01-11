import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

// GET /api/client/workout-day-logs/[id] - Obtener log específico
export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)

    if (!session || session.user.role !== 'CLIENT') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const workoutDayLog = await prisma.workoutDayLog.findFirst({
      where: {
        id: params.id,
        microcycle: {
          mesocycle: {
            clientId: session.user.id,
          },
        },
      },
      include: {
        templateDay: {
          select: {
            id: true,
            dayNumber: true,
            name: true,
            description: true,
          },
        },
        exerciseLogs: {
          include: {
            exercise: {
              include: {
                sets: {
                  orderBy: { setNumber: 'asc' },
                },
              },
            },
            setLogs: {
              orderBy: { setNumber: 'asc' },
            },
          },
        },
        microcycle: {
          select: {
            weekNumber: true,
          },
        },
      },
    })

    if (!workoutDayLog) {
      return NextResponse.json(
        { error: 'Workout day log not found' },
        { status: 404 }
      )
    }

    return NextResponse.json(workoutDayLog)
  } catch (error) {
    console.error('Error fetching workout day log:', error)
    return NextResponse.json(
      { error: 'Error fetching workout day log' },
      { status: 500 }
    )
  }
}

// PATCH /api/client/workout-day-logs/[id] - Editar log
export async function PATCH(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)

    if (!session || session.user.role !== 'CLIENT') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const {
      durationMinutes,
      rpe,
      fatigue,
      emotionalState,
      clientNotes,
      exercises,
    } = body

    // Verificar que el log pertenece al cliente
    const existingLog = await prisma.workoutDayLog.findFirst({
      where: {
        id: params.id,
        microcycle: {
          mesocycle: {
            clientId: session.user.id,
          },
        },
      },
    })

    if (!existingLog) {
      return NextResponse.json(
        { error: 'Workout day log not found' },
        { status: 404 }
      )
    }

    // Validaciones
    if (rpe && (rpe < 1 || rpe > 10)) {
      return NextResponse.json(
        { error: 'RPE debe estar entre 1 y 10' },
        { status: 400 }
      )
    }

    if (fatigue && (fatigue < 1 || fatigue > 10)) {
      return NextResponse.json(
        { error: 'Fatiga debe estar entre 1 y 10' },
        { status: 400 }
      )
    }

    const updateData: any = {}
    if (durationMinutes !== undefined) updateData.durationMinutes = durationMinutes
    if (rpe !== undefined) updateData.rpe = rpe
    if (fatigue !== undefined) updateData.fatigue = fatigue
    if (emotionalState !== undefined) updateData.emotionalState = emotionalState
    if (clientNotes !== undefined) updateData.clientNotes = clientNotes?.trim() || null

    // Si se proporcionan ejercicios, actualizar series
    if (exercises) {
      // Eliminar exercise logs existentes y crear nuevos
      await prisma.exerciseLog.deleteMany({
        where: { workoutDayLogId: params.id },
      })

      updateData.exerciseLogs = {
        create: exercises.map((exercise: any) => ({
          exerciseId: exercise.exerciseId,
          setLogs: {
            create: exercise.sets.map((set: any) => ({
              setNumber: set.setNumber,
              reps: set.reps,
              weight: set.weight,
              rir: set.rir,
              notes: set.notes?.trim() || null,
            })),
          },
        })),
      }
    }

    const workoutDayLog = await prisma.workoutDayLog.update({
      where: { id: params.id },
      data: updateData,
      include: {
        templateDay: {
          select: {
            id: true,
            dayNumber: true,
            name: true,
          },
        },
        exerciseLogs: {
          include: {
            exercise: {
              select: {
                id: true,
                name: true,
              },
            },
            setLogs: {
              orderBy: { setNumber: 'asc' },
            },
          },
        },
      },
    })

    return NextResponse.json(workoutDayLog)
  } catch (error) {
    console.error('Error updating workout day log:', error)
    return NextResponse.json(
      { error: 'Error updating workout day log' },
      { status: 500 }
    )
  }
}

// DELETE /api/client/workout-day-logs/[id] - Eliminar log
export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)

    if (!session || session.user.role !== 'CLIENT') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Verificar que el log pertenece al cliente
    const existingLog = await prisma.workoutDayLog.findFirst({
      where: {
        id: params.id,
        microcycle: {
          mesocycle: {
            clientId: session.user.id,
          },
        },
      },
    })

    if (!existingLog) {
      return NextResponse.json(
        { error: 'Workout day log not found' },
        { status: 404 }
      )
    }

    await prisma.workoutDayLog.delete({
      where: { id: params.id },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting workout day log:', error)
    return NextResponse.json(
      { error: 'Error deleting workout day log' },
      { status: 500 }
    )
  }
}
