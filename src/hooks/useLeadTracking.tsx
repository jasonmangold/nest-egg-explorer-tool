
import { useEffect, useRef } from 'react';
import { getLeadTracker } from '@/services/leadTracking';

export const useLeadTracking = () => {
  const tracker = getLeadTracker();
  const podcastStartTime = useRef<number | null>(null);

  useEffect(() => {
    // Initialize tracking when hook is first used
    console.log('Lead tracking initialized');
  }, []);

  const trackCalculatorInput = (field: 'savings' | 'spending', value: number) => {
    tracker.trackCalculatorInput(field, value);
  };

  const trackProjectedResults = (safeMonthlyAmount: number, yearsUntilEmpty: number, isMoneyLasting: boolean) => {
    tracker.trackProjectedResults(safeMonthlyAmount, yearsUntilEmpty, isMoneyLasting);
  };

  const trackPDFRequest = (firstName: string, email: string) => {
    tracker.trackPDFRequest(firstName, email);
  };

  const trackContactFormSubmission = () => {
    tracker.trackContactFormSubmission();
  };

  const trackTooltipInteraction = () => {
    tracker.trackTooltipInteraction();
  };

  const trackEducationalContentClick = () => {
    tracker.trackEducationalContentClick();
  };

  const trackPodcastPlay = () => {
    podcastStartTime.current = Date.now();
    console.log('Podcast play started');
  };

  const trackPodcastPause = () => {
    if (podcastStartTime.current) {
      const listenTime = (Date.now() - podcastStartTime.current) / 1000;
      tracker.trackPodcastEngagement(listenTime);
      podcastStartTime.current = null;
    }
  };

  const trackPodcastEnded = () => {
    if (podcastStartTime.current) {
      const listenTime = (Date.now() - podcastStartTime.current) / 1000;
      tracker.trackPodcastEngagement(listenTime);
      podcastStartTime.current = null;
    }
  };

  return {
    trackCalculatorInput,
    trackProjectedResults,
    trackPDFRequest,
    trackContactFormSubmission,
    trackTooltipInteraction,
    trackEducationalContentClick,
    trackPodcastPlay,
    trackPodcastPause,
    trackPodcastEnded,
    getLeadData: () => tracker.getLeadData()
  };
};
