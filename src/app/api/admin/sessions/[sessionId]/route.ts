import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET(
  request: NextRequest,
  { params }: { params: { sessionId: string } }
) {
  try {
    const session = await getServerSession(authOptions)

    if (!session || session.user.role === 'CLIENT') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const trainingSession = await prisma.trainingSession.findFirst({
      where: {
        id: params.sessionId,
        week: {
          trainingPlan: {
            user: {
              trainerId: session.user.id,
            },
          },
        },
      },
      include: {
        exercises: {
          orderBy: {
            order: 'asc',
          },
        },
      },
    })

    if (!trainingSession) {
      return NextResponse.json(
        { error: 'Sesión no encontrada' },
        { status: 404 }
      )
    }

    return NextResponse.json(trainingSession)
  } catch (error) {
    console.error('Error fetching session:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
