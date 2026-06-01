import * as tables from './schema';
import * as rel from './relations';

export const schemaBundle = { ...tables, ...rel };
