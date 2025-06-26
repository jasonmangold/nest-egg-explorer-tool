export interface CompleteLeadPayload {
  // Required Core Fields
  leadId: string;
  score: number;
  quality: 'Cold' | 'Warm' | 'Hot' | 'Premium';
  timestamp: string;

  // Page Metrics
  pageMetrics: {
    timeOnPage: number;
    scrollDepth: number;
    bounced: boolean;
  };

  // Financial Profile
  financialProfile: {
    currentSavings: number;
    monthlySpending: number;
    safeWithdrawalAmount: number;
    retirementViability: 'Sustainable' | 'Needs Adjustment';
  };

  // Basic Engagement Data (legacy)
  engagementData: {
    calculatorInteractions: number;
    pdfDownloaded: boolean;
    podcastEngagement: number;
    contactAttempted: boolean;
  };

  // NEW: Enhanced Engagement Tracking
  enhancedEngagement: {
    // High-Intent Interactions
    findTimeClicked: boolean;
    contactMeClicked: boolean;
    calculateButtonClicks: number;
    exportResultsClicked: boolean;
    exportAfterCalculate: boolean;

    // Content Engagement
    listenNowClicked: boolean;
    readReportClicks: number;
    podcastListenTime: number; // in seconds

    // Tool Engagement
    inputChangesBeforeCalculate: number;
    scrolledPast75: boolean;
    tooltipInteractions: number;
    educationalContentClicks: number;

    // Behavioral & Loyalty
    sessionActiveTime: number; // active time only
    returnVisits: number;

    // Negative/Disqualifying
    quickBounce: boolean; // < 10 seconds
    closedPlayerEarly: boolean; // < 5 seconds
  };

  // Contact Info (optional)
  contactInfo?: {
    firstName: string;
    email: string;
  };
}

class EnhancedLeadTracker {
  private config: {
    apiEndpoint: string;
    apiKey: string;
    sessionId: string;
    pageLoadTime: number;
    lastActiveTime: number;
    debugMode: boolean;
  };

  private trackingData: {
    maxScrollDepth: number;
    timeOnPage: number;
    activeTime: number;
    bounced: boolean;
    findTimeClicked: boolean;
    contactMeClicked: boolean;
    calculateButtonClicks: number;
    exportResultsClicked: boolean;
    exportAfterCalculate: boolean;
    listenNowClicked: boolean;
    readReportClicks: number;
    podcastListenTime: number;
    podcastStartTime: number | null;
    inputChangesBeforeCalculate: number;
    scrolledPast75: boolean;
    tooltipInteractions: number;
    educationalContentClicks: number;
    calculatedYet: boolean;
    returnVisits: number;
    quickBounce: boolean;
    closedPlayerEarly: boolean;
    calculatorInteractions: number;
    pdfDownloaded: boolean;
    podcastEngagement: number;
    contactAttempted: boolean;
  };

  constructor() {
    this.config = {
      apiEndpoint: 'https://gmksmcjmrsedozzkfewq.supabase.co/functions/v1/api-leads',
      apiKey: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imdta3NtY2ptcnNlZG96emtmZXdxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDk4MzgxMjMsImV4cCI6MjA2NTQxNDEyM30.R3OmuPbcw7aRonYJ8eqq8FaZ_U5DLRZaGc7ILD53KEw',
      sessionId: this.generateSessionId(),
      pageLoadTime: Date.now(),
      lastActiveTime: Date.now(),
      debugMode: true
    };

    this.trackingData = {
      maxScrollDepth: 0,
      timeOnPage: 0,
      activeTime: 0,
      bounced: false,
      findTimeClicked: false,
      contactMeClicked: false,
      calculateButtonClicks: 0,
      exportResultsClicked: false,
      exportAfterCalculate: false,
      listenNowClicked: false,
      readReportClicks: 0,
      podcastListenTime: 0,
      podcastStartTime: null,
      inputChangesBeforeCalculate: 0,
      scrolledPast75: false,
      tooltipInteractions: 0,
      educationalContentClicks: 0,
      calculatedYet: false,
      returnVisits: this.getReturnVisits(),
      quickBounce: false,
      closedPlayerEarly: false,
      calculatorInteractions: 0,
      pdfDownloaded: false,
      podcastEngagement: 0,
      contactAttempted: false
    };

    this.initializeTracking();
  }

  private generateSessionId(): string {
    return 'lead_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
  }

  private getReturnVisits(): number {
    const visits = localStorage.getItem('nestEgg_visits') || '0';
    const newCount = parseInt(visits) + 1;
    localStorage.setItem('nestEgg_visits', newCount.toString());
    localStorage.setItem('nestEgg_lastVisit', Date.now().toString());
    return Math.max(0, newCount - 1);
  }

