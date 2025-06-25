
import { useEffect, useRef } from 'react';
import { getLeadTracker } from '@/services/leadTracking';

export const useLeadTracking = () => {
  const tracker = getLeadTracker();
  const podcastStartTime = useRef<number | null>(null);

  useEffect(() => {
    console.log('📊 Lead tracking hook initialized');
    console.log('🔍 Testing tracking system...');
  }, []);

  const trackCalculateButtonClick = () => {
    console.log('🎯 useLeadTracking: trackCalculateButtonClick called');
    tracker.trackCalculateButtonClick();
  };

  const trackFindATimeClick = () => {
    console.log('🎯 useLeadTracking: trackFindATimeClick called');
    tracker.trackFindATimeClick();
  };

  const trackContactMeClick = () => {
    console.log('🎯 useLeadTracking: trackContactMeClick called');
    tracker.trackContactMeClick();
  };

  const trackExportResultsClick = () => {
    console.log('🎯 useLeadTracking: trackExportResultsClick called');
    tracker.trackExportResultsClick();
  };

  const trackListenNowClick = () => {
    console.log('🎯 useLeadTracking: trackListenNowClick called');
    tracker.trackListenNowClick();
  };

  const trackReadReportClick = (buttonId?: string) => {
    console.log('🎯 useLeadTracking: trackReadReportClick called with ID:', buttonId);
    tracker.trackReadReportClick(buttonId);
  };

  const trackCalculatorInput = (field: 'savings' | 'spending', value: number) => {
    console.log('🎯 useLeadTracking: trackCalculatorInput called with:', field, value);
    tracker.trackCalculatorInput(field, value);
  };

  const trackCalculatorInputChange = (field: 'savings' | 'spending', value: number) => {
    console.log('🎯 useLeadTracking: trackCalculatorInputChange called with:', field, value);
    tracker.trackCalculatorInputChange(field, value);
  };

  const trackProjectedResults = (safeMonthlyAmount: number, yearsUntilEmpty: number, isMoneyLasting: boolean) => {
    console.log('🎯 useLeadTracking: trackProjectedResults called with:', { safeMonthlyAmount, yearsUntilEmpty, isMoneyLasting });
    tracker.trackProjectedResults(safeMonthlyAmount, yearsUntilEmpty, isMoneyLasting);
  };

  const trackPDFRequest = (firstName: string, email: string, wasCalculated: boolean = false) => {
    console.log('🎯 useLeadTracking: trackPDFRequest called with:', { firstName, email, wasCalculated });
    tracker.trackPDFRequest(firstName, email, wasCalculated);
  };

  const trackContactFormSubmission = () => {
    console.log('🎯 useLeadTracking: trackContactFormSubmission called');
    tracker.trackContactFormSubmission();
  };

  const trackTooltipInteraction = () => {
    console.log('🎯 useLeadTracking: trackTooltipInteraction called');
    tracker.trackTooltipInteraction();
  };

  const trackEducationalContentClick = () => {
    console.log('🎯 useLeadTracking: trackEducationalContentClick called');
    tracker.trackEducationalContentClick();
  };

  const trackPodcastPlay = () => {
    podcastStartTime.current = Date.now();
    tracker.trackPodcastPlay();
    console.log('🎯 useLeadTracking: Podcast play started');
  };

  const trackPodcastPause = () => {
    if (podcastStartTime.current) {
      const listenTime = (Date.now() - podcastStartTime.current) / 1000;
      tracker.trackPodcastEngagement(listenTime);
      podcastStartTime.current = null;
    }
    tracker.trackPodcastPause();
    console.log('🎯 useLeadTracking: Podcast paused');
  };

  const trackPodcastEnded = () => {
    if (podcastStartTime.current) {
      const listenTime = (Date.now() - podcastStartTime.current) / 1000;
      tracker.trackPodcastEngagement(listenTime);
      podcastStartTime.current = null;
    }
    tracker.trackPodcastEnded();
    console.log('🎯 useLeadTracking: Podcast ended');
  };

  const trackPlayerClosedEarly = () => {
    tracker.trackPlayerClosedEarly();
    console.log('🎯 useLeadTracking: Player closed early');
  };

  return {
    trackCalculateButtonClick,
    trackFindATimeClick,
    trackContactMeClick,
    trackExportResultsClick,
    trackListenNowClick,
    trackReadReportClick,
    trackCalculatorInput,
    trackCalculatorInputChange,
    trackProjectedResults,
    trackPDFRequest,
    trackContactFormSubmission,
    trackTooltipInteraction,
    trackEducationalContentClick,
    trackPodcastPlay,
    trackPodcastPause,
    trackPodcastEnded,
    trackPlayerClosedEarly,
    getLeadData: () => tracker.getLeadData()
  };
};
