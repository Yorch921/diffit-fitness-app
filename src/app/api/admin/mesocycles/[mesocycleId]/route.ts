import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

// GET /api/admin/mesocycles/[id] - Detalle mesociclo con microciclos
export async function GET(
  request: Request,
  { params }: { params: { mesocycleId: string } }
) {
  try {
    const session = await getServerSession(authOptions)

    if (!session || session.user.role !== 'TRAINER') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const mesocycle = await prisma.clientMesocycle.findFirst({
      where: {
        id: params.mesocycleId,
        trainerId: session.user.id,
      },
      include: {
        client: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        template: {
          include: {
            days: {
              orderBy: { dayNumber: 'asc' },
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
            },
          },
        },
        microcycles: {
          orderBy: { weekNumber: 'asc' },
          include: {
            workoutDayLogs: {
              include: {
                templateDay: {
                  select: {
                    id: true,
                    dayNumber: true,
                    name: true,
                  },
                },
              },
            },
          },
        },
      },
    })

    if (!mesocycle) {
      return NextResponse.json(
        { error: 'Mesocycle not found' },
        { status: 404 }
      )
    }

    return NextResponse.json(mesocycle)
  } catch (error) {
    console.error('Error fetching mesocycle:', error)
    return NextResponse.json(
      { error: 'Error fetching mesocycle' },
      { status: 500 }
    )
  }
}

// PATCH /api/admin/mesocycles/[id] - Actualizar notas o duración
export async function PATCH(
  request: Request,
  { params }: { params: { mesocycleId: string } }
) {
  try {
    const session = await getServerSession(authOptions)

    if (!session || session.user.role !== 'TRAINER') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { trainerNotes } = body

    // Verificar que el mesociclo pertenece al trainer
    const existingMesocycle = await prisma.clientMesocycle.findFirst({
      where: {
        id: params.mesocycleId,
        trainerId: session.user.id,
      },
    })

    if (!existingMesocycle) {
      return NextResponse.json(
        { error: 'Mesocycle not found' },
        { status: 404 }
      )
    }

    const mesocycle = await prisma.clientMesocycle.update({
      where: { id: params.mesocycleId },
      data: {
        trainerNotes: trainerNotes?.trim() || null,
      },
      include: {
        client: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        template: {
          select: {
            id: true,
            title: true,
            numberOfDays: true,
          },
        },
      },
    })

    return NextResponse.json(mesocycle)
  } catch (error) {
    console.error('Error updating mesocycle:', error)
    return NextResponse.json(
      { error: 'Error updating mesocycle' },
      { status: 500 }
    )
  }
}
