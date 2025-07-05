
import React, { useState, useEffect } from 'react';
import { Clock, User, ChevronDown, ChevronRight, Edit } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { useUploadedProducts } from '@/hooks/useUploadedProducts';
import type { Database } from '@/integrations/supabase/types';

type AuditRecord = Database['public']['Tables']['uploaded_products_audit']['Row'];

interface AuditHistoryProps {
  productId: string;
}

export function AuditHistory({ productId }: AuditHistoryProps) {
  const [auditHistory, setAuditHistory] = useState<AuditRecord[]>([]);
  const [loading, setLoading] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const { fetchAuditHistory } = useUploadedProducts();

  const loadAuditHistory = async () => {
    setLoading(true);
    const history = await fetchAuditHistory(productId);
    setAuditHistory(history);
    setLoading(false);
  };

  useEffect(() => {
    if (isOpen) {
      // Always refresh when opened to show latest changes
      loadAuditHistory();
    }
  }, [isOpen, productId]);

  const formatDateTime = (timestamp: string) => {
    const date = new Date(timestamp);
    return date.toLocaleString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      hour12: true
    });
  };

  const formatFieldName = (field: string) => {
    return field
      .replace(/_/g, ' ')
      .split(' ')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  };

  const formatFieldValue = (value: any) => {
    if (value === null || value === undefined) return 'empty';
    if (typeof value === 'string' && value.trim() === '') return 'empty';
    if (typeof value === 'string' && value.length > 50) {
      return value.substring(0, 50) + '...';
    }
    return String(value);
  };

  const formatFieldChanges = (record: AuditRecord) => {
    if (!record.old_values || !record.new_values || !record.changed_fields) {
      return null;
    }

    const oldValues = record.old_values as Record<string, any>;
    const newValues = record.new_values as Record<string, any>;
    const changedFields = record.changed_fields;

    return changedFields
      .filter(field => !['updated_at', 'last_modified_at', 'last_modified_by'].includes(field))
      .map(field => ({
        field,
        fieldName: formatFieldName(field),
        old: formatFieldValue(oldValues[field]),
        new: formatFieldValue(newValues[field])
      }));
  };

  const getEditedFieldsSummary = (record: AuditRecord) => {
    const changes = formatFieldChanges(record);
    if (!changes || changes.length === 0) return 'No fields changed';
    
    if (changes.length === 1) {
      return `Edited ${changes[0].fieldName}`;
    } else if (changes.length <= 3) {
      return `Edited ${changes.map(c => c.fieldName).join(', ')}`;
    } else {
      return `Edited ${changes.length} fields`;
    }
  };

  return (
    <Collapsible open={isOpen} onOpenChange={setIsOpen}>
      <CollapsibleTrigger asChild>
        <Button variant="ghost" size="sm" className="flex items-center gap-2 p-2">
          {isOpen ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
          <Clock className="h-4 w-4" />
          History ({auditHistory.length})
        </Button>
      </CollapsibleTrigger>
      <CollapsibleContent className="mt-2">
        <Card className="max-h-96 overflow-y-auto">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-2">
              <Clock className="h-4 w-4" />
              Change History
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {loading ? (
              <p className="text-sm text-muted-foreground">Loading history...</p>
            ) : auditHistory.length === 0 ? (
              <p className="text-sm text-muted-foreground">No changes recorded yet.</p>
            ) : (
              auditHistory.map((record) => {
                const changes = formatFieldChanges(record);
                const editSummary = getEditedFieldsSummary(record);
                
                return (
                  <div key={record.id} className="border-l-2 border-blue-200 pl-3 py-2 space-y-2">
                    <div className="flex items-center gap-2 text-xs">
                      <User className="h-3 w-3 text-muted-foreground" />
                      <span className="text-muted-foreground">User {record.changed_by.substring(0, 8)}...</span>
                      <Badge variant="outline" className="text-xs">
                        {record.action}
                      </Badge>
                      <span className="text-muted-foreground">{formatDateTime(record.changed_at)}</span>
                    </div>
                    
                    <div className="flex items-center gap-2 text-sm font-medium">
                      <Edit className="h-4 w-4 text-blue-600" />
                      <span className="text-blue-700">{editSummary}</span>
                    </div>
                    
                    {changes && changes.length > 0 && (
                      <div className="space-y-2 mt-2">
                        {changes.map(({ field, fieldName, old, new: newValue }) => (
                          <div key={field} className="bg-muted/30 p-3 rounded-md border">
                            <div className="font-medium text-sm text-foreground mb-2 flex items-center gap-1">
                              <Edit className="h-3 w-3" />
                              {fieldName}
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-xs">
                              <div className="bg-red-50 border border-red-200 p-2 rounded">
                                <span className="font-medium text-red-700">Before:</span>
                                <div className="text-red-800 mt-1 break-words">{old}</div>
                              </div>
                              <div className="bg-green-50 border border-green-200 p-2 rounded">
                                <span className="font-medium text-green-700">After:</span>
                                <div className="text-green-800 mt-1 break-words">{newValue}</div>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                );
              })
            )}
          </CardContent>
        </Card>
      </CollapsibleContent>
    </Collapsible>
  );
}
