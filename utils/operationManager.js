/**
 * Gestor de operaciones asíncronas para evitar memory leaks y operaciones pendientes
 * cuando el componente se desmonta
 */

export class OperationManager {
  constructor() {
    this.operations = new Map();
    this.operationId = 0;
  }

  /**
   * Crear una nueva operación con posibilidad de cancelación
   */
  createOperation() {
    const id = ++this.operationId;
    let cancelled = false;

    const operation = {
      id,
      isCancelled: () => cancelled,
      cancel: () => {
        cancelled = true;
      },
      run: async (asyncFn) => {
        if (cancelled) {
          throw new Error(`Operation ${id} was cancelled`);
        }
        const result = await asyncFn();
        if (cancelled) {
          throw new Error(`Operation ${id} was cancelled during execution`);
        }
        return result;
      }
    };

    this.operations.set(id, operation);
    return operation;
  }

  /**
   * Cancelar una operación específica
   */
  cancelOperation(id) {
    const operation = this.operations.get(id);
    if (operation) {
      operation.cancel();
      this.operations.delete(id);
    }
  }

  /**
   * Cancelar todas las operaciones
   */
  cancelAllOperations() {
    for (const [id, operation] of this.operations) {
      operation.cancel();
      this.operations.delete(id);
    }
  }

  /**
   * Limpiar operaciones completadas
   */
  cleanupCompleted() {
    // Las operaciones se limpian automáticamente al cancelarse
    // Este método puede expandirse en el futuro
  }
}

export default OperationManager;