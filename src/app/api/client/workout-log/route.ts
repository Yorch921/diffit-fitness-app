import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

// Guardar/actualizar registro de entrenamiento del cliente
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session || session.user.role !== 'CLIENT') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { exerciseId, weekNumber, setNumber, reps, weight } = body

    // Validar que el ejercicio existe
    const exercise = await prisma.exercise.findUnique({
      where: { id: exerciseId },
    })

    if (!exercise) {
      return NextResponse.json({ error: 'Ejercicio no encontrado' }, { status: 404 })
    }

    // Upsert (crear o actualizar) el registro
    const log = await prisma.clientWorkoutLog.upsert({
      where: {
        exerciseId_userId_weekNumber_setNumber: {
          exerciseId,
          userId: session.user.id,
          weekNumber,
          setNumber,
        },
      },
      update: {
        reps: reps !== null ? reps : undefined,
        weight: weight !== null ? weight : undefined,
      },
      create: {
        exerciseId,
        userId: session.user.id,
        weekNumber,
        setNumber,
        reps,
        weight,
      },
    })

    return NextResponse.json(log)
  } catch (error) {
    console.error('Error saving workout log:', error)
    return NextResponse.json(
      { error: 'Error al guardar registro' },
      { status: 500 }
    )
  }
}

// Obtener registros de entrenamiento del cliente para un ejercicio
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session || session.user.role !== 'CLIENT') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const exerciseId = searchParams.get('exerciseId')
    const weekNumber = searchParams.get('weekNumber')

    if (!exerciseId) {
      return NextResponse.json({ error: 'exerciseId es requerido' }, { status: 400 })
    }

    const where: any = {
      exerciseId,
      userId: session.user.id,
    }

    if (weekNumber) {
      where.weekNumber = parseInt(weekNumber)
    }

    const logs = await prisma.clientWorkoutLog.findMany({
      where,
      orderBy: [{ weekNumber: 'asc' }, { setNumber: 'asc' }],
    })

    return NextResponse.json(logs)
  } catch (error) {
    console.error('Error fetching workout logs:', error)
    return NextResponse.json(
      { error: 'Error al obtener registros' },
      { status: 500 }
    )
  }
}
