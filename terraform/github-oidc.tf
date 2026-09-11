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
      values   = [for r in var.github_repos : "repo:${split("/", r)[0]}*/${split("/", r)[1]}*:*"]
    }
  }
}

resource "aws_iam_role" "github_actions" {
  count              = local.create_oidc ? 1 : 0
  name               = "${var.project_name}-github-actions"
  assume_role_policy = data.aws_iam_policy_document.github_assume[0].json
}

resource "aws_iam_role_policy_attachment" "github_actions_admin" {
  count      = local.create_oidc ? 1 : 0
  role       = aws_iam_role.github_actions[0].name
  policy_arn = "arn:aws:iam::aws:policy/PowerUserAccess"
}

resource "aws_iam_role_policy" "github_actions_pass_role" {
  count = local.create_oidc ? 1 : 0
  name  = "${var.project_name}-pass-ecs-roles"
  role  = aws_iam_role.github_actions[0].id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect   = "Allow"
        Action   = "iam:PassRole"
        Resource = [module.ecs.execution_role_arn, module.ecs.task_role_arn]
      }
    ]
  })
}

output "github_actions_role_arn" {
  value = local.create_oidc ? aws_iam_role.github_actions[0].arn : null
}
