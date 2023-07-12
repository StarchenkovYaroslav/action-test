import * as github from '@actions/github'
import * as core from '@actions/core'

async function main() {
  try {
    const name = core.getInput('Name')
    const token = core.getInput('myToken')
    const octokit = github.getOctokit(token)

    await octokit.request('POST /repos/{owner}/{repo}/git/refs', {
      owner: '{owner}',
      repo: '{repo}',
      ref: `refs/heads/${name}`,
      sha: '9a0ec64fc1036243cbae9b62510a089109ea7716',
      headers: {
        'X-GitHub-Api-Version': '2022-11-28'
      }
    })

  } catch (error) {
    // @ts-ignore
    core.setFailed(`token ${token}`)
  }
}

main();
