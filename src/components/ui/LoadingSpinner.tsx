export function LoadingSpinner({ className = '' }: { className?: string }) {
  return (
    <div className={`flex items-center justify-center p-8 ${className}`}>
      <div className="w-8 h-8 border-4 border-[#D9A86C]/30 border-t-[#D9A86C] rounded-full animate-spin" />
    </div>
  )
}

export function PageLoading({ className = '' }: { className?: string }) {
  return (
    <div className={`flex items-center justify-center min-h-[60vh] ${className}`}>
      <LoadingSpinner />
    </div>
  )
}
