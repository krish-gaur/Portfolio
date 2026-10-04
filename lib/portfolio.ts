import type { PortfolioData, ProjectActionLink, ProjectScreenshot, SocialLink } from "@/types/portfolio";

const record = (value: unknown): Record<string, unknown> => value !== null && typeof value === "object" && !Array.isArray(value) ? value as Record<string, unknown> : {};
const text = (value: unknown, fallback = "") => typeof value === "string" ? value : fallback;
const list = (value: unknown): unknown[] => Array.isArray(value) ? value : [];
const strings = (value: unknown): string[] => list(value).filter((item): item is string => typeof item === "string");
const optionalText = (value: unknown): string | null => typeof value === "string" && value.trim() ? value : null;

function actionLink(value: unknown, fallbackUrl = "", fallbackLabel = "") : ProjectActionLink {
  const item = record(value);
  const detailLabel = optionalText(item.detailLabel);
  return {
    url: text(item.url, fallbackUrl),
    label: text(item.label, fallbackLabel),
    ...(detailLabel ? { detailLabel } : {})
  };
}

function screenshots(value: unknown): ProjectScreenshot[] {
  return list(value).flatMap((entry) => {
    if (typeof entry === "string") return entry ? [{ url: entry, alt: "Project screenshot", caption: "" }] : [];
    const item = record(entry);
    const url = text(item.url);
    return url ? [{ url, alt: text(item.alt, "Project screenshot"), caption: text(item.caption) }] : [];
  });
}

