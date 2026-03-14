import Link from 'next/link';
import { Plus, Edit, Settings, Eye } from 'lucide-react';

// Placeholder data - will be replaced with API
const placeholderFunnels = [
  {
    id: 'default',
    name: 'Main Checkout',
    slug: 'checkout',
    isActive: true,
    isDefault: true,
    steps: [
      { type: 'checkout', name: 'Checkout Page' },
      { type: 'thankyou', name: 'Thank You Page' },
    ],
    createdAt: new Date().toISOString(),
  },
];

export default function FunnelsPage() {
  return (
    <div className="p-8">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Funnels</h1>
            <p className="text-gray-500 mt-1">
              Create and manage checkout funnels with drag-drop editor
            </p>
          </div>
          <Link
            href="/funnels/new"
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            <Plus className="w-4 h-4" />
            New Funnel
          </Link>
        </div>

        {/* Funnels Grid */}
        <div className="grid gap-6">
          {placeholderFunnels.map((funnel) => (
            <div
              key={funnel.id}
              className="bg-white rounded-xl border border-gray-200 p-6 hover:shadow-md transition-shadow"
            >
              <div className="flex items-start justify-between">
                <div>
                  <div className="flex items-center gap-3">
                    <h3 className="text-lg font-semibold text-gray-900">
                      {funnel.name}
                    </h3>
                    {funnel.isDefault && (
                      <span className="px-2 py-1 text-xs font-medium bg-blue-100 text-blue-700 rounded-full">
                        Default
                      </span>
                    )}
                    {funnel.isActive && (
                      <span className="px-2 py-1 text-xs font-medium bg-green-100 text-green-700 rounded-full">
                        Active
                      </span>
                    )}
                  </div>
                  <p className="text-gray-500 text-sm mt-1">
                    /{funnel.slug}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <Link
                    href={`/funnels/checkout/${funnel.id}`}
                    className="flex items-center gap-2 px-3 py-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                  >
                    <Edit className="w-4 h-4" />
                    Edit Checkout
                  </Link>
                </div>
              </div>

              {/* Funnel Steps Visualization */}
              <div className="mt-6">
                <div className="flex items-center gap-2">
                  {funnel.steps.map((step, idx) => (
                    <div key={idx} className="flex items-center">
                      <div className="px-4 py-2 bg-gray-50 rounded-lg border border-gray-200">
                        <span className="text-sm font-medium text-gray-700">
                          {step.name}
                        </span>
                      </div>
                      {idx < funnel.steps.length - 1 && (
                        <div className="w-8 h-0.5 bg-gray-300 mx-2" />
                      )}
                    </div>
                  ))}
                  <button className="ml-2 p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors">
                    <Plus className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Info Box */}
        <div className="mt-8 p-4 bg-blue-50 border border-blue-200 rounded-xl">
          <h4 className="font-medium text-blue-900 mb-2">What is a Funnel?</h4>
          <p className="text-blue-700 text-sm">
            A funnel represents your customer's journey from checkout to thank you page.
            Each funnel can have multiple steps (checkout, upsells, thank you), and each step
            can be customized with the drag-drop editor.
          </p>
        </div>
      </div>
    </div>
  );
}