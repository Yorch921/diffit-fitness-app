import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

// PUT - Reordenar ejercicios de una sesión
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)

    if (!session || session.user.role === 'CLIENT') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { exerciseIds } = body // Array de IDs en el nuevo orden

    if (!exerciseIds || !Array.isArray(exerciseIds) || exerciseIds.length === 0) {
      return NextResponse.json({ error: 'Se requiere un array de IDs de ejercicios' }, { status: 400 })
    }

    // Actualizar orden de cada ejercicio en una transacción
    const updates = exerciseIds.map((id: string, index: number) =>
      prisma.exercise.update({
        where: { id },
        data: { order: index + 1 },
      })
    )

    await prisma.$transaction(updates)

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error reordering exercises:', error)
    return NextResponse.json(
      { error: 'Error al reordenar ejercicios' },
      { status: 500 }
    )
  }
}