/** Adds safe, presentation-neutral defaults around the editable JSON so an omitted field never crashes the page. */
export function normalizePortfolio(input: unknown): PortfolioData {
  const root = record(input);
  const meta = record(root.meta);
  const profile = record(root.profile);
  const resume = record(profile.resume);
  const avatar = record(profile.avatar);
  const stats = record(root.stats);
  const skills = record(root.skills);
  const about = record(root.about);
  const ai = record(root.ai);
  const contact = record(root.contact);
  const socialsRaw = record(root.socials);

  const socials: Record<string, SocialLink> = Object.fromEntries(
    Object.entries(socialsRaw).map(([key, value]) => {
      const item = record(value);
      return [key, { label: text(item.label, key), url: text(item.url) }];
    })
  );

  const experience = list(root.experience).map((value, index) => {
    const item = record(value);
    return {
      id: text(item.id, `experience-${index + 1}`),
      company: text(item.company),
      roles: strings(item.roles),
      dateRange: optionalText(item.dateRange),
      summary: text(item.summary),
      work: strings(item.work)
    };
  });

  const projects = list(root.projects).map((value, index) => {
    const item = record(value);
    const oldLinks = record(item.links);
    const founder = optionalText(item.founder);
    return {
      id: text(item.id, `project-${index + 1}`),
      name: text(item.name),
      category: text(item.category),
      descriptor: text(item.descriptor),
      description: text(item.description),
      long_description: text(item.long_description, text(item.description)),
      problem: optionalText(item.problem),
      solution: optionalText(item.solution),
      architecture: strings(item.architecture),
      features: strings(item.features),
      technologies: strings(item.technologies),
      metadata: strings(item.metadata),
      status: text(item.status),
      deployment: actionLink(item.deployment, text(oldLinks.demo), "Live Demo"),
      github: actionLink(item.github, text(oldLinks.github), "GitHub Repository"),
      screenshots: screenshots(item.screenshots),
      challenges: strings(item.challenges),
      ai_components: strings(item.ai_components),
      achievements: strings(item.achievements),
      ai_context: text(item.ai_context),
      impact: optionalText(item.impact),
      artwork: text(item.artwork, "forensics"),
      accent: text(item.accent, "cyan"),
      ...(founder ? { founder } : {})
    };
  });

  const achievements = list(root.achievements).map((value, index) => {
    const item = record(value);
    return {
      id: text(item.id, `achievement-${index + 1}`),
      title: text(item.title),
      detail: text(item.detail),
      category: text(item.category, "Milestone"),
      metric: text(item.metric),
      order: typeof item.order === "number" ? item.order : index + 1
    };
  });

  const hackathons = list(root.hackathons).map((value, index) => {
    const item = record(value);
    return {
      id: text(item.id, `event-${index + 1}`),
      name: text(item.name),
      rank: text(item.rank),
      project: optionalText(item.project),
      domain: optionalText(item.domain),
      result: text(item.result),
      date: optionalText(item.date)
    };
  });

  const education = list(root.education).map((value) => {
    const item = record(value);
    return {
      degree: text(item.degree),
      institution: text(item.institution),
      affiliation: text(item.affiliation),
      expectedGraduation: text(item.expectedGraduation),
      location: text(item.location)
    };
  });

  const organizations = list(root.organizations).map((value) => {
    const item = record(value);
    return { name: text(item.name), role: text(item.role), focus: text(item.focus) };
  });

  const categories = list(skills.categories).map((value, index) => {
    const item = record(value);
    return {
      id: text(item.id, `category-${index + 1}`),
      label: text(item.label),
      eyebrow: text(item.eyebrow),
      items: strings(item.items)
    };
  });

  const sourceStages = list(about.stages);
  const stages = sourceStages.map((value, index) => {
    const item = record(value);
    return {
      label: text(item.label),
      index: text(item.index, String(index + 1).padStart(2, "0")),
      title: text(item.title),
      body: text(item.body),
      signal: text(item.signal)
    };
  });
  if (!stages.length) stages.push({ label: "Identity", index: "01", title: "Profile details not configured.", body: "Add identity stages to the about section of portfolio.json.", signal: "EDIT PORTFOLIO.JSON" });

  const routes = list(contact.routes).map((value, index) => {
    const item = record(value);
    return { id: text(item.id, `route-${index + 1}`), label: text(item.label), intent: text(item.intent), icon: text(item.icon, "↗") };
  });

  const generalTopics = list(ai.general_topics).map((value, index) => {
    const item = record(value);
    return { id: text(item.id, `topic-${index + 1}`), triggers: strings(item.triggers), answer: text(item.answer) };
  });

  return {
    meta: { title: text(meta.title, "Personal portfolio"), description: text(meta.description), siteUrl: text(meta.siteUrl) },
    profile: {
      name: text(profile.name),
      heroTitle: strings(profile.heroTitle),
      heroDescription: text(profile.heroDescription),
      headline: text(profile.headline),
      secondaryHeadline: text(profile.secondaryHeadline),
      location: text(profile.location),
      bio: text(profile.bio),
      availability: text(profile.availability),
      looking_for: optionalText(profile.looking_for),
      focus: strings(profile.focus),
      community: text(profile.community),
      avatar: { portrait: text(avatar.portrait), alt: text(avatar.alt, "Digital holographic portrait") },
      resume: {
        url: text(resume.url),
        fileName: text(resume.fileName, "resume.pdf"),
        ai_context: text(resume.ai_context),
        summary: text(resume.summary),
        experience: strings(resume.experience),
        project_highlights: strings(resume.project_highlights),
        skills: strings(resume.skills),
        achievements: strings(resume.achievements),
        community: strings(resume.community)
      }
    },
    stats: {
      hackathonTopFive: text(stats.hackathonTopFive, "—"),
      hackathonWins: text(stats.hackathonWins, "—"),
      namedHackathonResult: text(stats.namedHackathonResult, "—"),
      followers: optionalText(stats.followers),
      leetcode: optionalText(stats.leetcode),
      dsa: optionalText(stats.dsa)
    },
    skills: { categories },
    experience,
    projects,
    achievements,
    hackathons,
    education,
    organizations,
    about: { eyebrow: text(about.eyebrow, "Identity timeline"), title: text(about.title), stages },
    socials,
    contact: { headline: text(contact.headline, "Start a conversation."), subhead: text(contact.subhead), routes },
    ai: {
      name: text(ai.name, "Portfolio interface"),
      system_personality: text(ai.system_personality),
      welcome_message: text(ai.welcome_message, "Hey. What are you thinking about?"),
      greeting_message: text(ai.greeting_message, text(ai.welcome_message, "Hey. What are you thinking about?")),
      suggested_questions: strings(ai.suggested_questions),
      fallback_message: text(ai.fallback_message, "I don't have that personal detail in the portfolio yet."),
      general_fallback_message: text(ai.general_fallback_message, "That topic isn't in the local conversation set yet."),
      general_topics: generalTopics
    }
  };
}

export function canonicalSiteUrl(value: string) {
  try {
    const url = new URL(value);
    return url.protocol === "https:" || url.protocol === "http:" ? url.origin : "";
  } catch {
    return "";
  }
}
