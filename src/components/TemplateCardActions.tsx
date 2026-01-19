'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Button } from '@/components/ui/button'

interface TemplateCardActionsProps {
  templateId: string
  templateTitle: string
  hasAssignments: boolean
}

export default function TemplateCardActions({
  templateId,
  templateTitle,
  hasAssignments,
}: TemplateCardActionsProps) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [duplicating, setDuplicating] = useState(false)

  const handleDelete = async () => {
    if (
      !confirm(
        `¿Estás seguro de que quieres eliminar la plantilla "${templateTitle}"?\n\nEsta acción no se puede deshacer.`
      )
    ) {
      return
    }

    setLoading(true)
    try {
      const response = await fetch(`/api/admin/training-templates/${templateId}`, {
        method: 'DELETE',
      })

      if (response.ok) {
        router.refresh()
      } else {
        const data = await response.json()
        alert(data.error || 'Error al eliminar la plantilla')
      }
    } catch (error) {
      alert('Error al eliminar la plantilla')
    } finally {
      setLoading(false)
    }
  }

  const handleDuplicate = async () => {
    const newTitle = prompt(
      'Nombre para la nueva plantilla:',
      `${templateTitle} (copia)`
    )

    if (!newTitle) return

    setDuplicating(true)
    try {
      const response = await fetch(`/api/admin/training-templates/${templateId}/duplicate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ newTitle }),
      })

      if (response.ok) {
        const data = await response.json()
        router.push(`/admin/training-templates/${data.templateId}`)
      } else {
        const data = await response.json()
        alert(data.error || 'Error al duplicar la plantilla')
      }
    } catch (error) {
      alert('Error al duplicar la plantilla')
    } finally {
      setDuplicating(false)
    }
  }

  return (
    <div className="space-y-2">
      <div className="flex gap-2">
        <Link href={`/admin/training-templates/${templateId}`} className="flex-1">
          <Button variant="outline" className="w-full">
            Editar
          </Button>
        </Link>
        <Link href={`/admin/training-templates/${templateId}`} className="flex-1">
          <Button className="w-full">Ver Detalle</Button>
        </Link>
      </div>
      <div className="flex gap-2">
        <Button
          variant="outline"
          onClick={handleDuplicate}
          disabled={duplicating}
          className="flex-1"
          title="Duplicar plantilla"
        >
          {duplicating ? 'Duplicando...' : '📋 Duplicar'}
        </Button>
        {!hasAssignments && (
          <Button
            variant="outline"
            onClick={handleDelete}
            disabled={loading}
            className="text-red-600 hover:text-red-700 hover:bg-red-50 border-red-300"
            title="Eliminar plantilla"
          >
            {loading ? '...' : '🗑️'}
          </Button>
        )}
      </div>
    </div>
  )
}
