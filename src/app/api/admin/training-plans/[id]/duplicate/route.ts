import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

// POST - Duplicar plan de entrenamiento completo
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)

    if (!session || session.user.role === 'CLIENT') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { clientId, title, startDate } = body

    // Validaciones
    if (!clientId || !title || !startDate) {
      return NextResponse.json(
        { error: 'Se requieren clientId, title y startDate' },
        { status: 400 }
      )
    }

    // Verificar que el cliente existe y pertenece al entrenador
    const client = await prisma.user.findFirst({
      where: {
        id: clientId,
        role: 'CLIENT',
        trainerId: session.user.id,
      },
    })

    if (!client) {
      return NextResponse.json(
        { error: 'Cliente no encontrado o no pertenece a este entrenador' },
        { status: 404 }
      )
    }

    // Obtener plan original con toda su estructura
    const originalPlan = await prisma.trainingPlan.findUnique({
      where: { id: params.id },
      include: {
        weeks: {
          include: {
            sessions: {
              include: {
                exercises: {
                  include: {
                    sets: {
                      orderBy: {
                        setNumber: 'asc',
                      },
                    },
                  },
                  orderBy: {
                    order: 'asc',
                  },
                },
              },
              orderBy: {
                dayNumber: 'asc',
              },
            },
          },
          orderBy: {
            weekNumber: 'asc',
          },
        },
      },
    })

    if (!originalPlan) {
      return NextResponse.json({ error: 'Plan no encontrado' }, { status: 404 })
    }

    // Desactivar planes anteriores del cliente
    await prisma.trainingPlan.updateMany({
      where: {
        userId: clientId,
        isActive: true,
      },
      data: { isActive: false },
    })

    // Calcular fechas de semanas
    const startDateObj = new Date(startDate)
    const numberOfWeeks = originalPlan.weeks.length

    // Crear nuevo plan duplicado
    const newPlan = await prisma.trainingPlan.create({
      data: {
        userId: clientId,
        title,
        description: originalPlan.description,
        startDate: startDateObj,
        endDate: new Date(
          startDateObj.getTime() + numberOfWeeks * 7 * 24 * 60 * 60 * 1000
        ),
        isActive: true,
        trainerNotes: originalPlan.trainerNotes,
        weeks: {
          create: originalPlan.weeks.map((week, weekIndex) => {
            const weekStartDate = new Date(
              startDateObj.getTime() + weekIndex * 7 * 24 * 60 * 60 * 1000
            )
            const weekEndDate = new Date(
              weekStartDate.getTime() + 6 * 24 * 60 * 60 * 1000
            )

            return {
              weekNumber: week.weekNumber,
              startDate: weekStartDate,
              endDate: weekEndDate,
              sessions: {
                create: week.sessions.map((session) => ({
                  dayNumber: session.dayNumber,
                  name: session.name,
                  description: session.description,
                  exercises: {
                    create: session.exercises.map((exercise) => ({
                      name: exercise.name,
                      description: exercise.description,
                      videoUrl: exercise.videoUrl,
                      targetSets: exercise.targetSets,
                      trainerComment: exercise.trainerComment,
                      order: exercise.order,
                      sets: {
                        create: exercise.sets.map((set) => ({
                          setNumber: set.setNumber,
                          minReps: set.minReps,
                          maxReps: set.maxReps,
                        })),
                      },
                    })),
                  },
                })),
              },
            }
          }),
        },
      },
      include: {
        weeks: {
          include: {
            sessions: {
              include: {
                exercises: {
                  include: {
                    sets: true,
                  },
                },
              },
            },
          },
        },
      },
    })

    return NextResponse.json(newPlan)
  } catch (error) {
    console.error('Error duplicating training plan:', error)
    return NextResponse.json(
      { error: 'Error al duplicar plan de entrenamiento' },
      { status: 500 }
    )
  }
}
