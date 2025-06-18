
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

class LeadTracker {
  private leadData: LeadData;
  private startTime: number;
  private lastScrollPosition: number = 0;
  private maxScrollPercentage: number = 0;
  private scoreThresholds = {
    premium: 80,
    hot: 60,
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
    // Track time on page
    setInterval(() => {
      this.leadData.interactions.timeOnPage = (Date.now() - this.startTime) / 1000;
      this.calculateScore();
    }, 1000);

    // Track scroll depth
    window.addEventListener('scroll', this.handleScroll.bind(this));

    // Track page visibility for bounce detection
    document.addEventListener('visibilitychange', this.handleVisibilityChange.bind(this));

    // Track before unload
    window.addEventListener('beforeunload', this.handleBeforeUnload.bind(this));
  }

  private handleScroll() {
    const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
    const docHeight = document.documentElement.scrollHeight - document.documentElement.clientHeight;
    const scrollPercentage = Math.round((scrollTop / docHeight) * 100);
    
    if (scrollPercentage > this.maxScrollPercentage) {
      this.maxScrollPercentage = scrollPercentage;
      this.leadData.interactions.scrollPercentage = this.maxScrollPercentage;
      this.calculateScore();
    }
  }

  private handleVisibilityChange() {
    if (document.hidden) {
      this.sendToDashboard();
    }
  }

  private handleBeforeUnload() {
    this.sendToDashboard();
  }

  // Public methods for tracking specific interactions
  trackCalculatorInput(field: 'savings' | 'spending', value: number) {
    if (field === 'savings') {
      this.leadData.userInputs.currentSavings = value;
    } else {
      this.leadData.userInputs.monthlySpending = value;
    }
    this.leadData.interactions.calculatorUsage++;
    this.calculateScore();
    console.log('Calculator input tracked:', field, value);
  }

  trackProjectedResults(safeMonthlyAmount: number, yearsUntilEmpty: number, isMoneyLasting: boolean) {
    this.leadData.projectedResults = {
      safeMonthlyAmount,
      yearsUntilEmpty,
      isMoneyLasting
    };
    this.calculateScore();
  }

  trackPodcastEngagement(timeInSeconds: number) {
    this.leadData.interactions.podcastListenTime = timeInSeconds;
    this.calculateScore();
    console.log('Podcast engagement tracked:', timeInSeconds);
  }

  trackPDFRequest(firstName: string, email: string) {
    this.leadData.userInputs.firstName = firstName;
    this.leadData.userInputs.email = email;
    this.leadData.interactions.pdfRequested = true;
    this.calculateScore();
    this.sendToDatabase();
    console.log('PDF request tracked:', firstName, email);
  }

  trackContactFormSubmission() {
    this.leadData.interactions.contactFormSubmitted = true;
    this.calculateScore();
    this.sendToDatabase();
    console.log('Contact form submission tracked');
  }

  trackTooltipInteraction() {
    this.leadData.interactions.tooltipInteractions++;
    this.calculateScore();
    console.log('Tooltip interaction tracked');
  }

  trackEducationalContentClick() {
    this.leadData.interactions.educationalContentClicks++;
    this.calculateScore();
    console.log('Educational content click tracked');
  }

  private calculateScore() {
    let score = 0;
    const interactions = this.leadData.interactions;

    // Time on page scoring (0-20 points)
    if (interactions.timeOnPage > 600) score += 20; // 10+ minutes
    else if (interactions.timeOnPage > 300) score += 15; // 5-10 minutes  
    else if (interactions.timeOnPage > 120) score += 10; // 2-5 minutes
    else if (interactions.timeOnPage > 30) score += 5; // 30sec-2min

    // Scroll depth scoring (0-15 points)
    if (interactions.scrollPercentage >= 100) score += 15;
    else if (interactions.scrollPercentage >= 75) score += 12;
    else if (interactions.scrollPercentage >= 50) score += 8;
    else if (interactions.scrollPercentage >= 25) score += 5;

    // Calculator usage (5-25 points)
    if (interactions.calculatorUsage >= 5) score += 25;
    else if (interactions.calculatorUsage >= 3) score += 20;
    else if (interactions.calculatorUsage >= 1) score += 15;

    // Podcast engagement (0-25 points)
    if (interactions.podcastListenTime > 300) score += 25; // 5+ minutes
    else if (interactions.podcastListenTime > 120) score += 15; // 2-5 minutes
    else if (interactions.podcastListenTime > 30) score += 10; // 30sec-2min
    else if (interactions.podcastListenTime > 0) score += 5; // Any play

    // High-value actions
    if (interactions.pdfRequested) score += 30;
    if (interactions.contactFormSubmitted) score += 25;

    // Engagement indicators
    score += Math.min(interactions.tooltipInteractions * 2, 10); // Up to 10 points
    score += Math.min(interactions.educationalContentClicks * 3, 15); // Up to 15 points

    // Input quality bonus
    if (this.leadData.userInputs.currentSavings && this.leadData.userInputs.currentSavings > 0) score += 10;
    if (this.leadData.userInputs.monthlySpending && this.leadData.userInputs.monthlySpending > 0) score += 10;

    this.leadData.calculatedScore = score;
    this.leadData.leadQuality = this.determineLeadQuality(score);

    console.log('Lead score updated:', score, this.leadData.leadQuality);
  }

  private determineLeadQuality(score: number): 'Cold' | 'Warm' | 'Hot' | 'Premium' {
    if (score >= this.scoreThresholds.premium) return 'Premium';
    if (score >= this.scoreThresholds.hot) return 'Hot';
    if (score >= this.scoreThresholds.warm) return 'Warm';
    return 'Cold';
  }

  private createDashboardPayload(): DashboardPayload {
    const bounced = this.leadData.interactions.timeOnPage < 30 && this.leadData.interactions.scrollPercentage < 25;
    
    return {
      leadId: this.leadData.sessionId,
      score: this.leadData.calculatedScore,
      quality: this.leadData.leadQuality,
      timestamp: new Date().toISOString(),
      pageMetrics: {
        timeOnPage: this.leadData.interactions.timeOnPage,
        scrollDepth: this.leadData.interactions.scrollPercentage,
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

  private async sendToDatabase() {
    try {
      const payload = this.createDashboardPayload();
      console.log('Sending to dashboard:', payload);
      
      const response = await fetch('https://preview--nest-egg-insight-hub.lovable.app/api/leads', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
        mode: 'cors'
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      console.log('Lead data sent successfully to dashboard');
    } catch (error) {
      console.error('Failed to send lead data to dashboard:', error);
      // Store in localStorage as backup
      localStorage.setItem(`leadData_${this.leadData.sessionId}`, JSON.stringify(this.createDashboardPayload()));
    }
  }

  sendToDatabase() {
    this.sendToDatabase();
  }

  private sendToDatabase() {
    if (this.leadData.calculatedScore >= this.scoreThresholds.warm || 
        this.leadData.interactions.pdfRequested || 
        this.leadData.interactions.contactFormSubmitted) {
      this.sendToDatabase();
    }
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
