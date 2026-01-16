import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

// GET /api/admin/training-templates/[id] - Obtener template completo
export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)

    if (!session || session.user.role !== 'TRAINER') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const template = await prisma.trainingTemplate.findFirst({
      where: {
        id: params.id,
        trainerId: session.user.id,
      },
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
        mesocycles: {
          where: { isActive: true },
          include: {
            client: {
              select: {
                id: true,
                name: true,
                email: true,
              },
            },
          },
        },
      },
    })

    if (!template) {
      return NextResponse.json(
        { error: 'Template not found' },
        { status: 404 }
      )
    }

    return NextResponse.json(template)
  } catch (error) {
    console.error('Error fetching template:', error)
    return NextResponse.json(
      { error: 'Error fetching template' },
      { status: 500 }
    )
  }
}

// PATCH /api/admin/training-templates/[id] - Actualizar template
export async function PATCH(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)

    if (!session || session.user.role !== 'TRAINER') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { title, description, numberOfDays, trainerNotes } = body

    // Verificar que el template pertenece al trainer
    const existingTemplate = await prisma.trainingTemplate.findFirst({
      where: {
        id: params.id,
        trainerId: session.user.id,
      },
    })

    if (!existingTemplate) {
      return NextResponse.json(
        { error: 'Template not found' },
        { status: 404 }
      )
    }

    // Validaciones
    if (title && title.trim() === '') {
      return NextResponse.json(
        { error: 'El título no puede estar vacío' },
        { status: 400 }
      )
    }

    if (numberOfDays && (numberOfDays < 3 || numberOfDays > 5)) {
      return NextResponse.json(
        { error: 'El número de días debe estar entre 3 y 5' },
        { status: 400 }
      )
    }

    const template = await prisma.trainingTemplate.update({
      where: { id: params.id },
      data: {
        title: title?.trim(),
        description: description?.trim(),
        numberOfDays,
        trainerNotes: trainerNotes?.trim(),
      },
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
    })

    return NextResponse.json(template)
  } catch (error) {
    console.error('Error updating template:', error)
    return NextResponse.json(
      { error: 'Error updating template' },
      { status: 500 }
    )
  }
}

// DELETE /api/admin/training-templates/[id] - Eliminar template
export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)

    if (!session || session.user.role !== 'TRAINER') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Verificar que el template pertenece al trainer
    const existingTemplate = await prisma.trainingTemplate.findFirst({
      where: {
        id: params.id,
        trainerId: session.user.id,
      },
      include: {
        _count: {
          select: { mesocycles: true },
        },
      },
    })

    if (!existingTemplate) {
      return NextResponse.json(
        { error: 'Plantilla no encontrada' },
        { status: 404 }
      )
    }

    // Verificar si tiene mesociclos asignados (activos o no)
    if (existingTemplate._count.mesocycles > 0) {
      return NextResponse.json(
        {
          error:
            'No se puede eliminar una plantilla que tiene mesociclos asignados a clientes',
        },
        { status: 400 }
      )
    }

    // Eliminar permanentemente (esto eliminará en cascada días, ejercicios y sets)
    await prisma.trainingTemplate.delete({
      where: { id: params.id },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting template:', error)
    return NextResponse.json(
      { error: 'Error al eliminar la plantilla' },
      { status: 500 }
    )
  }
}
