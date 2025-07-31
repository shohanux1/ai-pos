import { Loader2 } from 'lucide-react'

interface LoadingSpinnerProps {
  message?: string
  fullScreen?: boolean
  size?: string
}

export function LoadingSpinner({ 
  message = "Loading...", 
  fullScreen = false,
  size = "h-8 w-8" 
}: LoadingSpinnerProps) {
  const wrapper = fullScreen 
    ? "min-h-screen bg-white flex items-center justify-center"
    : "text-center py-8"
    
  return (
    <div className={wrapper}>
      <div className="text-center">
        <Loader2 className={`animate-spin ${size} text-gray-900 mx-auto`} />
        <p className="mt-2 text-gray-600">{message}</p>
      </div>
    </div>
  )
}