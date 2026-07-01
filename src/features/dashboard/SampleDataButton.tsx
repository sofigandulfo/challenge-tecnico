"use client";

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Sparkles } from 'lucide-react';

import { loadSampleData } from '@/app/dashboard/actions';
import { Button } from '@/components/ui/button';

export function SampleDataButton() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleLoadSampleData(): Promise<void> {
    setIsLoading(true);
    setError(null);

    try {
      const result = await loadSampleData();
      if (!result.success) {
        setError(result.error);
        return;
      }
      router.refresh();
    } catch {
      setError('Ocurrió un error inesperado. Intentá de nuevo.');
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div className="space-y-2">
      <Button
        type="button"
        variant="secondary"
        disabled={isLoading}
        onClick={handleLoadSampleData}
      >
        <Sparkles className="size-4" />
        {isLoading ? 'Cargando...' : 'Cargar datos de ejemplo'}
      </Button>
      {error && (
        <p className="text-sm text-destructive" role="alert">
          {error}
        </p>
      )}
    </div>
  );
}
