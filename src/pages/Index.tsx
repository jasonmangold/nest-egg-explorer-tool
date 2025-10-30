import { useState, useMemo, useEffect } from "react";
import { useParams } from "react-router-dom";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tooltip as UITooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Calculator, TrendingDown, Users, BookOpen, Headphones, ExternalLink, Download, FileText, Shield, PiggyBank, Info, Phone, Mail, MapPin } from "lucide-react";
import jsPDF from 'jspdf';
import AudioPlayer from '@/components/AudioPlayer';
import { useAudioPlayer } from '@/hooks/useAudioPlayer';
import { openPDFByTitle } from '@/hooks/useEducationPDFs';
import { supabase } from "@/integrations/supabase/client";
import { useTheme } from "@/contexts/ThemeContext";

// TypeScript interfaces
interface Advisor {
  name: string;
  title: string;
  bio: string;
  photoUrl: string;
  logo_url: string;
  contact_button_type: 'scroll' | 'phone' | 'email' | 'website';
  contact_button_url?: string;
  show_podcast: boolean;
  disclaimer_text: string | null;
  phone: string;
  email: string;
  address: string;
}

const Index = () => {
  // Advisor Information - fetched dynamically from database
  const {
    advisorSlug
  } = useParams();
  const {
    setColors
  } = useTheme();
  const [advisorInfo, setAdvisorInfo] = useState<Advisor>({
    name: "Sarah Johnson, CFP®",
    title: "Certified Financial Planner",
    bio: "15+ years experience helping clients achieve their goals",
    photoUrl: "",
    logo_url: "/lovable-uploads/d95ac3ea-3a71-4c6a-8e8f-a574c47981ec.png",
    contact_button_type: "scroll",
    contact_button_url: undefined,
    show_podcast: true,
    disclaimer_text: "The values shown are hypothetical illustrations and not a promise of future performance. They are not intended to provide financial advice. Contact a financial professional for more personalized recommendations.",
    phone: "",
    email: "",
    address: ""
  });

  const [advisorNotFound, setAdvisorNotFound] = useState(false);

  // Fetch advisor data from database using RPC function
  useEffect(() => {
    const fetchAdvisor = async () => {
      if (!advisorSlug) return;
      
      // Get current domain
      const domain = window.location.hostname;
      
      console.log('Fetching advisor:', { slug: advisorSlug, domain });
      
      // Call RPC function to get advisor with access control
      const { data, error } = await (supabase as any).rpc('get_advisor_by_slug_and_domain', {
        _slug: advisorSlug,
        _domain: domain
      });

      if (error) {
        console.error('Error fetching advisor:', error);
        setAdvisorNotFound(true);
        return;
      }

      if (!data || (data as any).length === 0) {
        console.log('Advisor not found or not enabled for this domain');
        setAdvisorNotFound(true);
        return;
      }

      const advisorData = (data as any)[0];
      console.log('Advisor data loaded:', advisorData);

      setAdvisorInfo({
        name: advisorData.name,
        title: advisorData.title,
        bio: advisorData.bio,
        photoUrl: advisorData.profile_picture_url || "",
        logo_url: advisorData.logo_url,
        contact_button_type: advisorData.contact_button_type as 'scroll' | 'phone' | 'email' | 'website',
        contact_button_url: advisorData.contact_button_url,
        show_podcast: advisorData.show_podcast ?? true,
        disclaimer_text: advisorData.disclaimer_text,
        phone: advisorData.phone || "",
        email: advisorData.email || "",
        address: advisorData.address || ""
      });
      
      setColors({
        primary: advisorData.theme_primary_color,
        secondary: advisorData.theme_secondary_color
      });
    };
    
    fetchAdvisor();
  }, [advisorSlug, setColors]);
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
    const monthlyReturnRate = 0.06 / 12; // 6% annual = 0.5% monthly

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
    if (!hasCalculated || needsCalculation) return {
      years: 0,
      months: 0,
      totalMonths: 0
    };
    let balance = currentSavings;
    const monthlySpendingBase = monthlySpending;
    const annualInflationRate = 0.03;
    const monthlyReturnRate = 0.06 / 12; // 6% annual = 0.5% monthly

    let lastPositiveMonth = 0;
    for (let month = 1; month <= 30 * 12; month++) {
      // Start from month 1
      const currentYear = Math.floor((month - 1) / 12);
      const adjustedMonthlySpending = monthlySpendingBase * Math.pow(1 + annualInflationRate, currentYear);

      // Subtract monthly spending first
      balance = balance - adjustedMonthlySpending;

      // If balance goes negative, we're done
      if (balance <= 0) {
        break;
      }

      // Apply interest after spending
      balance = balance * (1 + monthlyReturnRate);

      // Track the last month with positive balance
      lastPositiveMonth = month;

      // If we reach 30 years, set to max
      if (month === 30 * 12) {
        lastPositiveMonth = 30 * 12;
        break;
      }
    }
    const years = Math.floor(lastPositiveMonth / 12);
    const months = lastPositiveMonth % 12;
    return {
      years,
      months,
      totalMonths: lastPositiveMonth
    };
  }, [currentSavings, monthlySpending, hasCalculated, needsCalculation]);

  // Calculate maximum withdrawal that leaves ~$1,000 after 30 years (360 months)
  const safeMonthlyAmount = useMemo(() => {
    if (!hasCalculated || needsCalculation) return 0;
    const targetEndingBalance = 1000;
    const monthlyReturnRate = 0.06 / 12; // 0.5% monthly
    const annualInflationRate = 0.03;
    const totalMonths = 360; // 30 years

    // Binary search to find maximum monthly withdrawal
    let low = 0;
    let high = currentSavings / 12; // Conservative upper bound
    let bestWithdrawal = 0;

    // Binary search with precision of $1
    while (high - low > 1) {
      const midWithdrawal = Math.floor((low + high) / 2);

      // Simulate 360 months with this withdrawal amount
      let balance = currentSavings;
      let simulationSuccessful = true;
      for (let month = 1; month <= totalMonths; month++) {
        const currentYear = Math.floor((month - 1) / 12);
        const adjustedMonthlySpending = midWithdrawal * Math.pow(1 + annualInflationRate, currentYear);

        // Subtract withdrawal
        balance = balance - adjustedMonthlySpending;

        // If balance goes negative, this withdrawal is too high
        if (balance < 0) {
          simulationSuccessful = false;
          break;
        }

        // Apply interest
        balance = balance * (1 + monthlyReturnRate);
      }

      // Check if ending balance is close to target
      if (simulationSuccessful && balance >= targetEndingBalance) {
        bestWithdrawal = midWithdrawal;
        low = midWithdrawal;
      } else {
        high = midWithdrawal;
      }
    }
    return bestWithdrawal;
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
      // Get computed primary color from CSS variable
      const primaryColor = getComputedStyle(document.documentElement).getPropertyValue('--primary').trim();
      ctx.strokeStyle = primaryColor ? `hsl(${primaryColor})` : '#059669';
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
      ctx.fillStyle = primaryColor ? `hsl(${primaryColor})` : '#059669';
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
      let currentY = 20;

      // Title
      pdf.setFontSize(22);
      pdf.setTextColor(30, 41, 59);
      pdf.setFont("helvetica", "bold");
      pdf.text("What Can I Safely Spend in Retirement?", pageWidth / 2, 20, {
        align: "center"
      });
      pdf.setFontSize(10);
      pdf.setFont("helvetica", "normal");
      pdf.setTextColor(71, 85, 105);
      pdf.text("The graph below shows how long your retirement savings will last.", pageWidth / 2, 28, {
        align: "center"
      });
      currentY += 15;

      // Your Inputs Section
      pdf.setFontSize(12);
      pdf.setTextColor(51, 65, 85); // slate-700
      pdf.setFont("helvetica", "bold");
      pdf.text('Your Inputs', 15, currentY);
      currentY += 8;
      
      pdf.setFillColor(248, 250, 252); // slate-50
      pdf.roundedRect(15, currentY, pageWidth - 30, 22, 3, 3, 'F');
      pdf.setFontSize(10);
      pdf.setTextColor(71, 85, 105); // slate-600
      pdf.text('Amount at Retirement:', 20, currentY + 8);
      pdf.setTextColor(30, 41, 59); // slate-800
      pdf.text(`$${currentSavings.toLocaleString()}`, 80, currentY + 8);
      pdf.setTextColor(71, 85, 105);
      pdf.text('Monthly Spending:', 20, currentY + 15);
      pdf.setTextColor(30, 41, 59);
      pdf.text(`$${monthlySpending.toLocaleString()}`, 80, currentY + 15);
      currentY += 30;

      // Your Results Section Header
      pdf.setFontSize(12);
      pdf.setTextColor(51, 65, 85);
      pdf.setFont("helvetica", "bold");
      pdf.text('Your Results', 15, currentY);
      currentY += 8;

      // Two side-by-side boxes
      const boxWidth = (pageWidth - 35) / 2; // 15 left margin + 15 right margin + 5 gap
      const resultsBoxHeight = 28;
      const leftBoxX = 15;
      const rightBoxX = leftBoxX + boxWidth + 5;

      // Status indicator colors
      const statusColor: [number, number, number] = isMoneyLasting ? [5, 150, 105] : [220, 38, 38];
      const statusBgColor: [number, number, number] = isMoneyLasting ? [236, 253, 245] : [254, 226, 226];

      // Left Box - Status/Warning
      pdf.setFillColor(statusBgColor[0], statusBgColor[1], statusBgColor[2]);
      pdf.roundedRect(leftBoxX, currentY, boxWidth, resultsBoxHeight, 3, 3, 'F');
      pdf.setTextColor(statusColor[0], statusColor[1], statusColor[2]);
      pdf.setFont("helvetica", "bold");
      pdf.setFontSize(10);
      if (isMoneyLasting) {
        // Success state - 3 line format
        pdf.setFontSize(8);
        pdf.text('Money Lasts:', leftBoxX + 4, currentY + 6);
        pdf.setFontSize(16);
        pdf.text('30+ Years', leftBoxX + 4, currentY + 16);
      } else {
        // Warning state - 3 line format matching safe spending box
        pdf.setFontSize(8);
        pdf.text('Money Runs Out In:', leftBoxX + 4, currentY + 6);
        pdf.setFontSize(16);
        pdf.text(`${yearsUntilEmpty} years and ${monthsUntilEmpty} months`, leftBoxX + 4, currentY + 16);
      }

      // Subtext
      pdf.setFontSize(7);
      pdf.setFont("helvetica", "normal");
      const warningSubtext = isMoneyLasting ? 'Your spending plan looks sustainable for a 30-year retirement.' : 'Consider reducing spending or saving more to extend your money.';
      const warningLines = pdf.splitTextToSize(warningSubtext, boxWidth - 8);
      pdf.text(warningLines, leftBoxX + 4, currentY + 22);

      // Right Box - Safe Monthly Spending
      pdf.setFillColor(236, 253, 245); // Light green
      pdf.roundedRect(rightBoxX, currentY, boxWidth, resultsBoxHeight, 3, 3, 'F');
      pdf.setFontSize(8);
      pdf.setTextColor(5, 150, 105);
      pdf.setFont("helvetica", "bold");
      pdf.text('Safe Monthly Spending', rightBoxX + 4, currentY + 6);
      pdf.setFontSize(16);
      pdf.setFont("helvetica", "bold");
      pdf.text(`$${safeMonthlyAmount.toLocaleString()}`, rightBoxX + 4, currentY + 16);
      pdf.setFontSize(7);
      pdf.setFont("helvetica", "normal");
      pdf.setTextColor(71, 85, 105);
      const sustainableText = 'Sustainable for 30 years with 3% annual increases';
      const sustainableLines = pdf.splitTextToSize(sustainableText, boxWidth - 8);
      pdf.text(sustainableLines, rightBoxX + 4, currentY + 22);
      pdf.setFont("helvetica", "normal");
      currentY += resultsBoxHeight + 10;

      // Add the improved larger graph
      if (hasCalculated && !needsCalculation) {
        try {
          const graphImage = await generateGraphImage();
          if (graphImage) {
            // Compact dimensions to save space
            const graphWidth = 110;
            const graphHeight = 70;
            const graphX = (pageWidth - graphWidth) / 2;
            pdf.addImage(graphImage, 'PNG', graphX, currentY, graphWidth, graphHeight);
            currentY += graphHeight + 6;
          }
        } catch (error) {
          console.log('Could not add graph to PDF:', error);
          currentY += 6;
        }
      }

      // Assumptions section - more compact
      pdf.setFillColor(248, 250, 252);
      pdf.roundedRect(15, currentY, pageWidth - 30, 16, 3, 3, 'F');
      pdf.setFontSize(10);
      pdf.setTextColor(51, 65, 85);
      pdf.text('Assumptions', 20, currentY + 7);
      pdf.setFontSize(9);
      pdf.setTextColor(71, 85, 105);
      pdf.text('30-year retirement  •  3% annual inflation  •  6% annual return', 20, currentY + 12);
      currentY += 22;

      // Advisor Contact Info (with photo support)
      const contactY = currentY;
      const boxHeight = 42; // Reduced from 48

      // Box around contact info
      pdf.setFillColor(240, 249, 255);
      pdf.setDrawColor(59, 130, 246);
      pdf.setLineWidth(0.5);
      pdf.roundedRect(15, contactY - 5, pageWidth - 30, boxHeight, 2, 2, 'FD');

      // Add advisor photo if available (maintain aspect ratio)
      const photoX = 20;
      const maxPhotoHeight = 18; // Reduced from 20
      const maxPhotoWidth = 26; // Reduced from 30
      if (advisorInfo.photoUrl) {
        try {
          const img = new Image();
          img.src = advisorInfo.photoUrl;
          let photoWidth = maxPhotoWidth;
          let photoHeight = maxPhotoHeight;
          const aspectRatio = img.width / img.height;
          if (aspectRatio > 1) {
            photoHeight = maxPhotoWidth / aspectRatio;
          } else {
            photoWidth = maxPhotoHeight * aspectRatio;
          }
          const photoY = contactY + (maxPhotoHeight - photoHeight) / 2;
          pdf.addImage(advisorInfo.photoUrl, 'JPEG', photoX, photoY, photoWidth, photoHeight);
        } catch (e) {
          pdf.setFillColor(167, 243, 208);
          pdf.circle(photoX + maxPhotoHeight / 2, contactY + maxPhotoHeight / 2, maxPhotoHeight / 2, 'F');
        }
      } else {
        pdf.setFillColor(167, 243, 208);
        pdf.circle(photoX + maxPhotoHeight / 2, contactY + maxPhotoHeight / 2, maxPhotoHeight / 2, 'F');
      }

      // Advisor info (right of photo)
      const textX = photoX + maxPhotoWidth + 5;
      pdf.setFontSize(10);
      pdf.setFont("helvetica", "bold");
      pdf.setTextColor(51, 65, 85);
      pdf.text(advisorInfo.name, textX, contactY + 5);

      // Contact details in second column
      const col2X = pageWidth / 2 + 10;

      // Wrap advisor title to fit available space (don't overlap with contact info)
      const maxTitleWidth = col2X - textX - 5;
      pdf.setFontSize(8);
      pdf.setFont("helvetica", "normal");
      pdf.setTextColor(71, 85, 105);
      const wrappedTitle = pdf.splitTextToSize(advisorInfo.title, maxTitleWidth);
      pdf.text(wrappedTitle, textX, contactY + 11);

      // Show contact info if available
      if (advisorInfo.phone || advisorInfo.email || advisorInfo.address) {
        pdf.setFontSize(8);
        
        if (advisorInfo.phone) {
          pdf.setFont("helvetica", "bold");
          pdf.text("Phone:", col2X, contactY + 3);
          pdf.setFont("helvetica", "normal");
          pdf.text(advisorInfo.phone, col2X + 15, contactY + 3);
        }
        
        if (advisorInfo.email) {
          pdf.setFont("helvetica", "bold");
          pdf.text("Email:", col2X, contactY + 9);
          pdf.setFont("helvetica", "normal");
          pdf.text(advisorInfo.email, col2X + 15, contactY + 9);
        }
        
        if (advisorInfo.address) {
          pdf.setFont("helvetica", "bold");
          pdf.text("Office:", col2X, contactY + 15);
          pdf.setFont("helvetica", "normal");
          const addressLines = advisorInfo.address.split('\n');
          addressLines.forEach((line, index) => {
            pdf.text(line, col2X + 15, contactY + 15 + index * 4);
          });
        }
      }

      // Client info at bottom of box
      pdf.setFontSize(7);
      pdf.setFont("helvetica", "italic");
      pdf.setTextColor(100, 116, 139);
      pdf.text(`Prepared for: ${firstName} (${email}) on ${new Date().toLocaleDateString()}`, textX, contactY + boxHeight - 7);
      currentY = contactY + boxHeight + 6; // Reduced spacing

      // Disclaimer Section - optimized to fit on first page
      pdf.setFontSize(8);
      pdf.setFont("helvetica", "bold");
      pdf.setTextColor(51, 65, 85);
      pdf.text("Important Disclaimer", 15, currentY);
      pdf.setFontSize(6.5);
      pdf.setFont("helvetica", "normal");
      pdf.setTextColor(71, 85, 105);
      const disclaimerText = advisorInfo.disclaimer_text || "The values shown are hypothetical illustrations and not a promise of future performance. They are not intended to provide financial advice. Contact a financial professional for more personalized recommendations.";
      const disclaimerLines = pdf.splitTextToSize(disclaimerText, pageWidth - 30);
      pdf.text(disclaimerLines, 15, currentY + 5);

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

  // Dynamic contact button handler
  const handleContactClick = () => {
    switch (advisorInfo.contact_button_type) {
      case 'scroll':
        scrollToContact();
        break;
      case 'phone':
        if (advisorInfo.phone) {
          window.location.href = `tel:${advisorInfo.phone}`;
        } else {
          scrollToContact();
        }
        break;
      case 'email':
        if (advisorInfo.email) {
          window.location.href = `mailto:${advisorInfo.email}`;
        } else {
          scrollToContact();
        }
        break;
      case 'website':
        if (advisorInfo.contact_button_url) {
          window.open(advisorInfo.contact_button_url, '_blank');
        }
        break;
    }
  };

  // Show 404 if advisor not found or not enabled
  if (advisorNotFound) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="text-center px-4">
          <h1 className="text-4xl font-bold text-slate-800 mb-4">Advisor Not Found</h1>
          <p className="text-lg text-slate-600">
            The advisor page you're looking for is not available on this domain.
          </p>
        </div>
      </div>
    );
  }
  return <TooltipProvider>
    <div className="min-h-screen relative overflow-hidden bg-slate-50">
      {/* Structured Data for SEO */}
      <script type="application/ld+json">
        {JSON.stringify({
          "@context": "https://schema.org",
          "@type": "WebApplication",
          "name": "Retirement Spending Calculator",
          "description": "Free retirement spending calculator to determine safe monthly spending in retirement",
          "url": "https://retirement-calculator.lovable.app/",
          "applicationCategory": "FinanceApplication",
          "operatingSystem": "Any",
          "offers": {
            "@type": "Offer",
            "price": "0",
            "priceCurrency": "USD"
          },
          "provider": {
            "@type": "Organization",
            "name": "Financial Planning Company",
            "contactPoint": {
              "@type": "ContactPoint",
              "telephone": "(555) 123-4567",
              "email": "advisor@financialplanning.com",
              "contactType": "customer service"
            }
          },
          "featureList": ["Retirement spending projection", "30-year financial planning", "Safe withdrawal rate calculation", "PDF report generation", "Retirement education resources"]
        })}
      </script>
      {/* Enhanced Financial Background */}
      <div className="fixed inset-0 -z-10">
        {/* Primary gradient background */}
        <div className="absolute inset-0 bg-gradient-to-br from-slate-50 via-primary/5 via-primary/3 to-slate-100"></div>
        
        {/* Floating geometric shapes */}
        <div className="absolute top-10 left-10 w-32 h-32 bg-primary/10 rounded-full blur-xl animate-pulse"></div>
        <div className="absolute top-40 right-20 w-48 h-48 bg-secondary/8 rounded-full blur-2xl animate-pulse delay-1000"></div>
        <div className="absolute bottom-40 left-20 w-40 h-40 bg-slate-300/20 rounded-full blur-xl animate-pulse delay-2000"></div>
        <div className="absolute bottom-10 right-10 w-60 h-60 bg-primary/5 rounded-full blur-3xl animate-pulse delay-500"></div>
        
        {/* Subtle grid pattern overlay */}
        <div className="absolute inset-0 opacity-20" style={{
          backgroundImage: `
            linear-gradient(hsl(var(--primary) / 0.03) 1px, transparent 1px),
            linear-gradient(90deg, hsl(var(--primary) / 0.03) 1px, transparent 1px)
          `,
          backgroundSize: '60px 60px'
        }}></div>
        
        {/* Flowing lines */}
        <svg className="absolute inset-0 w-full h-full" viewBox="0 0 1000 1000" preserveAspectRatio="none">
          <path d="M0,300 Q250,100 500,300 T1000,300 V0 H0 Z" fill="url(#gradient1)" fillOpacity="0.08" />
          <path d="M0,600 Q250,400 500,600 T1000,600 V1000 H0 Z" fill="url(#gradient2)" fillOpacity="0.08" />
          <defs>
            <linearGradient id="gradient1" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="hsl(var(--primary))" stopOpacity="0.3" />
              <stop offset="50%" stopColor="hsl(var(--secondary))" stopOpacity="0.2" />
              <stop offset="100%" stopColor="hsl(var(--primary))" stopOpacity="0.1" />
            </linearGradient>
            <linearGradient id="gradient2" x1="0%" y1="100%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="hsl(var(--primary))" stopOpacity="0.2" />
              <stop offset="50%" stopColor="hsl(var(--secondary))" stopOpacity="0.15" />
              <stop offset="100%" stopColor="hsl(var(--primary))" stopOpacity="0.1" />
            </linearGradient>
          </defs>
        </svg>
      </div>

      {/* Header with Logo and Contact Button */}
      <header className="relative pt-6 pb-4 backdrop-blur-sm" role="banner">
        <nav className="container mx-auto px-2 sm:px-4 max-w-6xl" aria-label="Main navigation">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <img alt={`${advisorInfo.name} - Financial Planning Services Logo`} src={advisorInfo.logo_url} className="h-16 max-w-[200px] w-auto object-contain" loading="eager" />
            </div>
            <Button onClick={handleContactClick} variant="default" aria-label="Contact financial advisor">
              Contact Me
            </Button>
          </div>
        </nav>
      </header>

      {/* Hero Section */}
      <main>
        <section className="relative pb-20">
        <div className="container mx-auto px-4 max-w-6xl">
          <div className="text-center mb-8 sm:mb-12 px-2">
            <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold text-slate-800 mb-4 sm:mb-6 leading-tight">
              What Can I Safely<br />
              <span className="text-primary">Spend in Retirement?</span>
            </h1>
            <p className="text-base sm:text-lg md:text-xl text-slate-600 max-w-3xl mx-auto mb-6 sm:mb-8 px-4">
              Plan your retirement spending with confidence. Our calculator shows you how much you can spend monthly without running out of money.
            </p>
          </div>

          {/* Calculator Section */}
          <div className="grid lg:grid-cols-2 gap-6 sm:gap-8 items-start px-2 sm:px-0">
            {/* Inputs */}
            <Card className="bg-white/95 backdrop-blur-lg border-0 shadow-xl ring-1 ring-slate-200/50">
              <CardHeader className="px-4 sm:px-6">
                <CardTitle className="text-xl sm:text-2xl text-slate-800">Your Financial Situation</CardTitle>
                <CardDescription className="text-sm sm:text-base text-slate-600">Enter your current savings and spending goal to see your retirement projection</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4 sm:space-y-6 px-4 sm:px-6">
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <Label htmlFor="savings" className="text-sm sm:text-base font-medium text-slate-700">Amount at Retirement</Label>
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
                    <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-500 text-sm sm:text-base">$</span>
                    <Input id="savings" type="text" value={formatNumber(currentSavings)} onChange={handleSavingsChange} className="pl-8 text-base sm:text-lg h-11 sm:h-12 border-slate-200 focus:border-primary focus:ring-primary" placeholder="500,000" aria-label="Total retirement savings amount" />
                  </div>
                </div>
                
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <Label htmlFor="spending" className="text-sm sm:text-base font-medium text-slate-700">Monthly Spending Goal</Label>
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
                    <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-500 text-sm sm:text-base">$</span>
                    <Input id="spending" type="text" value={formatNumber(monthlySpending)} onChange={handleSpendingChange} className="pl-8 text-base sm:text-lg h-11 sm:h-12 border-slate-200 focus:border-primary focus:ring-primary" placeholder="3,000" aria-label="Desired monthly spending in retirement" />
                  </div>
                </div>

                {/* Calculate Button */}
                <div className="pt-2 sm:pt-4">
                  <Button onClick={handleCalculate} className="w-full bg-primary hover:bg-primary/90 text-primary-foreground h-11 sm:h-12 text-base sm:text-lg font-semibold touch-manipulation" aria-label="Calculate retirement plan">
                    <Calculator className="w-4 h-4 sm:w-5 sm:h-5 mr-2" />
                    <span className="hidden sm:inline">{hasCalculated && needsCalculation ? 'Recalculate My Plan' : 'Calculate My Retirement Plan'}</span>
                    <span className="sm:hidden">{hasCalculated && needsCalculation ? 'Recalculate' : 'Calculate Plan'}</span>
                  </Button>
                  {needsCalculation && <p className="text-xs sm:text-sm text-amber-600 mt-2 text-center">
                      Values changed - click to recalculate results
                    </p>}
                </div>

                {/* Assumptions Section */}
                <div className="pt-3 sm:pt-4 border-t border-slate-200">
                  <div className="flex items-center mb-3">
                    <Info className="w-4 h-4 sm:w-5 sm:h-5 text-primary mr-2" />
                    <h2 className="text-base sm:text-lg font-semibold text-slate-800">Calculation Assumptions</h2>
                  </div>
                  <div className="grid grid-cols-1 gap-3">
                    <div className="flex justify-between items-center p-3 bg-primary/10 rounded-lg">
                      <span className="text-sm font-medium text-slate-700">Retirement Period</span>
                      <span className="text-sm font-bold text-primary">30 years</span>
                    </div>
                    <div className="flex justify-between items-center p-3 rounded-lg" style={{
                        backgroundColor: `hsl(var(--primary) / 0.1)`
                      }}>
                      <span className="text-sm font-medium text-slate-700">Annual Inflation</span>
                      <span className="text-sm font-bold" style={{
                          color: `hsl(var(--primary))`
                        }}>3%</span>
                    </div>
                    <div className="flex justify-between items-center p-3 bg-primary/10 rounded-lg">
                      <span className="text-sm font-medium text-slate-700">Annual Return</span>
                      <span className="text-sm font-bold text-primary">6%</span>
                    </div>
                  </div>
                </div>

                {/* How It Works Section */}
                <div className="pt-3 sm:pt-4 border-t border-slate-200">
                  <div className="flex items-center mb-3">
                    <Calculator className="w-4 h-4 sm:w-5 sm:h-5 text-primary mr-2" />
                    <h2 className="text-base sm:text-lg font-semibold text-slate-800">How It Works</h2>
                  </div>
                  <div className="space-y-2 sm:space-y-3 text-xs sm:text-sm text-slate-600">
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
              <CardHeader className="px-4 sm:px-6">
                <CardTitle className="text-xl sm:text-2xl text-slate-800">Retirement Spend-Down Projection</CardTitle>
                <CardDescription className="text-sm sm:text-base text-slate-600">The graph below shows how long your retirement savings will last.</CardDescription>
              </CardHeader>
              <CardContent className="p-4 sm:p-6">
                {hasCalculated && !needsCalculation ? <>
                    <div className="h-64 sm:h-80 -mx-2">
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
                          <Tooltip formatter={(value: number) => [`$${Math.round(value).toLocaleString()}`, 'Balance']} labelFormatter={year => `Year ${year}`} contentStyle={{
                            backgroundColor: 'white',
                            border: '1px solid #e2e8f0',
                            borderRadius: '12px',
                            boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1)',
                            fontSize: '14px',
                            fontWeight: '500'
                          }} cursor={{
                            stroke: 'hsl(var(--primary))',
                            strokeWidth: 1,
                            strokeDasharray: '4 4'
                          }} />
                          <Line type="monotone" dataKey="balance" stroke="hsl(var(--primary))" strokeWidth={3} dot={false} activeDot={{
                            r: 6,
                            fill: 'hsl(var(--primary))',
                            stroke: '#ffffff',
                            strokeWidth: 2
                          }} style={{
                            filter: 'drop-shadow(0 2px 4px hsl(var(--primary) / 0.2))'
                          }} />
                        </LineChart>
                      </ResponsiveContainer>
                    </div>
                    
                    {/* Results Section */}
                    <div className="mt-4 sm:mt-6 space-y-3 sm:space-y-4">
                      <div className={`p-3 sm:p-4 rounded-lg ${isMoneyLasting ? 'bg-primary/10 border border-primary/20' : 'bg-red-50 border border-red-200'}`}>
                        <h2 className={`font-semibold text-base sm:text-lg ${isMoneyLasting ? 'text-primary' : 'text-red-800'}`}>
                          {isMoneyLasting ? '✓ Money Lasts 30+ Years' : `⚠ Money Runs Out in ${yearsUntilEmpty} year${yearsUntilEmpty !== 1 ? 's' : ''}${monthsUntilEmpty > 0 ? ` and ${monthsUntilEmpty} month${monthsUntilEmpty > 1 ? 's' : ''}` : ''}`}
                        </h2>
                        <p className={`text-xs sm:text-sm mt-1 ${isMoneyLasting ? 'text-primary' : 'text-red-600'}`}>
                          {isMoneyLasting ? 'Your spending plan looks sustainable for a 30-year retirement.' : 'Consider reducing spending or saving more to extend your money.'}
                        </p>
                      </div>
                      
                      <div className="bg-primary/10 border border-primary/20 p-3 sm:p-4 rounded-lg">
                        <h2 className="font-semibold text-base sm:text-lg text-primary">Safe Monthly Spending</h2>
                        <p className="text-xl sm:text-2xl font-bold text-primary mt-1">${safeMonthlyAmount.toLocaleString()}</p>
                        <p className="text-xs sm:text-sm text-primary mt-1">Sustainable for 30 years with 3% annual increases</p>
                      </div>
                      
                      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                        <DialogTrigger asChild>
                          <Button variant="outline" className="w-full border-primary/20 text-primary hover:bg-primary/10 h-10 sm:h-11 text-sm sm:text-base touch-manipulation" aria-label="Export retirement results as PDF">
                            <Download className="w-4 h-4 mr-2" />
                            <span className="hidden sm:inline">Export Results as PDF</span>
                            <span className="sm:hidden">Export PDF</span>
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
                              <Input id="firstName" value={firstName} onChange={e => setFirstName(e.target.value)} placeholder="Enter your first name" className="border-slate-200 focus:border-primary focus:ring-primary" />
                            </div>
                            <div className="space-y-2">
                              <Label htmlFor="email" className="text-slate-700">Email Address</Label>
                              <Input id="email" type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="Enter your email" className="border-slate-200 focus:border-primary focus:ring-primary" />
                            </div>
                            <Button onClick={handleExportPDF} disabled={!firstName || !email} className="w-full bg-primary hover:bg-primary/90 text-primary-foreground">
                              <Download className="w-4 h-4 mr-2" />
                              Generate PDF
                            </Button>
                          </div>
                        </DialogContent>
                      </Dialog>
                    </div>
                  </> : <div className="h-64 sm:h-80 flex items-center justify-center px-4">
                    <div className="text-center text-slate-500">
                      <Calculator className="w-12 h-12 sm:w-16 sm:h-16 mx-auto mb-3 sm:mb-4 opacity-50" />
                      <h2 className="text-lg sm:text-xl font-semibold mb-2">
                        {needsCalculation ? 'Values Changed' : 'Ready to Calculate?'}
                      </h2>
                      <p className="text-sm sm:text-base">
                        {needsCalculation ? 'Click "Recalculate" to see updated results' : 'Click "Calculate My Retirement Plan" to see your personalized projection'}
                      </p>
                    </div>
                  </div>}
              </CardContent>
            </Card>
          </div>

          {/* Podcast and CTA Section */}
          {advisorInfo.show_podcast ?
            // WHEN PODCAST IS SHOWING - Two column layout on desktop
            <div className="grid lg:grid-cols-2 gap-6 sm:gap-8 mt-8 sm:mt-12 px-2 sm:px-0">
              {/* Podcast Section */}
              <Card className="bg-gradient-to-br from-slate-700 via-emerald-700 to-teal-700 text-white border-0 shadow-2xl">
                <CardContent className="p-6 sm:p-8">
                  <Headphones className="w-10 h-10 sm:w-12 sm:h-12 mb-3 sm:mb-4 opacity-90" aria-hidden="true" />
                  <h2 className="text-xl sm:text-2xl font-bold mb-3 sm:mb-4">Retirement Spending Podcast</h2>
                  <p className="text-white/90 mb-4 sm:mb-6 text-sm sm:text-base">Discover how much you can safely spend in retirement by understanding this online calculator. We'll unpack why this tool is just a starting point, emphasizing the need for a personalized plan to build the retirement you envision.</p>
                  <Button size="lg" className="bg-white text-emerald-700 hover:bg-emerald-50 w-full sm:w-auto h-11 sm:h-12 touch-manipulation" onClick={handleListenNow} aria-label="Listen to retirement podcast">
                    <Headphones className="mr-2 h-4 w-4 sm:h-5 sm:w-5" aria-hidden="true" />
                    Listen Now
                  </Button>
                </CardContent>
              </Card>

              {/* CTA Section (Find a Time) */}
              <Card className="bg-gradient-to-br from-slate-700 via-emerald-700 to-teal-700 text-white border-0 shadow-2xl">
                <CardContent className="p-6 sm:p-8">
                  <PiggyBank className="w-10 h-10 sm:w-12 sm:h-12 mb-3 sm:mb-4 opacity-90" aria-hidden="true" />
                  <h2 className="text-xl sm:text-2xl font-bold mb-3 sm:mb-4">Ready to Create Your Retirement Plan?</h2>
                  <p className="text-white/90 mb-4 sm:mb-6 text-sm sm:text-base">Schedule a meeting with a financial professional to create a personalized retirement strategy.</p>
                  <Button size="lg" className="bg-white text-primary hover:bg-white/90 w-full sm:w-auto h-11 sm:h-12 touch-manipulation" onClick={handleContactClick} aria-label="Schedule appointment with financial advisor">
                    Find a Time
                    <ExternalLink className="w-4 h-4 ml-2" aria-hidden="true" />
                  </Button>
                </CardContent>
              </Card>
            </div> :
            // WHEN PODCAST IS HIDDEN - Centered single card layout
            <div className="text-center mt-8 sm:mt-12 px-2 sm:px-0">
              <Card className="bg-gradient-to-br from-slate-700 via-emerald-700 to-teal-700 text-white border-0 shadow-2xl max-w-2xl mx-auto">
                <CardContent className="p-6 sm:p-8">
                  <PiggyBank className="w-10 h-10 sm:w-12 sm:h-12 mx-auto mb-3 sm:mb-4 opacity-90" aria-hidden="true" />
                  <h2 className="text-xl sm:text-2xl font-bold mb-3 sm:mb-4">Ready to Optimize Your Financial Strategy?</h2>
                  <p className="text-white/90 mb-4 sm:mb-6 text-sm sm:text-base">
                    Make informed decisions about retirement, life insurance, debt, and college savings today. A
                    financial representative can help you create a comprehensive strategy that balances debt management
                    with long-term financial security and wealth building.
                  </p>
                  <Button size="lg" className="bg-white text-primary hover:bg-white/90 w-full sm:w-auto h-11 sm:h-12 touch-manipulation" onClick={handleContactClick} aria-label="Schedule consultation with financial advisor">
                    Find a Time
                    <ExternalLink className="w-4 h-4 ml-2" aria-hidden="true" />
                  </Button>
                </CardContent>
              </Card>
            </div>}
        </div>
        </section>
      </main>

      {/* Learn More and Related Topics Section */}
      <section className="relative py-12 sm:py-16 bg-gradient-to-br from-slate-200 via-primary/5 to-secondary/5 backdrop-blur-sm" aria-label="Educational Resources">
        <div className="container mx-auto px-4 max-w-6xl">
          <div className="grid lg:grid-cols-2 gap-8 sm:gap-12">
            {/* Learn More Section - Left Side */}
            <div>
              <div className="text-center mb-6 sm:mb-8">
                <BookOpen className="w-10 h-10 sm:w-12 sm:h-12 mx-auto text-primary mb-3 sm:mb-4" aria-hidden="true" />
                <h2 className="text-2xl sm:text-3xl font-bold text-slate-800 mb-3 sm:mb-4">Learn More About Retirement</h2>
                <p className="text-base sm:text-lg text-slate-600 px-4">
                  Deepen your understanding with our comprehensive retirement planning resources.
                </p>
              </div>
              
              <div className="space-y-4">
                <Card className="hover:shadow-lg transition-all duration-300 bg-white/90 backdrop-blur-sm border-0 ring-1 ring-slate-200/50 hover:ring-primary/30 h-40">
                  <CardContent className="p-4 h-full flex flex-col justify-between">
                    <div className="flex items-start space-x-3">
                      <TrendingDown className="w-6 h-6 text-primary mt-1 flex-shrink-0" />
                      <div className="flex-1">
                        <h3 className="font-semibold text-base mb-2 text-slate-800">The Need for Retirement Planning</h3>
                        <p className="text-slate-600 text-sm mb-3">Discover why early retirement planning is essential for long-term financial security.</p>
                      </div>
                    </div>
                    <Button variant="outline" size="sm" className="border-primary/20 text-primary hover:bg-primary/10 self-start w-28" onClick={() => handleEducationalClick('The Need for Retirement Planning', 'read-report-1')}>
                      Read Report
                    </Button>
                  </CardContent>
                </Card>
                
                <Card className="hover:shadow-lg transition-all duration-300 bg-white/90 backdrop-blur-sm border-0 ring-1 ring-slate-200/50 hover:ring-primary/30 h-40">
                  <CardContent className="p-4 h-full flex flex-col justify-between">
                    <div className="flex items-start space-x-3">
                      <Calculator className="w-6 h-6 text-primary mt-1 flex-shrink-0" />
                      <div className="flex-1">
                        <h3 className="font-semibold text-base mb-2 text-slate-800">IRA's Compared</h3>
                        <p className="text-slate-600 text-sm mb-3">Compare Traditional and Roth IRA options to choose the best retirement savings strategy.</p>
                      </div>
                    </div>
                    <Button variant="outline" size="sm" className="border-primary/20 text-primary hover:bg-primary/10 self-start w-28" onClick={() => handleEducationalClick('How a Roth IRA Works', 'read-report-2')}>
                      Read Report
                    </Button>
                  </CardContent>
                </Card>
                
                <Card className="hover:shadow-lg transition-all duration-300 bg-white/90 backdrop-blur-sm border-0 ring-1 ring-slate-200/50 hover:ring-primary/30 h-40">
                  <CardContent className="p-4 h-full flex flex-col justify-between">
                    <div className="flex items-start space-x-3">
                      <PiggyBank className="w-6 h-6 text-primary mt-1 flex-shrink-0" />
                      <div className="flex-1">
                        <h3 className="font-semibold text-base mb-2 text-slate-800">An Overview of Social Security Benefits</h3>
                        <p className="text-slate-600 text-sm mb-3">Discover how Social Security works and strategies to maximize your benefits.</p>
                      </div>
                    </div>
                    <Button variant="outline" size="sm" className="border-primary/20 text-primary hover:bg-primary/10 self-start w-28" onClick={() => handleEducationalClick('Social Security Retirement Claiming Strategies for Married Couples', 'read-report-3')}>
                      Read Report
                    </Button>
                  </CardContent>
                </Card>
              </div>
            </div>

            {/* Related Topics Section - Right Side */}
            <div>
              <div className="text-center mb-6 sm:mb-8">
                <FileText className="w-10 h-10 sm:w-12 sm:h-12 mx-auto text-primary mb-3 sm:mb-4" aria-hidden="true" />
                <h2 className="text-2xl sm:text-3xl font-bold text-slate-800 mb-3 sm:mb-4">Related Financial Topics</h2>
                <p className="text-base sm:text-lg text-slate-600 px-4">
                  Explore other important areas of financial planning to secure your future.
                </p>
              </div>
              
              <div className="space-y-4">
                <Card className="hover:shadow-lg transition-all duration-300 bg-white/90 backdrop-blur-sm border-0 ring-1 ring-slate-200/50 hover:ring-primary/30 h-40">
                  <CardContent className="p-4 h-full flex flex-col justify-between">
                    <div className="flex items-start space-x-3">
                      <div style={{
                        color: `hsl(var(--primary))`
                      }}>
                        <TrendingDown className="w-6 h-6 mt-1 flex-shrink-0" />
                      </div>
                      <div className="flex-1">
                        <h3 className="font-semibold text-base mb-2 text-slate-800">Choose the Financial Planning Team</h3>
                        <p className="text-slate-600 text-sm mb-3">Selecting the right professionals to help guide your financial journey.</p>
                      </div>
                    </div>
                    <Button variant="outline" size="sm" className="self-start w-28" style={{
                      borderColor: `hsl(var(--primary) / 0.2)`,
                      color: `hsl(var(--primary))`
                    }} onMouseEnter={e => e.currentTarget.style.backgroundColor = `hsl(var(--primary) / 0.1)`} onMouseLeave={e => e.currentTarget.style.backgroundColor = 'transparent'} onClick={() => handleEducationalClick('Managing Your Debt', 'read-report-4')}>
                      Read Report
                    </Button>
                  </CardContent>
                </Card>
                
                <Card className="hover:shadow-lg transition-all duration-300 bg-white/90 backdrop-blur-sm border-0 ring-1 ring-slate-200/50 hover:ring-primary/30 h-40">
                  <CardContent className="p-4 h-full flex flex-col justify-between">
                    <div className="flex items-start space-x-3">
                      <div style={{
                        color: `hsl(var(--primary))`
                      }}>
                        <Shield className="w-6 h-6 mt-1 flex-shrink-0" />
                      </div>
                      <div className="flex-1">
                        <h3 className="font-semibold text-base mb-2 text-slate-800">The Need for Responsible Planning</h3>
                        <p className="text-slate-600 text-sm mb-3">Protect your family's financial future with the right life insurance coverage.</p>
                      </div>
                    </div>
                    <Button variant="outline" size="sm" className="self-start w-28" style={{
                      borderColor: `hsl(var(--primary) / 0.2)`,
                      color: `hsl(var(--primary))`
                    }} onMouseEnter={e => e.currentTarget.style.backgroundColor = `hsl(var(--primary) / 0.1)`} onMouseLeave={e => e.currentTarget.style.backgroundColor = 'transparent'} onClick={() => handleEducationalClick('How Individual Disability Income Insurance Works', 'read-report-5')}>
                      Read Report
                    </Button>
                  </CardContent>
                </Card>
                
                <Card className="hover:shadow-lg transition-all duration-300 bg-white/90 backdrop-blur-sm border-0 ring-1 ring-slate-200/50 hover:ring-primary/30 h-40">
                  <CardContent className="p-4 h-full flex flex-col justify-between">
                    <div className="flex items-start space-x-3">
                      <div style={{
                        color: `hsl(var(--primary))`
                      }}>
                        <Users className="w-6 h-6 mt-1 flex-shrink-0" />
                      </div>
                      <div className="flex-1">
                        <h3 className="font-semibold text-base mb-2 text-slate-800">Basic Investment Tools</h3>
                        <p className="text-slate-600 text-sm mb-3">Understanding fundamental investment options to build your portfolio.</p>
                      </div>
                    </div>
                    <Button variant="outline" size="sm" className="self-start w-28" style={{
                      borderColor: `hsl(var(--primary) / 0.2)`,
                      color: `hsl(var(--primary))`
                    }} onMouseEnter={e => e.currentTarget.style.backgroundColor = `hsl(var(--primary) / 0.1)`} onMouseLeave={e => e.currentTarget.style.backgroundColor = 'transparent'} onClick={() => handleEducationalClick('General Purposes of Life Insurance', 'read-report-6')}>
                      Read Report
                    </Button>
                  </CardContent>
                </Card>
              </div>
            </div>
          </div>
        </div>
      </section>


      {/* Contact Me Section */}
      <section id="contact-section" className="relative py-12 sm:py-16 bg-gradient-to-br from-primary/5 via-secondary/5 to-primary/5 backdrop-blur-sm" aria-label="Contact Information">
        <div className="container mx-auto px-4 max-w-4xl">
          <div className="text-center mb-8 sm:mb-12">
            <h2 className="text-2xl sm:text-3xl font-bold text-slate-800 mb-3 sm:mb-4">Contact Your Financial Professional</h2>
            <p className="text-base sm:text-lg text-slate-600 px-4">Ready to discuss your retirement planning? Get in touch today.</p>
          </div>
          
          <Card className="bg-white/95 backdrop-blur-lg border-0 shadow-xl ring-1 ring-slate-200/50">
            <CardContent className="p-6 sm:p-8">
              <div className="grid md:grid-cols-2 gap-6 sm:gap-8 items-center">
                {/* Contact Information */}
                <div className="space-y-4 sm:space-y-6 order-2 md:order-1">
                  {advisorInfo.phone && (
                    <div className="flex items-center space-x-3 sm:space-x-4">
                      <div className="w-10 h-10 sm:w-12 sm:h-12 bg-primary/10 rounded-lg flex items-center justify-center flex-shrink-0">
                        <Phone className="w-5 h-5 sm:w-6 sm:h-6 text-primary" aria-hidden="true" />
                      </div>
                      <div>
                        <h3 className="font-semibold text-sm sm:text-base text-slate-800">Phone</h3>
                        <a href={`tel:${advisorInfo.phone}`} className="text-sm sm:text-base text-slate-600 hover:text-primary transition-colors">{advisorInfo.phone}</a>
                      </div>
                    </div>
                  )}
                  
                  {advisorInfo.email && (
                    <div className="flex items-center space-x-3 sm:space-x-4">
                      <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-lg flex items-center justify-center flex-shrink-0" style={{
                        backgroundColor: `hsl(var(--primary) / 0.1)`
                      }}>
                        <Mail className="w-5 h-5 sm:w-6 sm:h-6" style={{
                          color: `hsl(var(--primary))`
                        }} aria-hidden="true" />
                      </div>
                      <div className="min-w-0">
                        <h3 className="font-semibold text-sm sm:text-base text-slate-800">Email</h3>
                        <a href={`mailto:${advisorInfo.email}`} className="text-sm sm:text-base text-slate-600 hover:text-primary transition-colors break-all">{advisorInfo.email}</a>
                      </div>
                    </div>
                  )}
                  
                  {advisorInfo.address && (
                    <div className="flex items-start space-x-3 sm:space-x-4">
                      <div className="w-10 h-10 sm:w-12 sm:h-12 bg-primary/10 rounded-lg flex items-center justify-center flex-shrink-0">
                        <MapPin className="w-5 h-5 sm:w-6 sm:h-6 text-primary" aria-hidden="true" />
                      </div>
                      <div>
                        <h3 className="font-semibold text-sm sm:text-base text-slate-800">Office</h3>
                        <address className="text-sm sm:text-base text-slate-600 whitespace-pre-line not-italic">{advisorInfo.address}</address>
                      </div>
                    </div>
                  )}
                  
                  {!advisorInfo.phone && !advisorInfo.email && !advisorInfo.address && (
                    <div className="text-center py-8">
                      <p className="text-slate-600 text-sm sm:text-base">
                        Contact information coming soon.
                      </p>
                    </div>
                  )}
                </div>
                
                {/* Advisor Photo */}
                <div className="text-center order-1 md:order-2">
                  {advisorInfo.photoUrl ? <img src={advisorInfo.photoUrl} alt={`${advisorInfo.name}, ${advisorInfo.title} - Professional headshot`} className="w-32 h-32 sm:w-40 sm:h-40 md:w-48 md:h-48 mx-auto rounded-full object-cover mb-3 sm:mb-4" loading="lazy" /> : <div className="w-32 h-32 sm:w-40 sm:h-40 md:w-48 md:h-48 mx-auto bg-gradient-to-br from-primary/20 to-secondary/30 rounded-full flex items-center justify-center mb-3 sm:mb-4">
                      <Users className="w-16 h-16 sm:w-20 sm:h-20 md:w-24 md:h-24 text-primary opacity-60" aria-hidden="true" />
                    </div>}
                  <h3 className="text-lg sm:text-xl font-bold text-slate-800 mb-1 sm:mb-2">{advisorInfo.name}</h3>
                  <p className="text-sm sm:text-base text-slate-600">{advisorInfo.title}</p>
                  <p className="text-xs sm:text-sm text-slate-500 mt-1 sm:mt-2 px-4">{advisorInfo.bio}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* Disclaimer */}
      <footer className="relative py-8 sm:py-12 bg-gradient-to-t from-slate-100/90 to-white/60 backdrop-blur-sm" role="contentinfo">
        <div className="container mx-auto px-4 sm:px-6 max-w-4xl">
          <div className="text-center">
            <h2 className="text-base sm:text-lg font-semibold text-slate-800 mb-3 sm:mb-4">Important Disclaimer</h2>
            <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
              {advisorInfo.disclaimer_text}
            </p>
          </div>
        </div>
      </footer>

      {/* Audio Player Component with tracking */}
      <AudioPlayer audioRef={audioPlayer.audioRef} isPlaying={audioPlayer.isPlaying} duration={audioPlayer.duration} currentTime={audioPlayer.currentTime} volume={audioPlayer.volume} isVisible={audioPlayer.isVisible} isMinimized={audioPlayer.isMinimized} isLoading={audioPlayer.isLoading} error={audioPlayer.error} onTogglePlay={audioPlayer.togglePlay} onSeek={audioPlayer.seek} onVolumeChange={audioPlayer.changeVolume} onClose={audioPlayer.closePlayer} onToggleMinimize={audioPlayer.toggleMinimize} onRetryLoad={audioPlayer.retryLoad} />
    </div>
  </TooltipProvider>;
};
export default Index;