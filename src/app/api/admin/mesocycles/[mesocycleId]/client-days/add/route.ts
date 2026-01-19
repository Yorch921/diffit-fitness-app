import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

// POST /api/admin/mesocycles/[mesocycleId]/client-days/add - Agregar día a mesociclo forked
export async function POST(
  request: Request,
  { params }: { params: { mesocycleId: string } }
) {
  try {
    const session = await getServerSession(authOptions)

    if (!session || session.user.role !== 'TRAINER') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { dayNumber, name, description, order } = body

    if (!name || name.trim() === '') {
      return NextResponse.json(
        { error: 'El nombre del día es requerido' },
        { status: 400 }
      )
    }

    // Verificar que el mesociclo pertenece al trainer y está forked
    const mesocycle = await prisma.clientMesocycle.findFirst({
      where: {
        id: params.mesocycleId,
        trainerId: session.user.id,
      },
      include: {
        clientDays: {
          orderBy: { order: 'desc' },
          take: 1,
        },
      },
    })

    if (!mesocycle) {
      return NextResponse.json(
        { error: 'Mesociclo no encontrado' },
        { status: 404 }
      )
    }

    if (!mesocycle.isForked) {
      return NextResponse.json(
        { error: 'El mesociclo debe estar desvinculado para agregar días' },
        { status: 400 }
      )
    }

    // Calcular el siguiente orden
    const nextOrder = mesocycle.clientDays.length > 0
      ? mesocycle.clientDays[0].order + 1
      : 1

    const clientDay = await prisma.clientDay.create({
      data: {
        mesocycleId: params.mesocycleId,
        dayNumber: dayNumber || nextOrder,
        name: name.trim(),
        description: description?.trim() || null,
        order: order || nextOrder,
      },
      include: {
        exercises: {
          orderBy: { order: 'asc' },
          include: {
            sets: {
              orderBy: { setNumber: 'asc' },
            },
          },
        },
      },
    })

    return NextResponse.json(clientDay)
  } catch (error) {
    console.error('Error creating client day:', error)
    return NextResponse.json(
      { error: 'Error al crear día' },
      { status: 500 }
    )
  }
}
