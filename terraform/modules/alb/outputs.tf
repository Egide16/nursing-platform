output "alb_dns_name" {
  value = aws_lb.app.dns_name
}

output "alb_security_group_id" {
  value = aws_security_group.alb.id
}

output "target_group_arn" {
  value = aws_lb_target_group.app.arn
}

output "https_listener_arn" {
  value = aws_lb_listener.https.arn
}

output "app_url" {
  value = "https://${var.domain_name}"
}
