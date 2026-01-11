import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

// Agregar ejercicio a una sesión (SOLO ENTRENADOR)
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)

    if (!session || session.user.role === 'CLIENT') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const {
      name,
      description,
      videoUrl,
      targetSets,
      trainerComment,
      order,
    } = body

    // Verificar que la sesión existe y pertenece a un plan del trainer
    const trainingSession = await prisma.trainingSession.findFirst({
      where: {
        id: params.id,
      },
      include: {
        week: {
          include: {
            trainingPlan: {
              include: {
                user: true,
              },
            },
          },
        },
      },
    })

    if (!trainingSession) {
      return NextResponse.json({ error: 'Sesión no encontrada' }, { status: 404 })
    }

    // Verificar que el cliente del plan pertenece al trainer (si aplica)
    // En este caso, como todos los admins ven todos los clientes, solo verificamos que sea admin

    // Crear el ejercicio (PLAN DEL ENTRENADOR)
    const exercise = await prisma.exercise.create({
      data: {
        sessionId: params.id,
        name,
        description, // Explicación técnica
        videoUrl, // Enlace a vídeo
        targetSets, // Series objetivo (ej: "3 x 12-10-8")
        trainerComment, // Comentario del entrenador
        order: order || 1,
      },
    })

    return NextResponse.json(exercise)
  } catch (error) {
    console.error('Error creating exercise:', error)
    return NextResponse.json(
      { error: 'Error al crear ejercicio' },
      { status: 500 }
    )
  }
}

// Obtener ejercicios de una sesión
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)

    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const exercises = await prisma.exercise.findMany({
      where: {
        sessionId: params.id,
      },
      orderBy: {
        order: 'asc',
      },
    })

    return NextResponse.json(exercises)
  } catch (error) {
    console.error('Error fetching exercises:', error)
    return NextResponse.json(
      { error: 'Error al obtener ejercicios' },
      { status: 500 }
    )
  }
}
