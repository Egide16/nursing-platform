data "aws_availability_zones" "available" {
  state = "available"
}

locals {
  azs = slice(data.aws_availability_zones.available.names, 0, 2)
}

module "vpc" {
  source       = "./modules/vpc"
  project_name = var.project_name
  azs          = local.azs
}

module "ecr" {
  source       = "./modules/ecr"
  project_name = var.project_name
}

module "alb" {
  source            = "./modules/alb"
  project_name      = var.project_name
  vpc_id            = module.vpc.vpc_id
  public_subnet_ids = module.vpc.public_subnet_ids
  container_port    = var.container_port
  domain_name       = var.domain_name
  route53_zone_name = var.route53_zone_name
}

# Shared by both the ECS service and the RDS ingress rule. Created here at
# root — rather than inside either module — specifically to avoid a
# circular dependency: RDS needs to know which security group to allow in,
# and ECS needs the RDS secret ARN, so neither module can own this SG.
resource "aws_security_group" "ecs_tasks" {
  name_prefix = "${var.project_name}-ecs-tasks-"
  vpc_id      = module.vpc.vpc_id

  ingress {
    description     = "From the ALB"
    from_port       = var.container_port
    to_port         = var.container_port
    protocol        = "tcp"
    security_groups = [module.alb.alb_security_group_id]
  }

  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }

  lifecycle {
    create_before_destroy = true
  }

  tags = { Name = "${var.project_name}-ecs-tasks-sg" }
}

module "rds" {
  source                     = "./modules/rds"
  project_name               = var.project_name
  vpc_id                     = module.vpc.vpc_id
  private_subnet_ids         = module.vpc.private_subnet_ids
  allowed_security_group_id  = aws_security_group.ecs_tasks.id
  db_name                    = var.db_name
  db_username                = var.db_username
  instance_class             = var.db_instance_class
  allocated_storage          = var.db_allocated_storage
  engine_version             = var.db_engine_version
}

module "ecs" {
  source                   = "./modules/ecs"
  project_name             = var.project_name
  aws_region               = var.aws_region
  private_subnet_ids       = module.vpc.private_subnet_ids
  security_group_id        = aws_security_group.ecs_tasks.id
  ecr_repository_url       = module.ecr.repository_url
  image_tag                = var.image_tag
  container_port           = var.container_port
  domain_name              = var.domain_name
  database_url_secret_arn  = module.rds.database_url_secret_arn
  target_group_arn         = module.alb.target_group_arn
  app_cpu                  = var.app_cpu
  app_memory               = var.app_memory
  desired_count            = var.desired_count
  min_capacity             = var.min_capacity
  max_capacity             = var.max_capacity

  depends_on = [module.alb]
}
