import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

/**
 * GET /api/client/reviews
 * Obtiene las revisiones del cliente autenticado
 */
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Obtener el ID del cliente (puede ser el usuario actual o especificado por un trainer)
    let clientId = session.user.id

    // Si es un trainer, puede ver las revisiones de un cliente especifico
    if (session.user.role === 'TRAINER') {
      const { searchParams } = new URL(request.url)
      const specifiedClientId = searchParams.get('clientId')
      if (specifiedClientId) {
        clientId = specifiedClientId
      }
    }

    // Obtener revisiones del cliente
    const reviews = await prisma.review.findMany({
      where: {
        userId: clientId,
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            trainer: {
              select: {
                id: true,
                name: true,
              },
            },
          },
        },
      },
      orderBy: { reviewDate: 'desc' },
    })

    // Obtener informacion del entrenador para cada revision
    const reviewsWithTrainer = await Promise.all(
      reviews.map(async (review) => {
        const trainer = await prisma.user.findUnique({
          where: { id: review.trainerId },
          select: {
            id: true,
            name: true,
            email: true,
          },
        })
        return {
          ...review,
          trainer,
        }
      })
    )

    // Obtener proxima revision programada
    const nextReview = await prisma.user.findUnique({
      where: { id: clientId },
      select: {
        nextReviewDate: true,
      },
    })

    return NextResponse.json({
      reviews: reviewsWithTrainer,
      nextReviewDate: nextReview?.nextReviewDate,
    })
  } catch (error) {
    console.error('Error fetching client reviews:', error)
    return NextResponse.json(
      { error: 'Error al obtener revisiones' },
      { status: 500 }
    )
  }
}
