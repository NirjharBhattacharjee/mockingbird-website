const REPO = 'https://github.com/NirjharBhattacharjee/mockingbird'

export const links = {
  repo: REPO,
  releases: `${REPO}/releases`,
  issues: `${REPO}/issues`,
  newIssue: `${REPO}/issues/new/choose`,
  issue: (n: number) => `${REPO}/issues/${n}`,
  license: `${REPO}/blob/main/LICENSE`,
  contributing: `${REPO}/blob/main/CONTRIBUTING.md`,
  // the docs live on this site, rendered from the repo's docs/
  docs: '/docs',
  troubleshooting: '/docs#troubleshooting',
  manualInstall: '/docs#manual-install',
  architecture: '/docs/architecture',
  models: '/docs/models',
  privacy: '/docs/privacy',
  philosophy: '/docs/philosophy',
}

export const install = {
  brew: 'brew install nirjharbhattacharjee/mockingbird/mockingbird',
  pull: 'mockingbird models pull',
  script:
    'curl -fsSL https://raw.githubusercontent.com/NirjharBhattacharjee/mockingbird/main/scripts/install.sh | bash',
}
