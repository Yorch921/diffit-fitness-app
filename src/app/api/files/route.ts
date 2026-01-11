import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { writeFile, mkdir } from 'fs/promises'
import path from 'path'

export async function GET() {
  try {
    const session = await getServerSession(authOptions)

    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const files = await prisma.file.findMany({
      where: {
        userId: session.user.id,
      },
      orderBy: {
        createdAt: 'desc',
      },
    })

    return NextResponse.json(files)
  } catch (error) {
    console.error('Error fetching files:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const formData = await request.formData()
    const file = formData.get('file') as File
    const description = formData.get('description') as string

    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 })
    }

    // Determinar el tipo de archivo
    let fileType = 'OTHER'
    if (file.type.startsWith('image/')) {
      fileType = 'IMAGE'
    } else if (file.type.startsWith('video/')) {
      fileType = 'VIDEO'
    } else if (file.type === 'application/pdf') {
      fileType = 'PDF'
    }

    // Crear carpeta por mes (formato: YYYY-MM)
    const now = new Date()
    const monthFolder = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`
    const uploadsDir = path.join(process.cwd(), 'public', 'uploads', monthFolder)

    try {
      await mkdir(uploadsDir, { recursive: true })
    } catch (error) {
      // Directory might already exist
    }

    // Guardar el archivo
    const bytes = await file.arrayBuffer()
    const buffer = Buffer.from(bytes)
    const filename = `${Date.now()}-${file.name.replace(/[^a-zA-Z0-9.-]/g, '_')}`
    const filepath = path.join(uploadsDir, filename)
    await writeFile(filepath, buffer)

    const fileUrl = `/uploads/${monthFolder}/${filename}`

    // Guardar en la base de datos
    const dbFile = await prisma.file.create({
      data: {
        userId: session.user.id,
        name: file.name,
        type: fileType as any,
        url: fileUrl,
        size: file.size,
        description: description || null,
      },
    })

    return NextResponse.json(dbFile)
  } catch (error) {
    console.error('Error uploading file:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
