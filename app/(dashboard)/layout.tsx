import { requireAuth } from '@/lib/auth'
import Sidebar from '@/components/Sidebar'

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  // Require auth - redirects to login if not authenticated
  await requireAuth()

  return (
    <div className="min-h-screen bg-slate-50">
      <Sidebar />
      <main className="lg:pl-72">
        <div className="p-6 lg:p-8">
          {children}
        </div>
      </main>
    </div>
  )
}