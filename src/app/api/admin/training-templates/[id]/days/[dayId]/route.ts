import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

// PATCH /api/admin/training-templates/[id]/days/[dayId] - Editar día
export async function PATCH(
  request: Request,
  { params }: { params: { id: string; dayId: string } }
) {
  try {
    const session = await getServerSession(authOptions)

    if (!session || session.user.role !== 'TRAINER') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { name, description } = body

    // Verificar que el día pertenece a un template del trainer
    const templateDay = await prisma.templateDay.findFirst({
      where: {
        id: params.dayId,
        templateId: params.id,
        template: {
          trainerId: session.user.id,
        },
      },
    })

    if (!templateDay) {
      return NextResponse.json(
        { error: 'Template day not found' },
        { status: 404 }
      )
    }

    // Validaciones
    if (name && name.trim() === '') {
      return NextResponse.json(
        { error: 'El nombre no puede estar vacío' },
        { status: 400 }
      )
    }

    const updatedDay = await prisma.templateDay.update({
      where: { id: params.dayId },
      data: {
        name: name?.trim(),
        description: description?.trim(),
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

    return NextResponse.json(updatedDay)
  } catch (error) {
    console.error('Error updating template day:', error)
    return NextResponse.json(
      { error: 'Error updating template day' },
      { status: 500 }
    )
  }
}

// DELETE /api/admin/training-templates/[id]/days/[dayId] - Eliminar día
export async function DELETE(
  request: Request,
  { params }: { params: { id: string; dayId: string } }
) {
  try {
    const session = await getServerSession(authOptions)

    if (!session || session.user.role !== 'TRAINER') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Verificar que el día pertenece a un template del trainer
    const templateDay = await prisma.templateDay.findFirst({
      where: {
        id: params.dayId,
        templateId: params.id,
        template: {
          trainerId: session.user.id,
        },
      },
      include: {
        workoutDayLogs: true,
      },
    })

    if (!templateDay) {
      return NextResponse.json(
        { error: 'Template day not found' },
        { status: 404 }
      )
    }

    // Verificar si hay logs asociados
    if (templateDay.workoutDayLogs.length > 0) {
      return NextResponse.json(
        {
          error:
            'No se puede eliminar este día porque tiene registros de entrenamiento asociados',
        },
        { status: 400 }
      )
    }

    await prisma.templateDay.delete({
      where: { id: params.dayId },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting template day:', error)
    return NextResponse.json(
      { error: 'Error deleting template day' },
      { status: 500 }
    )
  }
}
