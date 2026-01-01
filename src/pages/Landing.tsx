import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import sportsStackLogo from '@/assets/sports-stack-logo.png';
import {
  Users,
  Calendar,
  FileText,
  Ticket,
  DollarSign,
  BarChart3,
  Sparkles,
  Shield,
  ShieldCheck,
  Lock,
  Eye,
  CheckCircle2,
  ArrowRight,
  Menu,
  X,
  ChevronRight,
  Building2,
  GraduationCap,
  UserCircle,
  Heart,
  Dumbbell,
  Trophy,
  Target,
  Waves,
  Gamepad2,
  Bike,
  Music
} from 'lucide-react';
import { useState } from 'react';
import { cn } from '@/lib/utils';

const SPORTS = [
  { name: 'Football', icon: '🏈' },
  { name: 'Basketball', icon: '🏀' },
  { name: 'Baseball', icon: '⚾' },
  { name: 'Soccer', icon: '⚽' },
  { name: 'Volleyball', icon: '🏐' },
  { name: 'Track & Field', icon: '🏃' },
  { name: 'Wrestling', icon: '🤼' },
  { name: 'Swimming', icon: '🏊' },
  { name: 'Cheer', icon: '📣' },
  { name: 'Esports', icon: '🎮' },
  { name: 'Tennis', icon: '🎾' },
  { name: 'Golf', icon: '⛳' },
  { name: 'Hockey', icon: '🏒' },
  { name: 'Lacrosse', icon: '🥍' },
  { name: 'Softball', icon: '🥎' },
  { name: 'Cross Country', icon: '🏃‍♀️' },
];

const FEATURES = [
  {
    icon: Users,
    title: 'Team & Roster Management',
    description: 'Multi-sport support with positions, depth charts, lines, and formations. Complete athlete, coach, and staff profiles.',
  },
  {
    icon: Trophy,
    title: 'Sports Cards & Visual Rosters',
    description: 'Game-style sports cards, formation views, and parent-friendly visual rosters for every athlete.',
  },
  {
    icon: FileText,
    title: 'Forms & Compliance',
    description: 'FinalForms integration, custom forms, digital signatures, and FERPA-aligned privacy controls.',
  },
  {
    icon: Ticket,
    title: 'Ticketing & Events',
    description: 'GoFan integration, event scheduling, attendance tracking, and comprehensive game management.',
  },
  {
    icon: Heart,
    title: 'Fundraising & Sponsorships',
    description: 'Campaign management, sponsor packages, donor tracking, and booster-friendly financial reporting.',
  },
  {
    icon: BarChart3,
    title: 'Finance & Reporting',
    description: 'Unified financial ledger, season rollups, team budgets, and complete audit trails.',
  },
];

const AUDIENCES = [
  {
    icon: Building2,
    title: 'Schools',
    description: 'Centralize athletic operations, ensure compliance, and streamline administration across all sports programs.',
  },
  {
    icon: GraduationCap,
    title: 'Districts',
    description: 'Unified oversight of all schools, standardized processes, and district-wide reporting and analytics.',
  },
  {
    icon: UserCircle,
    title: 'Coaches',
    description: 'Focus on coaching with simplified roster management, easy attendance, and streamlined communication.',
  },
  {
    icon: Users,
    title: 'Parents & Athletes',
    description: 'Stay informed with schedules, forms, and team updates. Athletes can track their achievements and stats.',
  },
];

