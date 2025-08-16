'use client';

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <html>
      <body>
        <div style={{ padding: 16 }}>
          <h2 style={{ fontSize: 18, fontWeight: 600 }}>Une erreur s&#39;est produite</h2>
          <p style={{ color: '#666', marginTop: 8 }}>{error.message}</p>
          <button
            onClick={() => reset()}
            style={{
              marginTop: 12,
              padding: '6px 10px',
              background: '#2563eb',
              color: 'white',
              borderRadius: 6,
            }}
          >
            Réessayer
          </button>
        </div>
      </body>
    </html>
  );
}


