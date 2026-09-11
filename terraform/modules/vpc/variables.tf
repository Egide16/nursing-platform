variable "project_name" {
  type = string
}

variable "vpc_cidr" {
  type    = string
  default = "10.20.0.0/16"
}

variable "azs" {
  description = "Exactly two availability zones to spread subnets across."
  type        = list(string)
}
