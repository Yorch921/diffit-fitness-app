import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

// PUT - Editar ejercicio completo
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)

    if (!session || session.user.role === 'CLIENT') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { name, description, videoUrl, trainerComment, sets, targetSets } = body

    // Validaciones
    if (!name || name.trim() === '') {
      return NextResponse.json({ error: 'El nombre del ejercicio es obligatorio' }, { status: 400 })
    }

    if (!description || description.trim() === '') {
      return NextResponse.json({ error: 'La explicación técnica es obligatoria' }, { status: 400 })
    }

    if (!trainerComment || trainerComment.trim() === '') {
      return NextResponse.json({ error: 'El comentario del entrenador es obligatorio' }, { status: 400 })
    }

    if (sets && (!Array.isArray(sets) || sets.length === 0)) {
      return NextResponse.json({ error: 'Debe definir al menos una serie' }, { status: 400 })
    }

    // Actualizar ejercicio y reemplazar series
    const exercise = await prisma.exercise.update({
      where: { id: params.id },
      data: {
        name,
        description,
        videoUrl,
        trainerComment,
        targetSets, // Mantener por compatibilidad
        // Reemplazar series estructuradas si se envían
        ...(sets && sets.length > 0 && {
          sets: {
            deleteMany: {}, // Eliminar series existentes
            create: sets.map((set: any, index: number) => ({
              setNumber: index + 1,
              minReps: set.minReps || 8,
              maxReps: set.maxReps || 12,
            })),
          },
        }),
      },
      include: {
        sets: {
          orderBy: {
            setNumber: 'asc',
          },
        },
      },
    })

    return NextResponse.json(exercise)
  } catch (error) {
    console.error('Error updating exercise:', error)
    return NextResponse.json(
      { error: 'Error al actualizar ejercicio' },
      { status: 500 }
    )
  }
}

// DELETE - Eliminar ejercicio
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)

    if (!session || session.user.role === 'CLIENT') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Eliminar ejercicio (las series se eliminan automáticamente por cascada)
    await prisma.exercise.delete({
      where: { id: params.id },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting exercise:', error)
    return NextResponse.json(
      { error: 'Error al eliminar ejercicio' },
      { status: 500 }
    )
  }
}
