import * as github from '@actions/github'
import * as core from '@actions/core'

async function main() {
  try {
    const token = core.getInput('myToken')

    const octokit = github.getOctokit(token)

    const responseIssues = await octokit.paginate(octokit.rest.issues.listForRepo, {
      owner: github.context.repo.owner,
      repo: github.context.repo.repo,
      per_page: 100,
      labels: 'release',
      state: 'all',
      headers: {
        'X-GitHub-Api-Version': '2022-11-28'
      }
    })

    const version = responseIssues.length + 1

    await octokit.request('POST /repos/{owner}/{repo}/git/refs', {
      owner: github.context.repo.owner,
      repo: github.context.repo.repo,
      ref: `refs/heads/prerelease-v${version}`,
      sha: github.context.sha,
      headers: {
        'X-GitHub-Api-Version': '2022-11-28'
      }
    })

    const issueBody =
      '## v' + version + '\n\n'
      + '**Дата инициации:** ' + new Date().toLocaleString() + '\n\n'
      + '**Автор:** ' + github.context.repo.owner + '\n\n'
      + '**Дата деплоя:** ' + '\n\n'
      + '### Изменения с прошлого релиза:' + '\n\n'
      + '### Результаты тестов:' + '\n'


    await octokit.request('POST /repos/{owner}/{repo}/issues', {
      owner: github.context.repo.owner,
      repo: github.context.repo.repo,
      title: `release-v${version}`,
      body: issueBody,
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
      title: `release-v${version}`,
      body: 'New release',
      head: `prerelease-v${version}`,
      base: 'release',
      headers: {
        'X-GitHub-Api-Version': '2022-11-28'
      }
    })

  } catch (error) {
    // @ts-ignore
    core.setFailed(error.message)
  }
}

main();
