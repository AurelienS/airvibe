'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';

export default function UploadFlightsForm() {
  const router = useRouter();
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [summary, setSummary] = useState<string | null>(null);

  const onSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);
    setIsUploading(true);
    try {
      const form = e.currentTarget;
      const elements = form.elements as unknown as HTMLFormControlsCollection;
      const fileInput = (elements.namedItem('files') ?? null) as HTMLInputElement | null;
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
      const data: unknown = await res.json();
      const flights =
        data && typeof data === 'object' && 'flights' in data && Array.isArray((data as any).flights)
          ? ((data as { flights: Array<{ id: string; filename: string }>; skippedDuplicates?: number }).flights)
          : [];
      const skipped =
        data && typeof data === 'object' && 'skippedDuplicates' in data && typeof (data as any).skippedDuplicates === 'number'
          ? (data as { skippedDuplicates: number }).skippedDuplicates
          : 0;
      const added = flights.length;
      setSummary(`${added} vol(s) ajouté(s), ${skipped} doublon(s) ignoré(s)`);
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
        {summary ? <span className="text-xs text-gray-700">{summary}</span> : null}
      </div>
    </form>
  );
}


