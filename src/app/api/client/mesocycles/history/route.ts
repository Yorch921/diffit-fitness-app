import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

// GET /api/client/mesocycles/history - Listar mesociclos completados
export async function GET() {
  try {
    const session = await getServerSession(authOptions)

    if (!session || session.user.role !== 'CLIENT') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const mesocycles = await prisma.clientMesocycle.findMany({
      where: {
        clientId: session.user.id,
        isCompleted: true,
      },
      include: {
        template: {
          select: {
            id: true,
            title: true,
            description: true,
            numberOfDays: true,
          },
        },
        trainer: {
          select: {
            id: true,
            name: true,
          },
        },
        _count: {
          select: {
            microcycles: true,
          },
        },
      },
      orderBy: { completedAt: 'desc' },
    })

    return NextResponse.json(mesocycles)
  } catch (error) {
    console.error('Error fetching mesocycle history:', error)
    return NextResponse.json(
      { error: 'Error fetching mesocycle history' },
      { status: 500 }
    )
  }
}
