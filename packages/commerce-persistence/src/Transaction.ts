// Transaction.ts
// C9.4: Commerce Persistence — transaction layer

export interface Transaction {
  execute(): Promise<void>
  rollback(): Promise<void>
}

export class CheckoutTransaction implements Transaction {
  constructor(
    private createOrder: () => Promise<string>,
    private reserveInventory: (orderId: string) => Promise<void>,
    private chargePayment: (orderId: string) => Promise<void>,
    private confirmOrder: (orderId: string) => Promise<void>,
    private cancelOrder: (orderId: string) => Promise<void>,
    private releaseInventory: (orderId: string) => Promise<void>
  ) {}

  async execute(): Promise<void> {
    const orderId = await this.createOrder()
    try {
      await this.reserveInventory(orderId)
      await this.chargePayment(orderId)
      await this.confirmOrder(orderId)
    } catch (error) {
      await this.rollback()
      throw error
    }
  }

  async rollback(): Promise<void> {
    await this.releaseInventory('')
    await this.cancelOrder('')
  }
}
