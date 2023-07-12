import * as github from '@actions/github'
import * as core from '@actions/core'

async function main() {
  try {
    const name = core.getInput('Name')
    // @ts-ignore
    const token = github.context.token
    const octokit = github.getOctokit(token)

    await octokit.request('POST /repos/{owner}/{repo}/git/refs', {
      owner: github.context.repo.owner,
      repo: github.context.repo.repo,
      ref: `refs/heads/${name}`,
      sha: github.context.sha,
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
