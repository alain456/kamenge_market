export const toCamelCase = (str: string) => {
  return str.replace(/_([a-z])/g, (match, letter) => letter.toUpperCase());
};

export const toSnakeCase = (str: string) => {
  return str.replace(/[A-Z]/g, (letter) => `_${letter.toLowerCase()}`);
};

export const keysToCamelCase = (obj: any): any => {
  if (Array.isArray(obj)) {
    return obj.map((v) => keysToCamelCase(v));
  } else if (obj !== null && obj.constructor === Object) {
    return Object.keys(obj).reduce((result, key) => {
      const camelKey = toCamelCase(key);
      result[camelKey] = keysToCamelCase(obj[key]);
      return result;
    }, {} as any);
  }
  return obj;
};

export const keysToSnakeCase = (obj: any): any => {
  if (Array.isArray(obj)) {
    return obj.map((v) => keysToSnakeCase(v));
  } else if (obj !== null && obj.constructor === Object) {
    return Object.keys(obj).reduce((result, key) => {
      const snakeKey = toSnakeCase(key);
      result[snakeKey] = keysToSnakeCase(obj[key]);
      return result;
    }, {} as any);
  }
  return obj;
};
