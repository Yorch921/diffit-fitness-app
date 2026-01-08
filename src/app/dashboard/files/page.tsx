'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { formatDate } from '@/lib/utils'

interface File {
  id: string
  name: string
  type: 'PDF' | 'IMAGE' | 'VIDEO' | 'OTHER'
  url: string
  size: number
  description: string | null
  createdAt: string
}

const fileTypeIcons = {
  PDF: '📄',
  IMAGE: '🖼️',
  VIDEO: '🎥',
  OTHER: '📎',
}

export default function FilesPage() {
  const [files, setFiles] = useState<File[]>([])
  const [showDialog, setShowDialog] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [newFile, setNewFile] = useState({
    file: null as File | null,
    description: '',
  })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchFiles()
  }, [])

  const fetchFiles = async () => {
    try {
      const response = await fetch('/api/files')
      const data = await response.json()
      setFiles(data)
    } catch (error) {
      console.error('Error fetching files:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setNewFile({ ...newFile, file: e.target.files[0] })
    }
  }

  const handleUpload = async () => {
    if (!newFile.file) return

    setUploading(true)
    try {
      const formData = new FormData()
      formData.append('file', newFile.file)
      formData.append('description', newFile.description)

      const response = await fetch('/api/files', {
        method: 'POST',
        body: formData,
      })

      if (response.ok) {
        setShowDialog(false)
        setNewFile({ file: null, description: '' })
        fetchFiles()
      }
    } catch (error) {
      console.error('Error uploading file:', error)
    } finally {
      setUploading(false)
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('¿Estás seguro de eliminar este archivo?')) return

    try {
      await fetch(`/api/files/${id}`, {
        method: 'DELETE',
      })
      fetchFiles()
    } catch (error) {
      console.error('Error deleting file:', error)
    }
  }

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
  }

  const groupedFiles = files.reduce((acc, file) => {
    if (!acc[file.type]) {
      acc[file.type] = []
    }
    acc[file.type].push(file)
    return acc
  }, {} as Record<string, File[]>)

  if (loading) {
    return (
      <div className="px-4 py-6 sm:px-0">
        <div className="text-center py-12">Cargando...</div>
      </div>
    )
  }

  return (
    <div className="px-4 py-6 sm:px-0">
      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Subir Archivo</DialogTitle>
            <DialogDescription>
              Añade fotos, videos o documentos
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="file">Archivo</Label>
              <Input
                id="file"
                type="file"
                onChange={handleFileChange}
                accept="image/*,video/*,.pdf"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="description">Descripción (opcional)</Label>
              <Input
                id="description"
                value={newFile.description}
                onChange={(e) => setNewFile({ ...newFile, description: e.target.value })}
                placeholder="Descripción del archivo..."
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDialog(false)}>
              Cancelar
            </Button>
            <Button onClick={handleUpload} disabled={!newFile.file || uploading}>
              {uploading ? 'Subiendo...' : 'Subir'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <div className="mb-8 flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Archivos y Fotos</h1>
          <p className="mt-2 text-gray-600">
            Gestiona tus fotos de progreso y documentos
          </p>
        </div>
        <Button onClick={() => setShowDialog(true)}>
          Subir Archivo
        </Button>
      </div>

      {files.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <div className="text-6xl mb-4">📁</div>
            <h3 className="text-xl font-semibold mb-2">
              No hay archivos subidos
            </h3>
            <p className="text-gray-600 mb-4">
              Sube fotos de progreso, videos o documentos
            </p>
            <Button onClick={() => setShowDialog(true)}>
              Subir Primer Archivo
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-6">
          {Object.entries(groupedFiles).map(([type, typeFiles]) => (
            <Card key={type}>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <span>{fileTypeIcons[type as keyof typeof fileTypeIcons]}</span>
                  {type === 'IMAGE' && 'Imágenes'}
                  {type === 'VIDEO' && 'Videos'}
                  {type === 'PDF' && 'PDFs'}
                  {type === 'OTHER' && 'Otros'}
                  <span className="text-sm font-normal text-gray-500">
                    ({typeFiles.length})
                  </span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {typeFiles.map((file) => (
                    <div
                      key={file.id}
                      className="border rounded-lg overflow-hidden hover:shadow-md transition-shadow"
                    >
                      {file.type === 'IMAGE' && (
                        <div className="aspect-square bg-gray-100">
                          <img
                            src={file.url}
                            alt={file.name}
                            className="w-full h-full object-cover"
                          />
                        </div>
                      )}
                      {file.type === 'VIDEO' && (
                        <div className="aspect-video bg-gray-100">
                          <video
                            src={file.url}
                            controls
                            className="w-full h-full"
                          />
                        </div>
                      )}
                      {(file.type === 'PDF' || file.type === 'OTHER') && (
                        <div className="aspect-square bg-gray-100 flex items-center justify-center">
                          <span className="text-6xl">
                            {fileTypeIcons[file.type]}
                          </span>
                        </div>
                      )}
                      <div className="p-4">
                        <h4 className="font-medium text-sm truncate">{file.name}</h4>
                        <p className="text-xs text-gray-500 mt-1">
                          {formatDate(file.createdAt)} • {formatFileSize(file.size)}
                        </p>
                        {file.description && (
                          <p className="text-sm text-gray-600 mt-2 line-clamp-2">
                            {file.description}
                          </p>
                        )}
                        <div className="flex gap-2 mt-3">
                          <a
                            href={file.url}
                            download
                            className="text-sm text-blue-600 hover:underline"
                          >
                            Descargar
                          </a>
                          <button
                            onClick={() => handleDelete(file.id)}
                            className="text-sm text-red-600 hover:underline"
                          >
                            Eliminar
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
