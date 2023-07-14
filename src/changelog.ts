import * as github from '@actions/github'
import * as core from '@actions/core'

async function main() {
  try {
    const headBranch = core.getInput('headBranch')
    const pullRequestTitle = core.getInput('pullRequestTitle')
    const token = core.getInput('myToken')

    const octokit = github.getOctokit(token)


    const diff = await octokit.request('GET /repos/{owner}/{repo}/compare/{basehead}', {
      owner: github.context.repo.owner,
      repo: github.context.repo.repo,
      basehead: `release...${headBranch}`,
      headers: {
        'X-GitHub-Api-Version': '2022-11-28'
      }
    })

    const commitMessages = diff.data.commits.map(commit => `- [${commit.commit.message}](${commit.html_url})`).join('\n')

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
      /### Изменения с прошлого релиза:[\s\S]*### Результаты тестов:/,
      `### Изменения с прошлого релиза:\n\n${commitMessages}\n\n### Результаты тестов:`
    )

    await octokit.request('PATCH /repos/{owner}/{repo}/issues/{issue_number}', {
      owner: github.context.repo.owner,
      repo: github.context.repo.repo,
      issue_number: issue.number,
      body: issueBody,
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
