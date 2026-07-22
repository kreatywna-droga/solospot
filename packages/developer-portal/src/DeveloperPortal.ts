import { DeveloperAccount, DeveloperOrganization, DeveloperApplication, DeveloperOAuthClient } from './DeveloperDomain';

export class DeveloperPortal {
  private accounts: Map<string, DeveloperAccount> = new Map();
  private organizations: Map<string, DeveloperOrganization> = new Map();
  private applications: Map<string, DeveloperApplication> = new Map();
  private oauthClients: Map<string, DeveloperOAuthClient> = new Map();

  registerAccount(account: DeveloperAccount): DeveloperAccount {
    this.accounts.set(account.id, account);
    return account;
  }

  createOrganization(organization: DeveloperOrganization): DeveloperOrganization {
    this.organizations.set(organization.id, organization);
    return organization;
  }

  createApplication(application: DeveloperApplication): DeveloperApplication {
    this.applications.set(application.id, application);
    return application;
  }

  createOAuthClient(client: DeveloperOAuthClient): DeveloperOAuthClient {
    this.oauthClients.set(client.id, client);
    return client;
  }

  getAccount(id: string): DeveloperAccount | undefined {
    return this.accounts.get(id);
  }

  getApplications(developerId: string): DeveloperApplication[] {
    return Array.from(this.applications.values()).filter(a => a.developerId === developerId);
  }

  listOAuthClients(organizationId: string): DeveloperOAuthClient[] {
    return Array.from(this.oauthClients.values()).filter(c => {
      const org = this.organizations.get(c.developerId);
      return org?.id === organizationId;
    });
  }
}