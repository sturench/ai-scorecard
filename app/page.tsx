import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ArrowRight, Shield, BarChart3, Users, CheckCircle } from "lucide-react";

export default function HomePage() {
  return (
    <div className="flex flex-col min-h-screen">
      {/* Header */}
      <header className="px-4 lg:px-6 h-14 flex items-center border-b">
        <Link className="flex items-center justify-center" href="/">
          <BarChart3 className="h-6 w-6 mr-2 text-primary" />
          <span className="font-bold">AI Reality Check</span>
        </Link>
        <nav className="ml-auto flex gap-4 sm:gap-6">
          <Link className="text-sm font-medium hover:underline underline-offset-4" href="#features">
            Features
          </Link>
          <Link className="text-sm font-medium hover:underline underline-offset-4" href="#about">
            About
          </Link>
        </nav>
      </header>

      {/* Main Content */}
      <main className="flex-1">
        {/* Hero Section */}
        <section className="w-full py-12 md:py-24 lg:py-32 xl:py-48">
          <div className="container px-4 md:px-6">
            <div className="flex flex-col items-center space-y-4 text-center">
              <div className="space-y-2">
                <h1 className="text-3xl font-bold tracking-tighter sm:text-4xl md:text-5xl lg:text-6xl/none">
                  AI Reality Check Scorecard
                </h1>
                <p className="mx-auto max-w-[700px] text-gray-500 md:text-xl dark:text-gray-400">
                  Executive AI readiness assessment. Evaluate your organization's preparedness across 
                  value assurance, customer safety, risk management, and governance.
                </p>
              </div>
              <div className="space-x-4">
                <Button asChild size="lg">
                  <Link href="/assessment/start">
                    Take Assessment <ArrowRight className="ml-2 h-4 w-4" />
                  </Link>
                </Button>
              </div>
            </div>
          </div>
        </section>

        {/* Features Section */}
        <section id="features" className="w-full py-12 md:py-24 lg:py-32 bg-gray-50 dark:bg-gray-900">
          <div className="container px-4 md:px-6">
            <div className="grid gap-10 sm:px-10 md:gap-16 md:grid-cols-2">
              <div className="space-y-4">
                <div className="inline-block rounded-lg bg-gray-100 px-3 py-1 text-sm dark:bg-gray-800">
                  Assessment Areas
                </div>
                <h2 className="lg:leading-tighter text-3xl font-bold tracking-tighter sm:text-4xl md:text-5xl xl:text-[3.4rem] 2xl:text-[3.75rem]">
                  Comprehensive AI Evaluation
                </h2>
                <p className="mx-auto max-w-[700px] text-gray-500 md:text-xl/relaxed lg:text-base/relaxed xl:text-xl/relaxed dark:text-gray-400">
                  Our assessment evaluates four critical dimensions of AI readiness to provide actionable insights for executives.
                </p>
              </div>
              <div className="flex flex-col justify-center space-y-4">
                <div className="grid gap-6">
                  <div className="flex items-start space-x-3">
                    <CheckCircle className="mt-1 h-5 w-5 text-primary" />
                    <div>
                      <h3 className="font-bold">AI Value Assurance</h3>
                      <p className="text-sm text-gray-500 dark:text-gray-400">
                        Measure your organization's ability to deliver and capture value from AI initiatives.
                      </p>
                    </div>
                  </div>
                  <div className="flex items-start space-x-3">
                    <Shield className="mt-1 h-5 w-5 text-primary" />
                    <div>
                      <h3 className="font-bold">Customer-Safe AI</h3>
                      <p className="text-sm text-gray-500 dark:text-gray-400">
                        Evaluate safeguards and protocols for customer-facing AI deployments.
                      </p>
                    </div>
                  </div>
                  <div className="flex items-start space-x-3">
                    <BarChart3 className="mt-1 h-5 w-5 text-primary" />
                    <div>
                      <h3 className="font-bold">Model Risk & Compliance</h3>
                      <p className="text-sm text-gray-500 dark:text-gray-400">
                        Assess risk management frameworks and regulatory compliance readiness.
                      </p>
                    </div>
                  </div>
                  <div className="flex items-start space-x-3">
                    <Users className="mt-1 h-5 w-5 text-primary" />
                    <div>
                      <h3 className="font-bold">Implementation Governance</h3>
                      <p className="text-sm text-gray-500 dark:text-gray-400">
                        Review organizational structures and processes for AI implementation.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="w-full py-12 md:py-24 lg:py-32">
          <div className="container px-4 md:px-6">
            <div className="flex flex-col items-center justify-center space-y-4 text-center">
              <div className="space-y-2">
                <h2 className="text-3xl font-bold tracking-tighter md:text-4xl">
                  Ready to Assess Your AI Readiness?
                </h2>
                <p className="max-w-[600px] text-gray-500 md:text-xl/relaxed lg:text-base/relaxed xl:text-xl/relaxed dark:text-gray-400">
                  Take our comprehensive assessment and receive personalized recommendations for your AI journey.
                </p>
              </div>
              <div className="w-full max-w-sm space-y-2">
                <Button asChild size="lg" className="w-full">
                  <Link href="/assessment/start">
                    Start Assessment <ArrowRight className="ml-2 h-4 w-4" />
                  </Link>
                </Button>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  Takes 5-7 minutes to complete
                </p>
              </div>
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="flex flex-col gap-2 sm:flex-row py-6 w-full shrink-0 items-center px-4 md:px-6 border-t">
        <p className="text-xs text-gray-500 dark:text-gray-400">
          © 2024 AI Reality Check Scorecard. All rights reserved.
        </p>
        <nav className="sm:ml-auto flex gap-4 sm:gap-6">
          <Link className="text-xs hover:underline underline-offset-4" href="/privacy">
            Privacy Policy
          </Link>
          <Link className="text-xs hover:underline underline-offset-4" href="/terms">
            Terms of Service
          </Link>
        </nav>
      </footer>
    </div>
  );
}