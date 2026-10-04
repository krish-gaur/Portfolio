export type ChatMessage = { role: "system" | "user" | "assistant"; content: string };

export type SocialLink = {
  label: string;
  url: string;
};

export type ProjectActionLink = {
  url: string;
  label: string;
  detailLabel?: string;
};

export type ProjectScreenshot = {
  url: string;
  alt: string;
  caption: string;
};

export type AssistantAction =
  | { type: "project"; label: string; projectId: string }
  | { type: "resume"; label: string }
  | { type: "link"; label: string; url: string };

export type PortfolioData = {
  meta: {
    title: string;
    description: string;
    siteUrl: string;
  };
  profile: {
    name: string;
    heroTitle: string[];
    heroDescription: string;
    headline: string;
    secondaryHeadline: string;
    location: string;
    bio: string;
    availability: string;
    looking_for: string | null;
    focus: string[];
    community: string;
    avatar: {
      portrait: string;
      alt: string;
    };
    resume: {
      url: string;
      fileName: string;
      ai_context: string;
      summary: string;
      experience: string[];
      project_highlights: string[];
      skills: string[];
      achievements: string[];
      community: string[];
    };
  };
  stats: {
    hackathonTopFive: string;
    hackathonWins: string;
    namedHackathonResult: string;
    followers: string | null;
    leetcode: string | null;
    dsa: string | null;
  };
  skills: {
    categories: Array<{
      id: string;
      label: string;
      eyebrow: string;
      items: string[];
    }>;
  };
  experience: Array<{
    id: string;
    company: string;
    roles: string[];
    dateRange: string | null;
    summary: string;
    work: string[];
  }>;
  projects: Array<{
    id: string;
    name: string;
    category: string;
    descriptor: string;
    description: string;
    long_description: string;
    problem: string | null;
    solution: string | null;
    architecture: string[];
    features: string[];
    technologies: string[];
    metadata: string[];
    status: string;
    deployment: ProjectActionLink;
    github: ProjectActionLink;
    screenshots: ProjectScreenshot[];
    challenges: string[];
    ai_components: string[];
    achievements: string[];
    ai_context: string;
    impact: string | null;
    artwork: string;
    accent: string;
    founder?: string;
  }>;
  achievements: Array<{
    id: string;
    title: string;
    detail: string;
    category: string;
    metric: string;
    order: number;
  }>;
  hackathons: Array<{
    id: string;
    name: string;
    rank: string;
    project: string | null;
    domain: string | null;
    result: string;
    date: string | null;
  }>;
  education: Array<{
    degree: string;
    institution: string;
    affiliation: string;
    expectedGraduation: string;
    location: string;
  }>;
  organizations: Array<{
    name: string;
    role: string;
    focus: string;
  }>;
  about: {
    eyebrow: string;
    title: string;
    stages: Array<{
      label: string;
      index: string;
      title: string;
      body: string;
      signal: string;
    }>;
  };
  socials: Record<string, SocialLink>;
  contact: {
    headline: string;
    subhead: string;
    routes: Array<{
      id: string;
      label: string;
      intent: string;
      icon: string;
    }>;
  };
  ai: {
    name: string;
    system_personality: string;
    welcome_message: string;
    greeting_message: string;
    suggested_questions: string[];
    fallback_message: string;
    general_fallback_message: string;
    general_topics: Array<{
      id: string;
      triggers: string[];
      answer: string;
    }>;
  };
};
