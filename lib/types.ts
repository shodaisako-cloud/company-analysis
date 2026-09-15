export interface ScrapedPage {
  url: string;
  title: string;
  category: string;
  text: string;
}

export interface ScrapeResult {
  rootUrl: string;
  siteTitle: string;
  companyNameGuess: string;
  pages: ScrapedPage[];
  warnings: string[];
}

export interface WebSnippet {
  title: string;
  url: string;
  snippet: string;
  query: string;
}

export interface SourceRef {
  url: string;
  label: string;
  type: "official" | "web";
}

export interface AnalysisReport {
  companyName: string;
  summary: string;

  basicInfo: {
    founded: string;
    capital: string;
    locations: string;
    employees: string;
    other: string;
  };

  philosophy: {
    mission: string;
    vision: string;
    values: string[];
  };

  competitorComparison: string[];
  recruitInfo: string[];
  financialTrend: string[];
  managementPolicyHistory: string[];
  keyProjects: string[];
  futureOutlook: string[];
  recentNews: string[];
  cultureAndWorkStyle: string[];
  employeeVoice: string[];
  risksAndDisputes: string[];
  other: string[];

  jobHuntingTips: {
    motivationHints: string[];
    likelyInterviewQuestions: string[];
    questionsToAsk: string[];
    fitPoints: string[];
  };

  sources: SourceRef[];
  confidenceNote: string;
}
