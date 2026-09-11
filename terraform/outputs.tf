output "app_url" {
  description = "The URL the platform is served on once DNS + cert validation finish."
  value       = module.alb.app_url
}

output "alb_dns_name" {
  value = module.alb.alb_dns_name
}

output "ecr_repository_url" {
  description = "Push your Docker image here — see the deploy.yml workflow."
  value       = module.ecr.repository_url
}

output "ecs_cluster_name" {
  value = module.ecs.cluster_name
}

output "ecs_service_name" {
  value = module.ecs.service_name
}

output "db_endpoint" {
  value     = module.rds.db_endpoint
  sensitive = true
}
