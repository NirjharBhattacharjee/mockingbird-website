const REPO = 'https://github.com/NirjharBhattacharjee/mockingbird'

export const links = {
  repo: REPO,
  releases: `${REPO}/releases`,
  issues: `${REPO}/issues`,
  newIssue: `${REPO}/issues/new/choose`,
  license: `${REPO}/blob/main/LICENSE`,
  docs: `${REPO}/blob/main/docs/README.md`,
  troubleshooting: `${REPO}/blob/main/docs/README.md#troubleshooting`,
  manualInstall: `${REPO}/blob/main/docs/README.md#manual-install`,
  architecture: `${REPO}/blob/main/docs/ARCHITECTURE.md`,
  models: `${REPO}/blob/main/docs/MODELS.md`,
  privacy: `${REPO}/blob/main/docs/SECURITY_PRIVACY.md`,
  philosophy: `${REPO}/blob/main/docs/PHILOSOPHY.md`,
  contributing: `${REPO}/blob/main/CONTRIBUTING.md`,
}

export const install = {
  brew: 'brew install nirjharbhattacharjee/mockingbird/mockingbird',
  pull: 'mockingbird models pull',
  script:
    'curl -fsSL https://raw.githubusercontent.com/NirjharBhattacharjee/mockingbird/main/scripts/install.sh | bash',
}
