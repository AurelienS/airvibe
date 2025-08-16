'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';

export default function UploadFlightsForm() {
  const router = useRouter();
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const onSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);
    setIsUploading(true);
    try {
      const form = e.currentTarget;
      const fileInput = form.elements.namedItem('files') as HTMLInputElement | null;
      const formData = new FormData();
      if (fileInput?.files) {
        for (const file of Array.from(fileInput.files)) {
          formData.append('files', file);
        }
      }
      const res = await fetch('/api/flights', {
        method: 'POST',
        body: formData,
        credentials: 'include',
      });
      if (!res.ok) {
        const data: unknown = await res.json().catch(() => null);
        let message = `Upload failed (${res.status})`;
        if (data && typeof data === 'object' && 'error' in data) {
          const errVal = (data as Record<string, unknown>).error;
          if (typeof errVal === 'string') message = errVal;
        }
        throw new Error(message);
      }
      form.reset();
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Upload failed');
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <form className="space-y-3" onSubmit={onSubmit} noValidate>
      <div>
        <label className="block text-sm font-medium mb-1">Importer des vols (.igc ou .zip)</label>
        <input
          type="file"
          name="files"
          multiple
          accept=".igc,.zip,application/zip"
          className="block w-full text-sm"
        />
      </div>
      <div className="flex items-center gap-3">
        <button
          type="submit"
          disabled={isUploading}
          className="px-3 py-2 bg-blue-600 text-white rounded-md text-sm disabled:opacity-60"
        >
          {isUploading ? 'Import en cours…' : 'Importer'}
        </button>
        {error ? <span className="text-xs text-red-600">{error}</span> : null}
      </div>
    </form>
  );
}


