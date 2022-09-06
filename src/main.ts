import * as core from '@actions/core'
import * as github from '@actions/github'

async function run(): Promise<void> {
  try {
    const issueNumber = github.context.issue.number
    if (!issueNumber) {
      throw new Error('Could not get pull request number from context, exiting')
    }

    const token = core.getInput('token', {required: true})
    const bodyContains = core.getInput('bodyContains', {required: true})

    const octokit = github.getOctokit(token)
    const response = await octokit.rest.issues.listComments({
      owner: github.context.repo.owner,
      repo: github.context.repo.repo,
      issue_number: issueNumber
    })

    const comments = response.data.filter(comment => {
      return comment.body?.includes(bodyContains)
    })

    for (const comment of comments) {
      await octokit.rest.issues.deleteComment({
        owner: github.context.repo.owner,
        repo: github.context.repo.repo,
        comment_id: comment.id
      })
    }
  } catch (error) {
    if (error instanceof Error) core.setFailed(error.message)
  }
}

run()
