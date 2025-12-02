/**
 * Converte objetos Prisma (snake_case) para formato frontend (camelCase)
 */

type CamelCase<S extends string> = S extends `${infer P1}_${infer P2}${infer P3}`
  ? `${Lowercase<P1>}${Uppercase<P2>}${CamelCase<P3>}`
  : Lowercase<S>;

export function toCamelCase<T extends Record<string, any>>(obj: T): any {
  if (obj === null || obj === undefined) return obj;
  
  if (Array.isArray(obj)) {
    return obj.map(item => toCamelCase(item));
  }
  
  if (typeof obj === 'object' && !(obj instanceof Date)) {
    const camelObj: any = {};
    
    for (const key in obj) {
      const camelKey = key.replace(/_([a-z])/g, (_, letter) => letter.toUpperCase());
      camelObj[camelKey] = toCamelCase(obj[key]);
    }
    
    return camelObj;
  }
  
  return obj;
}

export function toSnakeCase<T extends Record<string, any>>(obj: T): any {
  if (obj === null || obj === undefined) return obj;
  
  if (Array.isArray(obj)) {
    return obj.map(item => toSnakeCase(item));
  }
  
  if (typeof obj === 'object' && !(obj instanceof Date)) {
    const snakeObj: any = {};
    
    for (const key in obj) {
      const snakeKey = key.replace(/[A-Z]/g, letter => `_${letter.toLowerCase()}`);
      snakeObj[snakeKey] = toSnakeCase(obj[key]);
    }
    
    return snakeObj;
  }
  
  return obj;
}
