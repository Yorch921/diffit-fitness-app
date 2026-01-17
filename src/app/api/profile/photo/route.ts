import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { writeFile, mkdir } from 'fs/promises'
import path from 'path'

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const formData = await request.formData()
    const file = formData.get('photo') as File | null

    if (!file) {
      return NextResponse.json({ error: 'No se ha proporcionado una imagen' }, { status: 400 })
    }

    // Validar tipo de archivo
    const validTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif']
    if (!validTypes.includes(file.type)) {
      return NextResponse.json(
        { error: 'Tipo de archivo no valido. Solo se permiten JPG, PNG, WebP y GIF' },
        { status: 400 }
      )
    }

    // Validar tamano (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      return NextResponse.json(
        { error: 'El archivo es demasiado grande. Maximo 5MB' },
        { status: 400 }
      )
    }

    // Crear directorio si no existe
    const uploadDir = path.join(process.cwd(), 'public', 'uploads', 'profiles')
    await mkdir(uploadDir, { recursive: true })

    // Generar nombre unico
    const ext = file.name.split('.').pop() || 'jpg'
    const fileName = `${session.user.id}-${Date.now()}.${ext}`
    const filePath = path.join(uploadDir, fileName)

    // Guardar archivo
    const bytes = await file.arrayBuffer()
    const buffer = Buffer.from(bytes)
    await writeFile(filePath, buffer)

    // URL relativa para guardar en DB
    const photoUrl = `/uploads/profiles/${fileName}`

    // Actualizar usuario en DB
    await prisma.user.update({
      where: { id: session.user.id },
      data: { photoUrl },
    })

    return NextResponse.json({ photoUrl })
  } catch (error) {
    console.error('Error uploading profile photo:', error)
    return NextResponse.json(
      { error: 'Error al subir la imagen' },
      { status: 500 }
    )
  }
}
