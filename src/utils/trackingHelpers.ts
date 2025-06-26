
import { getLeadTracker } from '@/services/leadTracking';

// Helper functions to ensure proper tracking calls using the enhanced tracker
export const trackButtonClick = {
  calculate: () => {
    console.log('🔥 trackButtonClick.calculate called');
    const tracker = getLeadTracker();
    // The enhanced tracker handles this automatically via click detection
    // But we can also trigger it manually if needed
    tracker.submitLead();
  },
  
  findATime: () => {
    console.log('🔥 trackButtonClick.findATime called');
    const tracker = getLeadTracker();
    // Enhanced tracker handles this via click detection
    tracker.submitLead();
  },
  
  contactMe: () => {
    console.log('🔥 trackButtonClick.contactMe called');
    const tracker = getLeadTracker();
    // Enhanced tracker handles this via click detection
    tracker.submitLead();
  },
  
  exportResults: () => {
    console.log('🔥 trackButtonClick.exportResults called');
    const tracker = getLeadTracker();
    tracker.submitLead();
  },
  
  listenNow: () => {
    console.log('🔥 trackButtonClick.listenNow called');
    const tracker = getLeadTracker();
    tracker.trackPodcastPlay();
  },
  
  readReport: (buttonId?: string) => {
    console.log('🔥 trackButtonClick.readReport called with ID:', buttonId);
    // Enhanced tracker handles this via click detection
    const tracker = getLeadTracker();
    tracker.submitLead();
  }
};

// Helper for input tracking
export const trackInput = {
  savings: (value: number) => {
    console.log('🔥 trackInput.savings called with value:', value);
    // Enhanced tracker handles this via input detection
  },
  
  spending: (value: number) => {
    console.log('🔥 trackInput.spending called with value:', value);
    // Enhanced tracker handles this via input detection
  }
};

// Helper for results tracking
export const trackResults = (safeMonthlyAmount: number, yearsUntilEmpty: number, isMoneyLasting: boolean) => {
  console.log('🔥 trackResults called with:', { safeMonthlyAmount, yearsUntilEmpty, isMoneyLasting });
  const tracker = getLeadTracker();
  tracker.submitLead();
};

// Helper for PDF requests
export const trackPDFRequest = (firstName: string, email: string, wasCalculated: boolean = false) => {
  console.log('🔥 trackPDFRequest called with:', { firstName, email, wasCalculated });
  const tracker = getLeadTracker();
  tracker.trackPDFRequest(firstName, email);
};

// Helper for form submissions
export const trackFormSubmission = () => {
  console.log('🔥 trackFormSubmission called');
  const tracker = getLeadTracker();
  tracker.submitLead();
};

// Helper for educational content
export const trackEducationalContent = () => {
  console.log('🔥 trackEducationalContent called');
  // Enhanced tracker handles this via click detection
};

// Helper for tooltip interactions
export const trackTooltip = () => {
  console.log('🔥 trackTooltip called');
  // Enhanced tracker handles this via mouseover detection
};

// Helper for podcast tracking
export const trackPodcast = {
  play: () => {
    console.log('🔥 trackPodcast.play called');
    const tracker = getLeadTracker();
    tracker.trackPodcastPlay();
  },
  
  pause: () => {
    console.log('🔥 trackPodcast.pause called');
    const tracker = getLeadTracker();
    tracker.trackPodcastPause();
  },
  
  ended: () => {
    console.log('🔥 trackPodcast.ended called');
    const tracker = getLeadTracker();
    tracker.trackPodcastPause();
  },
  
  closedEarly: () => {
    console.log('🔥 trackPodcast.closedEarly called');
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
  tracker.submitLead();
};
