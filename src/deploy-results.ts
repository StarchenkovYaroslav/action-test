import * as github from '@actions/github'
import * as core from '@actions/core'

async function main() {
  try {
    const token = core.getInput('myToken')
    const pullRequestTitle = core.getInput('pullRequestTitle')
    const pullRequestNumber = core.getInput('pullRequestNumber')

    const releaseVersion = pullRequestTitle.replace('release-v', '')

    const octokit = github.getOctokit(token)

    const responsePull = await octokit.request('GET /repos/{owner}/{repo}/pulls/{pull_number}/commits', {
      owner: github.context.repo.owner,
      repo: github.context.repo.repo,
      pull_number: Number(pullRequestNumber),
      headers: {
        'X-GitHub-Api-Version': '2022-11-28'
      }
    })

    const commitSHA = responsePull.data[responsePull.data.length - 1].sha

    const releaseStateLink = `[Состояние деплоя](https://github.com/StarchenkovYaroslav/shri-ci/tree/${commitSHA})`

    await octokit.request('POST /repos/{owner}/{repo}/git/refs', {
      owner: github.context.repo.owner,
      repo: github.context.repo.repo,
      ref: `refs/tags/v${releaseVersion}`,
      sha: commitSHA,
      headers: {
        'X-GitHub-Api-Version': '2022-11-28'
      }
    })

    const responseRun = await octokit.request('GET /repos/{owner}/{repo}/actions/runs/{run_id}', {
      owner: github.context.repo.owner,
      repo: github.context.repo.repo,
      run_id: github.context.runId,
      headers: {
        'X-GitHub-Api-Version': '2022-11-28'
      }
    })

    const artLink = `[Страница с артефактом](${responseRun.data.html_url})`

    const responseIssues = await octokit.request('GET /repos/{owner}/{repo}/issues', {
      owner: github.context.repo.owner,
      repo: github.context.repo.repo,
      labels: 'release',
      headers: {
        'X-GitHub-Api-Version': '2022-11-28'
      }
    })

    const issue = responseIssues.data.find(issue => issue.title === pullRequestTitle)
    if (!issue) {
      core.setFailed('issue not found')
      return
    }

    const issueBody = issue.body?.replace(
      '**Дата деплоя:**',
      `**Дата деплоя:** ${new Date().toLocaleString()}\n\n${artLink}\n\n${releaseStateLink}`
    )

    await octokit.request('PATCH /repos/{owner}/{repo}/issues/{issue_number}', {
      owner: github.context.repo.owner,
      repo: github.context.repo.repo,
      issue_number: issue.number,
      body: issueBody,
      state: 'closed',
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
