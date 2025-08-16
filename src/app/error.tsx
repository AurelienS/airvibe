'use client';

export default function Error({ error, reset }: { error: Error; reset: () => void }) {
  return (
    <div className="p-6">
      <h2 className="text-lg font-semibold">Une erreur s&#39;est produite</h2>
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


