/**
 * Data Mappers
 * Centralizza la logica di conversione tra entità dominio e database
 * Segue il principio DRY (Don't Repeat Yourself)
 */

export { AccountMapper, accountMapper } from './AccountMapper';
export { BaseMapper, MappingError } from './BaseMapper';
export { BudgetMapper, budgetMapper } from './BudgetMapper';
// CategoryMapper removed - use CategoryRepository mapping instead
export { PersonMapper, personMapper } from './PersonMapper';
export { TransactionMapper, transactionMapper } from './TransactionMapper';

