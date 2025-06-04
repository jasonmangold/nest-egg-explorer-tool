
import { Loader2 } from 'lucide-react';
import { toast } from '@/hooks/use-toast';

export const showLoadingToast = () => {
  return toast({
    title: "Loading Audio",
    description: (
      <div className="flex items-center space-x-2">
        <Loader2 className="w-4 h-4 animate-spin" />
        <span>Preparing your podcast...</span>
      </div>
    ),
    duration: 5000,
  });
};
