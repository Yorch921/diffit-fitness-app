'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import Link from 'next/link'
import TemplateEditor from '@/components/TemplateEditor'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

interface MesocycleEditorProps {
  mesocycle: any
}

export default function MesocycleEditor({ mesocycle }: MesocycleEditorProps) {
  const router = useRouter()
  const [showSaveAsTemplateModal, setShowSaveAsTemplateModal] = useState(false)
  const [templateTitle, setTemplateTitle] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleSaveAsTemplate = async () => {
    if (!templateTitle.trim()) {
      setError('Debes especificar un título para la plantilla')
      return
    }

    setLoading(true)
    setError('')

    try {
      const response = await fetch('/api/admin/mesocycles/save-as-template', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          mesocycleId: mesocycle.id,
          templateTitle: templateTitle.trim(),
        }),
      })

      if (response.ok) {
        const data = await response.json()
        setShowSaveAsTemplateModal(false)
        setTemplateTitle('')
        // Mostrar mensaje de éxito y redirigir a la nueva plantilla
        alert('Plantilla guardada exitosamente')
        router.push(`/admin/training-templates/${data.templateId}`)
      } else {
        const data = await response.json()
        setError(data.error || 'Error al guardar plantilla')
      }
    } catch (error) {
      setError('Error al guardar plantilla')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="container mx-auto py-6 px-4">
      {/* Header with client info and actions */}
      <Card className="mb-6">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-2xl">
                Plan de Entrenamiento - {mesocycle.client.name}
              </CardTitle>
              {mesocycle.isForked ? (
                <p className="text-sm text-green-600 mt-2">
                  Plan personalizado (desvinculado de plantilla)
                </p>
              ) : mesocycle.template ? (
                <p className="text-sm text-gray-600 mt-2">
                  Basado en: {mesocycle.template.title}
                </p>
              ) : null}
              <p className="text-xs text-gray-500 mt-1">
                {mesocycle.durationWeeks} semanas • {mesocycle.isForked
                  ? `${mesocycle.clientDays?.length || 0} días/semana`
                  : `${mesocycle.template?.numberOfDays || 0} días/semana`}
              </p>
            </div>
            <div className="flex gap-2">
              <Link href={`/admin/clients/${mesocycle.client.id}`}>
                <Button variant="outline">← Volver al Cliente</Button>
              </Link>
              <Button
                variant="default"
                onClick={() => setShowSaveAsTemplateModal(true)}
              >
                💾 Guardar como Plantilla
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="p-3 bg-blue-50 rounded-lg">
              <div className="text-sm text-gray-600">Inicio</div>
              <div className="font-semibold">
                {new Date(mesocycle.startDate).toLocaleDateString('es-ES')}
              </div>
            </div>
            <div className="p-3 bg-green-50 rounded-lg">
              <div className="text-sm text-gray-600">Fin</div>
              <div className="font-semibold">
                {new Date(mesocycle.endDate).toLocaleDateString('es-ES')}
              </div>
            </div>
            <div className="p-3 bg-purple-50 rounded-lg">
              <div className="text-sm text-gray-600">Estado</div>
              <div className="font-semibold">
                {mesocycle.isActive ? '✅ Activo' : '⏸️ Inactivo'}
              </div>
            </div>
          </div>
          {mesocycle.trainerNotes && (
            <div className="mt-4 p-3 bg-gray-50 rounded-lg">
              <p className="text-sm font-medium text-gray-700 mb-1">Notas del Entrenador:</p>
              <p className="text-sm text-gray-600 whitespace-pre-wrap">{mesocycle.trainerNotes}</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Template Editor - reuse existing component */}
      <TemplateEditor
        template={mesocycle.template}
        hideHeader={true}
        mesocycleId={mesocycle.id}
        clientName={mesocycle.client.name}
        isForked={mesocycle.isForked}
        clientDays={mesocycle.clientDays}
      />

      {/* Save as Template Modal */}
      {showSaveAsTemplateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4">
            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-bold text-gray-900">Guardar como Plantilla</h2>
                <button
                  onClick={() => {
                    setShowSaveAsTemplateModal(false)
                    setError('')
                    setTemplateTitle('')
                  }}
                  className="text-gray-400 hover:text-gray-600"
                  disabled={loading}
                >
                  <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              <p className="text-sm text-gray-600 mb-4">
                Esto creará una nueva plantilla reutilizable con todos los ejercicios y configuración de este plan.
              </p>

              {error && (
                <div className="mb-4 bg-red-50 border border-red-200 text-red-800 px-4 py-3 rounded-lg text-sm">
                  {error}
                </div>
              )}

              <div className="space-y-4">
                <div>
                  <Label htmlFor="templateTitle">Título de la Plantilla *</Label>
                  <Input
                    id="templateTitle"
                    value={templateTitle}
                    onChange={(e) => setTemplateTitle(e.target.value)}
                    placeholder="Ej: Plan de Fuerza Avanzado"
                    disabled={loading}
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    La plantilla se guardará en tu biblioteca para usarla con otros clientes
                  </p>
                </div>

                <div className="flex gap-3 pt-2">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => {
                      setShowSaveAsTemplateModal(false)
                      setError('')
                      setTemplateTitle('')
                    }}
                    disabled={loading}
                    className="flex-1"
                  >
                    Cancelar
                  </Button>
                  <Button
                    type="button"
                    onClick={handleSaveAsTemplate}
                    disabled={loading || !templateTitle.trim()}
                    className="flex-1"
                  >
                    {loading ? 'Guardando...' : 'Guardar Plantilla'}
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
