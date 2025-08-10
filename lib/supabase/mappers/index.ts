/**
 * Data Mappers
 * Centralizza la logica di conversione tra entità dominio e database
 * Segue il principio DRY (Don't Repeat Yourself)
 */

export { AccountMapper, accountMapper } from './AccountMapper';
export { BudgetMapper, budgetMapper } from './BudgetMapper';
export { CategoryMapper, categoryMapper } from './CategoryMapper';
export { PersonMapper, personMapper } from './PersonMapper';
export { TransactionMapper, transactionMapper } from './TransactionMapper';

// Base mapper exports
export { BaseMapper, MappingError } from './BaseMapper';

