# GraphQL Queries Reference

## Fetch review threads (paginated)

GraphQL reports the CodeRabbit bot as `coderabbitai`, without the `[bot]` suffix. Keep threads where `isResolved` is false and the first comment's `author.login` matches `coderabbit`.

```bash
gh api graphql --paginate -f query='
query($endCursor: String) {
  repository(owner: "OWNER", name: "REPO") {
    pullRequest(number: PR_NUMBER) {
      reviewThreads(first: 100, after: $endCursor) {
        pageInfo { hasNextPage endCursor }
        nodes {
          id
          isResolved
          isOutdated
          comments(first: 1) {
            nodes { databaseId body path line author { login } }
          }
        }
      }
    }
  }
}' --jq '.data.repository.pullRequest.reviewThreads.nodes[]
  | select(.isResolved | not)
  | select(.comments.nodes[0].author.login | test("coderabbit"; "i"))'
```

`comments.nodes[0].databaseId` is the REST comment id for replying with `pulls/<PR>/comments/<id>/replies`.

## Batch-resolve threads

```graphql
mutation {
  t1: resolveReviewThread(input: {threadId: "ID1"}) { thread { isResolved } }
  t2: resolveReviewThread(input: {threadId: "ID2"}) { thread { isResolved } }
}
```
