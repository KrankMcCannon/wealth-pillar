/**
 * Base Mapper
 * Fornisce interfaccia comune per tutti i mapper
 * Segue il principio di Interface Segregation (ISP)
 */

export class MappingError extends Error {
  constructor(message: string, public source?: any, public target?: string) {
    super(message);
    this.name = 'MappingError';
  }
}

export abstract class BaseMapper<TEntity, TDatabaseRow> {
  abstract toEntity(dbRow: TDatabaseRow): TEntity;
  abstract toDatabase(entity: TEntity): Partial<TDatabaseRow>;
  
  /**
   * Mappa un array di righe database in entità
   */
  toEntities(dbRows: TDatabaseRow[]): TEntity[] {
    return dbRows.map(row => this.toEntity(row));
  }

  /**
   * Gestisce valori nullable in modo sicuro
   */
  protected safeParseFloat(value: any, defaultValue: number = 0): number {
    if (value === null || value === undefined) return defaultValue;
    const parsed = parseFloat(value);
    return isNaN(parsed) ? defaultValue : parsed;
  }

  /**
   * Gestisce array JSON in modo sicuro
   */
  protected safeParseArray<T>(value: any, defaultValue: T[] = []): T[] {
    if (!value) return defaultValue;
    
    try {
      if (Array.isArray(value)) return value;
      
      if (typeof value === 'string') {
        // Pulisce JSON malformato
        let cleanJson = value.replace(/^"/, '').replace(/"$/, '');
        cleanJson = cleanJson.replace(/}]$/, ']');
        cleanJson = cleanJson.replace(/^{/, '[');
        cleanJson = cleanJson.replace(/\\"/g, '"');
        
        return JSON.parse(cleanJson);
      }
      
      return defaultValue;
    } catch (error) {
      console.warn('Failed to parse array value:', value, error);
      return defaultValue;
    }
  }

  /**
   * Gestisce date in modo sicuro
   */
  protected safeParseDate(value: any): string {
    if (!value) return new Date().toISOString();
    if (value instanceof Date) return value.toISOString();
    return value.toString();
  }
}
