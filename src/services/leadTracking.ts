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

// Function to calculate lead score based on user behavior (updated to match your algorithm)
function calculateLeadScore(metrics: any) {
  let score = 0;
  
  // Time on page scoring (0-15 points)
  if (metrics.timeOnPage > 300) score += 15; // 5+ minutes
  else if (metrics.timeOnPage > 120) score += 10; // 2+ minutes
  else if (metrics.timeOnPage > 60) score += 5; // 1+ minute
  
  // Scroll depth scoring (0-10 points)
  if (metrics.scrollDepth > 80) score += 10;
  else if (metrics.scrollDepth > 50) score += 5;
  
  // Calculator interactions (0-15 points)
  score += Math.min(15, metrics.calculatorInteractions * 3);
  
  // PDF download (10 points)
  if (metrics.pdfDownloaded) score += 10;
  
  // Contact attempt (10 points)
  if (metrics.contactAttempted) score += 10;
  
  // Financial profile scoring (40 points)
  if (metrics.currentSavings > 200000) score += 15;
  else if (metrics.currentSavings > 100000) score += 10;
  else if (metrics.currentSavings > 50000) score += 5;
  
  if (metrics.monthlySpending < 4000) score += 10;
  else if (metrics.monthlySpending < 6000) score += 5;
  
  if (metrics.retirementViability === 'Sustainable') score += 15;
  else score += 5;
  
  return Math.min(100, Math.round(score));
}

// Function to determine lead quality (updated to match your algorithm)
function determineLeadQuality(score: number, hasContact: boolean, financialProfile?: any) {
  if (score >= 80) return 'Premium';
  if (score >= 60) return 'Hot';
  if (score >= 40) return 'Warm';
  return 'Cold';
}

// Function to submit lead data (updated to use your Supabase endpoint)
async function submitLeadData(leadData: any) {
  try {
    const response = await fetch('https://kmfowuhsilkpgturbumu.supabase.co/functions/v1/api-leads', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImttZm93dWhzaWxrcGd0dXJidW11Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTAyODI2NDEsImV4cCI6MjA2NTg1ODY0MX0.zmCFsruKxL6N6hToX2GOKzMyzcelLSfwgcFmqKrG7s4'
      },
      body: JSON.stringify(leadData),
      mode: 'cors'
    });
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error('❌ API Error Response:', errorText);
      throw new Error(`HTTP error! status: ${response.status}, response: ${errorText}`);
    }
    
    const result = await response.json();
    console.log('✅ Lead data submitted successfully to Supabase:', result);
    return result;
  } catch (error) {
    console.error('❌ Error submitting lead data to Supabase:', error);
    // Store in localStorage as backup
    localStorage.setItem(`leadData_${Date.now()}`, JSON.stringify(leadData));
    throw error;
  }
}

class LeadTracker {
  private leadData: LeadData;
  private startTime: number;
  private lastScrollPosition: number = 0;
  private maxScrollPercentage: number = 0;
  private lastScoreCalculation: number = 0;
  private scoreDebounceDelay: number = 2000;
  private scoreThresholds = {
    premium: 80,
    hot: 60,
    warm: 40
  };
  private hasBeenSubmitted: boolean = false; // Track if this lead has been submitted

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

  // Updated score calculation to include financial profile data
  private calculateScore() {
    const metrics = {
      timeOnPage: this.leadData.interactions.timeOnPage,
      scrollDepth: this.leadData.interactions.scrollPercentage,
      calculatorInteractions: this.leadData.interactions.calculatorUsage,
      pdfDownloaded: this.leadData.interactions.pdfRequested,
      contactAttempted: this.leadData.interactions.contactFormSubmitted,
      currentSavings: this.leadData.userInputs.currentSavings || 0,
      monthlySpending: this.leadData.userInputs.monthlySpending || 0,
      retirementViability: this.leadData.projectedResults.isMoneyLasting ? 'Sustainable' : 'Needs Adjustment'
    };

    const oldScore = this.leadData.calculatedScore;
    this.leadData.calculatedScore = calculateLeadScore(metrics);
    
    const hasContact = !!(this.leadData.userInputs.firstName && this.leadData.userInputs.email);
    this.leadData.leadQuality = determineLeadQuality(this.leadData.calculatedScore, hasContact) as 'Cold' | 'Warm' | 'Hot' | 'Premium';

    // Only log if score actually changed significantly
    if (Math.abs(this.leadData.calculatedScore - oldScore) >= 5) {
      console.log('🎯 Lead score updated:', this.leadData.calculatedScore, this.leadData.leadQuality);
    }
  }

  // Updated onUserInteraction to prevent duplicate submissions
  private async onUserInteraction() {
    // Prevent duplicate submissions for the same session
    if (this.hasBeenSubmitted) {
      console.log('Lead already submitted for this session, skipping...');
      return;
    }

    if (this.leadData.calculatedScore >= this.scoreThresholds.warm || 
        this.leadData.interactions.pdfRequested || 
        this.leadData.interactions.contactFormSubmitted) {
      
      try {
        const payload = this.createDashboardPayload();
        await submitLeadData(payload);
        this.hasBeenSubmitted = true; // Mark as submitted to prevent duplicates
        console.log('✅ Lead submitted successfully, session marked as submitted');
      } catch (error) {
        console.error('❌ Failed to submit lead data:', error);
        // Don't mark as submitted if there was an error, allow retry
      }
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