  private initializeTracking(): void {
    this.setupEventListeners();
    this.startActiveTimeTracking();
    this.checkQuickBounce();
  }

  private setupEventListeners(): void {
    window.addEventListener('scroll', () => this.trackScrollDepth());
    document.addEventListener('click', (e) => this.handleClick(e));
    document.addEventListener('input', (e) => this.handleInput(e));
    document.addEventListener('mouseover', (e) => this.handleTooltipHover(e));
    document.addEventListener('visibilitychange', () => this.handleVisibilityChange());
    window.addEventListener('beforeunload', () => this.submitFinalLead());
  }

  private trackScrollDepth(): void {
    const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
    const docHeight = document.documentElement.scrollHeight - window.innerHeight;
    const scrollPercent = Math.round((scrollTop / docHeight) * 100);
    
    if (scrollPercent > this.trackingData.maxScrollDepth) {
      this.trackingData.maxScrollDepth = Math.min(scrollPercent, 100);
      
      if (scrollPercent >= 75 && !this.trackingData.scrolledPast75) {
        this.trackingData.scrolledPast75 = true;
        this.debugLog('User scrolled past 75%');
      }
    }
  }

  private handleClick(event: Event): void {
    const element = event.target as HTMLElement;
    const text = element.textContent?.toLowerCase() || '';
    const className = element.className?.toLowerCase() || '';
    const id = element.id?.toLowerCase() || '';

    if (text.includes('find a time') || text.includes('schedule') || className.includes('schedule')) {
      if (!this.trackingData.findTimeClicked) {
        this.trackingData.findTimeClicked = true;
        this.trackingData.contactAttempted = true;
        this.debugLog('Find a Time clicked');
        this.submitLead();
      }
    }

    if (text.includes('contact me') || text.includes('contact') || className.includes('contact')) {
      if (!this.trackingData.contactMeClicked) {
        this.trackingData.contactMeClicked = true;
        this.trackingData.contactAttempted = true;
        this.debugLog('Contact Me clicked');
        this.submitLead();
      }
    }

    if (text.includes('calculate') || id.includes('calculate') || className.includes('calculate')) {
      this.trackingData.calculateButtonClicks++;
      this.trackingData.calculatedYet = true;
      this.trackingData.calculatorInteractions++;
      this.debugLog(`Calculate button clicked ${this.trackingData.calculateButtonClicks} times`);
      this.submitLead();
    }

    if (text.includes('export') || text.includes('download') || text.includes('results')) {
      if (!this.trackingData.exportResultsClicked) {
        this.trackingData.exportResultsClicked = true;
        this.trackingData.pdfDownloaded = true;
        this.trackingData.exportAfterCalculate = this.trackingData.calculatedYet;
        this.debugLog('Export Results clicked', { afterCalculate: this.trackingData.exportAfterCalculate });
        this.submitLead();
      }
    }

    if (text.includes('listen now') || text.includes('play') || className.includes('play')) {
      if (!this.trackingData.listenNowClicked) {
        this.trackingData.listenNowClicked = true;
        this.trackingData.podcastStartTime = Date.now();
        this.debugLog('Listen Now clicked');
      }
    }

    if (text.includes('read report') || text.includes('report') || className.includes('report')) {
      this.trackingData.readReportClicks = Math.min(this.trackingData.readReportClicks + 1, 6);
      this.debugLog(`Read Report clicked ${this.trackingData.readReportClicks} times`);
    }

    if (className.includes('educational') || text.includes('learn') || text.includes('guide')) {
      this.trackingData.educationalContentClicks++;
      this.debugLog(`Educational content clicked ${this.trackingData.educationalContentClicks} times`);
    }
  }

  private handleInput(event: Event): void {
    const target = event.target as HTMLElement;
    if (target.matches('input[type="number"], select, input[type="range"]')) {
      if (!this.trackingData.calculatedYet) {
        this.trackingData.inputChangesBeforeCalculate++;
        this.debugLog(`Input change ${this.trackingData.inputChangesBeforeCalculate} before calculate`);
      }
      this.trackingData.calculatorInteractions++;
    }
  }

  private handleTooltipHover(event: Event): void {
    const target = event.target as HTMLElement;
    if (target.matches('.tooltip, [data-tooltip], .info-icon, .help-icon')) {
      this.trackingData.tooltipInteractions++;
      this.debugLog(`Tooltip interaction ${this.trackingData.tooltipInteractions}`);
    }
  }

