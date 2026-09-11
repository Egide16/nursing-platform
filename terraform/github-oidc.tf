# Lets GitHub Actions assume an AWS role using short-lived OIDC tokens
# instead of long-lived access keys stored as repo secrets. Only created
# when var.github_repos is non-empty (see terraform.tfvars).
#
# This does mean the very first `terraform apply` has to run with your own
# AWS credentials before CI can take over — that's expected and normal.

locals {
  create_oidc = length(var.github_repos) > 0
}

data "tls_certificate" "github" {
  count = local.create_oidc ? 1 : 0
  url   = "https://token.actions.githubusercontent.com/.well-known/openid-configuration"
}

resource "aws_iam_openid_connect_provider" "github" {
  count           = local.create_oidc ? 1 : 0
  url             = "https://token.actions.githubusercontent.com"
  client_id_list  = ["sts.amazonaws.com"]
  thumbprint_list = [data.tls_certificate.github[0].certificates[0].sha1_fingerprint]
}

data "aws_iam_policy_document" "github_assume" {
  count = local.create_oidc ? 1 : 0

  statement {
    actions = ["sts:AssumeRoleWithWebIdentity"]
    principals {
      type        = "Federated"
      identifiers = [aws_iam_openid_connect_provider.github[0].arn]
    }
    condition {
      test     = "StringEquals"
      variable = "token.actions.githubusercontent.com:aud"
      values   = ["sts.amazonaws.com"]
    }
    condition {
      test     = "StringLike"
      variable = "token.actions.githubusercontent.com:sub"
      # Wildcard per repo (any branch, any PR, any event) rather than
      # locking to "ref:refs/heads/main" — terraform.yml's plan job runs
      # on pull_request events too, which carry a different sub claim
      # (refs/pull/N/merge, not refs/heads/main), so a main-only condition
      # would let apply work but leave PR-triggered plans unable to
      # authenticate. Still scoped to exactly the repos you name below —
      # not open to every repo in your account.
      values = [for r in var.github_repos : "repo:${r}:*"]
    }
  }
}

resource "aws_iam_role" "github_actions" {
  count              = local.create_oidc ? 1 : 0
  name               = "${var.project_name}-github-actions"
  assume_role_policy = data.aws_iam_policy_document.github_assume[0].json
}

# Broad-ish for a sample (ECR push, ECS deploy, and Terraform itself needs
# to manage most of what's in this repo). Tighten to only the specific
# actions/resources you need before treating this as production-grade.
resource "aws_iam_role_policy_attachment" "github_actions_admin" {
  count      = local.create_oidc ? 1 : 0
  role       = aws_iam_role.github_actions[0].name
  policy_arn = "arn:aws:iam::aws:policy/PowerUserAccess"
}

output "github_actions_role_arn" {
  value = local.create_oidc ? aws_iam_role.github_actions[0].arn : null
}
