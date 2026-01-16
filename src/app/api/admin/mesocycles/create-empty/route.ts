import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

// POST /api/admin/mesocycles/create-empty - Crear plan desde cero (sin plantilla)
export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions)

    if (!session || session.user.role !== 'TRAINER') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { clientId, startDate, durationWeeks, trainerNotes, planTitle, numberOfDays } = body

    // Validaciones
    if (!clientId || !startDate || !planTitle || !numberOfDays) {
      return NextResponse.json(
        { error: 'Faltan datos obligatorios' },
        { status: 400 }
      )
    }

    if (durationWeeks < 1 || durationWeeks > 52) {
      return NextResponse.json(
        { error: 'La duración debe estar entre 1 y 52 semanas' },
        { status: 400 }
      )
    }

    if (numberOfDays < 1 || numberOfDays > 7) {
      return NextResponse.json(
        { error: 'Los días de entrenamiento deben estar entre 1 y 7' },
        { status: 400 }
      )
    }

    // Verificar que el cliente pertenece al trainer
    const client = await prisma.user.findFirst({
      where: {
        id: clientId,
        trainerId: session.user.id,
        role: 'CLIENT',
      },
    })

    if (!client) {
      return NextResponse.json(
        { error: 'Cliente no encontrado' },
        { status: 404 }
      )
    }

    // Desactivar mesociclo anterior si existe
    await prisma.clientMesocycle.updateMany({
      where: {
        clientId,
        isActive: true,
      },
      data: {
        isActive: false,
        isCompleted: true,
        completedAt: new Date(),
      },
    })

    // Primero crear una plantilla temporal para este cliente
    const template = await prisma.trainingTemplate.create({
      data: {
        title: `${planTitle} (Cliente: ${client.name})`,
        description: `Plan personalizado creado para ${client.name}`,
        trainerId: session.user.id,
        numberOfDays: numberOfDays,
      },
    })

    // Crear días vacíos en la plantilla
    const templateDays = []
    for (let dayNum = 1; dayNum <= numberOfDays; dayNum++) {
      templateDays.push({
        templateId: template.id,
        dayNumber: dayNum,
        name: `Día ${dayNum}`,
        description: '',
        order: dayNum,
      })
    }

    await prisma.templateDay.createMany({
      data: templateDays,
    })

    // Calcular endDate
    const start = new Date(startDate)
    const end = new Date(start)
    end.setDate(end.getDate() + durationWeeks * 7 - 1)

    // Crear mesociclo
    const mesocycle = await prisma.clientMesocycle.create({
      data: {
        clientId,
        templateId: template.id,
        trainerId: session.user.id,
        startDate: start,
        durationWeeks: durationWeeks || 20,
        endDate: end,
        isActive: true,
        trainerNotes: trainerNotes?.trim() || null,
      },
    })

    // Crear microciclos
    const microcycles = []
    for (let weekNum = 1; weekNum <= durationWeeks; weekNum++) {
      const microcycleStartDate = new Date(start)
      microcycleStartDate.setDate(microcycleStartDate.getDate() + (weekNum - 1) * 7)

      const microcycleEndDate = new Date(microcycleStartDate)
      microcycleEndDate.setDate(microcycleEndDate.getDate() + 6)

      microcycles.push({
        mesocycleId: mesocycle.id,
        weekNumber: weekNum,
        startDate: microcycleStartDate,
        endDate: microcycleEndDate,
      })
    }

    await prisma.microcycle.createMany({
      data: microcycles,
    })

    // Retornar mesociclo con microciclos
    const result = await prisma.clientMesocycle.findUnique({
      where: { id: mesocycle.id },
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
              orderBy: { order: 'asc' },
            },
          },
        },
        microcycles: {
          orderBy: { weekNumber: 'asc' },
        },
      },
    })

    return NextResponse.json(result, { status: 201 })
  } catch (error) {
    console.error('Error creating empty plan:', error)
    return NextResponse.json(
      { error: 'Error creating empty plan' },
      { status: 500 }
    )
  }
}
