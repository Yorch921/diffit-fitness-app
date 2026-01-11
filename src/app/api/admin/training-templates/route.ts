import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

// GET /api/admin/training-templates - Listar templates del trainer
export async function GET() {
  try {
    const session = await getServerSession(authOptions)

    if (!session || session.user.role !== 'TRAINER') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const templates = await prisma.trainingTemplate.findMany({
      where: {
        trainerId: session.user.id,
        isArchived: false,
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
        _count: {
          select: { mesocycles: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    })

    return NextResponse.json(templates)
  } catch (error) {
    console.error('Error fetching templates:', error)
    return NextResponse.json(
      { error: 'Error fetching templates' },
      { status: 500 }
    )
  }
}

// POST /api/admin/training-templates - Crear template
export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions)

    if (!session || session.user.role !== 'TRAINER') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { title, description, numberOfDays, trainerNotes } = body

    // Validaciones
    if (!title || title.trim() === '') {
      return NextResponse.json(
        { error: 'El título es obligatorio' },
        { status: 400 }
      )
    }

    if (numberOfDays < 3 || numberOfDays > 5) {
      return NextResponse.json(
        { error: 'El número de días debe estar entre 3 y 5' },
        { status: 400 }
      )
    }

    const template = await prisma.trainingTemplate.create({
      data: {
        title: title.trim(),
        description: description?.trim() || null,
        numberOfDays,
        trainerNotes: trainerNotes?.trim() || null,
        trainerId: session.user.id,
      },
      include: {
        days: true,
      },
    })

    return NextResponse.json(template, { status: 201 })
  } catch (error) {
    console.error('Error creating template:', error)
    return NextResponse.json(
      { error: 'Error creating template' },
      { status: 500 }
    )
  }
}
