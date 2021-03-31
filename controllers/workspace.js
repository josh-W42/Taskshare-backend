// Data base
const db = require("../models");

// basic test
const test = async (req, res) => {
  res.json({ message: "Workspace endpoint OK!" });
};

// export all route functions
module.exports = {
  test,
};
