import { useState, useMemo } from "react";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Calculator, TrendingDown, Users, BookOpen, Headphones, ExternalLink, Download, FileText, Shield, PiggyBank, Info, Lightbulb, Phone, Mail, MapPin } from "lucide-react";
import jsPDF from 'jspdf';

const Index = () => {
  const [currentSavings, setCurrentSavings] = useState(500000);
  const [monthlySpending, setMonthlySpending] = useState(3000);
  const [firstName, setFirstName] = useState("");
  const [email, setEmail] = useState("");
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  // Calculate retirement projections
  const projectionData = useMemo(() => {
    const data = [];
    let balance = currentSavings;
    const annualSpending = monthlySpending * 12;
    const inflationRate = 0.03;
    const returnRate = 0.06;
    for (let year = 0; year <= 30; year++) {
      const adjustedSpending = annualSpending * Math.pow(1 + inflationRate, year);
      if (year > 0) {
        balance = balance * (1 + returnRate) - adjustedSpending;
      }
      data.push({
        year,
        balance: Math.max(0, balance),
        spending: adjustedSpending
      });
      if (balance <= 0) break;
    }
    return data;
  }, [currentSavings, monthlySpending]);

  // Calculate safe withdrawal amount using proper present value formula
  const safeMonthlyAmount = useMemo(() => {
    // Formula for withdrawals that increase by inflation rate over 30 years
    // This calculates the initial withdrawal amount that can be sustained
    const returnRate = 0.06;
    const inflationRate = 0.03;
    const years = 30;
    const realReturnRate = (1 + returnRate) / (1 + inflationRate) - 1;

    // Present value of annuity with inflation adjustments
    const presentValueFactor = (1 - Math.pow(1 + realReturnRate, -years)) / realReturnRate;
    const safeAnnualAmount = currentSavings / presentValueFactor;
    return Math.round(safeAnnualAmount / 12);
  }, [currentSavings]);
  const yearsUntilEmpty = projectionData[projectionData.length - 1]?.year || 30;
  const isMoneyLasting = yearsUntilEmpty >= 30;
  const handleExportPDF = () => {
    if (firstName && email) {
      const pdf = new jsPDF();
      const pageWidth = pdf.internal.pageSize.getWidth();
      const pageHeight = pdf.internal.pageSize.getHeight();
      
      // Header
      pdf.setFontSize(24);
      pdf.setTextColor(5, 150, 105); // emerald-600
      pdf.text('Retirement Spending Analysis', pageWidth / 2, 30, { align: 'center' });
      
      // Client info
      pdf.setFontSize(12);
      pdf.setTextColor(0, 0, 0);
      pdf.text(`Prepared for: ${firstName}`, 20, 50);
      pdf.text(`Email: ${email}`, 20, 60);
      pdf.text(`Date: ${new Date().toLocaleDateString()}`, 20, 70);
      
      // Inputs section
      pdf.setFontSize(16);
      pdf.setTextColor(15, 118, 110); // teal-600
      pdf.text('Your Financial Situation', 20, 90);
      
      pdf.setFontSize(12);
      pdf.setTextColor(0, 0, 0);
      pdf.text(`Current Amount Saved: $${currentSavings.toLocaleString()}`, 20, 105);
      pdf.text(`Monthly Spending Goal: $${monthlySpending.toLocaleString()}`, 20, 115);
      
      // Assumptions
      pdf.text('Calculation Assumptions:', 20, 135);
      pdf.text('• Retirement Period: 30 years', 25, 145);
      pdf.text('• Annual Inflation: 3%', 25, 155);
      pdf.text('• Annual Return: 6%', 25, 165);
      
      // Results section
      pdf.setFontSize(16);
      pdf.setTextColor(15, 118, 110);
      pdf.text('Analysis Results', 20, 185);
      
      pdf.setFontSize(12);
      pdf.setTextColor(0, 0, 0);
      pdf.text(`Safe Monthly Spending: $${safeMonthlyAmount.toLocaleString()}`, 20, 200);
      pdf.text(`Money Duration: ${isMoneyLasting ? '30+ years' : `${yearsUntilEmpty} years`}`, 20, 210);
      
      const statusText = isMoneyLasting 
        ? 'Your spending plan looks sustainable for a 30-year retirement.'
        : 'Consider reducing spending or saving more to extend your money.';
      pdf.text(`Status: ${statusText}`, 20, 220);
      
      // How it works
      pdf.setFontSize(14);
      pdf.setTextColor(15, 118, 110);
      pdf.text('How This Calculation Works', 20, 245);
      
      pdf.setFontSize(10);
      pdf.setTextColor(0, 0, 0);
      pdf.text('• We calculate how your savings will change over 30 years of retirement', 20, 255);
      pdf.text('• Your spending increases each year with inflation (3% annually)', 20, 265);
      pdf.text('• Your remaining savings earn a 6% annual return', 20, 275);
      pdf.text('• The "safe" amount ensures your money lasts the full 30 years', 20, 285);
      
      // Start new page for advisor info
      pdf.addPage();
      
      // Advisor contact section
      pdf.setFontSize(16);
      pdf.setTextColor(15, 118, 110);
      pdf.text('Your Financial Advisor', 20, 30);
      
      pdf.setFontSize(14);
      pdf.setTextColor(0, 0, 0);
      pdf.text('Sarah Johnson, CFP®', 20, 50);
      pdf.text('Certified Financial Planner', 20, 60);
      pdf.text('15+ years experience helping clients achieve their retirement goals', 20, 70);
      
      pdf.setFontSize(12);
      pdf.text('Contact Information:', 20, 90);
      pdf.text('Phone: (555) 123-4567', 25, 105);
      pdf.text('Email: advisor@financialplanning.com', 25, 115);
      pdf.text('Office: 123 Financial Street, Suite 456', 25, 125);
      pdf.text('        Financial City, FC 12345', 25, 135);
      
      // Disclaimer footer
      const disclaimerY = pageHeight - 50;
      pdf.setFontSize(8);
      pdf.setTextColor(100, 100, 100);
      pdf.text('Important Disclaimer', 20, disclaimerY);
      
      const disclaimerText = 'This calculator is provided for educational and informational purposes only and should not be considered personalized investment advice. The calculations are based on simplified assumptions and may not reflect your actual financial situation. Market returns, inflation rates, and personal circumstances can vary significantly. Past performance does not guarantee future results. Please consult with a qualified financial advisor before making any investment or retirement planning decisions. All investments carry risk, including the potential loss of principal.';
      
      const lines = pdf.splitTextToSize(disclaimerText, pageWidth - 40);
      pdf.text(lines, 20, disclaimerY + 10);
      
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
  return <div className="min-h-screen relative overflow-hidden bg-slate-50">
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
              Plan your retirement spending with confidence. Our calculator shows you exactly how much you can spend monthly without running out of money.
            </p>
          </div>

          {/* Calculator Section */}
          <div className="grid lg:grid-cols-2 gap-8 items-start">
            {/* Inputs */}
            <Card className="bg-white/95 backdrop-blur-lg border-0 shadow-xl ring-1 ring-slate-200/50">
              <CardHeader>
                <CardTitle className="text-2xl text-slate-800">Your Financial Situation</CardTitle>
                <CardDescription className="text-slate-600">Enter your current savings and spending to see your retirement projection</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-2">
                  <Label htmlFor="savings" className="text-base font-medium text-slate-700">Current Amount Saved</Label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-500">$</span>
                    <Input id="savings" type="number" value={currentSavings} onChange={e => setCurrentSavings(Number(e.target.value))} className="pl-8 text-lg h-12 border-slate-200 focus:border-emerald-500 focus:ring-emerald-500" placeholder="500,000" />
                  </div>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="spending" className="text-base font-medium text-slate-700">Monthly Spending Goal</Label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-500">$</span>
                    <Input id="spending" type="number" value={monthlySpending} onChange={e => setMonthlySpending(Number(e.target.value))} className="pl-8 text-lg h-12 border-slate-200 focus:border-emerald-500 focus:ring-emerald-500" placeholder="3,000" />
                  </div>
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
                    <p>• The "safe" amount ensures your money lasts the full 30 years</p>
                  </div>
                </div>

                {/* Planning Tips Section */}
                
              </CardContent>
            </Card>

            {/* Graph and Results */}
            <Card className="bg-white/95 backdrop-blur-lg border-0 shadow-xl ring-1 ring-slate-200/50">
              <CardHeader>
                <CardTitle className="text-2xl text-slate-800">Retirement Spend-Down Projection</CardTitle>
                <CardDescription className="text-slate-600">How your savings will change over 30 years</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-80">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={projectionData} margin={{
                    top: 20,
                    right: 20,
                    left: 40,
                    bottom: 60
                  }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" strokeOpacity={0.6} />
                      <XAxis dataKey="year" stroke="#64748b" fontSize={12} fontWeight={500} tickMargin={10} axisLine={{
                      stroke: '#cbd5e1',
                      strokeWidth: 1
                    }} tickLine={{
                      stroke: '#cbd5e1'
                    }} label={{
                      value: 'Years in Retirement',
                      position: 'insideBottom',
                      offset: -5,
                      style: {
                        textAnchor: 'middle',
                        fontSize: '12px',
                        fontWeight: '500',
                        fill: '#64748b'
                      }
                    }} />
                      <YAxis stroke="#64748b" fontSize={12} fontWeight={500} tickMargin={10} axisLine={{
                      stroke: '#cbd5e1',
                      strokeWidth: 1
                    }} tickLine={{
                      stroke: '#cbd5e1'
                    }} tickFormatter={value => `$${(value / 1000).toFixed(0)}k`} label={{
                      value: 'Remaining Balance',
                      angle: -90,
                      position: 'insideLeft',
                      style: {
                        textAnchor: 'middle',
                        fontSize: '12px',
                        fontWeight: '500',
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
                      {isMoneyLasting ? '✓ Money Lasts 30+ Years' : `⚠ Money Runs Out in ${yearsUntilEmpty} Years`}
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
                <Button size="lg" variant="secondary" className="bg-white text-emerald-600 hover:bg-emerald-50">
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
                    <Button variant="outline" size="sm" className="border-emerald-200 text-emerald-700 hover:bg-emerald-50 self-start w-28">
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
                    <Button variant="outline" size="sm" className="border-emerald-200 text-emerald-700 hover:bg-emerald-50 self-start w-28">
                      Read Report
                    </Button>
                  </CardContent>
                </Card>
                
                <Card className="hover:shadow-lg transition-all duration-300 bg-white/90 backdrop-blur-sm border-0 ring-1 ring-slate-200/50 hover:ring-emerald-300/50 h-40">
                  <CardContent className="p-4 h-full flex flex-col justify-between">
                    <div className="flex items-start space-x-3">
                      <PiggyBank className="w-6 h-6 text-emerald-600 mt-1 flex-shrink-0" />
                      <div className="flex-1">
                        <h3 className="font-semibold text-base mb-2 text-slate-800">Social Security Claiming Strategies</h3>
                        <p className="text-slate-600 text-sm mb-3 line-clamp-1">Outlines various strategies for claiming Social Security benefits to maximize lifetime income.</p>
                      </div>
                    </div>
                    <Button variant="outline" size="sm" className="border-emerald-200 text-emerald-700 hover:bg-emerald-50 self-start w-28">
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
                    <Button variant="outline" size="sm" className="border-teal-200 text-teal-700 hover:bg-teal-50 self-start w-28">
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
                    <Button variant="outline" size="sm" className="border-teal-200 text-teal-700 hover:bg-teal-50 self-start w-28">
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
                    <Button variant="outline" size="sm" className="border-teal-200 text-teal-700 hover:bg-teal-50 self-start w-28">
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
                <Button size="lg" variant="secondary" className="bg-white text-slate-700 hover:bg-slate-50" onClick={() => window.open('/retirement-podcast.mp4', '_blank')}>
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
            <h2 className="text-3xl font-bold text-slate-800 mb-4">Contact Your Financial Advisor</h2>
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
              This calculator is provided for educational and informational purposes only and should not be considered personalized investment advice. 
              The calculations are based on simplified assumptions and may not reflect your actual financial situation. Market returns, inflation rates, 
              and personal circumstances can vary significantly. Past performance does not guarantee future results. Please consult with a qualified 
              financial advisor before making any investment or retirement planning decisions. All investments carry risk, including the potential loss of principal.
            </p>
          </div>
        </div>
      </section>
    </div>;
};
export default Index;
