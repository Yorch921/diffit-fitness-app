import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

// POST /api/admin/training-templates/[id]/days/[dayId]/exercises - Agregar ejercicio
export async function POST(
  request: Request,
  { params }: { params: { id: string; dayId: string } }
) {
  try {
    const session = await getServerSession(authOptions)

    if (!session || session.user.role !== 'TRAINER') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { name, description, videoUrl, trainerComment, sets } = body

    // Verificar que el día pertenece a un template del trainer
    const templateDay = await prisma.templateDay.findFirst({
      where: {
        id: params.dayId,
        templateId: params.id,
        template: {
          trainerId: session.user.id,
        },
      },
      include: {
        exercises: true,
      },
    })

    if (!templateDay) {
      return NextResponse.json(
        { error: 'Template day not found' },
        { status: 404 }
      )
    }

    // Validaciones
    if (!name || name.trim() === '') {
      return NextResponse.json(
        { error: 'El nombre del ejercicio es obligatorio' },
        { status: 400 }
      )
    }

    if (!sets || !Array.isArray(sets) || sets.length === 0) {
      return NextResponse.json(
        { error: 'Debe especificar al menos una serie' },
        { status: 400 }
      )
    }

    // Validar cada serie
    for (const set of sets) {
      if (!set.setNumber || set.setNumber < 1) {
        return NextResponse.json(
          { error: 'Número de serie inválido' },
          { status: 400 }
        )
      }
      if (!set.minReps || !set.maxReps || set.minReps < 1 || set.maxReps < set.minReps) {
        return NextResponse.json(
          { error: 'Rango de repeticiones inválido' },
          { status: 400 }
        )
      }
    }

    // Calcular el siguiente orden
    const nextOrder = templateDay.exercises.length > 0
      ? Math.max(...templateDay.exercises.map((e) => e.order)) + 1
      : 1

    // Crear ejercicio con sus series
    const exercise = await prisma.exercise.create({
      data: {
        templateDayId: params.dayId,
        name: name.trim(),
        description: description?.trim() || null,
        videoUrl: videoUrl?.trim() || null,
        trainerComment: trainerComment?.trim() || null,
        order: nextOrder,
        sets: {
          create: sets.map((set: any) => ({
            setNumber: set.setNumber,
            minReps: set.minReps,
            maxReps: set.maxReps,
            restSeconds: set.restSeconds || null,
          })),
        },
      },
      include: {
        sets: {
          orderBy: { setNumber: 'asc' },
        },
      },
    })

    return NextResponse.json(exercise, { status: 201 })
  } catch (error) {
    console.error('Error creating exercise:', error)
    return NextResponse.json(
      { error: 'Error creating exercise' },
      { status: 500 }
    )
  }
}