export default function Landing() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <div className="min-h-screen bg-background">
      {/* Navigation */}
      <nav className="sticky top-0 z-50 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container mx-auto px-4">
          <div className="flex h-16 items-center justify-between">
            {/* Logo */}
            <Link to="/" className="flex items-center gap-2">
              <img src={sportsStackLogo} alt="Sports Stack" className="h-10 w-auto" />
            </Link>

            {/* Desktop Navigation */}
            <div className="hidden md:flex items-center gap-6">
              <a href="#features" className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">
                Features
              </a>
              <a href="#sports" className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">
                Sports
              </a>
              <a href="#security" className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">
                Security
              </a>
              <a href="#fundraising" className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">
                Fundraising
              </a>
              <a href="#about" className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">
                About
              </a>
            </div>

            {/* Desktop CTAs */}
            <div className="hidden md:flex items-center gap-3">
              <Button variant="ghost" asChild>
                <Link to="/auth">Log In</Link>
              </Button>
              <Button asChild>
                <Link to="/auth">Request Demo</Link>
              </Button>
            </div>

            {/* Mobile Menu Button */}
            <button
              className="md:hidden p-2"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            >
              {mobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
            </button>
          </div>
        </div>

        {/* Mobile Menu */}
        {mobileMenuOpen && (
          <div className="md:hidden border-t bg-background">
            <div className="container mx-auto px-4 py-4 space-y-4">
              <a href="#features" className="block py-2 text-sm font-medium" onClick={() => setMobileMenuOpen(false)}>
                Features
              </a>
              <a href="#sports" className="block py-2 text-sm font-medium" onClick={() => setMobileMenuOpen(false)}>
                Sports
              </a>
              <a href="#security" className="block py-2 text-sm font-medium" onClick={() => setMobileMenuOpen(false)}>
                Security
              </a>
              <a href="#fundraising" className="block py-2 text-sm font-medium" onClick={() => setMobileMenuOpen(false)}>
                Fundraising
              </a>
              <a href="#about" className="block py-2 text-sm font-medium" onClick={() => setMobileMenuOpen(false)}>
                About
              </a>
              <div className="flex flex-col gap-2 pt-4 border-t">
                <Button variant="outline" asChild className="w-full">
                  <Link to="/auth">Log In</Link>
                </Button>
                <Button asChild className="w-full">
                  <Link to="/auth">Request Demo</Link>
                </Button>
              </div>
            </div>
          </div>
        )}
      </nav>

      {/* Hero Section */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-background to-primary/10" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-blue-500/10 via-transparent to-transparent" />
        
        <div className="container relative mx-auto px-4 py-20 md:py-32">
          <div className="max-w-4xl mx-auto text-center space-y-8">
            <Badge variant="secondary" className="px-4 py-2 text-sm font-medium">
              <Sparkles className="h-4 w-4 mr-2 inline" />
              AI-Powered Athletic Management
            </Badge>
            
            <h1 className="text-4xl md:text-6xl lg:text-7xl font-bold tracking-tight">
              Everything Your Athletic Program Needs.{' '}
              <span className="text-primary">One Platform.</span>
            </h1>
            
            <p className="text-xl md:text-2xl text-muted-foreground max-w-3xl mx-auto">
              Manage teams, athletes, forms, schedules, fundraising, sponsorships, and finances across every sport with built-in security and AI-powered automation.
            </p>
            
            <div className="flex flex-col sm:flex-row gap-4 justify-center pt-4">
              <Button size="lg" className="text-lg px-8 py-6" asChild>
                <Link to="/auth">
                  Request a Demo
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Link>
              </Button>
              <Button size="lg" variant="outline" className="text-lg px-8 py-6" asChild>
                <Link to="/auth">Log In</Link>
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-20 md:py-32 bg-muted/30">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-5xl font-bold mb-4">
              Powerful Features for Every Need
            </h2>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              A complete platform designed to streamline athletic program management from top to bottom.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {FEATURES.map((feature) => (
              <Card key={feature.title} className="group hover:shadow-lg transition-all duration-300 border-0 bg-background">
                <CardContent className="p-6 space-y-4">
                  <div className="h-12 w-12 rounded-xl bg-primary/10 flex items-center justify-center group-hover:bg-primary/20 transition-colors">
                    <feature.icon className="h-6 w-6 text-primary" />
                  </div>
                  <h3 className="text-xl font-semibold">{feature.title}</h3>
                  <p className="text-muted-foreground">{feature.description}</p>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* AI Premium Feature */}
          <div className="mt-12">
            <Card className="bg-gradient-to-r from-primary/10 via-primary/5 to-background border-primary/20">
              <CardContent className="p-8 md:p-12">
                <div className="flex flex-col md:flex-row items-center gap-8">
                  <div className="flex-shrink-0">
                    <div className="h-20 w-20 rounded-2xl bg-primary/20 flex items-center justify-center">
                      <Sparkles className="h-10 w-10 text-primary" />
                    </div>
                  </div>
                  <div className="flex-1 text-center md:text-left">
                    <Badge className="mb-4">Premium Feature</Badge>
                    <h3 className="text-2xl md:text-3xl font-bold mb-4">AI-Powered Assistance</h3>
                    <p className="text-lg text-muted-foreground mb-4">
                      Smart roster completion checks, auto-seeded positions, data consistency validation, and AI-assisted setup recommendations. Let AI handle the tedious work while you stay in control.
                    </p>
                    <p className="text-sm font-medium text-primary">
                      "AI assists. Humans stay in control."
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Sports Coverage Section */}
      <section id="sports" className="py-20 md:py-32">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-5xl font-bold mb-4">
              Built for Every Sport
            </h2>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Supports over 60 high school and emerging sports with sport-specific layouts and rules.
            </p>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-8 gap-4">
            {SPORTS.map((sport) => (
              <div
                key={sport.name}
                className="flex flex-col items-center justify-center p-4 rounded-xl bg-muted/50 hover:bg-muted transition-colors"
              >
                <span className="text-3xl mb-2">{sport.icon}</span>
                <span className="text-sm font-medium text-center">{sport.name}</span>
              </div>
            ))}
          </div>

          <p className="text-center mt-8 text-muted-foreground">
            And many more including lacrosse, field hockey, bowling, gymnastics, dance, martial arts...
          </p>
        </div>
      </section>

      {/* Security Section */}
      <section id="security" className="py-20 md:py-32 bg-muted/30">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-5xl font-bold mb-4">
              Security & Trust First
            </h2>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Enterprise-grade security designed for educational institutions and student data protection.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-5xl mx-auto">
            <div className="flex items-start gap-4 p-6 rounded-xl bg-background">
              <div className="p-3 rounded-lg bg-green-500/10">
                <ShieldCheck className="h-6 w-6 text-green-600" />
              </div>
              <div>
                <h3 className="font-semibold mb-1">FERPA Aligned</h3>
                <p className="text-sm text-muted-foreground">Student data privacy controls and compliance</p>
              </div>
            </div>

            <div className="flex items-start gap-4 p-6 rounded-xl bg-background">
              <div className="p-3 rounded-lg bg-blue-500/10">
                <Lock className="h-6 w-6 text-blue-600" />
              </div>
              <div>
                <h3 className="font-semibold mb-1">Encrypted Data</h3>
                <p className="text-sm text-muted-foreground">Data encrypted at rest and in transit</p>
              </div>
            </div>

            <div className="flex items-start gap-4 p-6 rounded-xl bg-background">
              <div className="p-3 rounded-lg bg-purple-500/10">
                <Users className="h-6 w-6 text-purple-600" />
              </div>
              <div>
                <h3 className="font-semibold mb-1">Role-Based Access</h3>
                <p className="text-sm text-muted-foreground">Granular permissions for every role</p>
              </div>
            </div>

            <div className="flex items-start gap-4 p-6 rounded-xl bg-background">
              <div className="p-3 rounded-lg bg-orange-500/10">
                <Eye className="h-6 w-6 text-orange-600" />
              </div>
              <div>
                <h3 className="font-semibold mb-1">Audit Logging</h3>
                <p className="text-sm text-muted-foreground">Complete activity trails for compliance</p>
              </div>
            </div>

            <div className="flex items-start gap-4 p-6 rounded-xl bg-background">
              <div className="p-3 rounded-lg bg-red-500/10">
                <Shield className="h-6 w-6 text-red-600" />
              </div>
              <div>
                <h3 className="font-semibold mb-1">Secure Authentication</h3>
                <p className="text-sm text-muted-foreground">Strong password policies and MFA support</p>
              </div>
            </div>

            <div className="flex items-start gap-4 p-6 rounded-xl bg-background">
              <div className="p-3 rounded-lg bg-teal-500/10">
                <CheckCircle2 className="h-6 w-6 text-teal-600" />
              </div>
              <div>
                <h3 className="font-semibold mb-1">SOC 2 Aligned</h3>
                <p className="text-sm text-muted-foreground">Following industry best practices</p>
              </div>
            </div>
          </div>

          <div className="flex flex-wrap justify-center gap-4 mt-12">
            <Badge variant="outline" className="px-4 py-2">No Stored Payment Cards</Badge>
            <Badge variant="outline" className="px-4 py-2">GDPR Principles</Badge>
            <Badge variant="outline" className="px-4 py-2">Secure by Design</Badge>
          </div>
        </div>
      </section>

      {/* Fundraising Section */}
      <section id="fundraising" className="py-20 md:py-32">
        <div className="container mx-auto px-4">
          <div className="max-w-5xl mx-auto">
            <div className="grid md:grid-cols-2 gap-12 items-center">
              <div className="space-y-6">
                <Badge>Fundraising & Sponsorships</Badge>
                <h2 className="text-3xl md:text-4xl font-bold">
                  Power Your Program's Growth
                </h2>
                <p className="text-lg text-muted-foreground">
                  Run fundraising campaigns, manage sponsors, track donors, and maintain complete financial transparency. Built for booster clubs and athletic departments alike.
                </p>
                
                <ul className="space-y-4">
                  <li className="flex items-center gap-3">
                    <CheckCircle2 className="h-5 w-5 text-green-500 flex-shrink-0" />
                    <span>Team and individual fundraising campaigns</span>
                  </li>
                  <li className="flex items-center gap-3">
                    <CheckCircle2 className="h-5 w-5 text-green-500 flex-shrink-0" />
                    <span>Sponsor package management and tracking</span>
                  </li>
                  <li className="flex items-center gap-3">
                    <CheckCircle2 className="h-5 w-5 text-green-500 flex-shrink-0" />
                    <span>Donor recognition and anonymity options</span>
                  </li>
                  <li className="flex items-center gap-3">
                    <CheckCircle2 className="h-5 w-5 text-green-500 flex-shrink-0" />
                    <span>Comprehensive financial reporting</span>
                  </li>
                </ul>

                <Button size="lg" asChild>
                  <Link to="/auth">
                    See How Fundraising Works
                    <ChevronRight className="ml-2 h-4 w-4" />
                  </Link>
                </Button>
              </div>

              <div className="relative">
                <div className="aspect-square rounded-2xl bg-gradient-to-br from-primary/20 via-primary/10 to-transparent p-8 flex items-center justify-center">
                  <div className="grid grid-cols-2 gap-4 w-full max-w-xs">
                    <div className="bg-background rounded-xl p-4 shadow-lg">
                      <DollarSign className="h-8 w-8 text-green-500 mb-2" />
                      <p className="text-2xl font-bold">$24,500</p>
                      <p className="text-xs text-muted-foreground">Raised This Season</p>
                    </div>
                    <div className="bg-background rounded-xl p-4 shadow-lg">
                      <Heart className="h-8 w-8 text-red-500 mb-2" />
                      <p className="text-2xl font-bold">128</p>
                      <p className="text-xs text-muted-foreground">Donors</p>
                    </div>
                    <div className="bg-background rounded-xl p-4 shadow-lg col-span-2">
                      <Trophy className="h-8 w-8 text-yellow-500 mb-2" />
                      <p className="text-2xl font-bold">12 Sponsors</p>
                      <p className="text-xs text-muted-foreground">Active Partnerships</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Who It's For Section */}
      <section id="about" className="py-20 md:py-32 bg-muted/30">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-5xl font-bold mb-4">
              Who It's For
            </h2>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Designed for everyone involved in K-12 athletics.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {AUDIENCES.map((audience) => (
              <Card key={audience.title} className="text-center">
                <CardContent className="p-6 space-y-4">
                  <div className="h-16 w-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto">
                    <audience.icon className="h-8 w-8 text-primary" />
                  </div>
                  <h3 className="text-xl font-semibold">{audience.title}</h3>
                  <p className="text-muted-foreground text-sm">{audience.description}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Social Proof */}
      <section className="py-20 md:py-32">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto text-center space-y-8">
            <h2 className="text-3xl md:text-4xl font-bold">
              Trusted by Schools, Coaches, and Athletic Programs Nationwide
            </h2>
            <div className="flex flex-wrap justify-center gap-8 opacity-60">
              {/* Placeholder for future testimonials */}
              <div className="h-12 w-32 bg-muted rounded animate-pulse" />
              <div className="h-12 w-32 bg-muted rounded animate-pulse" />
              <div className="h-12 w-32 bg-muted rounded animate-pulse" />
              <div className="h-12 w-32 bg-muted rounded animate-pulse" />
            </div>
            <p className="text-muted-foreground italic">
              Testimonials coming soon...
            </p>
          </div>
        </div>
      </section>

      {/* Bottom CTA */}
      <section className="py-20 md:py-32 bg-primary text-primary-foreground">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-3xl md:text-5xl font-bold mb-6">
            Ready to Modernize Your Athletic Program?
          </h2>
          <p className="text-xl opacity-90 mb-8 max-w-2xl mx-auto">
            Join schools and districts across the country using Sports Stack to streamline their athletic operations.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button size="lg" variant="secondary" className="text-lg px-8" asChild>
              <Link to="/auth">Request Demo</Link>
            </Button>
            <Button size="lg" variant="outline" className="text-lg px-8 border-primary-foreground/30 hover:bg-primary-foreground/10" asChild>
              <Link to="/auth">Log In</Link>
            </Button>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t bg-background">
        <div className="container mx-auto px-4 py-12">
          <div className="grid md:grid-cols-4 gap-8">
            <div className="space-y-4">
              <img src={sportsStackLogo} alt="Sports Stack" className="h-10 w-auto" />
              <p className="text-sm text-muted-foreground">
                The complete platform for K-12 athletic program management.
              </p>
            </div>
            
            <div>
              <h4 className="font-semibold mb-4">Product</h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li><a href="#features" className="hover:text-foreground transition-colors">Features</a></li>
                <li><a href="#sports" className="hover:text-foreground transition-colors">Sports</a></li>
                <li><a href="#security" className="hover:text-foreground transition-colors">Security</a></li>
                <li><a href="#fundraising" className="hover:text-foreground transition-colors">Fundraising</a></li>
              </ul>
            </div>
            
            <div>
              <h4 className="font-semibold mb-4">Company</h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li><a href="#about" className="hover:text-foreground transition-colors">About</a></li>
                <li><a href="#" className="hover:text-foreground transition-colors">Contact</a></li>
                <li><a href="#" className="hover:text-foreground transition-colors">Careers</a></li>
              </ul>
            </div>
            
            <div>
              <h4 className="font-semibold mb-4">Legal</h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li><a href="#" className="hover:text-foreground transition-colors">Privacy Policy</a></li>
                <li><a href="#" className="hover:text-foreground transition-colors">Terms of Service</a></li>
                <li><a href="#" className="hover:text-foreground transition-colors">Security</a></li>
              </ul>
            </div>
          </div>
          
          <div className="border-t mt-12 pt-8 flex flex-col md:flex-row justify-between items-center gap-4">
            <p className="text-sm text-muted-foreground">
              © {new Date().getFullYear()} Sports Stack. All rights reserved.
            </p>
            <div className="flex items-center gap-4">
              <Link to="/auth" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
                Login
              </Link>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
