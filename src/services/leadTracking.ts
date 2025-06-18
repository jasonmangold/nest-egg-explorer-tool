
export interface LeadData {
  sessionId: string;
  timestamp: Date;
  userInputs: {
    currentSavings?: number;
    monthlySpending?: number;
    firstName?: string;
    email?: string;
  };
  interactions: {
    timeOnPage: number;
    scrollPercentage: number;
    calculatorUsage: number;
    podcastListenTime: number;
    pdfRequested: boolean;
    contactFormSubmitted: boolean;
    tooltipInteractions: number;
    educationalContentClicks: number;
  };
  calculatedScore: number;
  leadQuality: 'Cold' | 'Warm' | 'Hot' | 'Premium';
  projectedResults: {
    safeMonthlyAmount: number;
    yearsUntilEmpty: number;
    isMoneyLasting: boolean;
  };
}

export interface DashboardPayload {
  leadId: string;
  score: number;
  quality: string;
  timestamp: string;
  pageMetrics: {
    timeOnPage: number;
    scrollDepth: number;
    bounced: boolean;
  };
  financialProfile: {
    currentSavings: number;
    monthlySpending: number;
    safeWithdrawalAmount: number;
    retirementViability: string;
  };
  engagementData: {
    calculatorInteractions: number;
    pdfDownloaded: boolean;
    podcastEngagement: number;
    contactAttempted: boolean;
  };
  contactInfo?: {
    firstName: string;
    email: string;
  };
}

// Function to calculate lead score based on user behavior (your exact implementation)
function calculateLeadScore(metrics: any) {
  let score = 0;
  
  // Time on page scoring (0-25 points)
  if (metrics.timeOnPage > 300) score += 25;
  else if (metrics.timeOnPage > 180) score += 15;
  else if (metrics.timeOnPage > 60) score += 10;
  
  // Scroll depth scoring (0-15 points)
  score += Math.min(15, metrics.scrollDepth * 0.15);
  
  // Calculator interactions (0-20 points)
  score += Math.min(20, metrics.calculatorInteractions * 4);
  
  // PDF download (15 points)
  if (metrics.pdfDownloaded) score += 15;
  
  // Contact attempt (25 points)
  if (metrics.contactAttempted) score += 25;
  
  return Math.min(100, Math.round(score));
}

// Function to determine lead quality (your exact implementation)
function determineLeadQuality(score: number, hasContact: boolean, financialProfile?: any) {
  if (hasContact && score >= 80) return 'Premium';
  if (score >= 70 || hasContact) return 'Hot';
  if (score >= 40) return 'Warm';
  return 'Cold';
}

// Function to submit lead data (updated to use the correct endpoint)
async function submitLeadData(leadData: any) {
  try {
    const response = await fetch('https://preview--nest-egg-insight-hub.lovable.app/api/leads', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(leadData),
      mode: 'cors'
    });
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    console.log('Lead data submitted successfully');
  } catch (error) {
    console.error('Error submitting lead data:', error);
    // Store in localStorage as backup
    localStorage.setItem(`leadData_${Date.now()}`, JSON.stringify(leadData));
  }
}

class LeadTracker {
  private leadData: LeadData;
  private startTime: number;
  private lastScrollPosition: number = 0;
  private maxScrollPercentage: number = 0;
  private lastScoreCalculation: number = 0;
  private scoreDebounceDelay: number = 2000; // Reduced to 2 seconds for more frequent updates
  private scoreThresholds = {
    premium: 80,
    hot: 70,
    warm: 40
  };

  constructor() {
    this.leadData = {
      sessionId: this.generateSessionId(),
      timestamp: new Date(),
      userInputs: {},
      interactions: {
        timeOnPage: 0,
        scrollPercentage: 0,
        calculatorUsage: 0,
        podcastListenTime: 0,
        pdfRequested: false,
        contactFormSubmitted: false,
        tooltipInteractions: 0,
        educationalContentClicks: 0
      },
      calculatedScore: 0,
      leadQuality: 'Cold',
      projectedResults: {
        safeMonthlyAmount: 0,
        yearsUntilEmpty: 0,
        isMoneyLasting: false
      }
    };
    this.startTime = Date.now();
    this.initializeTracking();
  }

  private generateSessionId(): string {
    return 'session_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
  }

  private initializeTracking() {
    // Track time on page - more frequent updates
    setInterval(() => {
      this.leadData.interactions.timeOnPage = (Date.now() - this.startTime) / 1000;
      this.debouncedCalculateScore();
    }, 5000); // Every 5 seconds

    // Track scroll depth
    window.addEventListener('scroll', this.handleScroll.bind(this));

    // Track page visibility for bounce detection
    document.addEventListener('visibilitychange', this.handleVisibilityChange.bind(this));

    // Track before unload
    window.addEventListener('beforeunload', this.handleBeforeUnload.bind(this));

    // Submit after 30 seconds (as per your code)
    setTimeout(() => this.onUserInteraction(), 30000);
  }

  private handleScroll() {
    const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
    const docHeight = document.documentElement.scrollHeight - document.documentElement.clientHeight;
    const scrollPercentage = Math.round((scrollTop / docHeight) * 100);
    
    if (scrollPercentage > this.maxScrollPercentage) {
      this.maxScrollPercentage = scrollPercentage;
      this.leadData.interactions.scrollPercentage = this.maxScrollPercentage;
      this.debouncedCalculateScore();
    }
  }

  private handleVisibilityChange() {
    if (document.hidden) {
      this.onUserInteraction();
    }
  }

