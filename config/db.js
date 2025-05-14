const mongoose = require("mongoose");

const connectDb = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URL, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
      ssl: true,
    });
    console.log(" MongoDB connected");
  } catch (error) {
    console.error(" DB error", error);
  }
};

module.exports = connectDb;
