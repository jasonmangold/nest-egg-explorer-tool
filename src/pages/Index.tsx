import { useState, useMemo, useEffect } from "react";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Tooltip as UITooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Calculator, TrendingDown, Users, BookOpen, Headphones, ExternalLink, Download, FileText, Shield, PiggyBank, Info, Phone, Mail, MapPin } from "lucide-react";
import jsPDF from 'jspdf';
import AudioPlayer from '@/components/AudioPlayer';
import { useAudioPlayer } from '@/hooks/useAudioPlayer';
import { openPDFByTitle } from '@/hooks/useEducationPDFs';
const Index = () => {
  const [currentSavings, setCurrentSavings] = useState(0);
  const [monthlySpending, setMonthlySpending] = useState(0);
  const [firstName, setFirstName] = useState("");
  const [email, setEmail] = useState("");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [hasCalculated, setHasCalculated] = useState(false);
  const [needsCalculation, setNeedsCalculation] = useState(false);

  // Audio player hook
  const audioPlayer = useAudioPlayer();

  // Format number with commas
  const formatNumber = (num: number) => {
    return num.toLocaleString();
  };

  // Parse number from formatted string
  const parseNumber = (str: string) => {
    return parseInt(str.replace(/,/g, ''));
  };

  // Handle input changes with formatting
  const handleSavingsChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = parseNumber(e.target.value) || 0;
    setCurrentSavings(value);

    // If we've calculated before, mark that we need to recalculate
    if (hasCalculated) {
      setNeedsCalculation(true);
    }
  };
  const handleSpendingChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = parseNumber(e.target.value) || 0;
    setMonthlySpending(value);

    // If we've calculated before, mark that we need to recalculate
    if (hasCalculated) {
      setNeedsCalculation(true);
    }
  };

  // Handle Calculate button click
  const handleCalculate = () => {
    setHasCalculated(true);
    setNeedsCalculation(false);
  };

  // Calculate retirement projections (only if hasCalculated is true and no pending changes)
  const projectionData = useMemo(() => {
    if (!hasCalculated || needsCalculation) return [];
    const data = [];
    let balance = currentSavings;
    const monthlySpendingAmount = monthlySpending;
    const annualInflationRate = 0.03;
    const monthlyReturnRate = Math.pow(1.06, 1/12) - 1; // 6% annual converted to monthly
    
    // Calculate monthly for 30 years, but show yearly data points for the chart
    for (let year = 0; year <= 30; year++) {
      // Apply annual inflation to the base monthly spending
      const adjustedMonthlySpending = monthlySpendingAmount * Math.pow(1 + annualInflationRate, year);
      
      // If not the first year, simulate 12 months of returns and withdrawals
      if (year > 0) {
        for (let month = 0; month < 12; month++) {
          // Apply interest at the beginning of the month
          balance = balance * (1 + monthlyReturnRate);
          // Then subtract monthly spending
          balance = balance - adjustedMonthlySpending;
          if (balance <= 0) break;
        }
      }
      
      data.push({
        year,
        balance: Math.max(0, balance),
        spending: adjustedMonthlySpending * 12 // Show annual spending for display
      });
      
      if (balance <= 0) break;
    }
    return data;
  }, [currentSavings, monthlySpending, hasCalculated, needsCalculation]);

  // Calculate precise years and months until money runs out
  const timeUntilEmpty = useMemo(() => {
    if (!hasCalculated || needsCalculation) return { years: 0, months: 0, totalMonths: 0 };
    
    let balance = currentSavings;
    const monthlySpendingBase = monthlySpending;
    const annualInflationRate = 0.03; // Apply inflation annually, not monthly
    const monthlyReturnRate = Math.pow(1.06, 1/12) - 1; // 6% annual converted to monthly
    
    let totalMonths = 0;
    for (let month = 0; month <= 30 * 12; month++) { // 30 years max
      // Calculate which year we're in and apply annual inflation
      const currentYear = Math.floor(month / 12);
      const adjustedMonthlySpending = monthlySpendingBase * Math.pow(1 + annualInflationRate, currentYear);
      
      if (month > 0) {
        // Apply interest at the beginning of the month
        balance = balance * (1 + monthlyReturnRate);
        // Then subtract monthly spending
        balance = balance - adjustedMonthlySpending;
      }
      
      if (balance <= 0) {
        totalMonths = month;
        break;
      }
      
      // If we reach 30 years, set to max
      if (month === 30 * 12) {
        totalMonths = 30 * 12;
        break;
      }
    }
    
    const years = Math.floor(totalMonths / 12);
    const months = totalMonths % 12;
    
    return { years, months, totalMonths };
  }, [currentSavings, monthlySpending, hasCalculated, needsCalculation]);

  // Calculate safe withdrawal amount using proper present value formula
  const safeMonthlyAmount = useMemo(() => {
    if (!hasCalculated || needsCalculation) return 0;
    const returnRate = 0.06;
    const inflationRate = 0.03;
    const years = 30;
    const realReturnRate = (1 + returnRate) / (1 + inflationRate) - 1;
    const presentValueFactor = (1 - Math.pow(1 + realReturnRate, -years)) / realReturnRate;
    const safeAnnualAmount = currentSavings / presentValueFactor;
    return Math.round(safeAnnualAmount / 12);
  }, [currentSavings, hasCalculated, needsCalculation]);
  const yearsUntilEmpty = timeUntilEmpty.years;
  const monthsUntilEmpty = timeUntilEmpty.months;
  const isMoneyLasting = hasCalculated && !needsCalculation ? timeUntilEmpty.totalMonths >= 30 * 12 : false;


  // Generate graph image for PDF
  const generateGraphImage = (): Promise<string> => {
    return new Promise(resolve => {
      // Create a larger canvas for better PDF quality
      const canvas = document.createElement('canvas');
      const scale = 4; // Increased scale for higher resolution
      const width = 900; // Wider for PDF
      const height = 600; // Taller for PDF
      canvas.width = width * scale;
      canvas.height = height * scale;
      const ctx = canvas.getContext('2d');
      if (!ctx) {
        resolve('');
        return;
      }

      // Scale the context
      ctx.scale(scale, scale);

      // Set background
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(0, 0, width, height);

      // Chart area with more generous spacing for PDF
      const chartX = 140; // More left margin
      const chartY = 100; // More top margin
      const chartWidth = 650; // Wider chart area
      const chartHeight = 380; // Taller chart area

      // Draw grid lines
      ctx.strokeStyle = '#e2e8f0';
      ctx.lineWidth = 1;

      // Vertical grid lines
      for (let i = 0; i <= 6; i++) {
        const x = chartX + i * chartWidth / 6;
        ctx.beginPath();
        ctx.moveTo(x, chartY);
        ctx.lineTo(x, chartY + chartHeight);
        ctx.stroke();
      }

      // Horizontal grid lines
      for (let i = 0; i <= 5; i++) {
        const y = chartY + i * chartHeight / 5;
        ctx.beginPath();
        ctx.moveTo(chartX, y);
        ctx.lineTo(chartX + chartWidth, y);
        ctx.stroke();
      }

      // Draw data line
      const maxBalance = Math.max(...projectionData.map(d => d.balance));
      ctx.strokeStyle = '#059669';
      ctx.lineWidth = 5; // Thicker line for better visibility
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
      ctx.beginPath();
      projectionData.forEach((point, index) => {
        const x = chartX + point.year / 30 * chartWidth;
        const y = chartY + chartHeight - point.balance / maxBalance * chartHeight;
        if (index === 0) {
          ctx.moveTo(x, y);
        } else {
          ctx.lineTo(x, y);
        }
      });
      ctx.stroke();

      // Add data points
      ctx.fillStyle = '#059669';
      projectionData.forEach((point, index) => {
        if (index % 3 === 0) {
          const x = chartX + point.year / 30 * chartWidth;
          const y = chartY + chartHeight - point.balance / maxBalance * chartHeight;
          ctx.beginPath();
          ctx.arc(x, y, 8, 0, 2 * Math.PI); // Larger dots
          ctx.fill();
          ctx.strokeStyle = '#ffffff';
          ctx.lineWidth = 3;
          ctx.stroke();
          ctx.strokeStyle = '#e2e8f0';
          ctx.lineWidth = 1;
        }
      });

      // Add labels with larger fonts
      ctx.fillStyle = '#374151';
      ctx.font = 'bold 18px Arial'; // Larger font
      ctx.textAlign = 'center';

      // X-axis labels
      for (let i = 0; i <= 6; i++) {
        const x = chartX + i * chartWidth / 6;
        const year = i * 5;
        ctx.fillText(year.toString(), x, chartY + chartHeight + 50);
      }

      // Y-axis labels
      ctx.textAlign = 'right';
      ctx.font = 'bold 16px Arial'; // Larger font
      for (let i = 0; i <= 5; i++) {
        const y = chartY + chartHeight - i * chartHeight / 5;
        const value = maxBalance / 5 * i;
        const formattedValue = value >= 1000000 ? `$${(value / 1000000).toFixed(1)}M` : `$${(value / 1000).toFixed(0)}k`;
        ctx.fillText(formattedValue, chartX - 40, y + 8);
      }

      // Axis labels with larger fonts
      ctx.fillStyle = '#1f2937';
      ctx.font = 'bold 20px Arial'; // Larger font
      ctx.textAlign = 'center';
      ctx.fillText('Years in Retirement', chartX + chartWidth / 2, chartY + chartHeight + 100);

      // Rotate and draw Y-axis label
      ctx.save();
      ctx.translate(30, chartY + chartHeight / 2);
      ctx.rotate(-Math.PI / 2);
      ctx.fillText('Remaining Balance', 0, 0);
      ctx.restore();

      // Title with larger font
      ctx.fillStyle = '#111827';
      ctx.font = 'bold 28px Arial'; // Larger title
      ctx.textAlign = 'center';
      ctx.fillText('Retirement Balance Projection', width / 2, 50);

      // Add border
      ctx.strokeStyle = '#d1d5db';
      ctx.lineWidth = 3;
      ctx.strokeRect(chartX - 15, chartY - 15, chartWidth + 30, chartHeight + 30);

      // Convert to data URL
      resolve(canvas.toDataURL('image/png', 1.0));
    });
  };
  const handleExportPDF = async () => {
    if (firstName && email) {
      const pdf = new jsPDF();
      const pageWidth = pdf.internal.pageSize.getWidth();

      // Header with gradient effect (simulated with colors)
      pdf.setFillColor(5, 150, 105); // emerald-600
      pdf.rect(0, 0, pageWidth, 25, 'F');

      // Title in header
      pdf.setFontSize(20);
      pdf.setTextColor(255, 255, 255);
      pdf.text('Retirement Spending Analysis', pageWidth / 2, 16, {
        align: 'center'
      });

      // Client info section with background
      pdf.setFillColor(248, 250, 252); // slate-50
      pdf.rect(0, 25, pageWidth, 20, 'F');
      pdf.setFontSize(11);
      pdf.setTextColor(51, 65, 85); // slate-700
      pdf.text(`Prepared for: ${firstName}`, 15, 35);
      pdf.text(`Email: ${email}`, 15, 42);
      pdf.text(`Date: ${new Date().toLocaleDateString()}`, pageWidth - 15, 35, {
        align: 'right'
      });

      // Main content area
      let currentY = 55;

      // Financial Situation Section
      pdf.setFillColor(236, 253, 245); // emerald-50
      pdf.rect(15, currentY, pageWidth - 30, 25, 'F');
      pdf.setFontSize(14);
      pdf.setTextColor(5, 150, 105); // emerald-600
      pdf.text('Your Financial Situation', 20, currentY + 8);
      pdf.setFontSize(10);
      pdf.setTextColor(71, 85, 105); // slate-600
      pdf.text(`Current Savings: $${currentSavings.toLocaleString()}`, 20, currentY + 16);
      pdf.text(`Monthly Spending: $${monthlySpending.toLocaleString()}`, 20, currentY + 22);
      currentY += 35;

      // Results Section - Two columns
      const leftCol = 15;
      const rightCol = pageWidth / 2 + 5;

      // Safe Monthly Amount (left)
      pdf.setFillColor(220, 252, 231); // green-100
      pdf.rect(leftCol, currentY, (pageWidth - 40) / 2, 20, 'F');
      pdf.setFontSize(12);
      pdf.setTextColor(5, 150, 105);
      pdf.text('Safe Monthly Spending', leftCol + 5, currentY + 8);
      pdf.setFontSize(16);
      pdf.setTextColor(22, 101, 52); // green-800
      pdf.text(`$${safeMonthlyAmount.toLocaleString()}`, leftCol + 5, currentY + 16);

      // Status (right)
      const statusColor: [number, number, number] = isMoneyLasting ? [220, 252, 231] : [254, 226, 226]; // green-100 or red-100
      const statusTextColor: [number, number, number] = isMoneyLasting ? [22, 101, 52] : [153, 27, 27]; // green-800 or red-800

      pdf.setFillColor(statusColor[0], statusColor[1], statusColor[2]);
      pdf.rect(rightCol, currentY, (pageWidth - 40) / 2, 20, 'F');
      pdf.setFontSize(12);
      pdf.setTextColor(statusTextColor[0], statusTextColor[1], statusTextColor[2]);
      pdf.text('Money Duration', rightCol + 5, currentY + 8);
      pdf.setFontSize(16);
      const durationText = isMoneyLasting ? '30+ years' : `${yearsUntilEmpty} years${monthsUntilEmpty > 0 ? ` and ${monthsUntilEmpty} month${monthsUntilEmpty > 1 ? 's' : ''}` : ''}`;
      pdf.text(durationText, rightCol + 5, currentY + 16);
      currentY += 30;

      // Add the improved larger graph
      if (hasCalculated && !needsCalculation) {
        try {
          const graphImage = await generateGraphImage();
          if (graphImage) {
            // Larger dimensions for better visibility in PDF
            const graphWidth = 120; // Much wider
            const graphHeight = 80; // Much taller
            const graphX = (pageWidth - graphWidth) / 2; // Center horizontally
            pdf.addImage(graphImage, 'PNG', graphX, currentY, graphWidth, graphHeight);
            currentY += graphHeight + 10;
          }
        } catch (error) {
          console.log('Could not add graph to PDF:', error);
          currentY += 10;
        }
      }

      // Assumptions section
      pdf.setFillColor(241, 245, 249); // slate-100
      pdf.rect(15, currentY, pageWidth - 30, 18, 'F');
      pdf.setFontSize(11);
      pdf.setTextColor(15, 118, 110); // teal-600
      pdf.text('Calculation Assumptions', 20, currentY + 8);
      pdf.setFontSize(9);
      pdf.setTextColor(71, 85, 105);
      pdf.text('• 30-year retirement period  • 3% annual inflation  • 6% annual return', 20, currentY + 14);
      currentY += 25;

      // Advisor Contact Section
      pdf.setFillColor(240, 253, 250); // emerald-50
      pdf.rect(15, currentY, pageWidth - 30, 28, 'F');
      pdf.setFontSize(12);
      pdf.setTextColor(5, 150, 105);
      pdf.text('Your Financial Advisor', 20, currentY + 8);
      pdf.setFontSize(10);
      pdf.setTextColor(51, 65, 85);
      pdf.text('Sarah Johnson, CFP® - Certified Financial Planner', 20, currentY + 16);
      pdf.text('Phone: (555) 123-4567  |  Email: advisor@financialplanning.com', 20, currentY + 22);

      // Disclaimer at bottom
      const disclaimerY = 265;
      pdf.setFillColor(248, 250, 252); // slate-50
      pdf.rect(0, disclaimerY, pageWidth, 30, 'F');
      pdf.setFontSize(7);
      pdf.setTextColor(100, 116, 139); // slate-500
      pdf.text('IMPORTANT DISCLAIMER', pageWidth / 2, disclaimerY + 6, {
        align: 'center'
      });
      const disclaimerText = 'This calculator is for educational purposes only and should not be considered personalized investment advice. Market returns, inflation rates, and personal circumstances can vary significantly. Past performance does not guarantee future results. Please consult with a qualified financial advisor before making investment decisions. All investments carry risk, including potential loss of principal.';
      const lines = pdf.splitTextToSize(disclaimerText, pageWidth - 20);
      pdf.text(lines, 10, disclaimerY + 12);

      // Download the PDF
      pdf.save(`${firstName}_Retirement_Analysis.pdf`);
      setIsDialogOpen(false);
      setFirstName("");
      setEmail("");
    }
  };
  const scrollToContact = () => {
    const contactSection = document.getElementById('contact-section');
    contactSection?.scrollIntoView({
      behavior: 'smooth'
    });
  };
  const handleListenNow = async () => {
    console.log('=== Listen Now button clicked ===');

    // Test multiple potential paths
    const possiblePaths = ['/retirement-podcast.mp3', './retirement-podcast.mp3', 'retirement-podcast.mp3', '/public/retirement-podcast.mp3'];
    console.log('Testing possible file paths:', possiblePaths);
    for (const path of possiblePaths) {
      try {
        console.log(`Testing path: ${path}`);
        const response = await fetch(path, {
          method: 'HEAD'
        });
        console.log(`Path ${path} response:`, response.status);
        if (response.ok) {
          console.log(`Found audio file at: ${path}`);
          audioPlayer.loadAudio(path);
          return;
        }
      } catch (error) {
        console.log(`Path ${path} failed:`, error);
      }
    }
    console.error('No valid audio file found at any tested path');
    // If no file found, still try the default path and let the audio player handle the error
    audioPlayer.loadAudio('/retirement-podcast.mp3');
  };

  // Handle educational content clicks - opens PDFs from Supabase
  const handleEducationalClick = (documentTitle: string, buttonId?: string) => {
    openPDFByTitle(documentTitle);
  };

  // New handler for Find a Time button
  const handleFindATimeClick = () => {
    console.log('🎯 Find a Time button clicked!');
    scrollToContact();
  };

  return <TooltipProvider>
    <div className="min-h-screen relative overflow-hidden bg-slate-50">
      {/* Enhanced Financial Background */}
      <div className="fixed inset-0 -z-10">
        {/* Primary gradient background */}
        <div className="absolute inset-0 bg-gradient-to-br from-slate-50 via-emerald-50 via-blue-50 to-slate-100"></div>
        
        {/* Floating geometric shapes */}
        <div className="absolute top-10 left-10 w-32 h-32 bg-emerald-200/20 rounded-full blur-xl animate-pulse"></div>
        <div className="absolute top-40 right-20 w-48 h-48 bg-blue-200/15 rounded-full blur-2xl animate-pulse delay-1000"></div>
        <div className="absolute bottom-40 left-20 w-40 h-40 bg-slate-300/20 rounded-full blur-xl animate-pulse delay-2000"></div>
        <div className="absolute bottom-10 right-10 w-60 h-60 bg-emerald-300/10 rounded-full blur-3xl animate-pulse delay-500"></div>
        
        {/* Subtle grid pattern overlay */}
        <div className="absolute inset-0 opacity-20" style={{
          backgroundImage: `
            linear-gradient(rgba(15, 118, 110, 0.03) 1px, transparent 1px),
            linear-gradient(90deg, rgba(15, 118, 110, 0.03) 1px, transparent 1px)
          `,
          backgroundSize: '60px 60px'
        }}></div>
        
        {/* Flowing lines */}
        <svg className="absolute inset-0 w-full h-full" viewBox="0 0 1000 1000" preserveAspectRatio="none">
          <path d="M0,300 Q250,100 500,300 T1000,300 V0 H0 Z" fill="url(#gradient1)" fillOpacity="0.08" />
          <path d="M0,600 Q250,400 500,600 T1000,600 V1000 H0 Z" fill="url(#gradient2)" fillOpacity="0.08" />
          <defs>
            <linearGradient id="gradient1" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#059669" stopOpacity="0.3" />
              <stop offset="50%" stopColor="#0f766e" stopOpacity="0.2" />
              <stop offset="100%" stopColor="#1e40af" stopOpacity="0.1" />
            </linearGradient>
            <linearGradient id="gradient2" x1="0%" y1="100%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#1e40af" stopOpacity="0.2" />
              <stop offset="50%" stopColor="#0f766e" stopOpacity="0.15" />
              <stop offset="100%" stopColor="#059669" stopOpacity="0.1" />
            </linearGradient>
          </defs>
        </svg>
      </div>

      {/* Header with Logo and Contact Button */}
      <header className="relative pt-6 pb-4 backdrop-blur-sm">
        <div className="container mx-auto px-4 max-w-6xl">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <img alt="Financial Planning Company" src="/lovable-uploads/d95ac3ea-3a71-4c6a-8e8f-a574c47981ec.png" className="h-12 w-auto object-contain" />
            </div>
            <Button onClick={scrollToContact} className="bg-emerald-600 hover:bg-emerald-700 text-white">
              Contact Me
            </Button>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative pb-20">
        <div className="container mx-auto px-4 max-w-6xl">
          <div className="text-center mb-12">
            <h1 className="text-4xl md:text-6xl font-bold text-slate-800 mb-6 leading-tight">
              What Can I Safely<br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-600 to-teal-600">Spend in Retirement?</span>
            </h1>
            <p className="text-xl text-slate-600 max-w-3xl mx-auto mb-8">
              Plan your retirement spending with confidence. Our calculator shows you how much you can spend monthly without running out of money.
            </p>
          </div>

          {/* Calculator Section */}
          <div className="grid lg:grid-cols-2 gap-8 items-start">
            {/* Inputs */}
            <Card className="bg-white/95 backdrop-blur-lg border-0 shadow-xl ring-1 ring-slate-200/50">
              <CardHeader>
                <CardTitle className="text-2xl text-slate-800">Your Financial Situation</CardTitle>
                <CardDescription className="text-slate-600">Enter your current savings and spending goal to see your retirement projection</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <Label htmlFor="savings" className="text-base font-medium text-slate-700">Current Amount Saved</Label>
                    <UITooltip>
                      <TooltipTrigger>
                        <Info className="w-4 h-4 text-slate-400 hover:text-slate-600" />
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>Total amount you will have saved at the start of retirement</p>
                      </TooltipContent>
                    </UITooltip>
                  </div>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-500">$</span>
                    <Input id="savings" type="text" value={formatNumber(currentSavings)} onChange={handleSavingsChange} className="pl-8 text-lg h-12 border-slate-200 focus:border-emerald-500 focus:ring-emerald-500" placeholder="500,000" />
                  </div>
                </div>
                
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <Label htmlFor="spending" className="text-base font-medium text-slate-700">Monthly Spending Goal</Label>
                    <UITooltip>
                      <TooltipTrigger>
                        <Info className="w-4 h-4 text-slate-400 hover:text-slate-600" />
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>Enter the amount you plan to spend each month during retirement</p>
                      </TooltipContent>
                    </UITooltip>
                  </div>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-500">$</span>
                    <Input id="spending" type="text" value={formatNumber(monthlySpending)} onChange={handleSpendingChange} className="pl-8 text-lg h-12 border-slate-200 focus:border-emerald-500 focus:ring-emerald-500" placeholder="3,000" />
                  </div>
                </div>

                {/* Calculate Button */}
                <div className="pt-4">
                  <Button onClick={handleCalculate} className="w-full bg-emerald-600 hover:bg-emerald-700 text-white h-12 text-lg font-semibold">
                    <Calculator className="w-5 h-5 mr-2" />
                    {hasCalculated && needsCalculation ? 'Recalculate My Plan' : 'Calculate My Retirement Plan'}
                  </Button>
                  {needsCalculation && <p className="text-sm text-amber-600 mt-2 text-center">
                      Values changed - click to recalculate results
                    </p>}
                </div>

                {/* Assumptions Section */}
                <div className="pt-4 border-t border-slate-200">
                  <div className="flex items-center mb-3">
                    <Info className="w-5 h-5 text-emerald-600 mr-2" />
                    <h3 className="text-lg font-semibold text-slate-800">Calculation Assumptions</h3>
                  </div>
                  <div className="grid grid-cols-1 gap-3">
                    <div className="flex justify-between items-center p-3 bg-emerald-50 rounded-lg">
                      <span className="text-sm font-medium text-slate-700">Retirement Period</span>
                      <span className="text-sm font-bold text-emerald-700">30 years</span>
                    </div>
                    <div className="flex justify-between items-center p-3 bg-blue-50 rounded-lg">
                      <span className="text-sm font-medium text-slate-700">Annual Inflation</span>
                      <span className="text-sm font-bold text-blue-700">3%</span>
                    </div>
                    <div className="flex justify-between items-center p-3 bg-purple-50 rounded-lg">
                      <span className="text-sm font-medium text-slate-700">Annual Return</span>
                      <span className="text-sm font-bold text-purple-700">6%</span>
                    </div>
                  </div>
                </div>

                {/* How It Works Section */}
                <div className="pt-4 border-t border-slate-200">
                  <div className="flex items-center mb-3">
                    <Calculator className="w-5 h-5 text-teal-600 mr-2" />
                    <h3 className="text-lg font-semibold text-slate-800">How It Works</h3>
                  </div>
                  <div className="space-y-3 text-sm text-slate-600">
                    <p>• We calculate how your savings will change over 30 years of retirement</p>
                    <p>• Your spending increases each year with inflation (3% annually)</p>
                    <p>• Your remaining savings earn a 6% annual return</p>
                    <p>• The "safe" amount estimates that your money lasts the full 30 years</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Graph and Results */}
            <Card className="bg-white/95 backdrop-blur-lg border-0 shadow-xl ring-1 ring-slate-200/50">
              <CardHeader>
                <CardTitle className="text-2xl text-slate-800">Retirement Spend-Down Projection</CardTitle>
                <CardDescription className="text-slate-600">How your savings will change over 30 years</CardDescription>
              </CardHeader>
              <CardContent className="p-6">
                {hasCalculated && !needsCalculation ? <>
                    <div className="h-80 -mx-2">
                      <ResponsiveContainer width="100%" height="100%">
                        <LineChart data={projectionData} margin={{
                        top: 30,
                        right: 30,
                        left: 30,
                        bottom: 50
                      }}>
                          <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" strokeOpacity={0.6} />
                          <XAxis dataKey="year" stroke="#64748b" fontSize={12} fontWeight={500} tickMargin={20} axisLine={{
                          stroke: '#cbd5e1',
                          strokeWidth: 1
                        }} tickLine={{
                          stroke: '#cbd5e1'
                        }} label={{
                          value: 'Years in Retirement',
                          position: 'insideBottom',
                          offset: -30,
                          style: {
                            textAnchor: 'middle',
                            fontSize: '12px',
                            fontWeight: '500',
                            fill: '#64748b'
                          }
                        }} domain={[0, 30]} type="number" ticks={[0, 5, 10, 15, 20, 25, 30]} />
                          <YAxis stroke="#64748b" fontSize={12} fontWeight={500} tickMargin={20} axisLine={{
                          stroke: '#cbd5e1',
                          strokeWidth: 1
                        }} tickLine={{
                          stroke: '#cbd5e1'
                        }} tickFormatter={value => `$${(value / 1000).toFixed(0)}k`} label={{
                          value: 'Remaining Balance',
                          angle: -90,
                          position: 'insideLeft',
                          offset: -20,
                          style: {
                            textAnchor: 'middle',
                            fontWeight: '500',
                            fontSize: '12px',
                            fill: '#64748b'
                          }
                        }} />
                          <Tooltip formatter={(value: number) => [`$${value.toLocaleString()}`, 'Balance']} labelFormatter={year => `Year ${year}`} contentStyle={{
                          backgroundColor: 'white',
                          border: '1px solid #e2e8f0',
                          borderRadius: '12px',
                          boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1)',
                          fontSize: '14px',
                          fontWeight: '500'
                        }} cursor={{
                          stroke: '#059669',
                          strokeWidth: 1,
                          strokeDasharray: '4 4'
                        }} />
                          <Line type="monotone" dataKey="balance" stroke="#059669" strokeWidth={3} dot={false} activeDot={{
                          r: 6,
                          fill: '#059669',
                          stroke: '#ffffff',
                          strokeWidth: 2
                        }} style={{
                          filter: 'drop-shadow(0 2px 4px rgba(5, 150, 105, 0.2))'
                        }} />
                        </LineChart>
                      </ResponsiveContainer>
                    </div>
                    
                    {/* Results Section */}
                    <div className="mt-6 space-y-4">
                      <div className={`p-4 rounded-lg ${isMoneyLasting ? 'bg-emerald-50 border border-emerald-200' : 'bg-red-50 border border-red-200'}`}>
                        <h3 className={`font-semibold text-lg ${isMoneyLasting ? 'text-emerald-800' : 'text-red-800'}`}>
                          {isMoneyLasting ? '✓ Money Lasts 30+ Years' : `⚠ Money Runs Out in ${yearsUntilEmpty} year${yearsUntilEmpty !== 1 ? 's' : ''}${monthsUntilEmpty > 0 ? ` and ${monthsUntilEmpty} month${monthsUntilEmpty > 1 ? 's' : ''}` : ''}`}
                        </h3>
                        <p className={`text-sm ${isMoneyLasting ? 'text-emerald-600' : 'text-red-600'}`}>
                          {isMoneyLasting ? 'Your spending plan looks sustainable for a 30-year retirement.' : 'Consider reducing spending or saving more to extend your money.'}
                        </p>
                      </div>
                      
                      <div className="bg-emerald-50 border border-emerald-200 p-4 rounded-lg">
                        <h3 className="font-semibold text-lg text-emerald-800">Safe Monthly Spending</h3>
                        <p className="text-2xl font-bold text-emerald-600">${safeMonthlyAmount.toLocaleString()}</p>
                        <p className="text-sm text-emerald-600">Sustainable for 30 years with 3% annual increases</p>
                      </div>
                      
                      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                        <DialogTrigger asChild>
                          <Button variant="outline" className="w-full border-emerald-200 text-emerald-700 hover:bg-emerald-50">
                            <Download className="w-4 h-4 mr-2" />
                            Export Results as PDF
                          </Button>
                        </DialogTrigger>
                        <DialogContent className="sm:max-w-md">
                          <DialogHeader>
                            <DialogTitle className="text-slate-800">Export Your Results</DialogTitle>
                            <DialogDescription className="text-slate-600">
                              Enter your details to receive a PDF summary of your retirement projection.
                            </DialogDescription>
                          </DialogHeader>
                          <div className="space-y-4">
                            <div className="space-y-2">
                              <Label htmlFor="firstName" className="text-slate-700">First Name</Label>
                              <Input id="firstName" value={firstName} onChange={e => setFirstName(e.target.value)} placeholder="Enter your first name" className="border-slate-200 focus:border-emerald-500 focus:ring-emerald-500" />
                            </div>
                            <div className="space-y-2">
                              <Label htmlFor="email" className="text-slate-700">Email Address</Label>
                              <Input id="email" type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="Enter your email" className="border-slate-200 focus:border-emerald-500 focus:ring-emerald-500" />
                            </div>
                            <Button onClick={handleExportPDF} disabled={!firstName || !email} className="w-full bg-emerald-600 hover:bg-emerald-700">
                              <Download className="w-4 h-4 mr-2" />
                              Generate PDF
                            </Button>
                          </div>
                        </DialogContent>
                      </Dialog>
                    </div>
                  </> : <div className="h-80 flex items-center justify-center">
                    <div className="text-center text-slate-500">
                      <Calculator className="w-16 h-16 mx-auto mb-4 opacity-50" />
                      <h3 className="text-xl font-semibold mb-2">
                        {needsCalculation ? 'Values Changed' : 'Ready to Calculate?'}
                      </h3>
                      <p>
                        {needsCalculation ? 'Click "Recalculate" to see updated results' : 'Click "Calculate My Retirement Plan" to see your personalized projection'}
                      </p>
                    </div>
                  </div>}
              </CardContent>
            </Card>
          </div>

          {/* CTA Section */}
          <div className="text-center mt-12">
            <Card className="bg-gradient-to-r from-emerald-600 via-teal-600 to-blue-600 text-white border-0 shadow-2xl max-w-2xl mx-auto ring-1 ring-white/20">
              <CardContent className="p-8">
                <Users className="w-12 h-12 mx-auto mb-4 opacity-90" />
                <h3 className="text-2xl font-bold mb-4">Ready to Create Your Retirement Plan?</h3>
                <p className="text-emerald-100 mb-6">
                  Schedule a meeting with a financial professional to create a personalized retirement strategy.
                </p>
                <Button size="lg" variant="secondary" className="bg-white text-emerald-600 hover:bg-emerald-50" onClick={handleFindATimeClick}>
                  Find a Time
                  <ExternalLink className="w-4 h-4 ml-2" />
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Learn More and Related Topics Section */}
      <section className="relative py-16 bg-gradient-to-br from-slate-200 via-emerald-100 to-blue-100 backdrop-blur-sm">
        <div className="container mx-auto px-4 max-w-6xl">
          <div className="grid lg:grid-cols-2 gap-12">
            {/* Learn More Section - Left Side */}
            <div>
              <div className="text-center mb-8">
                <BookOpen className="w-12 h-12 mx-auto text-emerald-600 mb-4" />
                <h2 className="text-3xl font-bold text-slate-800 mb-4">Learn More About Retirement</h2>
                <p className="text-lg text-slate-600">
                  Deepen your understanding with our comprehensive retirement planning resources.
                </p>
              </div>
              
              <div className="space-y-4">
                <Card className="hover:shadow-lg transition-all duration-300 bg-white/90 backdrop-blur-sm border-0 ring-1 ring-slate-200/50 hover:ring-emerald-300/50 h-40">
                  <CardContent className="p-4 h-full flex flex-col justify-between">
                    <div className="flex items-start space-x-3">
                      <TrendingDown className="w-6 h-6 text-emerald-600 mt-1 flex-shrink-0" />
                      <div className="flex-1">
                        <h3 className="font-semibold text-base mb-2 text-slate-800">The Need for Retirement Planning</h3>
                        <p className="text-slate-600 text-sm mb-3 line-clamp-1">Highlights the importance of proactively preparing for retirement to ensure long-term financial security.</p>
                      </div>
                    </div>
                    <Button variant="outline" size="sm" className="border-emerald-200 text-emerald-700 hover:bg-emerald-50 self-start w-28" onClick={() => handleEducationalClick('The Need for Retirement Planning', 'read-report-1')}>
                      Read Report
                    </Button>
                  </CardContent>
                </Card>
                
                <Card className="hover:shadow-lg transition-all duration-300 bg-white/90 backdrop-blur-sm border-0 ring-1 ring-slate-200/50 hover:ring-emerald-300/50 h-40">
                  <CardContent className="p-4 h-full flex flex-col justify-between">
                    <div className="flex items-start space-x-3">
                      <Calculator className="w-6 h-6 text-emerald-600 mt-1 flex-shrink-0" />
                      <div className="flex-1">
                        <h3 className="font-semibold text-base mb-2 text-slate-800">How a Roth IRA Works</h3>
                        <p className="text-slate-600 text-sm mb-3 line-clamp-1">Explains how a Roth IRA allows for tax-free growth and withdrawals in retirement through after-tax contributions.</p>
                      </div>
                    </div>
                    <Button variant="outline" size="sm" className="border-emerald-200 text-emerald-700 hover:bg-emerald-50 self-start w-28" onClick={() => handleEducationalClick('How a Roth IRA Works', 'read-report-2')}>
                      Read Report
                    </Button>
                  </CardContent>
                </Card>
                
                <Card className="hover:shadow-lg transition-all duration-300 bg-white/90 backdrop-blur-sm border-0 ring-1 ring-slate-200/50 hover:ring-emerald-300/50 h-40">
                  <CardContent className="p-4 h-full flex flex-col justify-between">
                    <div className="flex items-start space-x-3">
                      <PiggyBank className="w-6 h-6 text-emerald-600 mt-1 flex-shrink-0" />
                      <div className="flex-1">
                        <h3 className="font-semibold text-base mb-2 text-slate-800">Social Security Retirement Claiming Strategies for Married Couples</h3>
                        <p className="text-slate-600 text-sm mb-3 line-clamp-1">Outlines various strategies for claiming Social Security benefits to maximize lifetime income.</p>
                      </div>
                    </div>
                    <Button variant="outline" size="sm" className="border-emerald-200 text-emerald-700 hover:bg-emerald-50 self-start w-28" onClick={() => handleEducationalClick('Social Security Retirement Claiming Strategies for Married Couples', 'read-report-3')}>
                      Read Report
                    </Button>
                  </CardContent>
                </Card>
              </div>
            </div>

            {/* Related Topics Section - Right Side */}
            <div>
              <div className="text-center mb-8">
                <FileText className="w-12 h-12 mx-auto text-teal-600 mb-4" />
                <h2 className="text-3xl font-bold text-slate-800 mb-4">Related Financial Topics</h2>
                <p className="text-lg text-slate-600">
                  Explore other important areas of financial planning to secure your future.
                </p>
              </div>
              
              <div className="space-y-4">
                <Card className="hover:shadow-lg transition-all duration-300 bg-white/90 backdrop-blur-sm border-0 ring-1 ring-slate-200/50 hover:ring-teal-300/50 h-40">
                  <CardContent className="p-4 h-full flex flex-col justify-between">
                    <div className="flex items-start space-x-3">
                      <TrendingDown className="w-6 h-6 text-teal-600 mt-1 flex-shrink-0" />
                      <div className="flex-1">
                        <h3 className="font-semibold text-base mb-2 text-slate-800">Managing Your Debt</h3>
                        <p className="text-slate-600 text-sm mb-3 line-clamp-1">Provides guidance on effectively reducing and managing debt to improve financial stability and long-term well-being.</p>
                      </div>
                    </div>
                    <Button variant="outline" size="sm" className="border-teal-200 text-teal-700 hover:bg-teal-50 self-start w-28" onClick={() => handleEducationalClick('Managing Your Debt', 'read-report-4')}>
                      Read Report
                    </Button>
                  </CardContent>
                </Card>
                
                <Card className="hover:shadow-lg transition-all duration-300 bg-white/90 backdrop-blur-sm border-0 ring-1 ring-slate-200/50 hover:ring-teal-300/50 h-40">
                  <CardContent className="p-4 h-full flex flex-col justify-between">
                    <div className="flex items-start space-x-3">
                      <Shield className="w-6 h-6 text-teal-600 mt-1 flex-shrink-0" />
                      <div className="flex-1">
                        <h3 className="font-semibold text-base mb-2 text-slate-800">How Individual Disability Income Insurance Works</h3>
                        <p className="text-slate-600 text-sm mb-3 line-clamp-1">Explains how individual disability income insurance provides income protection by replacing a portion of earnings.</p>
                      </div>
                    </div>
                    <Button variant="outline" size="sm" className="border-teal-200 text-teal-700 hover:bg-teal-50 self-start w-28" onClick={() => handleEducationalClick('How Individual Disability Income Insurance Works', 'read-report-5')}>
                      Read Report
                    </Button>
                  </CardContent>
                </Card>
                
                <Card className="hover:shadow-lg transition-all duration-300 bg-white/90 backdrop-blur-sm border-0 ring-1 ring-slate-200/50 hover:ring-teal-300/50 h-40">
                  <CardContent className="p-4 h-full flex flex-col justify-between">
                    <div className="flex items-start space-x-3">
                      <Users className="w-6 h-6 text-teal-600 mt-1 flex-shrink-0" />
                      <div className="flex-1">
                        <h3 className="font-semibold text-base mb-2 text-slate-800">General Purposes of Life Insurance</h3>
                        <p className="text-slate-600 text-sm mb-3 line-clamp-1">Describes the main reasons for purchasing life insurance, including income replacement, debt coverage, and estate planning.</p>
                      </div>
                    </div>
                    <Button variant="outline" size="sm" className="border-teal-200 text-teal-700 hover:bg-teal-50 self-start w-28" onClick={() => handleEducationalClick('General Purposes of Life Insurance', 'read-report-6')}>
                      Read Report
                    </Button>
                  </CardContent>
                </Card>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Podcast Section */}
      <section className="relative py-16 bg-slate-50/60 backdrop-blur-sm">
        <div className="container mx-auto px-4 max-w-4xl">
          <Card className="bg-gradient-to-r from-slate-700 via-emerald-700 to-teal-700 text-white border-0 shadow-2xl ring-1 ring-white/20">
            <CardContent className="p-8 text-center">
              <Headphones className="w-16 h-16 mx-auto mb-6 opacity-90" />
              <h2 className="text-3xl font-bold mb-4">Retirement Spending Podcast</h2>
              <p className="text-lg text-slate-100 mb-6 max-w-2xl mx-auto">Discover how much you can safely spend in retirement by understanding this online calculator. We'll unpack why this tool is just a starting point, emphasizing the need for a personalized plan to build the retirement you envision.</p>
              <div className="flex justify-center">
                <Button size="lg" variant="secondary" className="bg-white text-slate-700 hover:bg-slate-50" onClick={handleListenNow}>
                  <Headphones className="w-5 h-5 mr-2" />
                  Listen Now
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* Contact Me Section */}
      <section id="contact-section" className="relative py-16 bg-gradient-to-br from-emerald-50 via-teal-50 to-blue-50 backdrop-blur-sm">
        <div className="container mx-auto px-4 max-w-4xl">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-slate-800 mb-4">Contact Your Financial Professional</h2>
            <p className="text-lg text-slate-600">Ready to discuss your retirement planning? Get in touch today.</p>
          </div>
          
          <Card className="bg-white/95 backdrop-blur-lg border-0 shadow-xl ring-1 ring-slate-200/50">
            <CardContent className="p-8">
              <div className="grid md:grid-cols-2 gap-8 items-center">
                {/* Contact Information */}
                <div className="space-y-6">
                  <div className="flex items-center space-x-4">
                    <div className="w-12 h-12 bg-emerald-100 rounded-lg flex items-center justify-center">
                      <Phone className="w-6 h-6 text-emerald-600" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-slate-800">Phone</h3>
                      <p className="text-slate-600">(555) 123-4567</p>
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-4">
                    <div className="w-12 h-12 bg-teal-100 rounded-lg flex items-center justify-center">
                      <Mail className="w-6 h-6 text-teal-600" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-slate-800">Email</h3>
                      <p className="text-slate-600">advisor@financialplanning.com</p>
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-4">
                    <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                      <MapPin className="w-6 h-6 text-blue-600" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-slate-800">Office</h3>
                      <p className="text-slate-600">123 Financial Street<br />Suite 456<br />Financial City, FC 12345</p>
                    </div>
                  </div>
                </div>
                
                {/* Advisor Photo */}
                <div className="text-center">
                  <div className="w-48 h-48 mx-auto bg-gradient-to-br from-emerald-200 to-teal-300 rounded-full flex items-center justify-center mb-4">
                    <Users className="w-24 h-24 text-emerald-700 opacity-60" />
                  </div>
                  <h3 className="text-xl font-bold text-slate-800 mb-2">Sarah Johnson, CFP®</h3>
                  <p className="text-slate-600">Certified Financial Planner</p>
                  <p className="text-sm text-slate-500 mt-2">15+ years experience helping clients achieve their retirement goals</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* Disclaimer */}
      <section className="relative py-12 bg-gradient-to-t from-slate-100/90 to-white/60 backdrop-blur-sm">
        <div className="container mx-auto px-4 max-w-4xl">
          <div className="text-center">
            <h3 className="text-lg font-semibold text-slate-800 mb-4">Important Disclaimer</h3>
            <p className="text-sm text-slate-600 leading-relaxed">
              This calculator is provided for educational purposes only and should not be considered personalized investment advice. 
              The calculations are based on simplified assumptions and may not reflect your actual financial situation. Market returns, inflation rates, 
              and personal circumstances can vary significantly. Past performance does not guarantee future results. Please consult with a qualified 
              financial advisor before making any investment or retirement planning decisions. All investments carry risk, including the potential loss of principal.
            </p>
          </div>
        </div>
      </section>

      {/* Audio Player Component with tracking */}
      <AudioPlayer 
        audioRef={audioPlayer.audioRef} 
        isPlaying={audioPlayer.isPlaying} 
        duration={audioPlayer.duration} 
        currentTime={audioPlayer.currentTime} 
        volume={audioPlayer.volume} 
        isVisible={audioPlayer.isVisible} 
        isMinimized={audioPlayer.isMinimized} 
        isLoading={audioPlayer.isLoading} 
        error={audioPlayer.error} 
        onTogglePlay={audioPlayer.togglePlay} 
        onSeek={audioPlayer.seek} 
        onVolumeChange={audioPlayer.changeVolume} 
        onClose={audioPlayer.closePlayer}
        onToggleMinimize={audioPlayer.toggleMinimize} 
        onRetryLoad={audioPlayer.retryLoad} 
      />
    </div>
  </TooltipProvider>;
};
export default Index;
