'use client'

import { useEffect } from 'react'

type Section = 'notifications' | 'reviews' | 'nutrition' | 'training'

interface MarkSectionSeenProps {
  section: Section
}

/**
 * Client component that marks a section as seen when mounted.
 * Use this inside Server Components to track when user visits a section.
 */
export default function MarkSectionSeen({ section }: MarkSectionSeenProps) {
  useEffect(() => {
    const markAsSeen = async () => {
      try {
        await fetch('/api/client/updates', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ section }),
        })
      } catch (error) {
        console.error('Error marking section as seen:', error)
      }
    }
    markAsSeen()
  }, [section])

  // This component renders nothing - it's just for side effects
  return null
}
