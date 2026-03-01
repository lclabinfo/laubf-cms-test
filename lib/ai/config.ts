// Centralized AI configuration

export const aiConfig = {
  azure: {
    apiKey: process.env.AZURE_OPENAI_API_KEY || '',
    endpoint: process.env.AZURE_OPENAI_ENDPOINT || '',
    deploymentName: process.env.AZURE_OPENAI_DEPLOYMENT_NAME || '',
    apiVersion: process.env.AZURE_OPENAI_API_VERSION || '2024-12-01-preview',
  },
  youtube: {
    apiKey: process.env.YOUTUBE_API_KEY || '',
  },
}

export function isAzureConfigured(): boolean {
  return !!(aiConfig.azure.apiKey && aiConfig.azure.endpoint && aiConfig.azure.deploymentName)
}

export function isYouTubeConfigured(): boolean {
  return !!aiConfig.youtube.apiKey
}

export class AINotConfiguredError extends Error {
  constructor(service: string) {
    super(
      `${service} is not configured. Please add the required API keys to your environment variables.`
    )
    this.name = 'AINotConfiguredError'
  }
}
