import * as github from '@actions/github'
import * as core from '@actions/core'

async function main() {
  try {
    const name = core.getInput('Name')
    const token = core.getInput('myToken')

    const octokit = github.getOctokit(token)

    await octokit.request('POST /repos/{owner}/{repo}/git/refs', {
      owner: github.context.repo.owner,
      repo: github.context.repo.repo,
      ref: `refs/heads/prerelease-${name}`,
      sha: github.context.sha,
      headers: {
        'X-GitHub-Api-Version': '2022-11-28'
      }
    })

    const diff = await octokit.request('GET /repos/{owner}/{repo}/compare/{basehead}', {
      owner: github.context.repo.owner,
      repo: github.context.repo.repo,
      basehead: `prerelease-${name}...release`,
      headers: {
        'X-GitHub-Api-Version': '2022-11-28'
      }
    })

    const commitMessages = diff.data.commits.map(commit => commit.commit.message).join('\n')

    await octokit.request('POST /repos/{owner}/{repo}/issues', {
      owner: github.context.repo.owner,
      repo: github.context.repo.repo,
      title: `release-${name}`,
      body: `
        Дата инициации: ${new Date().toISOString()}\n
        ${commitMessages}
      `,
      labels: [
        'release'
      ],
      headers: {
        'X-GitHub-Api-Version': '2022-11-28'
      }
    })

    await octokit.request('POST /repos/{owner}/{repo}/pulls', {
      owner: github.context.repo.owner,
      repo: github.context.repo.repo,
      title: `Release-${name}`,
      body: 'New release',
      head: `prerelease-${name}`,
      base: 'release',
      headers: {
        'X-GitHub-Api-Version': '2022-11-28'
      }
    })

    core.info(commitMessages)

  } catch (error) {
    // @ts-ignore
    core.setFailed(error.message)
  }
}

main();
