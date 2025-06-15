import type React from "react"

const LoadingSpinner: React.FC = () => {
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 flex items-center gap-3">
        <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-bleu-ciel"></div>
        <span className="text-slate-700">Chargement...</span>
      </div>
    </div>
  )
}

export default LoadingSpinner
