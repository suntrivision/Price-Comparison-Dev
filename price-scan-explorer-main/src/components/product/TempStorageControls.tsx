
import React from 'react';
import { Button } from '@/components/ui/button';
import { RefreshCw, Cloud, AlertCircle } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { useTempProductStorage } from '@/hooks/useTempProductStorage';

export function TempStorageControls() {
  const { pendingUpdatesCount, isLoading, retryPendingSync, refreshFromDatabase } = useTempProductStorage();

  if (pendingUpdatesCount === 0) {
    return null;
  }

  return (
    <div className="flex items-center gap-2 p-2 bg-yellow-50 border border-yellow-200 rounded-lg">
      <AlertCircle className="h-4 w-4 text-yellow-600" />
      <span className="text-sm text-yellow-800">
        <Badge variant="secondary" className="mr-2">
          {pendingUpdatesCount}
        </Badge>
        pending changes not synced to database
      </span>
      
      <div className="flex gap-2 ml-auto">
        <Button
          variant="outline"
          size="sm"
          onClick={retryPendingSync}
          disabled={isLoading}
          className="flex items-center gap-1"
        >
          <Cloud className="h-3 w-3" />
          Retry Sync
        </Button>
        
        <Button
          variant="outline"
          size="sm"
          onClick={refreshFromDatabase}
          disabled={isLoading}
          className="flex items-center gap-1"
        >
          <RefreshCw className="h-3 w-3" />
          Refresh
        </Button>
      </div>
    </div>
  );
}
