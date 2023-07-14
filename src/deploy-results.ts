import * as github from '@actions/github'
import * as core from '@actions/core'

async function main() {
  try {
    const token = core.getInput('myToken')
    const pullRequestTitle = core.getInput('pullRequestTitle')

    const octokit = github.getOctokit(token)

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
      `**Дата деплоя:** ${new Date().toISOString()}`
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
