'use client'

import { useEffect, useState, useCallback } from 'react'
import { usePathname, useSearchParams } from 'next/navigation'

export function NavigationProgress() {
  const [isNavigating, setIsNavigating] = useState(false)
  const [progress, setProgress] = useState(0)
  const pathname = usePathname()
  const searchParams = useSearchParams()

  // Reset on route change complete
  useEffect(() => {
    setIsNavigating(false)
    setProgress(0)
  }, [pathname, searchParams])

  // Progress animation
  useEffect(() => {
    if (!isNavigating) return

    // Quick initial progress
    setProgress(30)
    
    const timer1 = setTimeout(() => setProgress(50), 100)
    const timer2 = setTimeout(() => setProgress(70), 300)
    const timer3 = setTimeout(() => setProgress(85), 600)
    const timer4 = setTimeout(() => setProgress(95), 1000)

    return () => {
      clearTimeout(timer1)
      clearTimeout(timer2)
      clearTimeout(timer3)
      clearTimeout(timer4)
    }
  }, [isNavigating])

  // Listen for link clicks
  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      const target = e.target as HTMLElement
      const link = target.closest('a')
      
      if (!link) return
      
      const href = link.getAttribute('href')
      
      // Only trigger for internal navigation links
      if (
        href &&
        href.startsWith('/') &&
        !href.startsWith('//') &&
        !link.hasAttribute('target') &&
        !e.ctrlKey &&
        !e.metaKey &&
        !e.shiftKey
      ) {
        // Don't trigger if it's the same page
        const currentPath = pathname + (searchParams.toString() ? '?' + searchParams.toString() : '')
        if (href !== currentPath && href !== pathname) {
          setIsNavigating(true)
          setProgress(0)
        }
      }
    }

    document.addEventListener('click', handleClick, true)
    return () => document.removeEventListener('click', handleClick, true)
  }, [pathname, searchParams])

  if (!isNavigating && progress === 0) return null

  return (
    <div className="fixed top-0 left-0 right-0 z-[100] h-1 bg-transparent">
      <div
        className="h-full bg-gradient-to-r from-primary-400 via-primary-500 to-primary-600 transition-all duration-200 ease-out shadow-lg shadow-primary-500/30"
        style={{
          width: `${progress}%`,
          opacity: isNavigating ? 1 : 0,
        }}
      />
    </div>
  )
}
