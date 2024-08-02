const utils = {};

utils.handleError = (res, error) => {
  try {
    const { code, message } = error;
    if (!code) {
      throw error;
    }
    console.log("ClientError -", error);
    res.status(code).json({ message });
  } catch (error) {
    console.log("ServerError -", error);
    res.status(500).json({ message: "An unknown error occurred" });
  }
};

utils.isObjectEmpty = (obj) => {
  for (const prop in obj) {
    if (Object.hasOwn(obj, prop)) {
      return false;
    }
  }
  return true;
}

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
 * Validate whether the parameter is a boolean value
 * @param value (String|Number)
 * @return true if parameter is a boolean value
 */
utils.isBoolean = (value) => {
  const isFalse = value === false || value === "false";
  const isTrue = value === true || value === "true";
  return isFalse || isTrue;
};

/**
 * Convert a value to boolean value
 * @param value (String|Number)
 * @return Boolean value
 */
utils.toBoolean = (value) => {
  return value === true || value === "true";
};

export default utils;
