import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { EmotionalState } from '@prisma/client'

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const {
      sessionId,
      exerciseData,
      emotionalState,
      fatigueLevel,
      waterIntake,
      notes,
    } = body

    // Crear la sesión de entrenamiento completada
    const workoutSession = await prisma.workoutSession.create({
      data: {
        userId: session.user.id,
        sessionId,
        emotionalState: emotionalState as EmotionalState,
        fatigueLevel,
        waterIntake,
        notes,
        exerciseData: {
          create: exerciseData.map((data: any) => ({
            exerciseId: data.exerciseId,
            reps: data.reps,
            weight: data.weight,
            rir: data.rir,
            notes: data.notes,
          })),
        },
      },
    })

    return NextResponse.json(workoutSession)
  } catch (error) {
    console.error('Error creating workout session:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
