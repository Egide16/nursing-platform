# Infrastructure (Terraform)

Terraform for running this app on AWS. Lives alongside the app in the same
repo — see the note on that below.

## Architecture

```
                    Route 53 (existing zone)
                            |
                    ACM cert (DNS-validated)
                            |
                    Application Load Balancer  (public subnets)
                            |
                    ECS Fargate service        (private subnets)
                     - 2 tasks by default, autoscales 1-4 on CPU
                            |
                    RDS Postgres               (private subnets)

    ECR repository holds the app's Docker image.
    Secrets Manager holds DATABASE_URL and NEXTAUTH_SECRET, injected
    into the container at start — never baked into the image or logged.
```

One VPC, two AZs, one NAT gateway (see the note in `modules/vpc/main.tf`
about upgrading to one-per-AZ later). Everything is one environment
("production") for now — see "Adding a second environment" below for how
to extend this when staging is needed.

## Layout

```
terraform/
  main.tf, variables.tf, outputs.tf   — root module, wires everything together
  github-oidc.tf                      — GitHub Actions IAM role
  modules/
    vpc/     — VPC, subnets, routing, NAT
    ecr/     — Docker image repository
    alb/     — Load balancer, ACM cert, Route 53 record
    rds/     — Postgres + its secret
    ecs/     — Cluster, task definition, service, autoscaling, IAM

Elsewhere in the repo:
  Dockerfile, .dockerignore           — at repo root (needs the app source as build context)
  .github/workflows/
    terraform.yml — plan on PR touching terraform/**, apply on merge to main
    deploy.yml    — build image, run migrations, deploy to ECS on app code changes
```

## First-time setup

1. **Prerequisites**: an AWS account, a domain already in Route 53, and
   the AWS CLI configured locally with credentials that can create the
   resources below (this first apply happens with your own credentials —
   CI takes over after).
2. `cd terraform && terraform init`
3. `terraform.tfvars` is already filled in with real values for this
   deployment (domain, region, repo name) — it's gitignored, so it stays
   local and never gets pushed.
4. `terraform plan`, review it, then `terraform apply`.
5. First apply will fail to find an image in ECR (nothing's been pushed
   yet) — that's expected. Build and push once by hand to get the
   service healthy the first time. Run this from the **repo root**
   (not from `terraform/`) since that's where the Dockerfile is:
   ```
   aws ecr get-login-password --region us-east-1 | docker login --username AWS --password-stdin <account>.dkr.ecr.us-east-1.amazonaws.com
   docker build -t <ecr_repository_url>:latest .
   docker push <ecr_repository_url>:latest
   aws ecs update-service --cluster nursing-platform-cluster --service nursing-platform-service --force-new-deployment
   ```
6. Run the initial migration + seed once, the same way `deploy.yml`
   does it for migrations (`aws ecs run-task ... --overrides
   '{"containerOverrides":[{"name":"nursing-platform-app","command":["npx","prisma","migrate","deploy"]}]}'`),
   and again with `["npm","run","seed"]` if you want the seeded demo
   accounts in this environment.
7. After DNS + ACM validation propagate (usually a few minutes),
   `terraform output app_url` is live.

## One repo, two independent pipelines

The app and its infrastructure live in one repo, but on purpose have
**separate** CI workflows rather than one combined pipeline:

- **`terraform.yml`** only triggers on changes under `terraform/**` —
  `terraform plan` on every PR, `terraform apply` on merge to `main`.
  Add a required reviewer on the `production` GitHub Environment
  (Settings → Environments) if you want a manual approval gate before
  apply runs.
- **`deploy.yml`** triggers on everything *except* `terraform/**` and
  `*.md` — builds the Docker image, pushes it to ECR, runs
  `prisma migrate deploy` as a one-off Fargate task, then rolls the ECS
  service to the new image.

That split matters even in one repo: app code ships far more often than
infrastructure does, so a combined pipeline would mean every small code
fix re-plans your entire AWS setup for no reason, and every infra tweak
would rebuild and redeploy the app unnecessarily.

Both workflows authenticate to AWS via GitHub's OIDC provider rather than
long-lived access keys. `github_repos` in `terraform.tfvars` is already
set to `["Egide16/nursing-platform"]` — Terraform creates the IAM role
for you (`github-oidc.tf`). After `terraform apply`, run
`terraform output github_actions_role_arn` and add it as a repo secret
named `AWS_GITHUB_ACTIONS_ROLE_ARN` (Settings → Secrets and variables →
Actions) — one secret covers both workflows since they're in the same
repo.

## What's deliberately left for you to decide

- **A second NAT gateway per AZ** for real HA — currently one NAT gateway
  is a single point of failure for outbound traffic from private subnets
  (inbound app traffic through the ALB is unaffected).
- **`multi_az = true`** on RDS once this holds real resident/company
  data — currently single-AZ to keep sample costs down.
- **`deletion_protection` and a real final snapshot policy** on RDS
  before this is anything but a sandbox.
- **Remote state** (S3 + DynamoDB lock table) — see the commented block
  in `versions.tf`. Local state works for one person kicking the tires;
  it will cause conflicts the moment two people or CI and a human both
  run `terraform apply`.
- **Tighter IAM on the GitHub Actions role** — it currently uses
  `PowerUserAccess` for simplicity. Worth narrowing to exactly the
  actions these workflows use (ECR push, ECS deploy, and whatever
  Terraform needs to manage).
- **A WAF in front of the ALB** if this becomes internet-facing at scale
  — not included here.

## Adding a second environment (e.g. staging)

This root module isn't parameterized by environment yet. The
straightforward path: duplicate the `terraform/` directory's *backend
config* (not the modules) using Terraform workspaces, or an
`environments/staging` and `environments/production` split that both
point at the same `modules/`, each with its own `.tfvars` and state file.
Worth doing before a second person needs an isolated place to test
changes.