  private handleVisibilityChange(): void {
    if (document.hidden) {
      this.config.lastActiveTime = Date.now();
    } else {
      const now = Date.now();
      this.trackingData.activeTime += now - this.config.lastActiveTime;
      this.config.lastActiveTime = now;
    }
  }

  private startActiveTimeTracking(): void {
    setInterval(() => {
      if (!document.hidden) {
        this.trackingData.activeTime += 1000;
        this.trackingData.timeOnPage = Math.round((Date.now() - this.config.pageLoadTime) / 1000);
      }
    }, 1000);
  }

  private checkQuickBounce(): void {
    setTimeout(() => {
      const timeOnSite = Date.now() - this.config.pageLoadTime;
      if (timeOnSite < 10000) {
        this.trackingData.quickBounce = true;
        this.debugLog('Quick bounce detected');
      }
    }, 10000);
  }

  private calculateEngagementScore(): number {
    let score = 0;

    if (this.hasFormCompletion()) score += 35;
    if (this.trackingData.findTimeClicked) score += 35;
    if (this.trackingData.contactMeClicked) score += 30;
    if (this.trackingData.calculateButtonClicks > 0) score += 25;
    if (this.trackingData.exportResultsClicked) {
      score += 20;
      if (this.trackingData.exportAfterCalculate) score += 10;
    }

    if (this.trackingData.listenNowClicked) score += 10;
    score += Math.min(this.trackingData.readReportClicks * 5, 30);
    if (this.trackingData.podcastListenTime > 60) {
      const minutes = Math.floor((this.trackingData.podcastListenTime - 60) / 60);
      score += Math.min(minutes * 2, 10);
    }

    if (this.trackingData.calculatedYet) {
      score += Math.min(this.trackingData.inputChangesBeforeCalculate * 2, 8);
    }
    if (this.trackingData.scrolledPast75) score += 10;

    const activeMinutes = Math.floor(this.trackingData.activeTime / 60000);
    if (activeMinutes >= 10) score += 15;
    else if (activeMinutes >= 5) score += 10;
    else if (activeMinutes >= 2) score += 5;

    score += Math.min(this.trackingData.returnVisits * 10, 20);

    if (this.trackingData.quickBounce) score -= 15;
    if (this.trackingData.closedPlayerEarly) score -= 8;

    return Math.max(0, score);
  }

  private getLeadQuality(score: number): 'Cold' | 'Warm' | 'Hot' | 'Premium' {
    if (score >= 120) return 'Premium';
    if (score >= 80) return 'Hot';
    if (score >= 20) return 'Warm';
    return 'Cold';
  }

  private hasFormCompletion(): boolean {
    const firstName = (document.querySelector('input[name="firstName"], input[name="first_name"], #firstName') as HTMLInputElement)?.value;
    const email = (document.querySelector('input[name="email"], input[type="email"], #email') as HTMLInputElement)?.value;
    return !!(firstName && email);
  }

  private getCurrentFinancialData(): CompleteLeadPayload['financialProfile'] {
    try {
      const currentSavings = 
        parseFloat((document.querySelector('[data-field="current-savings"], #currentSavings, input[name="currentSavings"]') as HTMLInputElement)?.value) || 100000;
      
      const monthlySpending = 
        parseFloat((document.querySelector('[data-field="monthly-spending"], #monthlySpending, input[name="monthlySpending"]') as HTMLInputElement)?.value) || 3000;
      
      const safeWithdrawalAmount = 
        parseFloat((document.querySelector('[data-field="safe-withdrawal"], #safeWithdrawal, input[name="safeWithdrawal"]') as HTMLInputElement)?.value) || 4000;
      
      const viabilityElement = document.querySelector('[data-field="viability"], #viability, .viability-result');
      const retirementViability: 'Sustainable' | 'Needs Adjustment' = viabilityElement?.textContent?.toLowerCase().includes('sustainable') ? 'Sustainable' : 'Needs Adjustment';

      return {
        currentSavings,
        monthlySpending,
        safeWithdrawalAmount,
        retirementViability
      };
    } catch (error) {
      console.error('Error extracting financial data:', error);
      return {
        currentSavings: 100000,
        monthlySpending: 3000,
        safeWithdrawalAmount: 4000,
        retirementViability: 'Needs Adjustment' as const
      };
    }
  }

  private getContactInfo() {
    const firstName = (document.querySelector('input[name="firstName"], input[name="first_name"], #firstName') as HTMLInputElement)?.value;
    const email = (document.querySelector('input[name="email"], input[type="email"], #email') as HTMLInputElement)?.value;
    
    if (firstName && email) {
      return { firstName, email };
    }
    return null;
  }

