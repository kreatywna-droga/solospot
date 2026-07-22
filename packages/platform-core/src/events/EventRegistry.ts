/**
 * The EventRegistry maintains the catalog of official and validated event types
 * exchanged across the platform core domains.
 */
export class EventRegistry {
  private static readonly registeredTypes = new Set<string>([
    'Runtime.RequestStarted',
    'Runtime.RequestCompleted',
    'Tenant.Resolved',
    'Tenant.ResolutionFailed',
    'Provisioning.Started',
    'Provisioning.Completed',
    'Provisioning.Failed',
    'Package.Loaded',
    'Package.Failed',
    'System.LogCreated',
    'System.ErrorOccurred',
    'Bootstrap.Started',
    'Bootstrap.ModuleInitialized',
    'Bootstrap.Ready',
    'Bootstrap.Degraded',
    'Bootstrap.Failed',
    // Security events
    'Security.Login',
    'Security.PermissionDenied',
    'Security.APIBlocked',
    'Security.SecretRotation',
    // Allowed wildcard for testing/general subscriptions
    'Test.Created',
  ]);

  /**
   * Dynamically registers a new event type on the platform.
   */
  public static register(eventType: string): void {
    this.registeredTypes.add(eventType);
  }

  /**
   * Checks whether a given event type is officially registered.
   */
  public static isRegistered(eventType: string): boolean {
    return this.registeredTypes.has(eventType);
  }

  /**
   * Retrieves all currently registered event types.
   */
  public static getAll(): string[] {
    return Array.from(this.registeredTypes);
  }
}
