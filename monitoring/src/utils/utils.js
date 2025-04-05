import { encode, decode } from "safe-base64";

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

/**
 * Extract conditions from cursor
 * @param cursor (String)
 * @param sort (Object)
 * @return MongoDB filter conditions
 */
utils.extractCursor = (cursor, sort) => {
  let condition = {};
  const payload = utils.toJSON(decode(cursor).toString()) || {};
  const params = Object.keys(sort)
    .filter((field) => payload[field])
    .map((field) => [field, payload[field]]);
  for (let [field, value] of params.reverse()) {
    value = utils.isIsoDate(value) ? new Date(value) : value;
    condition = utils.isObjectEmpty(condition)
      ? { field: value }
      : {
        $or: [
          { [field]: { $gt: value } },
          {
            $and: [
              { [field]: { $eq: value } },
              { ...condition },
            ],
          }
        ],
      };
  }
  return condition;
};

/**
 * create cursor from last document
 * @param doc (Object)
 * @param sort (Object)
 * @return new cursor
 */
utils.createCursor = (doc, sort) => {
  const payload = Object.keys(sort)
    .filter((field) => doc[field])
    .map((field) => [field, doc[field]])
    .reduce((obj, [field, value]) => ({ ...obj, [field]: value }), {});
  return encode(Buffer.from(JSON.stringify(payload)));
};

export default utils;
