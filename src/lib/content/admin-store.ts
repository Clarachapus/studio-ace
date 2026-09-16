import "server-only";
import { promises as fs } from "node:fs";
import path from "node:path";
import { getContentStore, type ContentStore } from "./store";
import { GitHubContentStore } from "./github-store";

/** Online editing is on when the site knows its GitHub repository and has a token to write to it. */
export function onlineStorage(): boolean {
  return Boolean(process.env.GITHUB_TOKEN && process.env.GITHUB_REPO);
}

let github: GitHubContentStore | null = null;

function githubStore(): GitHubContentStore {
  if (!github) {
    github = new GitHubContentStore({
      token: process.env.GITHUB_TOKEN ?? "",
      repo: process.env.GITHUB_REPO ?? "",
      branch: process.env.GITHUB_BRANCH,
    });
  }
  return github;
}

/** Store used by the editor: the GitHub repository online, the local files otherwise. */
export function getAdminStore(): ContentStore {
  return onlineStorage() ? githubStore() : getContentStore();
}

const mediaPattern = /^\/media\/[a-z0-9/_.-]+$/i;

/** Bytes of an image for the editor's previews, including photos saved online but not yet republished. */
export async function readAdminMedia(publicPath: string): Promise<Buffer | null> {
  if (!mediaPattern.test(publicPath) || publicPath.includes("..")) return null;
  if (onlineStorage()) return githubStore().readBytes(`public${publicPath}`);
  try {
    return await fs.readFile(path.join(process.cwd(), "public", publicPath));
  } catch {
    return null;
  }
}
