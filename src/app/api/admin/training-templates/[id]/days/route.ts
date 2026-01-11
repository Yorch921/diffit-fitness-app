import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

// POST /api/admin/training-templates/[id]/days - Agregar día
export async function POST(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)

    if (!session || session.user.role !== 'TRAINER') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { dayNumber, name, description } = body

    // Verificar que el template pertenece al trainer
    const template = await prisma.trainingTemplate.findFirst({
      where: {
        id: params.id,
        trainerId: session.user.id,
      },
      include: {
        days: true,
      },
    })

    if (!template) {
      return NextResponse.json(
        { error: 'Template not found' },
        { status: 404 }
      )
    }

    // Validaciones
    if (!dayNumber || dayNumber < 1 || dayNumber > template.numberOfDays) {
      return NextResponse.json(
        {
          error: `El número de día debe estar entre 1 y ${template.numberOfDays}`,
        },
        { status: 400 }
      )
    }

    if (!name || name.trim() === '') {
      return NextResponse.json(
        { error: 'El nombre del día es obligatorio' },
        { status: 400 }
      )
    }

    // Verificar que no existe ya un día con ese número
    const existingDay = template.days.find((d) => d.dayNumber === dayNumber)
    if (existingDay) {
      return NextResponse.json(
        { error: `Ya existe el día ${dayNumber} en este template` },
        { status: 400 }
      )
    }

    const templateDay = await prisma.templateDay.create({
      data: {
        templateId: params.id,
        dayNumber,
        name: name.trim(),
        description: description?.trim() || null,
        order: dayNumber,
      },
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
    })

    return NextResponse.json(templateDay, { status: 201 })
  } catch (error) {
    console.error('Error creating template day:', error)
    return NextResponse.json(
      { error: 'Error creating template day' },
      { status: 500 }
    )
  }
}
