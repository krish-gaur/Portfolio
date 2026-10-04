import type { AssistantAction, ChatMessage, PortfolioData } from "@/types/portfolio";

type Project = PortfolioData["projects"][number];

type ToolRecord = { tool: string; data: unknown };

export function get_project(name: string, portfolio: PortfolioData): Project | null {
  const query = name.toLocaleLowerCase().trim();
  return portfolio.projects.find((project) => {
    const projectName = project.name.toLocaleLowerCase();
    const significantWords = projectName.split(/[^a-z0-9]+/).filter((word) => word.length >= 4);
    return query.includes(projectName) || projectName.includes(query) || significantWords.some((word) => query.includes(word));
  }) ?? null;
}

export function get_projects(portfolio: PortfolioData) {
  return portfolio.projects.map(({ id, name, category, description, long_description, status, technologies, metadata, deployment, github, ai_context }) => ({
    id, name, category, description, long_description, status, technologies, metadata, deployment, github, ai_context
  }));
}

export function get_experience(portfolio: PortfolioData) {
  return { roles: portfolio.experience, organizations: portfolio.organizations };
}

export function get_achievements(portfolio: PortfolioData) {
  return { achievements: portfolio.achievements, hackathons: portfolio.hackathons, aggregate: portfolio.stats };
}

export function get_resume(portfolio: PortfolioData) {
  return {
    file: portfolio.profile.resume.url || null,
    sourceNote: portfolio.profile.resume.ai_context || null,
    resumeSummary: portfolio.profile.resume.summary || null,
    resumeExperience: portfolio.profile.resume.experience,
    resumeProjects: portfolio.profile.resume.project_highlights,
    resumeSkills: portfolio.profile.resume.skills,
    resumeAchievements: portfolio.profile.resume.achievements,
    resumeCommunity: portfolio.profile.resume.community,
    profile: {
      name: portfolio.profile.name,
      headline: portfolio.profile.headline,
      bio: portfolio.profile.bio,
      looking_for: portfolio.profile.looking_for
    },
    experience: portfolio.experience,
    education: portfolio.education,
    skills: portfolio.skills.categories,
    projects: portfolio.projects.map((project) => ({ name: project.name, category: project.category, description: project.description })),
    organizations: portfolio.organizations,
    achievements: portfolio.achievements
  };
}

export function get_skills(portfolio: PortfolioData) {
  return portfolio.skills.categories;
}

export function get_profile(portfolio: PortfolioData) {
  return {
    profile: portfolio.profile,
    organizations: portfolio.organizations,
    education: portfolio.education,
    focus: portfolio.profile.focus
  };
}

export function get_links(portfolio: PortfolioData) {
  return {
    socials: Object.entries(portfolio.socials).filter(([, link]) => link.url),
    projects: portfolio.projects.map((project) => ({
      name: project.name,
      github: project.github.url ? project.github : null,
      deployment: project.deployment.url ? project.deployment : null
    })).filter((project) => project.github || project.deployment),
    resume: portfolio.profile.resume.url || null
  };
}

export function get_education(portfolio: PortfolioData) {
  return portfolio.education;
}

export function get_general_topic(question: string, portfolio: PortfolioData) {
  const q = question.toLocaleLowerCase();
  const tokens = q.split(/[^a-z0-9]+/);
  return portfolio.ai.general_topics.find((topic) => topic.triggers.some((trigger) => {
    const normalized = trigger.toLocaleLowerCase().trim();
    return normalized.includes(" ") ? q.includes(normalized) : tokens.includes(normalized);
  })) ?? null;
}

export function matchProjects(text: string, portfolio: PortfolioData): Project[] {
  const lower = text.toLocaleLowerCase();
  const compact = lower.replace(/[^a-z0-9]/g, "");
  return portfolio.projects.filter((project) => {
    const name = project.name.toLocaleLowerCase();
    const nameParts = name.split(/[^a-z0-9]+/).filter((part) => part.length >= 4);
    const compactName = name.replace(/[^a-z0-9]/g, "");
    const compactId = project.id.replace(/[^a-z0-9]/g, "");
    return lower.includes(name) || compact.includes(compactName) || compact.includes(compactId) || nameParts.some((part) => lower.includes(part));
  });
}

