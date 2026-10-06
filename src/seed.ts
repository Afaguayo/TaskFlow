import type { Priority } from "./domain/Priority";
import { TASK_STATUSES, type TaskStatus } from "./domain/TaskStatus";
import type { TaskService } from "./services/TaskService";

interface SeedTask {
  title: string;
  description: string;
  priority: Priority;
  status: TaskStatus;
}

/**
 * First-visit content: my real maintenance backlog for the repos on
 * github.com/Afaguayo, from an audit on 2026-10-05. The board manages its
 * own author's work (dogfooding), so the demo is never empty.
 */
const BACKLOG: readonly SeedTask[] = [
  // ---- To Do ---------------------------------------------------------------
  {
    title: "PortfolioWeb: add a README at the repo root",
    description:
      "The app lives in my-portfolio/ and the root has no README or .gitignore. Add a screenshot, the live link, the stack and how the GitHub/Spotify data is fetched.",
    priority: "high",
    status: "todo",
  },
  {
    title: "Keylogger-project: add a README with scope and ethics",
    description:
      "One file, no README. State it is educational, only for machines you own or have consent on, and explain how it works. Or make it private.",
    priority: "high",
    status: "todo",
  },
  {
    title: "Pin TaskFlow on my GitHub profile",
    description: "Profile → Customize your pins → tick TaskFlow. GitHub has no API for pins, so this one is manual.",
    priority: "high",
    status: "todo",
  },
  {
    title: "Add descriptions to AI-project and hackathon",
    description:
      "Both show no description on the profile or the portfolio grid.",
    priority: "medium",
    status: "todo",
  },
  {
    title: "Add topics to every repo",
    description:
      "Only brochacho and TaskFlow have topics. Add language, domain and framework tags so the repos show up in GitHub search.",
    priority: "medium",
    status: "todo",
  },
  {
    title: "Add a LICENSE to repos that have none",
    description:
      "Only brochacho, emailleakscanner and TaskFlow are licensed. Without one, nobody can legally reuse the code. MIT for personal projects; check class rules for course work.",
    priority: "medium",
    status: "todo",
  },
  {
    title: "Add CI to repos that have none",
    description:
      "AI-chess (unittest, 40 tests), brochacho (PSScriptAnalyzer + shellcheck), hackathon (lint + build; Vercel already deploys).",
    priority: "medium",
    status: "todo",
  },
  {
    title: "Rename YtDowloaderTool to YtDownloaderTool",
    description:
      "Typo in the name. GitHub redirects the old URL; update the profile README, local remotes and vault links.",
    priority: "low",
    status: "todo",
  },
  {
    title: "hackathon: rename to the project's real name",
    description:
      "It's deployed as Reading Companion on Vercel. Give the repo that name, a description, and link the live site in the README header.",
    priority: "low",
    status: "todo",
  },
  {
    title: "AI-project: describe what it is",
    description: "No description and a short README. Add the goal, approach and how to run it, or archive it.",
    priority: "low",
    status: "todo",
  },
  {
    title: "brochacho: lint scripts in CI",
    description: "No tests or CI yet. Run PSScriptAnalyzer and shellcheck on push; add Pester tests for the wake tools.",
    priority: "low",
    status: "todo",
  },
  // ---- In Progress -----------------------------------------------------------
  {
    title: "Separate class projects from my own work",
    description:
      "Portfolio: collapsed Coursework section. Profile README: class repos folded into a 🎓 dropdown, TaskFlow added. Left: archive the old Minecraft agent repo.",
    priority: "high",
    status: "review",
  },
  {
    title: "Unify README format across repos",
    description:
      "Same order everywhere: one-line pitch, screenshot, features, how to run, how it works. Steelseries-Gamesence and emailleakscanner are the model.",
    priority: "medium",
    status: "in_progress",
  },
  // ---- Review ----------------------------------------------------------------
  {
    title: "TaskFlow: Review column",
    description: "Added by editing only TaskStatus.ts: Open/Closed in practice. Check that it works on a phone.",
    priority: "medium",
    status: "review",
  },
  // ---- Done ------------------------------------------------------------------
  {
    title: "Audit all public repos",
    description: "Checked 20 repos for README, license, topics, CI, tests, committed junk and naming. Findings are the cards on this board.",
    priority: "high",
    status: "done",
  },
  {
    title: "Add TaskFlow to the profile README (EN + ES)",
    description: "Added to the Quest Log in README.md and README.es.md.",
    priority: "medium",
    status: "done",
  },
  {
    title: "Ship TaskFlow",
    description: "Layered TypeScript app with tests, CI and GitHub Pages deploy.",
    priority: "high",
    status: "done",
  },
];

export function seedDemoTasks(service: TaskService): void {
  for (const { status, ...input } of BACKLOG) {
    const { id } = service.create(input);
    // Walk the task through the workflow, so seeding obeys the same rules as users.
    for (let i = 0; i < TASK_STATUSES.indexOf(status); i++) service.step(id, 1);
  }
}
