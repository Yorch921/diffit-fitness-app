import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)

    if (!session || session.user.role === 'CLIENT') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const {
      name,
      email,
      age,
      gender,
      height,
      initialWeight,
      goal,
      clinicalNotes,
      nextReviewDate,
      status,
    } = body

    // Verificar que el cliente pertenece al trainer
    const existingClient = await prisma.user.findFirst({
      where: {
        id: params.id,
        role: 'CLIENT',
      },
    })

    if (!existingClient) {
      return NextResponse.json({ error: 'Cliente no encontrado' }, { status: 404 })
    }

    // Si se está cambiando el email, verificar que no exista
    if (email && email !== existingClient.email) {
      const emailExists = await prisma.user.findUnique({
        where: { email },
      })

      if (emailExists) {
        return NextResponse.json(
          { error: 'Ya existe un usuario con este email' },
          { status: 400 }
        )
      }
    }

    // Actualizar cliente
    const updatedClient = await prisma.user.update({
      where: { id: params.id },
      data: {
        name: name || undefined,
        email: email || undefined,
        age: age !== undefined ? age : undefined,
        gender: gender || undefined,
        height: height !== undefined ? height : undefined,
        initialWeight: initialWeight !== undefined ? initialWeight : undefined,
        goal: goal !== undefined ? goal : undefined,
        clinicalNotes: clinicalNotes !== undefined ? clinicalNotes : undefined,
        nextReviewDate: nextReviewDate ? new Date(nextReviewDate) : undefined,
        status: status || undefined,
      },
    })

    return NextResponse.json({
      id: updatedClient.id,
      name: updatedClient.name,
      email: updatedClient.email,
      status: updatedClient.status,
    })
  } catch (error) {
    console.error('Error updating client:', error)
    return NextResponse.json(
      { error: 'Error al actualizar cliente' },
      { status: 500 }
    )
  }
}

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)

    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const client = await prisma.user.findFirst({
      where: {
        id: params.id,
        role: 'CLIENT',
      },
      include: {
        nutritionPlan: {
          orderBy: { createdAt: 'desc' },
        },
        clientMesocycles: {
          orderBy: { createdAt: 'desc' },
        },
        weightEntry: {
          orderBy: { date: 'desc' },
        },
        bodyMeasurements: {
          orderBy: { date: 'desc' },
        },
        nutritionistComments: {
          orderBy: { createdAt: 'desc' },
        },
        reviews: {
          orderBy: { reviewDate: 'desc' },
        },
      },
    })

    if (!client) {
      return NextResponse.json({ error: 'Cliente no encontrado' }, { status: 404 })
    }

    return NextResponse.json(client)
  } catch (error) {
    console.error('Error fetching client:', error)
    return NextResponse.json(
      { error: 'Error al obtener cliente' },
      { status: 500 }
    )
  }
}
