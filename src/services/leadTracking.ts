
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
    calculateButtonClicks: number;
    findATimeClicks: number;
    contactMeClicks: number;
    exportResultsClicks: number;
    listenNowClicks: number;
    readReportClicks: number;
    inputChangesBeforeCalculate: number;
  };
  calculatedScore: number;
  leadQuality: 'unqualified' | 'cold' | 'warm' | 'hot';
  projectedResults: {
    safeMonthlyAmount: number;
    yearsUntilEmpty: number;
    isMoneyLasting: boolean;
  };
  negativeFlags: {
    quickBounce: boolean;
    playerClosedEarly: boolean;
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
    calculateButtonClicks: number;
    tooltipInteractions: number;
  };
  contactInfo?: {
    firstName: string;
    email: string;
  };
}

// Updated scoring algorithm based on new requirements
function calculateLeadScore(data: LeadData) {
  let score = 0;
  
  console.log('🔍 Calculating lead score with data:', {
    formCompleted: !!(data.userInputs.firstName && data.userInputs.email),
    findATimeClicks: data.interactions.findATimeClicks,
    contactMeClicks: data.interactions.contactMeClicks,
    calculateButtonClicks: data.interactions.calculateButtonClicks,
    exportResultsClicks: data.interactions.exportResultsClicks,
    listenNowClicks: data.interactions.listenNowClicks,
    readReportClicks: data.interactions.readReportClicks,
    podcastListenTime: data.interactions.podcastListenTime,
    inputChangesBeforeCalculate: data.interactions.inputChangesBeforeCalculate,
    scrollPercentage: data.interactions.scrollPercentage,
    timeOnPage: data.interactions.timeOnPage,
    quickBounce: data.negativeFlags.quickBounce,
    playerClosedEarly: data.negativeFlags.playerClosedEarly
  });
  
  // 🔥 High-Intent Interactions (Conversion-Driven)
  if (data.userInputs.firstName && data.userInputs.email) {
    score += 35; // Form Completion
    console.log('Added 35 points for form completion');
  }
  
  if (data.interactions.findATimeClicks > 0) {
    score += 35; // Find a Time (first click only)
    console.log('Added 35 points for Find a Time click');
  }
  
  if (data.interactions.contactMeClicks > 0) {
    score += 30; // Contact Me (first click only)
    console.log('Added 30 points for Contact Me click');
  }
  
  if (data.interactions.calculateButtonClicks > 0) {
    score += 25; // Calculate Button (once per session)
    console.log('Added 25 points for Calculate button click');
  }
  
  // Export Results with bonus logic
  if (data.interactions.exportResultsClicks > 0) {
    score += 20;
    console.log('Added 20 points for Export Results');
    // +10 bonus if done after Calculate (max +40 total)
    if (data.interactions.calculateButtonClicks > 0) {
      score += 10;
      console.log('Added 10 bonus points for Export Results after Calculate');
    }
  }
  
  // 🎧 Content Engagement Interactions
  if (data.interactions.listenNowClicks > 0) {
    score += 10; // Listen Now (first click only)
    console.log('Added 10 points for Listen Now click');
  }
  
  // Read Report clicks (up to 30 points, max 6 unique clicks)
  const readReportPoints = Math.min(30, data.interactions.readReportClicks * 5);
  score += readReportPoints;
  if (readReportPoints > 0) {
    console.log(`Added ${readReportPoints} points for Read Report clicks`);
  }
  
  // Podcast listening time (+2 per minute, max 10)
  const podcastPoints = Math.min(10, Math.floor(data.interactions.podcastListenTime / 60) * 2);
  score += podcastPoints;
  if (podcastPoints > 0) {
    console.log(`Added ${podcastPoints} points for podcast listening time`);
  }
  
  // 📊 Tool Engagement (Exploratory)
  // Calculator input changes (only if Calculate was eventually clicked)
  if (data.interactions.calculateButtonClicks > 0) {
    const inputChangePoints = Math.min(8, data.interactions.inputChangesBeforeCalculate * 2);
    score += inputChangePoints;
    if (inputChangePoints > 0) {
      console.log(`Added ${inputChangePoints} points for input changes before calculate`);
    }
  }
  
  // Scroll past 75%
  if (data.interactions.scrollPercentage > 75) {
    score += 10;
    console.log('Added 10 points for scrolling past 75%');
  }
  
  // 💬 Behavioral & Loyalty
  // Time on page scoring
  if (data.interactions.timeOnPage >= 600) { // 10+ minutes
    score += 15;
    console.log('Added 15 points for 10+ minutes on page');
  } else if (data.interactions.timeOnPage >= 300) { // 5-10 minutes
    score += 10;
    console.log('Added 10 points for 5-10 minutes on page');
  } else if (data.interactions.timeOnPage >= 120) { // 2-5 minutes
    score += 5;
    console.log('Added 5 points for 2-5 minutes on page');
  }
  
  // 🚫 Negative/Disqualifying
  if (data.negativeFlags.quickBounce) {
    score -= 15; // Quick bounce (<10s)
    console.log('Deducted 15 points for quick bounce');
  }
  
  if (data.negativeFlags.playerClosedEarly) {
    score -= 8; // Close player within 5 seconds
    console.log('Deducted 8 points for player closed early');
  }
  
  const finalScore = Math.max(0, score);
  console.log(`🎯 Final calculated score: ${finalScore}`);
  return finalScore;
}

