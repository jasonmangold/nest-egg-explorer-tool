
import { useState, useMemo } from "react";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Calculator, TrendingDown, Users, BookOpen, Headphones, ExternalLink } from "lucide-react";

const Index = () => {
  const [currentSavings, setCurrentSavings] = useState(500000);
  const [monthlySpending, setMonthlySpending] = useState(3000);

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

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50">
      {/* Header with Logo */}
      <header className="pt-6 pb-4">
        <div className="container mx-auto px-4 max-w-6xl">
          <div className="flex items-center">
            <div className="w-12 h-12 bg-blue-600 rounded-lg flex items-center justify-center">
              <Calculator className="w-6 h-6 text-white" />
            </div>
            <span className="ml-3 text-xl font-bold text-gray-900">RetireCalc</span>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="pb-20">
        <div className="container mx-auto px-4 max-w-6xl">
          <div className="text-center mb-12">
            <div className="inline-flex items-center gap-2 bg-blue-100 text-blue-800 px-4 py-2 rounded-full text-sm font-medium mb-6">
              <Calculator className="w-4 h-4" />
              Retirement Planning Calculator
            </div>
            <h1 className="text-4xl md:text-6xl font-bold text-gray-900 mb-6 leading-tight">
              What Can I Safely<br />
              <span className="text-blue-600">Spend in Retirement?</span>
            </h1>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto mb-8">
              Plan your retirement spending with confidence. Our calculator shows you exactly how much you can spend monthly without running out of money.
            </p>
          </div>

          {/* Calculator Section */}
          <div className="grid lg:grid-cols-2 gap-8 items-start">
            {/* Inputs */}
            <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-xl">
              <CardHeader>
                <CardTitle className="text-2xl text-gray-900">Your Financial Situation</CardTitle>
                <CardDescription>Enter your current savings and spending to see your retirement projection</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-2">
                  <Label htmlFor="savings" className="text-base font-medium">Current Amount Saved</Label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500">$</span>
                    <Input
                      id="savings"
                      type="number"
                      value={currentSavings}
                      onChange={(e) => setCurrentSavings(Number(e.target.value))}
                      className="pl-8 text-lg h-12"
                      placeholder="500,000"
                    />
                  </div>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="spending" className="text-base font-medium">Monthly Spending Goal</Label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500">$</span>
                    <Input
                      id="spending"
                      type="number"
                      value={monthlySpending}
                      onChange={(e) => setMonthlySpending(Number(e.target.value))}
                      className="pl-8 text-lg h-12"
                      placeholder="3,000"
                    />
                  </div>
                </div>

                {/* Results */}
                <div className="pt-4 border-t">
                  <div className="space-y-4">
                    <div className={`p-4 rounded-lg ${isMoneyLasting ? 'bg-green-50 border border-green-200' : 'bg-red-50 border border-red-200'}`}>
                      <h3 className={`font-semibold text-lg ${isMoneyLasting ? 'text-green-800' : 'text-red-800'}`}>
                        {isMoneyLasting ? '✓ Money Lasts 30+ Years' : `⚠ Money Runs Out in ${yearsUntilEmpty} Years`}
                      </h3>
                      <p className={`text-sm ${isMoneyLasting ? 'text-green-600' : 'text-red-600'}`}>
                        {isMoneyLasting 
                          ? 'Your spending plan looks sustainable for a 30-year retirement.'
                          : 'Consider reducing spending or saving more to extend your money.'}
                      </p>
                    </div>
                    
                    <div className="bg-blue-50 border border-blue-200 p-4 rounded-lg">
                      <h3 className="font-semibold text-lg text-blue-800">Safe Monthly Spending</h3>
                      <p className="text-2xl font-bold text-blue-600">${safeMonthlyAmount.toLocaleString()}</p>
                      <p className="text-sm text-blue-600">Sustainable for 30 years with 3% annual increases</p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Graph */}
            <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-xl">
              <CardHeader>
                <CardTitle className="text-2xl text-gray-900">Retirement Spend-Down Projection</CardTitle>
                <CardDescription>How your savings will change over 30 years</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-80">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart 
                      data={projectionData}
                      margin={{ top: 20, right: 20, left: 40, bottom: 60 }}
                    >
                      <CartesianGrid 
                        strokeDasharray="3 3" 
                        stroke="#e2e8f0" 
                        strokeOpacity={0.6}
                      />
                      <XAxis 
                        dataKey="year" 
                        stroke="#64748b"
                        fontSize={12}
                        fontWeight={500}
                        tickMargin={10}
                        axisLine={{ stroke: '#cbd5e1', strokeWidth: 1 }}
                        tickLine={{ stroke: '#cbd5e1' }}
                        label={{ 
                          value: 'Years in Retirement', 
                          position: 'insideBottom', 
                          offset: -5,
                          style: { textAnchor: 'middle', fontSize: '12px', fontWeight: '500', fill: '#64748b' }
                        }}
                      />
                      <YAxis 
                        stroke="#64748b"
                        fontSize={12}
                        fontWeight={500}
                        tickMargin={10}
                        axisLine={{ stroke: '#cbd5e1', strokeWidth: 1 }}
                        tickLine={{ stroke: '#cbd5e1' }}
                        tickFormatter={(value) => `$${(value / 1000).toFixed(0)}k`}
                        label={{ 
                          value: 'Remaining Balance', 
                          angle: -90, 
                          position: 'insideLeft',
                          style: { textAnchor: 'middle', fontSize: '12px', fontWeight: '500', fill: '#64748b' }
                        }}
                      />
                      <Tooltip 
                        formatter={(value: number) => [`$${value.toLocaleString()}`, 'Balance']}
                        labelFormatter={(year) => `Year ${year}`}
                        contentStyle={{ 
                          backgroundColor: 'white', 
                          border: '1px solid #e2e8f0', 
                          borderRadius: '12px',
                          boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1)',
                          fontSize: '14px',
                          fontWeight: '500'
                        }}
                        cursor={{ stroke: '#3b82f6', strokeWidth: 1, strokeDasharray: '4 4' }}
                      />
                      <Line 
                        type="monotone" 
                        dataKey="balance" 
                        stroke="#2563eb" 
                        strokeWidth={3}
                        dot={false}
                        activeDot={{ 
                          r: 6, 
                          fill: '#2563eb',
                          stroke: '#ffffff',
                          strokeWidth: 2
                        }}
                        style={{
                          filter: 'drop-shadow(0 2px 4px rgba(37, 99, 235, 0.2))'
                        }}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
                
                {/* Assumptions */}
                <div className="mt-4 p-3 bg-gray-50 rounded-lg text-sm text-gray-600">
                  <p className="font-medium mb-1">Assumptions:</p>
                  <p>• 30-year retirement period • 3% annual inflation • 6% annual return</p>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* CTA Section */}
          <div className="text-center mt-12">
            <Card className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white border-0 shadow-xl max-w-2xl mx-auto">
              <CardContent className="p-8">
                <Users className="w-12 h-12 mx-auto mb-4 opacity-90" />
                <h3 className="text-2xl font-bold mb-4">Ready to Create Your Retirement Plan?</h3>
                <p className="text-blue-100 mb-6">
                  Schedule a consultation with our certified financial advisors to create a personalized retirement strategy.
                </p>
                <Button size="lg" variant="secondary" className="bg-white text-blue-600 hover:bg-blue-50">
                  Schedule Free Consultation
                  <ExternalLink className="w-4 h-4 ml-2" />
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Learn More Section */}
      <section className="py-16 bg-white">
        <div className="container mx-auto px-4 max-w-6xl">
          <div className="text-center mb-12">
            <BookOpen className="w-12 h-12 mx-auto text-blue-600 mb-4" />
            <h2 className="text-3xl font-bold text-gray-900 mb-4">Learn More About Retirement</h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              Deepen your understanding with our comprehensive retirement planning resources.
            </p>
          </div>
          
          <div className="grid md:grid-cols-3 gap-8">
            <Card className="hover:shadow-lg transition-shadow">
              <CardContent className="p-6">
                <TrendingDown className="w-8 h-8 text-blue-600 mb-4" />
                <h3 className="font-semibold text-lg mb-3">The 4% Rule Explained</h3>
                <p className="text-gray-600 mb-4">
                  Understanding the classic withdrawal strategy and when it works best for your situation.
                </p>
                <Button variant="outline" size="sm">Read Report</Button>
              </CardContent>
            </Card>
            
            <Card className="hover:shadow-lg transition-shadow">
              <CardContent className="p-6">
                <Calculator className="w-8 h-8 text-blue-600 mb-4" />
                <h3 className="font-semibold text-lg mb-3">Retirement Income Strategies</h3>
                <p className="text-gray-600 mb-4">
                  Explore different approaches to generating sustainable income in retirement.
                </p>
                <Button variant="outline" size="sm">Read Report</Button>
              </CardContent>
            </Card>
            
            <Card className="hover:shadow-lg transition-shadow">
              <CardContent className="p-6">
                <Users className="w-8 h-8 text-blue-600 mb-4" />
                <h3 className="font-semibold text-lg mb-3">Healthcare Costs in Retirement</h3>
                <p className="text-gray-600 mb-4">
                  Planning for one of the largest expenses you'll face during retirement.
                </p>
                <Button variant="outline" size="sm">Read Report</Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Related Topics Section */}
      <section className="py-16 bg-gray-50">
        <div className="container mx-auto px-4 max-w-6xl">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">Related Financial Topics</h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              Explore other important areas of financial planning to secure your future.
            </p>
          </div>
          
          <div className="grid md:grid-cols-3 gap-8">
            <Card className="hover:shadow-lg transition-shadow">
              <CardContent className="p-6">
                <h3 className="font-semibold text-lg mb-3">Tax-Efficient Investing</h3>
                <p className="text-gray-600 mb-4">
                  Maximize your returns by minimizing your tax burden through strategic investment planning.
                </p>
                <Button variant="outline" size="sm">Learn More</Button>
              </CardContent>
            </Card>
            
            <Card className="hover:shadow-lg transition-shadow">
              <CardContent className="p-6">
                <h3 className="font-semibold text-lg mb-3">Estate Planning Basics</h3>
                <p className="text-gray-600 mb-4">
                  Protect your legacy and ensure your assets are distributed according to your wishes.
                </p>
                <Button variant="outline" size="sm">Learn More</Button>
              </CardContent>
            </Card>
            
            <Card className="hover:shadow-lg transition-shadow">
              <CardContent className="p-6">
                <h3 className="font-semibold text-lg mb-3">Emergency Fund Strategies</h3>
                <p className="text-gray-600 mb-4">
                  Build financial resilience with the right emergency fund for your situation.
                </p>
                <Button variant="outline" size="sm">Learn More</Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Podcast Section */}
      <section className="py-16 bg-white">
        <div className="container mx-auto px-4 max-w-4xl">
          <Card className="bg-gradient-to-r from-purple-600 to-indigo-600 text-white border-0 shadow-xl">
            <CardContent className="p-8 text-center">
              <Headphones className="w-16 h-16 mx-auto mb-6 opacity-90" />
              <h2 className="text-3xl font-bold mb-4">Retirement Spending Podcast</h2>
              <p className="text-lg text-purple-100 mb-6 max-w-2xl mx-auto">
                Listen to our financial experts discuss this retirement spending calculator, share real-world examples, and answer common questions about sustainable withdrawal strategies.
              </p>
              <div className="flex justify-center">
                <Button 
                  size="lg" 
                  variant="secondary" 
                  className="bg-white text-purple-600 hover:bg-purple-50"
                  onClick={() => window.open('/retirement-podcast.mp4', '_blank')}
                >
                  <Headphones className="w-5 h-5 mr-2" />
                  Listen Now
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* Disclaimer */}
      <section className="py-12 bg-gray-100">
        <div className="container mx-auto px-4 max-w-4xl">
          <div className="text-center">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Important Disclaimer</h3>
            <p className="text-sm text-gray-600 leading-relaxed">
              This calculator is provided for educational and informational purposes only and should not be considered personalized investment advice. 
              The calculations are based on simplified assumptions and may not reflect your actual financial situation. Market returns, inflation rates, 
              and personal circumstances can vary significantly. Past performance does not guarantee future results. Please consult with a qualified 
              financial advisor before making any investment or retirement planning decisions. All investments carry risk, including the potential loss of principal.
            </p>
          </div>
        </div>
      </section>
    </div>
  );
};

export default Index;
