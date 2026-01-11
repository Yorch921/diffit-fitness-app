import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

// PATCH /api/admin/exercises/[id] - Editar ejercicio
export async function PATCH(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)

    if (!session || session.user.role !== 'TRAINER') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { name, description, videoUrl, trainerComment, sets } = body

    // Verificar que el ejercicio pertenece al trainer
    const exercise = await prisma.exercise.findFirst({
      where: {
        id: params.id,
        templateDay: {
          template: {
            trainerId: session.user.id,
          },
        },
      },
      include: {
        sets: true,
      },
    })

    if (!exercise) {
      return NextResponse.json(
        { error: 'Exercise not found' },
        { status: 404 }
      )
    }

    // Validaciones
    if (name && name.trim() === '') {
      return NextResponse.json(
        { error: 'El nombre no puede estar vacío' },
        { status: 400 }
      )
    }

    // Si se proporcionan series, validarlas
    if (sets) {
      if (!Array.isArray(sets) || sets.length === 0) {
        return NextResponse.json(
          { error: 'Debe especificar al menos una serie' },
          { status: 400 }
        )
      }

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
    }

    // Actualizar ejercicio
    const updateData: any = {}
    if (name) updateData.name = name.trim()
    if (description !== undefined) updateData.description = description?.trim() || null
    if (videoUrl !== undefined) updateData.videoUrl = videoUrl?.trim() || null
    if (trainerComment !== undefined) updateData.trainerComment = trainerComment?.trim() || null

    // Si se proporcionan series, eliminar las existentes y crear las nuevas
    if (sets) {
      await prisma.exerciseSet.deleteMany({
        where: { exerciseId: params.id },
      })

      updateData.sets = {
        create: sets.map((set: any) => ({
          setNumber: set.setNumber,
          minReps: set.minReps,
          maxReps: set.maxReps,
          restSeconds: set.restSeconds || null,
        })),
      }
    }

    const updatedExercise = await prisma.exercise.update({
      where: { id: params.id },
      data: updateData,
      include: {
        sets: {
          orderBy: { setNumber: 'asc' },
        },
      },
    })

    return NextResponse.json(updatedExercise)
  } catch (error) {
    console.error('Error updating exercise:', error)
    return NextResponse.json(
      { error: 'Error updating exercise' },
      { status: 500 }
    )
  }
}

// DELETE /api/admin/exercises/[id] - Eliminar ejercicio
export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)

    if (!session || session.user.role !== 'TRAINER') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Verificar que el ejercicio pertenece al trainer
    const exercise = await prisma.exercise.findFirst({
      where: {
        id: params.id,
        templateDay: {
          template: {
            trainerId: session.user.id,
          },
        },
      },
      include: {
        exerciseLogs: true,
      },
    })

    if (!exercise) {
      return NextResponse.json(
        { error: 'Exercise not found' },
        { status: 404 }
      )
    }

    // Verificar si hay logs asociados
    if (exercise.exerciseLogs.length > 0) {
      return NextResponse.json(
        {
          error:
            'No se puede eliminar este ejercicio porque tiene registros de entrenamiento asociados',
        },
        { status: 400 }
      )
    }

    await prisma.exercise.delete({
      where: { id: params.id },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting exercise:', error)
    return NextResponse.json(
      { error: 'Error deleting exercise' },
      { status: 500 }
    )
  }
}