function contextualProjects(question: string, history: ChatMessage[], portfolio: PortfolioData) {
  const direct = matchProjects(question, portfolio);
  const recentUserQuestions = history.filter((message) => message.role === "user").slice(-6).reverse();
  const needsComparison = /(compare|different|difference|differ|versus|\bvs\b)/i.test(question);
  if (direct.length && !needsComparison) return direct;
  const previous = recentUserQuestions.flatMap((message) => matchProjects(message.content, portfolio));
  const combined = [...direct, ...(needsComparison ? previous : [])];
  if (combined.length) return [...new Map(combined.map((project) => [project.id, project])).values()];
  const isProjectFollowup = /(\bit\b|\bthat\b|\bthis\b|\btheir\b|\bits\b|\bone\b|what about|how does|how is|hardest|challenge|tech stack|technolog|feature|architecture|what was|open source|repository|github|live demo|tell me more|expand on|elaborate|go deeper)/i.test(question) || /^why[?!.,\s]*$/i.test(question) || /why (was|is|does|did) (it|that|this)\b/i.test(question);
  if (!isProjectFollowup) return [];
  for (const message of recentUserQuestions) {
    const mentioned = matchProjects(message.content, portfolio);
    if (mentioned.length) return mentioned;
  }
  return [];
}

/** Small retrieval router: send only relevant records to the model, not the whole portfolio on every turn. */
export function retrievePortfolioContext(question: string, history: ChatMessage[], portfolio: PortfolioData): ToolRecord[] {
  const q = question.toLocaleLowerCase();
  const projectRefs = contextualProjects(question, history, portfolio);
  const calls: ToolRecord[] = [];
  const add = (tool: string, data: unknown) => calls.push({ tool, data });
  const topic = get_general_topic(question, portfolio);
  if (topic) add("general_topic", { id: topic.id, answer: topic.answer });

  if (projectRefs.length) {
    add("get_project", projectRefs.map((project) => get_project(project.name, portfolio)).filter(Boolean));
  }
  if (/(projects?|built|build|products?|created|shipped|portfolio|work have)/.test(q) && !projectRefs.length) {
    add("get_projects", get_projects(portfolio));
  }
  if (/(experience|intern|internship|work history|worked|career|job|role|leadership|president|ambassador|education|degree|college)/.test(q)) {
    add("get_experience", get_experience(portfolio));
  }
  if (/(achievement|hackathon|award|win|winner|rank|competition|record)/.test(q)) {
    add("get_achievements", get_achievements(portfolio));
  }
  if (/(resume|résumé|cv|curriculum vitae)/.test(q)) {
    add("get_resume", get_resume(portfolio));
  }
  if (/(technology|technologies|tech stack|skills|tools|framework|language|programming)/.test(q)) {
    add("get_skills", get_skills(portfolio));
  }
  if (/(link|github|source|live|demo|deploy|repository|contact|reach|email)/.test(q)) {
    add("get_links", get_links(portfolio));
  }
  const nameTokens = portfolio.profile.name.toLocaleLowerCase().split(/[^a-z0-9]+/).filter((word) => word.length > 1);
  const questionTokens = q.split(/[^a-z0-9]+/);
  const mentionsProfile = nameTokens.some((word) => questionTokens.includes(word));
  if (/(who|profile|about|hire|looking for|internship|currently|working on|focus|interested)/.test(q) || mentionsProfile) {
    add("get_profile", get_profile(portfolio));
  }
  const refersToPerson = mentionsProfile || questionTokens.some((word) => ["he", "him", "his", "her", "she", "they", "them", "their"].includes(word));
  const asksForPersonalSynthesis = /(interesting|notable|stand out|surprising)/.test(q) && refersToPerson;
  const asksSecurityFit = /(hire|good fit|why should)/.test(q) && /(security|cyber|red.team|vulnerab)/.test(q);
  if ((asksForPersonalSynthesis || asksSecurityFit) && !projectRefs.length) {
    const synthesisProjects = portfolio.projects.filter((project) => /red teaming|llm security|digital forensics/i.test(`${project.category} ${project.metadata.join(" ")}`));
    if (synthesisProjects.length) add("get_project", synthesisProjects.slice(0, 3));
    const relevantWork = portfolio.experience.filter((item) => item.work.some((work) => /RAG|LLM|machine.learning|AI workflows/i.test(work)));
    if (relevantWork.length) add("get_experience", relevantWork);
  }
  if (/(education|degree|college|study|student)/.test(q) && !calls.some((call) => call.tool === "get_education")) {
    add("get_education", get_education(portfolio));
  }

  return calls;
}

