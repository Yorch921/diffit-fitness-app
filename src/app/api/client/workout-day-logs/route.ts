import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

// POST /api/client/workout-day-logs - Crear registro de día (con exercises y sets)
export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions)

    if (!session || session.user.role !== 'CLIENT') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const {
      microcycleId,
      templateDayId,
      completedDate,
      durationMinutes,
      rpe,
      fatigue,
      emotionalState,
      clientNotes,
      exercises,
    } = body

    // Validaciones
    if (!microcycleId || !templateDayId || !completedDate) {
      return NextResponse.json(
        { error: 'Faltan datos obligatorios' },
        { status: 400 }
      )
    }

    if (!exercises || !Array.isArray(exercises) || exercises.length === 0) {
      return NextResponse.json(
        { error: 'Debe registrar al menos un ejercicio' },
        { status: 400 }
      )
    }

    // Verificar que el microciclo pertenece al cliente
    const microcycle = await prisma.microcycle.findFirst({
      where: {
        id: microcycleId,
        mesocycle: {
          clientId: session.user.id,
          isActive: true,
        },
      },
    })

    if (!microcycle) {
      return NextResponse.json(
        { error: 'Microcycle not found' },
        { status: 404 }
      )
    }

    // Validar RPE y fatigue
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

    // Validar ejercicios y series
    for (const exercise of exercises) {
      if (!exercise.exerciseId || !exercise.sets || !Array.isArray(exercise.sets)) {
        return NextResponse.json(
          { error: 'Datos de ejercicio inválidos' },
          { status: 400 }
        )
      }

      for (const set of exercise.sets) {
        if (!set.setNumber || !set.reps || set.weight === undefined) {
          return NextResponse.json(
            { error: 'Datos de serie inválidos' },
            { status: 400 }
          )
        }
      }
    }

    // Crear workout day log con nested creates
    const workoutDayLog = await prisma.workoutDayLog.create({
      data: {
        microcycleId,
        templateDayId,
        completedDate: new Date(completedDate),
        durationMinutes,
        rpe,
        fatigue,
        emotionalState,
        clientNotes: clientNotes?.trim() || null,
        exerciseLogs: {
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
        },
      },
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

    return NextResponse.json(workoutDayLog, { status: 201 })
  } catch (error) {
    console.error('Error creating workout day log:', error)
    return NextResponse.json(
      { error: 'Error creating workout day log' },
      { status: 500 }
    )
  }
}
