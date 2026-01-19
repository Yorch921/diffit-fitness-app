import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

// PATCH /api/admin/client-exercises/[id] - Editar ejercicio de cliente (plan forked)
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

    // Verificar que el ejercicio pertenece al trainer (a través de mesocycle)
    const exercise = await prisma.clientExercise.findFirst({
      where: {
        id: params.id,
        clientDay: {
          mesocycle: {
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
        { error: 'Ejercicio no encontrado' },
        { status: 404 }
      )
    }

    // Validaciones
    if (name !== undefined && name.trim() === '') {
      return NextResponse.json(
        { error: 'El nombre no puede estar vacío' },
        { status: 400 }
      )
    }

    // Validar y normalizar series si se proporcionan
    if (sets) {
      if (!Array.isArray(sets) || sets.length === 0) {
        return NextResponse.json(
          { error: 'Debe especificar al menos una serie' },
          { status: 400 }
        )
      }

      for (let i = 0; i < sets.length; i++) {
        const set = sets[i]
        const setNumber = typeof set.setNumber === 'string' ? parseInt(set.setNumber, 10) : set.setNumber
        const minReps = typeof set.minReps === 'string' ? parseInt(set.minReps, 10) : set.minReps
        const maxReps = typeof set.maxReps === 'string' ? parseInt(set.maxReps, 10) : set.maxReps

        if (isNaN(setNumber) || setNumber < 1) {
          return NextResponse.json(
            { error: `Serie ${i + 1}: número de serie inválido` },
            { status: 400 }
          )
        }
        if (isNaN(minReps) || minReps < 1) {
          return NextResponse.json(
            { error: `Serie ${i + 1}: repeticiones mínimas inválidas` },
            { status: 400 }
          )
        }
        if (isNaN(maxReps) || maxReps < 1) {
          return NextResponse.json(
            { error: `Serie ${i + 1}: repeticiones máximas inválidas` },
            { status: 400 }
          )
        }
        if (maxReps < minReps) {
          return NextResponse.json(
            { error: `Serie ${i + 1}: las repeticiones máximas deben ser mayores o iguales a las mínimas` },
            { status: 400 }
          )
        }

        sets[i] = {
          ...set,
          setNumber,
          minReps,
          maxReps,
          restSeconds: set.restSeconds ? (typeof set.restSeconds === 'string' ? parseInt(set.restSeconds, 10) : set.restSeconds) : null,
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
      await prisma.clientExerciseSet.deleteMany({
        where: { clientExerciseId: params.id },
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

    const updatedExercise = await prisma.clientExercise.update({
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
    console.error('Error updating client exercise:', error)
    return NextResponse.json(
      { error: 'Error al actualizar ejercicio' },
      { status: 500 }
    )
  }
}

// DELETE /api/admin/client-exercises/[id] - Eliminar ejercicio de cliente
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
    const exercise = await prisma.clientExercise.findFirst({
      where: {
        id: params.id,
        clientDay: {
          mesocycle: {
            trainerId: session.user.id,
          },
        },
      },
    })

    if (!exercise) {
      return NextResponse.json(
        { error: 'Ejercicio no encontrado' },
        { status: 404 }
      )
    }

    await prisma.clientExercise.delete({
      where: { id: params.id },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting client exercise:', error)
    return NextResponse.json(
      { error: 'Error al eliminar ejercicio' },
      { status: 500 }
    )
  }
}