export function relevantProjectsForTurn(question: string, history: ChatMessage[], portfolio: PortfolioData) {
  const direct = matchProjects(question, portfolio);
  if (direct.length && !/(compare|different|difference|differ|versus|\bvs\b)/i.test(question)) return direct;
  return contextualProjects(question, history, portfolio);
}

export function getAssistantActions(question: string, history: ChatMessage[], portfolio: PortfolioData): AssistantAction[] {
  const q = question.toLocaleLowerCase();
  if (get_general_topic(question, portfolio) && !matchProjects(question, portfolio).length) return [];
  if (/(resume|résumé|cv|curriculum vitae)/.test(q)) {
    return portfolio.profile.resume.url ? [{ type: "resume", label: "OPEN RESUME" }] : [];
  }
  let projects = relevantProjectsForTurn(question, history, portfolio);
  const tokens = q.split(/[^a-z0-9]+/);
  const nameTokens = portfolio.profile.name.toLocaleLowerCase().split(/[^a-z0-9]+/).filter((word) => word.length > 1);
  const refersToPerson = nameTokens.some((word) => tokens.includes(word)) || tokens.some((word) => ["he", "him", "his", "her", "she", "they", "them", "their"].includes(word));
  const asksForSynthesis = /(interesting|notable|stand out|surprising)/.test(q) && refersToPerson;
  const asksSecurityFit = /(hire|good fit|why should)/.test(q) && /(security|cyber|red.team|vulnerab)/.test(q);
  if (!projects.length && (asksForSynthesis || asksSecurityFit)) {
    projects = portfolio.projects.filter((project) => /red teaming|llm security|digital forensics/i.test(`${project.category} ${project.metadata.join(" ")}`)).slice(0, 2);
  }
  if (!projects.length && /(working on|current project|what (?:is|are) .*doing)/.test(q)) {
    projects = portfolio.projects.filter((project) => /development|active|in progress/i.test(project.status)).slice(0, 2);
  }
  if (!projects.length && /(project|build|built|show|products?)/.test(q)) projects = portfolio.projects.slice(0, 2);
  const actions: AssistantAction[] = []; 
  const seen = new Set<string>();
  const push = (action: AssistantAction) => {
    const key = action.type === "link" ? `${action.type}:${action.url}` : `${action.type}:${action.type === "project" ? action.projectId : action.label}`;
    if (!seen.has(key)) { seen.add(key); actions.push(action); }
  };

  for (const project of projects.slice(0, 2)) {
    push({ type: "project", label: `OPEN ${project.name.toUpperCase()}`, projectId: project.id });
    if (project.github.url) push({ type: "link", label: project.github.label || "⌘ GITHUB", url: project.github.url });
    if (project.deployment.url) push({ type: "link", label: project.deployment.label || "↗ LIVE DEMO", url: project.deployment.url });
  }

  const socialKeys = ["github", "linkedin", "x", "instagram", "portfolio", "email"];
  for (const key of socialKeys) {
    const link = portfolio.socials[key];
    if (link?.url && q.includes(key === "x" ? "twitter" : key)) push({ type: "link", label: link.label.toUpperCase(), url: link.url });
  }
  return actions.slice(0, 5);
}
