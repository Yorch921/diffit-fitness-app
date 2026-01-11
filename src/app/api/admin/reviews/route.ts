import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session || session.user.role === 'CLIENT') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { userId, reviewDate, changes, notes, nextReviewDate } = body

    if (!userId || !reviewDate || !changes) {
      return NextResponse.json(
        { error: 'Usuario, fecha de revisión y cambios son requeridos' },
        { status: 400 }
      )
    }

    // Verificar que el cliente pertenece al trainer
    const client = await prisma.user.findFirst({
      where: {
        id: userId,
        role: 'CLIENT',
      },
    })

    if (!client) {
      return NextResponse.json({ error: 'Cliente no encontrado' }, { status: 404 })
    }

    // Crear revisión
    const review = await prisma.review.create({
      data: {
        userId,
        trainerId: session.user.id,
        reviewDate: new Date(reviewDate),
        changes,
        notes: notes || null,
        nextReviewDate: nextReviewDate ? new Date(nextReviewDate) : null,
      },
    })

    // Actualizar nextReviewDate del cliente si se proporcionó
    if (nextReviewDate) {
      await prisma.user.update({
        where: { id: userId },
        data: { nextReviewDate: new Date(nextReviewDate) },
      })
    }

    return NextResponse.json(review)
  } catch (error) {
    console.error('Error creating review:', error)
    return NextResponse.json(
      { error: 'Error al crear revisión' },
      { status: 500 }
    )
  }
}

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session || session.user.role === 'CLIENT') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const userId = searchParams.get('userId')

    // Si se especifica userId, obtener revisiones de ese cliente
    if (userId) {
      const reviews = await prisma.review.findMany({
        where: {
          userId,
          trainerId: session.user.id,
        },
        include: {
          user: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
        },
        orderBy: { reviewDate: 'desc' },
      })

      return NextResponse.json(reviews)
    }

    // Si no se especifica userId, obtener todas las revisiones del trainer
    const reviews = await prisma.review.findMany({
      where: {
        trainerId: session.user.id,
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
      orderBy: { reviewDate: 'desc' },
    })

    return NextResponse.json(reviews)
  } catch (error) {
    console.error('Error fetching reviews:', error)
    return NextResponse.json(
      { error: 'Error al obtener revisiones' },
      { status: 500 }
    )
  }
}
