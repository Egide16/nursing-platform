resource "aws_ecs_cluster" "this" {
  name = "${var.project_name}-cluster"

  setting {
    name  = "containerInsights"
    value = "enabled"
  }
}

resource "aws_cloudwatch_log_group" "app" {
  name              = "/ecs/${var.project_name}"
  retention_in_days = 30
}

# NextAuth needs a stable signing secret — generated once here rather than
# left for someone to set by hand and forget to change from a placeholder.
resource "random_password" "nextauth_secret" {
  length  = 32
  special = false
}

resource "aws_secretsmanager_secret" "nextauth_secret" {
  name = "${var.project_name}/nextauth-secret"
}

resource "aws_secretsmanager_secret_version" "nextauth_secret" {
  secret_id     = aws_secretsmanager_secret.nextauth_secret.id
  secret_string = random_password.nextauth_secret.result
}

# --- IAM ---------------------------------------------------------------

data "aws_iam_policy_document" "ecs_assume" {
  statement {
    actions = ["sts:AssumeRole"]
    principals {
      type        = "Service"
      identifiers = ["ecs-tasks.amazonaws.com"]
    }
  }
}

resource "aws_iam_role" "execution" {
  name               = "${var.project_name}-ecs-execution"
  assume_role_policy = data.aws_iam_policy_document.ecs_assume.json
}

resource "aws_iam_role_policy_attachment" "execution_managed" {
  role       = aws_iam_role.execution.name
  policy_arn = "arn:aws:iam::aws:policy/service-role/AmazonECSTaskExecutionRolePolicy"
}

# The execution role is what pulls secrets in at container start — the
# managed policy above covers ECR/logs, this covers reading the two
# secrets referenced in the task definition below.
data "aws_iam_policy_document" "read_secrets" {
  statement {
    actions   = ["secretsmanager:GetSecretValue"]
    resources = [var.database_url_secret_arn, aws_secretsmanager_secret.nextauth_secret.arn]
  }
}

resource "aws_iam_role_policy" "execution_secrets" {
  name   = "${var.project_name}-read-secrets"
  role   = aws_iam_role.execution.id
  policy = data.aws_iam_policy_document.read_secrets.json
}

# Runtime role for the app itself. Empty for now — add permissions here
# if the app later needs to call other AWS services directly (S3, SES, etc).
resource "aws_iam_role" "task" {
  name               = "${var.project_name}-ecs-task"
  assume_role_policy = data.aws_iam_policy_document.ecs_assume.json
}

# --- Task definition & service ------------------------------------------

resource "aws_ecs_task_definition" "app" {
  family                   = "${var.project_name}-app"
  requires_compatibilities = ["FARGATE"]
  network_mode             = "awsvpc"
  cpu                      = var.app_cpu
  memory                   = var.app_memory
  execution_role_arn       = aws_iam_role.execution.arn
  task_role_arn            = aws_iam_role.task.arn

  container_definitions = jsonencode([
    {
      name      = "${var.project_name}-app"
      image     = "${var.ecr_repository_url}:${var.image_tag}"
      essential = true
      portMappings = [
        { containerPort = var.container_port, protocol = "tcp" }
      ]
      environment = [
        { name = "NODE_ENV", value = "production" },
        { name = "PORT", value = tostring(var.container_port) },
        { name = "NEXTAUTH_URL", value = "https://${var.domain_name}" },
      ]
      secrets = [
        { name = "DATABASE_URL", valueFrom = var.database_url_secret_arn },
        { name = "NEXTAUTH_SECRET", valueFrom = aws_secretsmanager_secret.nextauth_secret.arn },
      ]
      logConfiguration = {
        logDriver = "awslogs"
        options = {
          "awslogs-group"         = aws_cloudwatch_log_group.app.name
          "awslogs-region"        = var.aws_region
          "awslogs-stream-prefix" = "app"
        }
      }
    }
  ])
}

resource "aws_ecs_service" "app" {
  name            = "${var.project_name}-service"
  cluster         = aws_ecs_cluster.this.id
  task_definition = aws_ecs_task_definition.app.arn
  desired_count   = var.desired_count
  launch_type     = "FARGATE"

  network_configuration {
    subnets          = var.private_subnet_ids
    security_groups  = [var.security_group_id]
    assign_public_ip = false
  }

  load_balancer {
    target_group_arn = var.target_group_arn
    container_name    = "${var.project_name}-app"
    container_port    = var.container_port
  }

  deployment_minimum_healthy_percent = 50
  deployment_maximum_percent         = 200

  # Ordering against the HTTPS listener is handled by a depends_on on this
  # whole module at the call site in the root main.tf — depends_on here
  # can't target a plain variable value.

  lifecycle {
    ignore_changes = [task_definition] # let CI-driven deploys update this without a plan diff every time
  }
}

# --- Autoscaling ---------------------------------------------------------

resource "aws_appautoscaling_target" "ecs" {
  max_capacity       = var.max_capacity
  min_capacity       = var.min_capacity
  resource_id        = "service/${aws_ecs_cluster.this.name}/${aws_ecs_service.app.name}"
  scalable_dimension = "ecs:service:DesiredCount"
  service_namespace  = "ecs"
}

resource "aws_appautoscaling_policy" "cpu" {
  name               = "${var.project_name}-cpu-scaling"
  policy_type        = "TargetTrackingScaling"
  resource_id        = aws_appautoscaling_target.ecs.resource_id
  scalable_dimension = aws_appautoscaling_target.ecs.scalable_dimension
  service_namespace  = aws_appautoscaling_target.ecs.service_namespace

  target_tracking_scaling_policy_configuration {
    predefined_metric_specification {
      predefined_metric_type = "ECSServiceAverageCPUUtilization"
    }
    target_value       = 60
    scale_in_cooldown  = 300
    scale_out_cooldown = 60
  }
}
