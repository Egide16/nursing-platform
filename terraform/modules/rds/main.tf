resource "random_password" "db" {
  length  = 24
  special = false # keep it URL-safe since it goes straight into a connection string
}

resource "aws_db_subnet_group" "this" {
  name       = "${var.project_name}-db-subnets"
  subnet_ids = var.private_subnet_ids
}

resource "aws_security_group" "db" {
  name_prefix = "${var.project_name}-db-"
  vpc_id      = var.vpc_id

  ingress {
    description     = "Postgres from ECS tasks"
    from_port       = 5432
    to_port         = 5432
    protocol        = "tcp"
    security_groups = [var.allowed_security_group_id]
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

  tags = { Name = "${var.project_name}-db-sg" }
}

resource "aws_db_instance" "this" {
  identifier     = "${var.project_name}-db"
  engine         = "postgres"
  engine_version = var.engine_version

  instance_class    = var.instance_class
  allocated_storage = var.allocated_storage
  storage_type      = "gp3"
  storage_encrypted = true

  db_name  = var.db_name
  username = var.db_username
  password = random_password.db.result

  db_subnet_group_name   = aws_db_subnet_group.this.name
  vpc_security_group_ids = [aws_security_group.db.id]
  publicly_accessible    = false
  multi_az               = false # bump to true for production HA

  backup_retention_period = 7
  deletion_protection     = false # flip to true once this holds real data
  skip_final_snapshot     = true  # sample only — set false + snapshot ID for production

  tags = { Name = "${var.project_name}-db" }
}

# Full connection string, stored so the ECS task definition can inject it
# as a single secret rather than assembling it from parts at runtime.
resource "aws_secretsmanager_secret" "database_url" {
  name = "${var.project_name}/database-url"
}

resource "aws_secretsmanager_secret_version" "database_url" {
  secret_id = aws_secretsmanager_secret.database_url.id
  secret_string = "postgresql://${var.db_username}:${random_password.db.result}@${aws_db_instance.this.endpoint}/${var.db_name}?schema=public&sslmode=require"
}
