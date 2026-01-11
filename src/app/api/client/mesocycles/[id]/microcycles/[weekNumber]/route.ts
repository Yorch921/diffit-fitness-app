import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

// GET /api/client/mesocycles/[id]/microcycles/[weekNumber] - Obtener microciclo con logs
export async function GET(
  request: Request,
  { params }: { params: { id: string; weekNumber: string } }
) {
  try {
    const session = await getServerSession(authOptions)

    if (!session || session.user.role !== 'CLIENT') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const weekNum = parseInt(params.weekNumber)

    if (isNaN(weekNum)) {
      return NextResponse.json(
        { error: 'Week number inválido' },
        { status: 400 }
      )
    }

    const microcycle = await prisma.microcycle.findFirst({
      where: {
        mesocycleId: params.id,
        weekNumber: weekNum,
        mesocycle: {
          clientId: session.user.id,
        },
      },
      include: {
        mesocycle: {
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
          },
        },
        workoutDayLogs: {
          include: {
            templateDay: {
              select: {
                id: true,
                dayNumber: true,
                name: true,
              },
            },
            exerciseLogs: {
              include: {
                exercise: {
                  select: {
                    id: true,
                    name: true,
                  },
                },
                setLogs: {
                  orderBy: { setNumber: 'asc' },
                },
              },
            },
          },
        },
      },
    })

    if (!microcycle) {
      return NextResponse.json(
        { error: 'Microcycle not found' },
        { status: 404 }
      )
    }

    return NextResponse.json(microcycle)
  } catch (error) {
    console.error('Error fetching microcycle:', error)
    return NextResponse.json(
      { error: 'Error fetching microcycle' },
      { status: 500 }
    )
  }
}
