
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

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

      console.log('Available PDFs in database:', data);
      return data || [];
    },
  });
};

export const openPDFByTitle = async (documentTitle: string) => {
  try {
    console.log('Looking for PDF with title:', documentTitle);
    
    const { data, error } = await supabase
      .from('Education')
      .select('file_path, DocumentTitle')
      .eq('DocumentTitle', documentTitle)
      .eq('Active', 'Yes')
      .not('file_path', 'is', null);

    if (error) {
      console.error('Error fetching PDF:', error);
      toast.error('Error accessing PDF database');
      return;
    }

    console.log('Database query result:', data);

    if (!data || data.length === 0) {
      console.warn('No PDF found for title:', documentTitle);
      toast.error(`PDF not found for "${documentTitle}". Please check if the document exists in the database.`);
      return;
    }

    // Use the first matching result
    const pdfRecord = data[0];
    
    if (pdfRecord?.file_path) {
      console.log('Opening PDF:', pdfRecord.file_path);
      window.open(pdfRecord.file_path, '_blank');
      toast.success('Opening PDF...');
    } else {
      console.warn('PDF record found but no file path:', pdfRecord);
      toast.error('PDF file path not available');
    }
  } catch (error) {
    console.error('Error opening PDF:', error);
    toast.error('Failed to open PDF');
  }
};
