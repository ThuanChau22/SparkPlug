const utils = {};

/**
 * @param {Object} obj
 * @returns True if obj does not have any property else false
 */
utils.isObjectEmpty = (obj) => {
  for (const prop in obj) {
    if (Object.hasOwn(obj, prop)) {
      return false;
    }
  }
  return true;
}

/**
 * @param {*} value
 * @returns True if value is integer string else false
 */
utils.isInteger = (value) => {
  if (typeof value != "string") return false
  return /^-?\d+$/.test(value);
}

/**
 * @param {*} value
 * @returns True if value is ISO Date string else false
 */
utils.isIsoDate = (value) => {
  const isoFormat = /\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}.\d{3}Z/;
  if (!isoFormat.test(value)) return false;
  const date = new Date(value);
  return !isNaN(date.getTime()) && date.toISOString() === value;
};

/**
 * Convert a string into JSON
 * Wrapper for JSON.parse
 * @return JSON Object
 */
utils.toJSON = (string) => {
  try {
    return JSON.parse(string);
  } catch (error) {
    return undefined;
  }
};

/**
 * Replace "_id" with "id" on Mongoose Object Document
 * @param doc (Object|Array)
 * @return Document
 */
utils.toClient = (doc) => {
  if (Array.isArray(doc)) {
    return doc.map((doc) => utils.toClient(doc));
  }
  if (doc && doc.constructor === Object) {
    const { _id, __v, ...remain } = doc;
    const reducer = (o, k) => ({ ...o, [k]: utils.toClient(remain[k]) });
    return Object.keys(remain).reduce(reducer, _id ? { id: _id } : {});
  }
  return doc;
};

/**
 * Convert current value
 * into an array if not yet one
 * @param value (any)
 * @return An array of given value
 */
utils.toArray = (value) => {
  if (!value) return [];
  return Array.isArray(value) ? value : [value];
};

/**
 * Convert string
 * from snake_case to camelCase
 * @param value (String)
 * @return A camelCase string
 */
utils.snakeToCamel = (s) => {
  const convert = (_, c) => c.toUpperCase();
  return s.replace(/[^a-zA-Z0-9]+(.)/g, convert);
};

export default utils;
