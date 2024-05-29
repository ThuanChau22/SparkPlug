const utils = {};

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

export default utils;
