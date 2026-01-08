import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)

    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const trainingSession = await prisma.trainingSession.findUnique({
      where: {
        id: params.id,
      },
      include: {
        exercises: {
          orderBy: {
            order: 'asc',
          },
        },
        week: {
          include: {
            trainingPlan: true,
          },
        },
      },
    })

    if (!trainingSession) {
      return NextResponse.json({ error: 'Session not found' }, { status: 404 })
    }

    // Verificar que la sesión pertenece al usuario
    if (trainingSession.week.trainingPlan.userId !== session.user.id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    // Obtener datos del último entrenamiento para cada ejercicio
    const lastWorkoutData: Record<string, any> = {}

    for (const exercise of trainingSession.exercises) {
      const lastData = await prisma.exerciseData.findFirst({
        where: {
          exerciseId: exercise.id,
          workoutSession: {
            userId: session.user.id,
          },
        },
        orderBy: {
          createdAt: 'desc',
        },
      })

      if (lastData) {
        lastWorkoutData[exercise.id] = {
          reps: lastData.reps,
          weight: lastData.weight,
          rir: lastData.rir,
          notes: lastData.notes,
        }
      }
    }

    return NextResponse.json({
      ...trainingSession,
      lastWorkoutData,
    })
  } catch (error) {
    console.error('Error fetching session:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
