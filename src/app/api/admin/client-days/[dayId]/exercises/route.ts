import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

// POST /api/admin/client-days/[dayId]/exercises - Agregar ejercicio a día de cliente (plan forked)
export async function POST(
  request: Request,
  { params }: { params: { dayId: string } }
) {
  try {
    const session = await getServerSession(authOptions)

    if (!session || session.user.role !== 'TRAINER') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { name, description, videoUrl, trainerComment, sets } = body

    if (!name || name.trim() === '') {
      return NextResponse.json(
        { error: 'El nombre del ejercicio es requerido' },
        { status: 400 }
      )
    }

    // Verificar que el día pertenece al trainer
    const clientDay = await prisma.clientDay.findFirst({
      where: {
        id: params.dayId,
        mesocycle: {
          trainerId: session.user.id,
        },
      },
      include: {
        exercises: {
          orderBy: { order: 'desc' },
          take: 1,
        },
      },
    })

    if (!clientDay) {
      return NextResponse.json(
        { error: 'Día no encontrado' },
        { status: 404 }
      )
    }

    // Calcular el siguiente orden
    const nextOrder = clientDay.exercises.length > 0
      ? clientDay.exercises[0].order + 1
      : 1

    // Validar series si se proporcionan
    const validatedSets = []
    if (sets && Array.isArray(sets)) {
      for (let i = 0; i < sets.length; i++) {
        const set = sets[i]
        const setNumber = typeof set.setNumber === 'string' ? parseInt(set.setNumber, 10) : set.setNumber
        const minReps = typeof set.minReps === 'string' ? parseInt(set.minReps, 10) : set.minReps
        const maxReps = typeof set.maxReps === 'string' ? parseInt(set.maxReps, 10) : set.maxReps

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

        validatedSets.push({
          setNumber: isNaN(setNumber) ? i + 1 : setNumber,
          minReps,
          maxReps,
          restSeconds: set.restSeconds ? (typeof set.restSeconds === 'string' ? parseInt(set.restSeconds, 10) : set.restSeconds) : null,
        })
      }
    }

    // Crear ejercicio
    const exercise = await prisma.clientExercise.create({
      data: {
        clientDayId: params.dayId,
        name: name.trim(),
        description: description?.trim() || null,
        videoUrl: videoUrl?.trim() || null,
        trainerComment: trainerComment?.trim() || null,
        order: nextOrder,
        sets: validatedSets.length > 0 ? {
          create: validatedSets,
        } : undefined,
      },
      include: {
        sets: {
          orderBy: { setNumber: 'asc' },
        },
      },
    })

    return NextResponse.json(exercise)
  } catch (error) {
    console.error('Error creating client exercise:', error)
    return NextResponse.json(
      { error: 'Error al crear ejercicio' },
      { status: 500 }
    )
  }
}
