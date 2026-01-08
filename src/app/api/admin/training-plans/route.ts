import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { addWeeks } from 'date-fns'

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session || session.user.role === 'CLIENT') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { clientId, title, description, startDate, numberOfWeeks } = body

    // Validar que el cliente pertenece al trainer
    const client = await prisma.user.findFirst({
      where: {
        id: clientId,
        trainerId: session.user.id,
      },
    })

    if (!client) {
      return NextResponse.json(
        { error: 'Cliente no encontrado' },
        { status: 404 }
      )
    }

    // Desactivar planes anteriores
    await prisma.trainingPlan.updateMany({
      where: {
        userId: clientId,
        isActive: true,
      },
      data: {
        isActive: false,
      },
    })

    // Crear el plan
    const plan = await prisma.trainingPlan.create({
      data: {
        userId: clientId,
        title,
        description,
        startDate: new Date(startDate),
        isActive: true,
      },
    })

    // Crear las semanas y sesiones
    const start = new Date(startDate)

    for (let weekNum = 1; weekNum <= numberOfWeeks; weekNum++) {
      const weekStart = addWeeks(start, weekNum - 1)
      const weekEnd = addWeeks(weekStart, 1)

      const week = await prisma.trainingWeek.create({
        data: {
          trainingPlanId: plan.id,
          weekNumber: weekNum,
          startDate: weekStart,
          endDate: weekEnd,
        },
      })

      // Crear 5 sesiones por semana
      for (let dayNum = 1; dayNum <= 5; dayNum++) {
        await prisma.trainingSession.create({
          data: {
            weekId: week.id,
            dayNumber: dayNum,
            name: `Día ${dayNum} - Semana ${weekNum}`,
            description: `Sesión de entrenamiento del día ${dayNum}`,
          },
        })
      }
    }

    return NextResponse.json(plan)
  } catch (error) {
    console.error('Error creating training plan:', error)
    return NextResponse.json(
      { error: 'Error al crear plan de entrenamiento' },
      { status: 500 }
    )
  }
}
