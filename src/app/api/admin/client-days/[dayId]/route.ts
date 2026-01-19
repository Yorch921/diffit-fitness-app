import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

// PATCH /api/admin/client-days/[dayId] - Editar día de cliente (plan forked)
export async function PATCH(
  request: Request,
  { params }: { params: { dayId: string } }
) {
  try {
    const session = await getServerSession(authOptions)

    if (!session || session.user.role !== 'TRAINER') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { name, description } = body

    // Verificar que el día pertenece al trainer
    const clientDay = await prisma.clientDay.findFirst({
      where: {
        id: params.dayId,
        mesocycle: {
          trainerId: session.user.id,
        },
      },
    })

    if (!clientDay) {
      return NextResponse.json(
        { error: 'Día no encontrado' },
        { status: 404 }
      )
    }

    if (name !== undefined && name.trim() === '') {
      return NextResponse.json(
        { error: 'El nombre no puede estar vacío' },
        { status: 400 }
      )
    }

    const updateData: any = {}
    if (name) updateData.name = name.trim()
    if (description !== undefined) updateData.description = description?.trim() || null

    const updatedDay = await prisma.clientDay.update({
      where: { id: params.dayId },
      data: updateData,
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
    console.error('Error updating client day:', error)
    return NextResponse.json(
      { error: 'Error al actualizar día' },
      { status: 500 }
    )
  }
}

// DELETE /api/admin/client-days/[dayId] - Eliminar día de cliente
export async function DELETE(
  request: Request,
  { params }: { params: { dayId: string } }
) {
  try {
    const session = await getServerSession(authOptions)

    if (!session || session.user.role !== 'TRAINER') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Verificar que el día pertenece al trainer
    const clientDay = await prisma.clientDay.findFirst({
      where: {
        id: params.dayId,
        mesocycle: {
          trainerId: session.user.id,
        },
      },
    })

    if (!clientDay) {
      return NextResponse.json(
        { error: 'Día no encontrado' },
        { status: 404 }
      )
    }

    await prisma.clientDay.delete({
      where: { id: params.dayId },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting client day:', error)
    return NextResponse.json(
      { error: 'Error al eliminar día' },
      { status: 500 }
    )
  }
}
