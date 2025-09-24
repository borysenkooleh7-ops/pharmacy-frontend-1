// This file is no longer used as the main app component
// Routing is now handled in main.jsx with page-based components
// This file can be removed or used as a legacy fallback

export default function App(): React.JSX.Element {
  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-6">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-text-primary">
            This component is deprecated
          </h1>
          <p className="text-text-secondary">
            Please use the new page-based routing system
          </p>
        </div>
      </div>
    </div>
  )
}
