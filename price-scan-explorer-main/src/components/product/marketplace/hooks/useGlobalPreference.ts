
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

export function useGlobalPreference(preferenceKey: string, defaultValue: string = '') {
  const [value, setValue] = useState<string>(defaultValue);
  const [isLoading, setIsLoading] = useState(true);

  // Load global preference from database
  useEffect(() => {
    const loadGlobalPreference = async () => {
      try {
        const { data, error } = await supabase
          .from('global_preferences')
          .select('preference_value')
          .eq('preference_key', preferenceKey)
          .single();
          
        if (data && !error) {
          setValue(data.preference_value);
        }
      } catch (err) {
        console.log('No saved global preference found, using default');
      } finally {
        setIsLoading(false);
      }
    };

    loadGlobalPreference();
  }, [preferenceKey]);

  // Save preference to database when it changes
  const updatePreference = async (newValue: string) => {
    setValue(newValue);
    
    try {
      const { error } = await supabase.rpc('upsert_global_preference', {
        p_preference_key: preferenceKey,
        p_preference_value: newValue
      });
      
      if (error) {
        console.error('Error saving global preference:', error);
      }
    } catch (err) {
      console.error('Error saving global preference:', err);
    }
  };

  return { value, updatePreference, isLoading };
}