  private handleBeforeUnload() {
    this.onUserInteraction();
  }

  // Debounced score calculation to prevent excessive updates
  private debouncedCalculateScore() {
    const now = Date.now();
    if (now - this.lastScoreCalculation > this.scoreDebounceDelay) {
      this.calculateScore();
      this.lastScoreCalculation = now;
    }
  }

  // Public methods for tracking specific interactions
  trackCalculatorInput(field: 'savings' | 'spending', value: number) {
    if (field === 'savings') {
      this.leadData.userInputs.currentSavings = value;
    } else {
      this.leadData.userInputs.monthlySpending = value;
    }
    this.leadData.interactions.calculatorUsage++;
    this.debouncedCalculateScore();
    console.log('Calculator input tracked:', field, value);
  }

  trackProjectedResults(safeMonthlyAmount: number, yearsUntilEmpty: number, isMoneyLasting: boolean) {
    this.leadData.projectedResults = {
      safeMonthlyAmount,
      yearsUntilEmpty,
      isMoneyLasting
    };
    this.debouncedCalculateScore();
  }

  trackPodcastEngagement(timeInSeconds: number) {
    this.leadData.interactions.podcastListenTime = timeInSeconds;
    this.debouncedCalculateScore();
    console.log('Podcast engagement tracked:', timeInSeconds);
  }

  trackPDFRequest(firstName: string, email: string) {
    this.leadData.userInputs.firstName = firstName;
    this.leadData.userInputs.email = email;
    this.leadData.interactions.pdfRequested = true;
    this.calculateScore();
    this.onUserInteraction();
    console.log('PDF request tracked:', firstName, email);
  }

  trackContactFormSubmission() {
    this.leadData.interactions.contactFormSubmitted = true;
    this.calculateScore();
    this.onUserInteraction();
    console.log('Contact form submission tracked');
  }

  trackTooltipInteraction() {
    this.leadData.interactions.tooltipInteractions++;
    this.debouncedCalculateScore();
    console.log('Tooltip interaction tracked');
  }

  trackEducationalContentClick() {
    this.leadData.interactions.educationalContentClicks++;
    this.debouncedCalculateScore();
    console.log('Educational content click tracked');
  }

  // Use your exact scoring algorithm
  private calculateScore() {
    const metrics = {
      timeOnPage: this.leadData.interactions.timeOnPage,
      scrollDepth: this.leadData.interactions.scrollPercentage,
      calculatorInteractions: this.leadData.interactions.calculatorUsage,
      pdfDownloaded: this.leadData.interactions.pdfRequested,
      contactAttempted: this.leadData.interactions.contactFormSubmitted
    };

    const oldScore = this.leadData.calculatedScore;
    this.leadData.calculatedScore = calculateLeadScore(metrics);
    
    const hasContact = !!(this.leadData.userInputs.firstName && this.leadData.userInputs.email);
    this.leadData.leadQuality = determineLeadQuality(this.leadData.calculatedScore, hasContact) as 'Cold' | 'Warm' | 'Hot' | 'Premium';

    // Only log if score actually changed significantly
    if (Math.abs(this.leadData.calculatedScore - oldScore) >= 5) {
      console.log('Lead score updated:', this.leadData.calculatedScore, this.leadData.leadQuality);
    }
  }

  // Implementation of your onUserInteraction function
  private onUserInteraction() {
    if (this.leadData.calculatedScore >= this.scoreThresholds.warm || 
        this.leadData.interactions.pdfRequested || 
        this.leadData.interactions.contactFormSubmitted) {
      
      const payload = this.createDashboardPayload();
      submitLeadData(payload);
    }
  }

  private createDashboardPayload(): DashboardPayload {
    const bounced = this.leadData.interactions.timeOnPage < 30 && this.leadData.interactions.scrollPercentage < 25;
    
    return {
      leadId: this.leadData.sessionId,
      score: this.leadData.calculatedScore,
      quality: this.leadData.leadQuality,
      timestamp: new Date().toISOString(),
      pageMetrics: {
        timeOnPage: Math.round(this.leadData.interactions.timeOnPage),
        scrollDepth: Math.round(this.leadData.interactions.scrollPercentage),
        bounced
      },
      financialProfile: {
        currentSavings: this.leadData.userInputs.currentSavings || 0,
        monthlySpending: this.leadData.userInputs.monthlySpending || 0,
        safeWithdrawalAmount: this.leadData.projectedResults.safeMonthlyAmount,
        retirementViability: this.leadData.projectedResults.isMoneyLasting ? 'Sustainable' : 'Needs Adjustment'
      },
      engagementData: {
        calculatorInteractions: this.leadData.interactions.calculatorUsage,
        pdfDownloaded: this.leadData.interactions.pdfRequested,
        podcastEngagement: this.leadData.interactions.podcastListenTime,
        contactAttempted: this.leadData.interactions.contactFormSubmitted
      },
      contactInfo: this.leadData.userInputs.firstName && this.leadData.userInputs.email ? {
        firstName: this.leadData.userInputs.firstName,
        email: this.leadData.userInputs.email
      } : undefined
    };
  }

  getLeadData(): LeadData {
    return { ...this.leadData };
  }
}

// Create global instance
let globalLeadTracker: LeadTracker | null = null;

export const getLeadTracker = (): LeadTracker => {
  if (!globalLeadTracker) {
    globalLeadTracker = new LeadTracker();
  }
  return globalLeadTracker;
};

export default LeadTracker;