  private buildPayload(): CompleteLeadPayload {
    const financialData = this.getCurrentFinancialData();
    const contactInfo = this.getContactInfo();
    const engagementScore = this.calculateEngagementScore();
    const quality = this.getLeadQuality(engagementScore);

    return {
      leadId: this.config.sessionId,
      score: engagementScore,
      quality: quality,
      timestamp: new Date().toISOString(),
      
      pageMetrics: {
        timeOnPage: this.trackingData.timeOnPage,
        scrollDepth: this.trackingData.maxScrollDepth,
        bounced: this.trackingData.quickBounce
      },
      
      financialProfile: financialData,
      
      engagementData: {
        calculatorInteractions: this.trackingData.calculatorInteractions,
        pdfDownloaded: this.trackingData.pdfDownloaded,
        podcastEngagement: this.trackingData.podcastListenTime,
        contactAttempted: this.trackingData.contactAttempted
      },

      enhancedEngagement: {
        findTimeClicked: this.trackingData.findTimeClicked,
        contactMeClicked: this.trackingData.contactMeClicked,
        calculateButtonClicks: this.trackingData.calculateButtonClicks,
        exportResultsClicked: this.trackingData.exportResultsClicked,
        exportAfterCalculate: this.trackingData.exportAfterCalculate,
        listenNowClicked: this.trackingData.listenNowClicked,
        readReportClicks: this.trackingData.readReportClicks,
        podcastListenTime: this.trackingData.podcastListenTime,
        inputChangesBeforeCalculate: this.trackingData.inputChangesBeforeCalculate,
        scrolledPast75: this.trackingData.scrolledPast75,
        tooltipInteractions: this.trackingData.tooltipInteractions,
        educationalContentClicks: this.trackingData.educationalContentClicks,
        sessionActiveTime: Math.round(this.trackingData.activeTime / 1000),
        returnVisits: this.trackingData.returnVisits,
        quickBounce: this.trackingData.quickBounce,
        closedPlayerEarly: this.trackingData.closedPlayerEarly
      },

      contactInfo: contactInfo || undefined
    };
  }

  public async submitLead(): Promise<any> {
    const payload = this.buildPayload();
    
    this.debugLog('📤 Submitting complete lead payload:', payload);

    try {
      const response = await fetch(this.config.apiEndpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.config.apiKey}`
        },
        body: JSON.stringify(payload)
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`HTTP error! status: ${response.status}, response: ${errorText}`);
      }

      const result = await response.json();
      console.log('✅ Lead submitted successfully:', result);
      return result;

    } catch (error) {
      console.error('❌ Error submitting lead:', error);
      throw error;
    }
  }

  private submitFinalLead(): void {
    if (this.trackingData.timeOnPage > 10) {
      const payload = this.buildPayload();
      
      const blob = new Blob([JSON.stringify(payload)], { type: 'application/json' });
      navigator.sendBeacon(this.config.apiEndpoint, blob);
      
      this.debugLog('👋 Final lead data submitted via sendBeacon');
    }
  }

  private debugLog(message: string, data: any = null): void {
    if (this.config.debugMode) {
      console.log(`🐛 [Enhanced Lead Tracker] ${message}`, data || '');
    }
  }

  // Public methods for manual tracking
  public trackPodcastPlay(): void {
    this.trackingData.podcastStartTime = Date.now();
  }

  public trackPodcastPause(): void {
    if (this.trackingData.podcastStartTime) {
      const elapsed = (Date.now() - this.trackingData.podcastStartTime) / 1000;
      this.trackingData.podcastListenTime += elapsed;
      this.trackingData.podcastEngagement = this.trackingData.podcastListenTime;
      this.trackingData.podcastStartTime = null;
    }
  }

  public trackPlayerClosedEarly(): void {
    this.trackingData.closedPlayerEarly = true;
    this.debugLog('Player closed early');
  }

  public trackPDFRequest(firstName: string, email: string): void {
    this.trackingData.pdfDownloaded = true;
    const firstNameInput = document.querySelector('#firstName') as HTMLInputElement;
    const emailInput = document.querySelector('#email') as HTMLInputElement;
    if (firstNameInput) firstNameInput.value = firstName;
    if (emailInput) emailInput.value = email;
    this.submitLead();
  }

  public getLeadData(): any {
    return this.buildPayload();
  }
}

// Create global instance
let globalEnhancedTracker: EnhancedLeadTracker | null = null;

export const getLeadTracker = (): EnhancedLeadTracker => {
  if (!globalEnhancedTracker) {
    globalEnhancedTracker = new EnhancedLeadTracker();
  }
  return globalEnhancedTracker;
};

export default EnhancedLeadTracker;
