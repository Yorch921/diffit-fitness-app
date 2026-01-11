'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { formatDate } from '@/lib/utils'

interface ProgressFile {
  id: string
  name: string
  type: 'PDF' | 'IMAGE' | 'VIDEO' | 'OTHER'
  url: string
  size: number
  description: string | null
  createdAt: string
}

export default function FilesPage() {
  const [files, setFiles] = useState<ProgressFile[]>([])
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
    if (!confirm('¿Estás seguro de eliminar esta foto?')) return

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

  const getMonthName = (date: string) => {
    const d = new Date(date)
    const months = [
      'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
      'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
    ]
    return `${months[d.getMonth()]} ${d.getFullYear()}`
  }

  const getMonthKey = (date: string) => {
    const d = new Date(date)
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
  }

  // Filtrar solo imágenes (fotos de progreso)
  const imageFiles = files.filter(file => file.type === 'IMAGE')

  // Agrupar fotos por mes
  const groupedByMonth = imageFiles.reduce((acc, file) => {
    const monthKey = getMonthKey(file.createdAt)
    if (!acc[monthKey]) {
      acc[monthKey] = []
    }
    acc[monthKey].push(file)
    return acc
  }, {} as Record<string, ProgressFile[]>)

  // Ordenar meses de más reciente a más antiguo
  const sortedMonths = Object.keys(groupedByMonth).sort((a, b) => b.localeCompare(a))

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
            <DialogTitle>Subir Foto de Progreso</DialogTitle>
            <DialogDescription>
              Añade fotos de tu evolución física (solo imágenes)
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="file">Foto</Label>
              <Input
                id="file"
                type="file"
                onChange={handleFileChange}
                accept="image/*"
              />
              <p className="text-xs text-gray-500">
                Se guardará automáticamente en la carpeta del mes actual
              </p>
            </div>
            <div className="space-y-2">
              <Label htmlFor="description">Descripción (opcional)</Label>
              <Input
                id="description"
                value={newFile.description}
                onChange={(e) => setNewFile({ ...newFile, description: e.target.value })}
                placeholder="Ej: Semana 4, vista frontal..."
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDialog(false)}>
              Cancelar
            </Button>
            <Button onClick={handleUpload} disabled={!newFile.file || uploading}>
              {uploading ? 'Subiendo...' : 'Subir Foto'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <div className="mb-8 flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Fotos de Progreso</h1>
          <p className="mt-2 text-gray-600">
            Registra tu evolución mes a mes con fotos
          </p>
        </div>
        <Button onClick={() => setShowDialog(true)} className="flex items-center gap-2">
          <span>📸</span>
          Subir Foto
        </Button>
      </div>

      {imageFiles.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <div className="text-6xl mb-4">📸</div>
            <h3 className="text-xl font-semibold mb-2">
              No hay fotos de progreso
            </h3>
            <p className="text-gray-600 mb-4">
              Sube tu primera foto para comenzar a trackear tu evolución
            </p>
            <Button onClick={() => setShowDialog(true)}>
              Subir Primera Foto
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-6">
          {sortedMonths.map((monthKey) => {
            const monthFiles = groupedByMonth[monthKey]
            const monthName = getMonthName(monthFiles[0].createdAt)

            return (
              <Card key={monthKey}>
                <CardHeader>
                  <CardTitle className="flex items-center justify-between">
                    <span className="flex items-center gap-2">
                      <span>📅</span>
                      {monthName}
                    </span>
                    <span className="text-sm font-normal text-gray-500">
                      {monthFiles.length} {monthFiles.length === 1 ? 'foto' : 'fotos'}
                    </span>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                    {monthFiles.map((file) => (
                      <div
                        key={file.id}
                        className="border rounded-lg overflow-hidden hover:shadow-md transition-shadow group"
                      >
                        <div className="aspect-square bg-gray-100 relative">
                          <img
                            src={file.url}
                            alt={file.name}
                            className="w-full h-full object-cover cursor-pointer"
                            onClick={() => window.open(file.url, '_blank')}
                          />
                          <button
                            onClick={() => handleDelete(file.id)}
                            className="absolute top-2 right-2 bg-red-500 text-white rounded-full w-8 h-8 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-600"
                            title="Eliminar foto"
                          >
                            ×
                          </button>
                        </div>
                        <div className="p-3">
                          <p className="text-xs text-gray-500">
                            {formatDate(file.createdAt)}
                          </p>
                          {file.description && (
                            <p className="text-sm text-gray-700 mt-1 line-clamp-2">
                              {file.description}
                            </p>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>
      )}

      {imageFiles.length > 0 && (
        <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
          <p className="text-sm text-blue-800">
            💡 <strong>Tip:</strong> Las fotos se organizan automáticamente por mes.
            Intenta subir fotos en la misma fecha cada mes para comparar mejor tu progreso.
          </p>
        </div>
      )}
    </div>
  )
}
