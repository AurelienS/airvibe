'use client';

import { useRouter } from 'next/navigation';
import { useRef, useState } from 'react';

export default function UploadFlightsForm() {
  const router = useRouter();
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [summary, setSummary] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement | null>(null);

  const triggerPicker = () => {
    setError(null);
    inputRef.current?.click();
  };

  const onFilesChosen = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.currentTarget.files;
    if (!files || files.length === 0) return;
    setIsUploading(true);
    setError(null);
    try {
      const formData = new FormData();
      for (const file of Array.from(files)) {
        formData.append('files', file);
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
      const skipped =
        data && typeof data === 'object' && 'skippedDuplicates' in data && typeof (data as any).skippedDuplicates === 'number'
          ? (data as { skippedDuplicates: number }).skippedDuplicates
          : 0;
      const added = (() => {
        if (data && typeof data === 'object' && 'createdCount' in data && typeof (data as any).createdCount === 'number') {
          return (data as { createdCount: number }).createdCount;
        }
        if (data && typeof data === 'object' && 'flights' in data && Array.isArray((data as any).flights)) {
          return ((data as { flights: Array<unknown> }).flights).length;
        }
        return 0;
      })();
      setSummary(`${added} vol(s) ajouté(s), ${skipped} doublon(s) ignoré(s)`);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Upload failed');
    } finally {
      setIsUploading(false);
      // reset input so selecting same files again retriggers change
      if (inputRef.current) inputRef.current.value = '';
    }
  };

  return (
    <div className="space-y-3">
      <div>
        <label className="block text-sm font-medium mb-2">Importer des vols (.igc ou .zip)</label>
        <input
          ref={inputRef}
          type="file"
          name="files"
          multiple
          accept=".igc,.zip,application/zip"
          className="sr-only"
          onChange={onFilesChosen}
        />
        <button
          type="button"
          onClick={triggerPicker}
          disabled={isUploading}
          className="px-3 py-2 bg-blue-600 text-white rounded-md text-sm disabled:opacity-60"
          aria-busy={isUploading}
        >
          {isUploading ? 'Import en cours…' : 'Choisir et importer'}
        </button>
      </div>
      <div className="flex items-center gap-3">
        {error ? <span className="text-xs text-red-600">{error}</span> : null}
        {summary ? <span className="text-xs text-gray-700">{summary}</span> : null}
      </div>
    </div>
  );
}


