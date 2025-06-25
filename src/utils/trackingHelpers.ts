
import { getLeadTracker } from '@/services/leadTracking';

// Helper functions to ensure proper tracking calls
export const trackButtonClick = {
  calculate: () => {
    console.log('🔥 trackButtonClick.calculate called');
    const tracker = getLeadTracker();
    tracker.trackCalculateButtonClick();
  },
  
  findATime: () => {
    console.log('🔥 trackButtonClick.findATime called');
    const tracker = getLeadTracker();
    tracker.trackFindATimeClick();
  },
  
  contactMe: () => {
    console.log('🔥 trackButtonClick.contactMe called');
    const tracker = getLeadTracker();
    tracker.trackContactMeClick();
  },
  
  exportResults: () => {
    console.log('🔥 trackButtonClick.exportResults called');
    const tracker = getLeadTracker();
    tracker.trackExportResultsClick();
  },
  
  listenNow: () => {
    console.log('🔥 trackButtonClick.listenNow called');
    const tracker = getLeadTracker();
    tracker.trackListenNowClick();
  },
  
  readReport: (buttonId?: string) => {
    console.log('🔥 trackButtonClick.readReport called with ID:', buttonId);
    const tracker = getLeadTracker();
    tracker.trackReadReportClick(buttonId);
  }
};

// Helper for input tracking
export const trackInput = {
  savings: (value: number) => {
    const tracker = getLeadTracker();
    tracker.trackCalculatorInputChange('savings', value);
  },
  
  spending: (value: number) => {
    const tracker = getLeadTracker();
    tracker.trackCalculatorInputChange('spending', value);
  }
};

// Helper for results tracking
export const trackResults = (safeMonthlyAmount: number, yearsUntilEmpty: number, isMoneyLasting: boolean) => {
  const tracker = getLeadTracker();
  tracker.trackProjectedResults(safeMonthlyAmount, yearsUntilEmpty, isMoneyLasting);
};

// Helper for PDF requests
export const trackPDFRequest = (firstName: string, email: string, wasCalculated: boolean = false) => {
  const tracker = getLeadTracker();
  tracker.trackPDFRequest(firstName, email, wasCalculated);
};

// Helper for form submissions
export const trackFormSubmission = () => {
  const tracker = getLeadTracker();
  tracker.trackContactFormSubmission();
};

// Helper for educational content
export const trackEducationalContent = () => {
  const tracker = getLeadTracker();
  tracker.trackEducationalContentClick();
};

// Helper for tooltip interactions
export const trackTooltip = () => {
  const tracker = getLeadTracker();
  tracker.trackTooltipInteraction();
};

// Helper for podcast tracking
export const trackPodcast = {
  play: () => {
    const tracker = getLeadTracker();
    tracker.trackPodcastPlay();
  },
  
  pause: () => {
    const tracker = getLeadTracker();
    tracker.trackPodcastPause();
  },
  
  ended: () => {
    const tracker = getLeadTracker();
    tracker.trackPodcastEnded();
  },
  
  closedEarly: () => {
    const tracker = getLeadTracker();
    tracker.trackPlayerClosedEarly();
  }
};

// Debug helper to get current lead data
export const getLeadData = () => {
  const tracker = getLeadTracker();
  return tracker.getLeadData();
};

// Debug helper to manually submit lead
export const debugSubmitLead = () => {
  const tracker = getLeadTracker();
  // Access private method through type assertion for debugging
  (tracker as any).submitLead();
};
