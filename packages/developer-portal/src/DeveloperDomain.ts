export interface DeveloperAccount {
  id: string;
  email: string;
  name: string;
  createdAt: string;
}

export interface DeveloperOrganization {
  id: string;
  name: string;
  developerId: string;
  createdAt: string;
}

export interface DeveloperApplication {
  id: string;
  name: string;
  developerId: string;
  description: string;
  permissions: string[];
  createdAt: string;
}

export interface DeveloperOAuthClient {
  id: string;
  name: string;
  developerId: string;
  clientId: string;
  clientSecret: string;
  redirectUris: string[];
  scopes: string[];
  createdAt: string;
}