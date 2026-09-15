export interface ScrapedPage {
  url: string;
  title: string;
  category: string;
  text: string;
}

export interface ScrapeResult {
  rootUrl: string;
  siteTitle: string;
  pages: ScrapedPage[];
  warnings: string[];
}

export interface AnalysisReport {
  companyName: string;
  summary: string;
  business: {
    overview: string;
    products: string[];
    industryPosition: string;
  };
  strengths: string[];
  risks: string[];
  culture: {
    findings: string[];
    values: string[];
  };
  growthAndNews: string[];
  jobHuntingTips: {
    motivationHints: string[];
    likelyInterviewQuestions: string[];
    questionsToAsk: string[];
    fitPoints: string[];
  };
  sources: { url: string; label: string }[];
  confidenceNote: string;
}
