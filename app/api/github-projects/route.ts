import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

type GitHubRepo = {
  id: number;
  name: string;
  description: string | null;
  html_url: string;
  private: boolean;
  language: string | null;
  updated_at: string;
  owner: {
    login: string;
  };
};

function getGitHubToken() {
  return process.env.GITHUB_API_KEY || process.env.GITHUB_TOKEN;
}

export async function GET() {
  const token = getGitHubToken();

  if (!token) {
    return NextResponse.json(
      {
        ok: false,
        error: "Configure GITHUB_API_KEY ou GITHUB_TOKEN para carregar os repositorios.",
      },
      { status: 500 },
    );
  }

  const repos: GitHubRepo[] = [];
  let page = 1;

  while (true) {
    const response = await fetch(
      `https://api.github.com/user/repos?visibility=all&affiliation=owner&sort=updated&direction=desc&per_page=100&page=${page}`,
      {
        headers: {
          Accept: "application/vnd.github+json",
          Authorization: `Bearer ${token}`,
          "X-GitHub-Api-Version": "2022-11-28",
        },
        cache: "no-store",
      },
    );

    if (!response.ok) {
      const errorText = await response.text();

      return NextResponse.json(
        {
          ok: false,
          error: "Falha ao consultar os repositorios no GitHub.",
          details: errorText,
        },
        { status: response.status },
      );
    }

    const currentPageRepos = (await response.json()) as GitHubRepo[];
    repos.push(...currentPageRepos);

    if (currentPageRepos.length < 100) {
      break;
    }

    page += 1;
  }

  return NextResponse.json({
    ok: true,
    repos: repos.map((repo) => ({
      id: repo.id,
      name: repo.name,
      owner: repo.owner.login,
      description: repo.description,
      htmlUrl: repo.html_url,
      isPrivate: repo.private,
      language: repo.language,
      updatedAt: repo.updated_at,
    })),
  });
}

export async function PATCH(request: Request) {
  const token = getGitHubToken();

  if (!token) {
    return NextResponse.json(
      {
        ok: false,
        error: "Configure GITHUB_API_KEY ou GITHUB_TOKEN para atualizar os repositorios.",
      },
      { status: 500 },
    );
  }

  const payload = (await request.json()) as {
    owner?: string;
    name?: string;
    description?: string;
  };

  const owner = payload.owner?.trim();
  const name = payload.name?.trim();
  const description = payload.description?.trim() ?? "";

  if (!owner || !name) {
    return NextResponse.json(
      {
        ok: false,
        error: "owner e name sao obrigatorios.",
      },
      { status: 400 },
    );
  }

  if (description.length > 200) {
    return NextResponse.json(
      {
        ok: false,
        error: "A descricao deve ter no maximo 200 caracteres.",
      },
      { status: 400 },
    );
  }

  const response = await fetch(`https://api.github.com/repos/${owner}/${name}`, {
    method: "PATCH",
    headers: {
      Accept: "application/vnd.github+json",
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
      "X-GitHub-Api-Version": "2022-11-28",
    },
    body: JSON.stringify({
      description,
    }),
    cache: "no-store",
  });

  if (!response.ok) {
    const errorText = await response.text();

    return NextResponse.json(
      {
        ok: false,
        error: "Falha ao atualizar a descricao no GitHub.",
        details: errorText,
      },
      { status: response.status },
    );
  }

  const repo = (await response.json()) as GitHubRepo;

  return NextResponse.json({
    ok: true,
    repo: {
      id: repo.id,
      name: repo.name,
      owner: repo.owner.login,
      description: repo.description,
      htmlUrl: repo.html_url,
      isPrivate: repo.private,
      language: repo.language,
      updatedAt: repo.updated_at,
    },
  });
}