// Updated lead quality determination - using lowercase to match database constraint
function determineLeadQuality(score: number): 'unqualified' | 'cold' | 'warm' | 'hot' {
  if (score >= 120) return 'hot';
  if (score >= 80) return 'warm';
  if (score >= 20) return 'cold';
  return 'unqualified';
}

// Function to submit lead data
async function submitLeadData(leadData: any) {
  try {
    console.log('📤 Submitting lead data:', leadData);
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
  private lastSubmissionTime: number = 0;
  private submissionCooldown: number = 30000; // 30 second cooldown

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
        educationalContentClicks: 0,
        calculateButtonClicks: 0,
        findATimeClicks: 0,
        contactMeClicks: 0,
        exportResultsClicks: 0,
        listenNowClicks: 0,
        readReportClicks: 0,
        inputChangesBeforeCalculate: 0
      },
      calculatedScore: 0,
      leadQuality: 'unqualified',
      projectedResults: {
        safeMonthlyAmount: 0,
        yearsUntilEmpty: 0,
        isMoneyLasting: false
      },
      negativeFlags: {
        quickBounce: false,
        playerClosedEarly: false
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
      
      // Check for quick bounce
      if (this.leadData.interactions.timeOnPage < 10 && !this.leadData.negativeFlags.quickBounce) {
        this.leadData.negativeFlags.quickBounce = true;
      }
      
      this.debouncedCalculateScore();
    }, 5000);

    // Track scroll depth
    window.addEventListener('scroll', this.handleScroll.bind(this));

    // Track page visibility
    document.addEventListener('visibilitychange', this.handleVisibilityChange.bind(this));

    // Track before unload
    window.addEventListener('beforeunload', this.handleBeforeUnload.bind(this));

    // Submit after 30 seconds
    setTimeout(() => this.trySubmitLead(), 30000);
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
      this.trySubmitLead();
    }
  }

  private handleBeforeUnload() {
    this.trySubmitLead();
  }

  private debouncedCalculateScore() {
    const now = Date.now();
    if (now - this.lastScoreCalculation > this.scoreDebounceDelay) {
      this.calculateScore();
      this.lastScoreCalculation = now;
    }
  }

  // Public tracking methods
  trackCalculateButtonClick() {
    if (this.leadData.interactions.calculateButtonClicks === 0) {
      this.leadData.interactions.calculateButtonClicks = 1;
      console.log('Calculate button clicked - awarded 25 points');
      this.calculateScore(); // Calculate immediately to see the effect
      this.trySubmitLead();
    }
  }

  trackFindATimeClick() {
    if (this.leadData.interactions.findATimeClicks === 0) {
      this.leadData.interactions.findATimeClicks = 1;
      console.log('Find a Time clicked - awarded 35 points');
      this.calculateScore();
      this.trySubmitLead();
    }
  }

  trackContactMeClick() {
    if (this.leadData.interactions.contactMeClicks === 0) {
      this.leadData.interactions.contactMeClicks = 1;
      console.log('Contact Me clicked - awarded 30 points');
      this.calculateScore();
      this.trySubmitLead();
    }
  }

  trackExportResultsClick() {
    if (this.leadData.interactions.exportResultsClicks === 0) {
      this.leadData.interactions.exportResultsClicks = 1;
      console.log('Export Results clicked - awarded points');
      this.calculateScore();
      this.trySubmitLead();
    }
  }

  trackListenNowClick() {
    if (this.leadData.interactions.listenNowClicks === 0) {
      this.leadData.interactions.listenNowClicks = 1;
      console.log('Listen Now clicked - awarded 10 points');
      this.calculateScore();
    }
  }

  trackReadReportClick() {
    this.leadData.interactions.readReportClicks++;
    console.log('Read Report clicked - awarded 5 points');
    this.calculateScore();
  }

  trackCalculatorInput(field: 'savings' | 'spending', value: number) {
    if (field === 'savings') {
      this.leadData.userInputs.currentSavings = value;
    } else {
      this.leadData.userInputs.monthlySpending = value;
    }
    this.debouncedCalculateScore();
  }

  trackCalculatorInputChange(field: 'savings' | 'spending', value: number) {
    this.leadData.interactions.inputChangesBeforeCalculate++;
    this.trackCalculatorInput(field, value);
  }

  trackProjectedResults(safeMonthlyAmount: number, yearsUntilEmpty: number, isMoneyLasting: boolean) {
    this.leadData.projectedResults = {
      safeMonthlyAmount,
      yearsUntilEmpty,
      isMoneyLasting
    };
    this.debouncedCalculateScore();
  }

  trackPodcastPlay() {
    console.log('Podcast play started');
  }

  trackPodcastPause() {
    // Handle podcast pause logic if needed
  }

  trackPodcastEnded() {
    // Handle podcast end logic if needed
  }

  trackPodcastEngagement(timeInSeconds: number) {
    this.leadData.interactions.podcastListenTime = timeInSeconds;
    this.debouncedCalculateScore();
    console.log('Podcast engagement tracked:', timeInSeconds, 'seconds');
  }

  trackPlayerClosedEarly() {
    this.leadData.negativeFlags.playerClosedEarly = true;
    console.log('Player closed early - deducted 8 points');
    this.calculateScore();
  }

  trackPDFRequest(firstName: string, email: string, wasCalculated: boolean = false) {
    this.leadData.userInputs.firstName = firstName;
    this.leadData.userInputs.email = email;
    this.leadData.interactions.pdfRequested = true;
    
    this.calculateScore();
    this.trySubmitLead();
    console.log('PDF request tracked:', firstName, email);
  }

  trackContactFormSubmission() {
    this.leadData.interactions.contactFormSubmitted = true;
    this.calculateScore();
    this.trySubmitLead();
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

  private calculateScore() {
    const oldScore = this.leadData.calculatedScore;
    this.leadData.calculatedScore = calculateLeadScore(this.leadData);
    this.leadData.leadQuality = determineLeadQuality(this.leadData.calculatedScore);

    console.log('🎯 Lead score updated:', this.leadData.calculatedScore, this.leadData.leadQuality);
  }

  // Throttled submission method
  private async trySubmitLead() {
    const now = Date.now();
    
    // Check cooldown period
    if (now - this.lastSubmissionTime < this.submissionCooldown) {
      console.log('Submission throttled, waiting for cooldown...');
      return;
    }

    // Submit if lead has any meaningful engagement
    if (this.leadData.calculatedScore >= 20 || 
        this.leadData.interactions.pdfRequested || 
        this.leadData.interactions.contactFormSubmitted ||
        this.leadData.interactions.calculateButtonClicks > 0 ||
        this.leadData.interactions.findATimeClicks > 0 ||
        this.leadData.interactions.contactMeClicks > 0) {
      
      try {
        const payload = this.createDashboardPayload();
        await submitLeadData(payload);
        this.lastSubmissionTime = now;
        console.log('✅ Lead submitted successfully');
      } catch (error) {
        console.error('❌ Failed to submit lead data:', error);
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
        contactAttempted: this.leadData.interactions.contactFormSubmitted,
        calculateButtonClicks: this.leadData.interactions.calculateButtonClicks,
        tooltipInteractions: this.leadData.interactions.tooltipInteractions
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
  return globalLeadTraacker;
};

export default LeadTracker;
