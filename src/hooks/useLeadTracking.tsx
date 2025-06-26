
import { useEffect } from 'react';
import { getLeadTracker } from '@/services/leadTracking';

export const useLeadTracking = () => {
  const tracker = getLeadTracker();

  useEffect(() => {
    console.log('📊 Enhanced Lead tracking hook initialized');
    console.log('🔍 Enhanced tracking system active...');
  }, []);

  // All tracking is now handled automatically by the enhanced tracker
  // These methods are kept for backward compatibility but delegate to the enhanced system
  const trackCalculateButtonClick = () => {
    console.log('🎯 useLeadTracking: trackCalculateButtonClick called');
    tracker.submitLead();
  };

  const trackFindATimeClick = () => {
    console.log('🎯 useLeadTracking: trackFindATimeClick called');
    tracker.submitLead();
  };

  const trackContactMeClick = () => {
    console.log('🎯 useLeadTracking: trackContactMeClick called');
    tracker.submitLead();
  };

  const trackExportResultsClick = () => {
    console.log('🎯 useLeadTracking: trackExportResultsClick called');
    tracker.submitLead();
  };

  const trackListenNowClick = () => {
    console.log('🎯 useLeadTracking: trackListenNowClick called');
    tracker.trackPodcastPlay();
  };

  const trackReadReportClick = (buttonId?: string) => {
    console.log('🎯 useLeadTracking: trackReadReportClick called with ID:', buttonId);
    tracker.submitLead();
  };

  const trackCalculatorInput = (field: 'savings' | 'spending', value: number) => {
    console.log('🎯 useLeadTracking: trackCalculatorInput called with:', field, value);
    // Update the tracker with the actual values
    if (field === 'savings') {
      tracker.updateFinancialData(value, undefined, undefined, undefined);
    } else if (field === 'spending') {
      tracker.updateFinancialData(undefined, value, undefined, undefined);
    }
  };

  const trackCalculatorInputChange = (field: 'savings' | 'spending', value: number) => {
    console.log('🎯 useLeadTracking: trackCalculatorInputChange called with:', field, value);
    // Update the tracker with the actual values
    if (field === 'savings') {
      tracker.updateFinancialData(value, undefined, undefined, undefined);
    } else if (field === 'spending') {
      tracker.updateFinancialData(undefined, value, undefined, undefined);
    }
  };

  const trackProjectedResults = (safeMonthlyAmount: number, yearsUntilEmpty: number, isMoneyLasting: boolean) => {
    console.log('🎯 useLeadTracking: trackProjectedResults called with:', { safeMonthlyAmount, yearsUntilEmpty, isMoneyLasting });
    // Update the tracker with calculated results
    const viability = isMoneyLasting ? 'Sustainable' : 'Needs Adjustment';
    tracker.updateFinancialData(undefined, undefined, safeMonthlyAmount, viability);
    tracker.submitLead();
  };

  const trackPDFRequest = (firstName: string, email: string, wasCalculated: boolean = false) => {
    console.log('🎯 useLeadTracking: trackPDFRequest called with:', { firstName, email, wasCalculated });
    tracker.trackPDFRequest(firstName, email);
  };

  const trackContactFormSubmission = () => {
    console.log('🎯 useLeadTracking: trackContactFormSubmission called');
    tracker.submitLead();
  };

  const trackTooltipInteraction = () => {
    console.log('🎯 useLeadTracking: trackTooltipInteraction called');
    // Enhanced tracker handles this automatically
  };

  const trackEducationalContentClick = () => {
    console.log('🎯 useLeadTracking: trackEducationalContentClick called');
    // Enhanced tracker handles this automatically
  };

  const trackPodcastPlay = () => {
    tracker.trackPodcastPlay();
    console.log('🎯 useLeadTracking: Podcast play started');
  };

  const trackPodcastPause = () => {
    tracker.trackPodcastPause();
    console.log('🎯 useLeadTracking: Podcast paused');
  };

  const trackPodcastEnded = () => {
    tracker.trackPodcastPause();
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
