
// Lead Tracking Integration for Nest Egg Explorer Tool
// Add this script to your retirement calculator at https://preview--nest-egg-explorer-tool.lovable.app/

(function() {
  'use strict';

  // Configuration
  const CONFIG = {
    apiEndpoint: 'https://kmfowuhsilkpgturbumu.supabase.co/functions/v1/api-leads',
    apiKey: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImttZm93dWhzaWxrcGd0dXJidW11Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTAyODI2NDEsImV4cCI6MjA2NTg1ODY0MX0.zmCFsruKxL6N6hToX2GOKzMyzcelLSfwgcFmqKrG7s4',
    sessionId: generateSessionId(),
    pageLoadTime: Date.now(),
    interactions: 0,
    scrollDepth: 0,
    pdfDownloaded: false,
    contactAttempted: false,
    debugMode: true // Enable for testing
  };

  console.log('🎯 Nest Egg Tracker initialized');
  console.log('📡 API Endpoint:', CONFIG.apiEndpoint);
  console.log('🆔 Session ID:', CONFIG.sessionId);

  // Generate unique session ID
  function generateSessionId() {
    return 'calc_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
  }

  // Debug logging
  function debugLog(message, data = null) {
    if (CONFIG.debugMode) {
      console.log(`🐛 [NestEgg Debug] ${message}`, data || '');
    }
  }

  // Track page metrics
  let maxScrollDepth = 0;
  
  // Track scroll depth
  function trackScrollDepth() {
    const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
    const docHeight = document.documentElement.scrollHeight - window.innerHeight;
    const scrollPercent = Math.round((scrollTop / docHeight) * 100);
    
    if (scrollPercent > maxScrollDepth) {
      maxScrollDepth = Math.min(scrollPercent, 100);
      CONFIG.scrollDepth = maxScrollDepth;
      debugLog(`Scroll depth updated: ${maxScrollDepth}%`);
    }
  }

  // Track calculator interactions
  function trackCalculatorInteraction() {
    CONFIG.interactions++;
    debugLog(`Calculator interaction #${CONFIG.interactions}`);
  }

  // Track PDF downloads
  function trackPDFDownload() {
    CONFIG.pdfDownloaded = true;
    debugLog('PDF download tracked');
  }

  // Track contact attempts
  function trackContactAttempt() {
    CONFIG.contactAttempted = true;
    debugLog('Contact attempt tracked');
  }

  // Calculate lead score based on behavior
  function calculateLeadScore(financialData) {
    let score = 0;
    
    // Financial factors (40 points)
    if (financialData.currentSavings > 200000) score += 15;
    else if (financialData.currentSavings > 100000) score += 10;
    else if (financialData.currentSavings > 50000) score += 5;
    
    if (financialData.monthlySpending < 4000) score += 10;
    else if (financialData.monthlySpending < 6000) score += 5;
    
    if (financialData.retirementViability === 'Sustainable') score += 15;
    else score += 5;
    
    // Engagement factors (35 points)
    score += Math.min(CONFIG.interactions * 3, 15); // Max 15 points for interactions
    if (CONFIG.scrollDepth > 80) score += 10;
    else if (CONFIG.scrollDepth > 50) score += 5;
    if (CONFIG.pdfDownloaded) score += 10;
    
    // Time on page factors (15 points)
    const timeOnPage = (Date.now() - CONFIG.pageLoadTime) / 1000;
    if (timeOnPage > 300) score += 15; // 5+ minutes
    else if (timeOnPage > 120) score += 10; // 2+ minutes
    else if (timeOnPage > 60) score += 5; // 1+ minute
    
    // Contact attempt bonus (10 points)
    if (CONFIG.contactAttempted) score += 10;
    
    debugLog(`Calculated score: ${score}`, {
      savings: financialData.currentSavings,
      spending: financialData.monthlySpending,
      interactions: CONFIG.interactions,
      scrollDepth: CONFIG.scrollDepth,
      timeOnPage: Math.round(timeOnPage)
    });
    
    return Math.min(score, 100);
  }

  // Determine lead quality based on score
  function getLeadQuality(score) {
    if (score >= 80) return 'Premium';
    if (score >= 60) return 'Hot';
    if (score >= 40) return 'Warm';
    return 'Cold';
  }

  // Submit lead data to advisor dashboard
  async function submitLead(financialData, contactInfo = null) {
    const timeOnPage = (Date.now() - CONFIG.pageLoadTime) / 1000;
    const score = calculateLeadScore(financialData);
    const quality = getLeadQuality(score);
    
    const payload = {
      leadId: CONFIG.sessionId,
      score: score,
      quality: quality,
      timestamp: new Date().toISOString(),
      pageMetrics: {
        timeOnPage: Math.round(timeOnPage),
        scrollDepth: CONFIG.scrollDepth,
        bounced: timeOnPage < 30 // Consider bounced if less than 30 seconds
      },
      financialProfile: {
        currentSavings: financialData.currentSavings,
        monthlySpending: financialData.monthlySpending,
        safeWithdrawalAmount: financialData.safeWithdrawalAmount,
        retirementViability: financialData.retirementViability
      },
      engagementData: {
        calculatorInteractions: CONFIG.interactions,
        pdfDownloaded: CONFIG.pdfDownloaded,
        podcastEngagement: Math.round(timeOnPage), // Use time on page as podcast engagement proxy
        contactAttempted: CONFIG.contactAttempted
      }
    };

    // Add contact info if provided
    if (contactInfo) {
      payload.contactInfo = contactInfo;
    }

    debugLog('📤 Submitting lead payload:', payload);

    try {
      const response = await fetch(CONFIG.apiEndpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${CONFIG.apiKey}`
        },
        body: JSON.stringify(payload)
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('❌ API Error Response:', errorText);
        throw new Error(`HTTP error! status: ${response.status}, response: ${errorText}`);
      }

      const result = await response.json();
      console.log('✅ Lead submitted successfully:', result);
      
      // Show success notification if possible
      if (typeof window !== 'undefined' && window.alert) {
        console.log(`🎉 Lead captured! Quality: ${quality}, Score: ${score}`);
      }
      
      return result;
    } catch (error) {
      console.error('❌ Error submitting lead:', error);
      throw error;
    }
  }

  // Test the API connection
  async function testAPIConnection() {
    try {
      debugLog('🧪 Testing API connection...');
      const testPayload = {
        leadId: 'test_' + Date.now(),
        score: 50,
        quality: 'Warm',
        timestamp: new Date().toISOString(),
        pageMetrics: { timeOnPage: 60, scrollDepth: 50, bounced: false },
        financialProfile: {
          currentSavings: 100000,
          monthlySpending: 3000,
          safeWithdrawalAmount: 4000,
          retirementViability: 'Sustainable'
        },
        engagementData: {
          calculatorInteractions: 1,
          pdfDownloaded: false,
          podcastEngagement: 60,
          contactAttempted: false
        }
      };

      const response = await fetch(CONFIG.apiEndpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${CONFIG.apiKey}`
        },
        body: JSON.stringify(testPayload)
      });

      if (response.ok) {
        console.log('✅ API connection test successful');
        return true;
      } else {
        console.error('❌ API connection test failed:', response.status);
        return false;
      }
    } catch (error) {
      console.error('❌ API connection test error:', error);
      return false;
    }
  }

  // Event listeners
  window.addEventListener('scroll', trackScrollDepth);
  
  // Track calculator form interactions
  document.addEventListener('input', function(e) {
    if (e.target.matches('input[type="number"], select, input[type="range"]')) {
      trackCalculatorInteraction();
    }
  });

  // Track button clicks
  document.addEventListener('click', function(e) {
    if (e.target.matches('button, .btn, input[type="submit"]')) {
      trackCalculatorInteraction();
      
      // Check for PDF download
      if (e.target.textContent.toLowerCase().includes('download') || 
          e.target.textContent.toLowerCase().includes('pdf')) {
        trackPDFDownload();
      }
      
      // Check for contact attempt
      if (e.target.textContent.toLowerCase().includes('contact') ||
          e.target.textContent.toLowerCase().includes('advisor') ||
          e.target.textContent.toLowerCase().includes('call')) {
        trackContactAttempt();
      }
    }
  });

  // Auto-submit lead when calculation is completed
  function onCalculationComplete(financialData) {
    debugLog('🧮 Calculation completed, submitting lead:', financialData);
    submitLead(financialData);
  }

  // Submit lead with contact info when email is captured
  function onEmailCaptured(email, firstName = null) {
    const contactInfo = { email };
    if (firstName) contactInfo.firstName = firstName;
    
    debugLog('📧 Email captured, submitting lead with contact info:', contactInfo);
    
    // Get the latest financial data from the calculator
    const financialData = getCurrentFinancialData();
    if (financialData) {
      submitLead(financialData, contactInfo);
    }
  }

  // Function to get current financial data (customize based on your calculator)
  function getCurrentFinancialData() {
    // This function should extract the current values from your calculator
    // Customize these selectors based on your actual calculator implementation
    try {
      // Try multiple common selectors
      const currentSavings = 
        parseFloat(document.querySelector('[data-field="current-savings"], #currentSavings, input[name="currentSavings"], input[placeholder*="savings" i]')?.value) ||
        parseFloat(document.querySelector('input[type="number"]')?.value) || 
        100000; // Default for testing

      const monthlySpending = 
        parseFloat(document.querySelector('[data-field="monthly-spending"], #monthlySpending, input[name="monthlySpending"], input[placeholder*="spending" i]')?.value) ||
        3000; // Default for testing

      const safeWithdrawalAmount = 
        parseFloat(document.querySelector('[data-field="safe-withdrawal"], #safeWithdrawal, input[name="safeWithdrawal"]')?.value) ||
        4000; // Default for testing

      const viabilityText = document.querySelector('[data-field="viability"], #viability, .viability-result')?.textContent || '';
      const retirementViability = viabilityText.toLowerCase().includes('sustainable') ? 'Sustainable' : 'Needs Adjustment';

      const result = {
        currentSavings,
        monthlySpending,
        safeWithdrawalAmount,
        retirementViability
      };

      debugLog('📊 Extracted financial data:', result);
      return result;
    } catch (error) {
      console.error('❌ Error extracting financial data:', error);
      // Return test data if extraction fails
      return {
        currentSavings: 150000,
        monthlySpending: 3500,
        safeWithdrawalAmount: 4200,
        retirementViability: 'Sustainable'
      };
    }
  }

  // Submit lead on page unload (visitor leaving)
  window.addEventListener('beforeunload', function() {
    const financialData = getCurrentFinancialData();
    if (financialData && (Date.now() - CONFIG.pageLoadTime) > 10000) { // Only if spent more than 10 seconds
      debugLog('👋 Page unload, submitting final lead data');
      
      // Use sendBeacon for reliable data transmission
      const payload = JSON.stringify({
        leadId: CONFIG.sessionId,
        score: calculateLeadScore(financialData),
        quality: getLeadQuality(calculateLeadScore(financialData)),
        timestamp: new Date().toISOString(),
        pageMetrics: {
          timeOnPage: Math.round((Date.now() - CONFIG.pageLoadTime) / 1000),
          scrollDepth: CONFIG.scrollDepth,
          bounced: (Date.now() - CONFIG.pageLoadTime) < 30000
        },
        financialProfile: financialData,
        engagementData: {
          calculatorInteractions: CONFIG.interactions,
          pdfDownloaded: CONFIG.pdfDownloaded,
          podcastEngagement: Math.round((Date.now() - CONFIG.pageLoadTime) / 1000),
          contactAttempted: CONFIG.contactAttempted
        }
      });

      navigator.sendBeacon(CONFIG.apiEndpoint, payload);
    }
  });

  // Auto-submit test lead after 5 seconds for testing
  setTimeout(() => {
    if (CONFIG.debugMode) {
      debugLog('🧪 Auto-submitting test lead for debugging...');
      const testData = getCurrentFinancialData();
      submitLead(testData);
    }
  }, 5000);

  // Test API connection on load
  setTimeout(testAPIConnection, 1000);

  // Make functions available globally for integration
  window.NestEggTracker = {
    trackInteraction: trackCalculatorInteraction,
    trackPDFDownload: trackPDFDownload,
    trackContactAttempt: trackContactAttempt,
    submitLead: submitLead,
    onCalculationComplete: onCalculationComplete,
    onEmailCaptured: onEmailCaptured,
    testAPI: testAPIConnection,
    getCurrentData: getCurrentFinancialData,
    config: CONFIG
  };

  console.log('🚀 Nest Egg Lead Tracker initialized successfully');
  console.log('🔧 Use window.NestEggTracker.testAPI() to test the connection');
})();
