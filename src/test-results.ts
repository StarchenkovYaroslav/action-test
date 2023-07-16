import * as github from '@actions/github'
import * as core from '@actions/core'

async function main() {
  try {
    const token = core.getInput('myToken')
    const jobName = core.getInput('jobName')
    const pullRequestTitle = core.getInput('pullRequestTitle')

    const octokit = github.getOctokit(token)

    const responseJobs = await octokit.request('GET /repos/{owner}/{repo}/actions/runs/{run_id}/jobs', {
      owner: github.context.repo.owner,
      repo: github.context.repo.repo,
      run_id: github.context.runId,
      headers: {
        'X-GitHub-Api-Version': '2022-11-28'
      }
    })

    const testJob = responseJobs.data.jobs.find(job => job.name === jobName)
    if (!testJob) {
      core.setFailed('job not found')
      return
    }

    const jobInfo = `- [${testJob.name}](${testJob.html_url}): ${new Date().toLocaleString()} | ${testJob.conclusion}`

    const responseIssues = await octokit.paginate(octokit.rest.issues.listForRepo, {
      owner: github.context.repo.owner,
      repo: github.context.repo.repo,
      per_page: 100,
      labels: 'release',
      headers: {
        'X-GitHub-Api-Version': '2022-11-28'
      }
    })

    const issue = responseIssues.find(issue => issue.title === pullRequestTitle)
    if (!issue) {
      core.setFailed('issue not found')
      return
    }

    const issueBody = issue.body?.replace(/### Результаты тестов:[\s\S]*/, `$&\n${jobInfo}`)

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
