/**
 * Order simulation service for demo: drives driver along OSRM route,
 * updates statuses (ARRIVED, IN_PROGRESS, COMPLETED).
 * Runs in background, triggered by POST /api/orders/:id/simulate.
 */
export declare class OrderSimulationService {
    run(orderId: string): Promise<void>;
}
//# sourceMappingURL=orderSimulation.service.d.ts.map