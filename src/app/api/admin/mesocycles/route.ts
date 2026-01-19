import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

// GET /api/admin/mesocycles - Listar mesociclos (filtros: clientId, isActive)
export async function GET(request: Request) {
  try {
    const session = await getServerSession(authOptions)

    if (!session || session.user.role !== 'TRAINER') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const clientId = searchParams.get('clientId')
    const isActive = searchParams.get('isActive')

    const where: any = {
      trainerId: session.user.id,
    }

    if (clientId) {
      where.clientId = clientId
    }

    if (isActive !== null) {
      where.isActive = isActive === 'true'
    }

    const mesocycles = await prisma.clientMesocycle.findMany({
      where,
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
        _count: {
          select: { microcycles: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    })

    return NextResponse.json(mesocycles)
  } catch (error) {
    console.error('Error fetching mesocycles:', error)
    return NextResponse.json(
      { error: 'Error fetching mesocycles' },
      { status: 500 }
    )
  }
}

// POST /api/admin/mesocycles - Asignar template a cliente (crear mesociclo + microciclos)
export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions)

    if (!session || session.user.role !== 'TRAINER') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { clientId, templateId, startDate, durationWeeks, trainerNotes } = body

    // Validaciones
    if (!clientId || !templateId || !startDate) {
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

    // Verificar que el template existe y no está archivado
    const template = await prisma.trainingTemplate.findFirst({
      where: {
        id: templateId,
        isArchived: false,
      },
    })

    if (!template) {
      return NextResponse.json(
        { error: 'Template no encontrado' },
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

    // Calcular endDate
    const start = new Date(startDate)
    const end = new Date(start)
    end.setDate(end.getDate() + durationWeeks * 7 - 1)

    // Crear mesociclo
    const mesocycle = await prisma.clientMesocycle.create({
      data: {
        clientId,
        templateId,
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
          select: {
            id: true,
            title: true,
            numberOfDays: true,
          },
        },
        microcycles: {
          orderBy: { weekNumber: 'asc' },
        },
      },
    })

    return NextResponse.json(result, { status: 201 })
  } catch (error) {
    console.error('Error creating mesocycle:', error)
    return NextResponse.json(
      { error: 'Error creating mesocycle' },
      { status: 500 }
    )
  }
}
