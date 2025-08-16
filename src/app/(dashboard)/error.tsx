'use client';

export default function DashboardError({ error, reset }: { error: Error; reset: () => void }) {
  return (
    <div className="p-6">
      <h2 className="text-lg font-semibold">Erreur du tableau de bord</h2>
      <p className="text-sm text-gray-600 mt-2">{error.message}</p>
      <button
        className="mt-4 px-3 py-2 bg-blue-600 text-white rounded-md text-sm"
        onClick={() => reset()}
      >
        Réessayer
      </button>
    </div>
  );
}


