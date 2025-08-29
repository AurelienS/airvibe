'use client';

import { useRouter } from 'next/navigation';
import { useRef, useState } from 'react';
import { Button } from '@/components/ui/Button';

export default function UploadFlightsForm() {
  const router = useRouter();
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selected, setSelected] = useState<Array<File>>([]);
  const inputRef = useRef<HTMLInputElement | null>(null);

  const triggerPicker = () => {
    setError(null);
    inputRef.current?.click();
  };

  const onFilesChosen = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.currentTarget.files;
    if (!files || files.length === 0) return setSelected([]);
    setSelected(Array.from(files));
    // auto-import immediately
    await doImportWith(Array.from(files));
  };

  const doImportWith = async (files: Array<File>) => {
    setIsUploading(true);
    setError(null);
    try {
      const formData = new FormData();
      for (const file of files) formData.append('files', file);
      const res = await fetch('/api/flights', { method: 'POST', body: formData, credentials: 'include' });
      if (!res.ok) {
        const data: unknown = await res.json().catch(() => null);
        let message = `Upload failed (${res.status})`;
        if (data && typeof data === 'object' && 'error' in data) {
          const errVal = (data as Record<string, unknown>).error;
          if (typeof errVal === 'string') message = errVal;
        }
        throw new Error(message);
      }
      await res.json().catch(() => null);
      try { window.dispatchEvent(new Event('flights:data-changed')); } catch {}
      try {
        window.dispatchEvent(new Event('flights:processing-start'));
        await fetch('/api/flights/process', { method: 'POST', cache: 'no-store' });
      } catch {}
      setSelected([]);
      if (inputRef.current) inputRef.current.value = '';
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Upload failed');
    } finally {
      setIsUploading(false);
    }
  };

  const doImport = async () => {
    if (selected.length === 0) return;
    setIsUploading(true);
    setError(null);
    try {
      const formData = new FormData();
      for (const file of selected) formData.append('files', file);
      const res = await fetch('/api/flights', { method: 'POST', body: formData, credentials: 'include' });
      if (!res.ok) {
        const data: unknown = await res.json().catch(() => null);
        let message = `Upload failed (${res.status})`;
        if (data && typeof data === 'object' && 'error' in data) {
          const errVal = (data as Record<string, unknown>).error;
          if (typeof errVal === 'string') message = errVal;
        }
        throw new Error(message);
      }
      await res.json().catch(() => null);
      try { window.dispatchEvent(new Event('flights:data-changed')); } catch {}
      try {
        window.dispatchEvent(new Event('flights:processing-start'));
        await fetch('/api/flights/process', { method: 'POST', cache: 'no-store' });
      } catch {}
      setSelected([]);
      if (inputRef.current) inputRef.current.value = '';
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Upload failed');
    } finally {
      setIsUploading(false);
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
        <div className="flex flex-wrap items-center gap-3">
          <Button type="button" onClick={triggerPicker} disabled={isUploading} aria-busy={isUploading}>
            {isUploading ? 'Import en cours…' : 'Choisir et importer'}
          </Button>
        </div>
      </div>
      {selected.length > 0 ? (
        <div className="flex flex-wrap gap-2">
          {selected.slice(0, 5).map((f) => (
            <span key={f.name} className="chip">{f.name}</span>
          ))}
          {selected.length > 5 ? (<span className="chip">+{selected.length - 5}</span>) : null}
        </div>
      ) : null}
      <div className="flex items-center gap-3">
        {error ? <span className="text-xs text-red-500">{error}</span> : null}
      </div>
    </div>
  );
}


