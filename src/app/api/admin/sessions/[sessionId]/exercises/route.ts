import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function POST(
  request: NextRequest,
  { params }: { params: { sessionId: string } }
) {
  try {
    const session = await getServerSession(authOptions)

    if (!session || session.user.role === 'CLIENT') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { exercises } = body

    // Verificar que la sesión pertenece al trainer
    const trainingSession = await prisma.trainingSession.findFirst({
      where: {
        id: params.sessionId,
        week: {
          trainingPlan: {
            user: {
              trainerId: session.user.id,
            },
          },
        },
      },
    })

    if (!trainingSession) {
      return NextResponse.json(
        { error: 'Sesión no encontrada' },
        { status: 404 }
      )
    }

    // Eliminar ejercicios existentes
    await prisma.exercise.deleteMany({
      where: {
        sessionId: params.sessionId,
      },
    })

    // Crear nuevos ejercicios
    const createdExercises = await Promise.all(
      exercises.map((exercise: any) =>
        prisma.exercise.create({
          data: {
            sessionId: params.sessionId,
            name: exercise.name,
            description: exercise.description || null,
            videoUrl: exercise.videoUrl || null,
            order: exercise.order,
          },
        })
      )
    )

    return NextResponse.json({ success: true, exercises: createdExercises })
  } catch (error) {
    console.error('Error saving exercises:', error)
    return NextResponse.json(
      { error: 'Error al guardar ejercicios' },
      { status: 500 }
    )
  }
}
