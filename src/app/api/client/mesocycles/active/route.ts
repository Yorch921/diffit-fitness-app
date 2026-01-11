import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

// GET /api/client/mesocycles/active - Obtener mesociclo activo con template
export async function GET() {
  try {
    const session = await getServerSession(authOptions)

    if (!session || session.user.role !== 'CLIENT') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const mesocycle = await prisma.clientMesocycle.findFirst({
      where: {
        clientId: session.user.id,
        isActive: true,
      },
      include: {
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
        trainer: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        microcycles: {
          orderBy: { weekNumber: 'asc' },
        },
      },
    })

    if (!mesocycle) {
      return NextResponse.json(
        { error: 'No active mesocycle found' },
        { status: 404 }
      )
    }

    return NextResponse.json(mesocycle)
  } catch (error) {
    console.error('Error fetching active mesocycle:', error)
    return NextResponse.json(
      { error: 'Error fetching active mesocycle' },
      { status: 500 }
    )
  }
}
