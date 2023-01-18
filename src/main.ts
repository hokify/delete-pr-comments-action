import * as core from '@actions/core'
import * as github from '@actions/github'

async function run(): Promise<void> {
  try {
    const pullNumber = github.context.issue.number

    // eslint-disable-next-line no-console
    console.log('el pull number es: ', pullNumber)

    if (!pullNumber) {
      core.warning('Cannot find the PR id.')
      return
    }

    const token = core.getInput('token', {required: true})
    const bodyContains = core.getInput('bodyContains')
    const noReply = core.getInput('noReply')
    core.debug(`bodyContains: ${JSON.stringify(bodyContains)}`)

    // eslint-disable-next-line no-console
    console.log('el repo owner: ', github.context.repo.owner)
    // eslint-disable-next-line no-console
    console.log('el repo repo: ', github.context.repo.repo)

    const octokit = github.getOctokit(token)
    const response = await octokit.rest.pulls.listReviewComments({
      owner: github.context.repo.owner,
      repo: github.context.repo.repo,
      pull_number: pullNumber,
      per_page: 100,
      sort: 'created',
      direction: 'desc'
    })

    // eslint-disable-next-line no-console
    console.log('el octokit response: ', JSON.stringify(response, null, 6))

    core.debug(`Comment count: ${response.data.length}`)
    core.debug(`Comments: ${JSON.stringify(response.data)}`)

    const commentIdsWithReply = response.data
      .map(({in_reply_to_id}) => in_reply_to_id)
      .filter((id): id is number => !!id)
    const commentIdsWithReplySet = new Set(commentIdsWithReply)

    // eslint-disable-next-line no-console
    console.log(
      'el resultado comment: ',
      JSON.stringify(response.data, null, 6)
    )

    const comments = response.data.filter(comment => {
      if (bodyContains.length > 0 && !comment.body?.includes(bodyContains)) {
        return false
      }

      if (noReply === 'true' && commentIdsWithReplySet.has(comment.id)) {
        return false
      }

      return true
    })

    // eslint-disable-next-line no-console
    console.log('el comentario final: ', JSON.stringify(comments, null, 6))
    core.debug(`Found ${comments.length} comments with match conditions.`)

    for (const comment of comments) {
      await octokit.rest.pulls.deleteReviewComment({
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
