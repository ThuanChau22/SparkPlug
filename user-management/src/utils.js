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

export default utils;
