import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

// POST /api/admin/mesocycles/[id]/complete - Marcar mesociclo como completado
export async function POST(
  request: Request,
  { params }: { params: { mesocycleId: string } }
) {
  try {
    const session = await getServerSession(authOptions)

    if (!session || session.user.role !== 'TRAINER') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

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
        isActive: false,
        isCompleted: true,
        completedAt: new Date(),
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
    console.error('Error completing mesocycle:', error)
    return NextResponse.json(
      { error: 'Error completing mesocycle' },
      { status: 500 }
    )
  }
}
