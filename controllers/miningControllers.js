const miningSessionModel = require("../models/miningSessionModel");
const { v4: uuidv4 } = require("uuid");
MINING_RATE = 500 / 60;
MAX_DURATION = 3 * 60 * 60 * 1000;

const miningSessionController = async (req, res) => {
  if (!req.session.sessionId) {
    req.session.sessionId = uuidv4();  //unique session id
  }

  const sessionId = req.session.sessionId;

  const existingSession = await miningSessionModel.findOne({
    sessionId: sessionId,
    ended: false
  });

  if (existingSession) {
    return res.status(400).json({ message: "Mining session already started" });
  }

  const startTime = new Date();

  const newSession = new miningSessionModel({
    sessionId: sessionId,
    startAt: startTime,
    boostType: null,
    boostedAt: null,
    ended: false
  });

  await newSession.save();

  const endTime = new Date(startTime.getTime() + MAX_DURATION);

  res.status(200).json({
    message: "Mining session started",
    startAt: startTime,
    endAt: endTime,
    sessionId: sessionId
  });
}

module.exports = { miningSessionController }

