
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export const useEducationPDFs = () => {
  return useQuery({
    queryKey: ['education-pdfs'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('Education')
        .select('DocumentTitle, file_path')
        .eq('Active', 'Yes')
        .not('file_path', 'is', null);

      if (error) {
        console.error('Error fetching education PDFs:', error);
        throw error;
      }

      return data || [];
    },
  });
};

export const openPDFByTitle = async (documentTitle: string) => {
  try {
    const { data, error } = await supabase
      .from('Education')
      .select('file_path')
      .eq('DocumentTitle', documentTitle)
      .eq('Active', 'Yes')
      .not('file_path', 'is', null)
      .single();

    if (error) {
      console.error('Error fetching PDF:', error);
      return;
    }

    if (data?.file_path) {
      window.open(data.file_path, '_blank');
    } else {
      console.warn('No PDF found for:', documentTitle);
    }
  } catch (error) {
    console.error('Error opening PDF:', error);
  }
};
