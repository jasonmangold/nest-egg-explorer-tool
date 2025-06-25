
import { useEffect, useRef } from 'react';
import { getLeadTracker } from '@/services/leadTracking';
import { trackButtonClick, trackInput, trackResults, trackPDFRequest, trackFormSubmission, trackEducationalContent, trackTooltip, trackPodcast } from '@/utils/trackingHelpers';

export const useLeadTracking = () => {
  const tracker = getLeadTracker();
  const podcastStartTime = useRef<number | null>(null);

  useEffect(() => {
    console.log('📊 Lead tracking hook initialized');
    // Test the tracking system
    console.log('🔍 Testing tracking system...');
  }, []);

  const trackCalculateButtonClick = () => {
    console.log('🎯 useLeadTracking: trackCalculateButtonClick called');
    trackButtonClick.calculate();
  };

  const trackFindATimeClick = () => {
    console.log('🎯 useLeadTracking: trackFindATimeClick called');
    trackButtonClick.findATime();
  };

  const trackContactMeClick = () => {
    console.log('🎯 useLeadTracking: trackContactMeClick called');
    trackButtonClick.contactMe();
  };

  const trackExportResultsClick = () => {
    console.log('🎯 useLeadTracking: trackExportResultsClick called');
    trackButtonClick.exportResults();
  };

  const trackListenNowClick = () => {
    console.log('🎯 useLeadTracking: trackListenNowClick called');
    trackButtonClick.listenNow();
  };

  const trackReadReportClick = (buttonId?: string) => {
    console.log('🎯 useLeadTracking: trackReadReportClick called with ID:', buttonId);
    trackButtonClick.readReport(buttonId);
  };

  const trackCalculatorInput = (field: 'savings' | 'spending', value: number) => {
    if (field === 'savings') {
      trackInput.savings(value);
    } else {
      trackInput.spending(value);
    }
  };

  const trackCalculatorInputChange = (field: 'savings' | 'spending', value: number) => {
    trackCalculatorInput(field, value);
  };

  const trackProjectedResults = (safeMonthlyAmount: number, yearsUntilEmpty: number, isMoneyLasting: boolean) => {
    trackResults(safeMonthlyAmount, yearsUntilEmpty, isMoneyLasting);
  };

  const trackPDFRequest = (firstName: string, email: string, wasCalculated: boolean = false) => {
    trackPDFRequest(firstName, email, wasCalculated);
  };

  const trackContactFormSubmission = () => {
    trackFormSubmission();
  };

  const trackTooltipInteraction = () => {
    trackTooltip();
  };

  const trackEducationalContentClick = () => {
    trackEducationalContent();
  };

  const trackPodcastPlay = () => {
    podcastStartTime.current = Date.now();
    trackPodcast.play();
    console.log('Podcast play started');
  };

  const trackPodcastPause = () => {
    if (podcastStartTime.current) {
      const listenTime = (Date.now() - podcastStartTime.current) / 1000;
      tracker.trackPodcastEngagement(listenTime);
      podcastStartTime.current = null;
    }
    trackPodcast.pause();
  };

  const trackPodcastEnded = () => {
    if (podcastStartTime.current) {
      const listenTime = (Date.now() - podcastStartTime.current) / 1000;
      tracker.trackPodcastEngagement(listenTime);
      podcastStartTime.current = null;
    }
    trackPodcast.ended();
  };

  const trackPlayerClosedEarly = () => {
    trackPodcast.closedEarly();
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
