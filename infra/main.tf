terraform {
  required_version = ">= 1.3"
  required_providers {
    azurerm = {
      source  = "hashicorp/azurerm"
      version = "~> 3.0"
    }
  }
}

provider "azurerm" {
  features {}
}

# ── Variables ──────────────────────────────────────────────────────────────────

variable "resource_group_name" {
  description = "Resource group to deploy the Static Web App into."
  type        = string
  default     = "rg-skincare-routine-prod"  
}

variable "location" {
  description = "Azure region. SWA is available in: eastus2, westus2, centralus, westeurope, eastasia."
  type        = string
  default     = "eastasia"
}

variable "app_name" {
  description = "Name for the Static Web App resource."
  type        = string
  default     = "skincare-routine-prod"
}

variable "cosmos_resource_group_name" {
  description = "Resource group of the existing Cosmos DB account."
  type        = string
  default     = "rg-goyl-loadouts-prod"
}

variable "cosmos_account_name" {
  description = "Name of the existing Cosmos DB account."
  type        = string
  default     = "cosmos-goyl-loadouts-prod"
}

variable "cosmos_database_name" {
  description = "Name of the Cosmos DB database."
  type        = string
  default     = "skincare"
}

variable "frontend_url" {
  description = <<-EOT
    Public URL used in password-reset links (e.g. https://my-app.azurestaticapps.net).
    Leave empty on the first apply, then set it once you know the SWA hostname and re-apply.
  EOT
  type        = string
  default     = ""
}

# ── Resource Group ────────────────────────────────────────────────────────────

resource "azurerm_resource_group" "app" {
  name     = var.resource_group_name
  location = var.location
}

# ── Data: existing Cosmos DB ───────────────────────────────────────────────────

data "azurerm_cosmosdb_account" "main" {
  name                = var.cosmos_account_name
  resource_group_name = var.cosmos_resource_group_name
}

# ── Static Web App ─────────────────────────────────────────────────────────────

resource "azurerm_static_web_app" "app" {
  name                = var.app_name
  resource_group_name = azurerm_resource_group.app.name
  location            = azurerm_resource_group.app.location

  # Free tier is sufficient for a personal app.
  # Upgrade to "Standard" if you need SLA guarantees or >0.5 GB app size.
  sku_tier = "Free"
  sku_size = "Free"

  app_settings = {
    COSMOS_ENDPOINT  = data.azurerm_cosmosdb_account.main.endpoint
    COSMOS_KEY       = data.azurerm_cosmosdb_account.main.primary_key
    COSMOS_DATABASE  = var.cosmos_database_name
    FRONTEND_URL     = var.frontend_url
  }
}

# ── Outputs ────────────────────────────────────────────────────────────────────

output "url" {
  description = "Public URL of the deployed app."
  value       = "https://${azurerm_static_web_app.app.default_host_name}"
}

output "deployment_token" {
  description = "Deployment token — set this as AZURE_STATIC_WEB_APPS_API_TOKEN in your CI/CD pipeline or use it with the SWA CLI."
  value       = azurerm_static_web_app.app.api_key
  sensitive   = true
}
