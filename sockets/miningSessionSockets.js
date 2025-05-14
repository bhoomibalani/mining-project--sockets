const { v4: uuidv4 } = require('uuid');
const miningSessionModel = require('../models/miningSessionModel');

const MAX_DURATION = 3 * 60 * 60 * 1000; 
const MINING_RATE = 1;
const BOOST_MULTIPLIER = 5;

const miningSessionSocketHandler = (socket) => {
  const session = socket.handshake.session;

  let miningInterval = null;
  let boostedInterval = null;

  socket.on('startMining', async () => {
    try {
      if (!session.sessionId) {
        session.sessionId = `sess-${uuidv4()}`;
        await new Promise((resolve, reject) =>
          session.save(err => err ? reject(err) : resolve())
        );
      }

      const sessionId = session.sessionId;
      const existing = await miningSessionModel.findOne({ sessionId, ended: false });

      if (existing) {
        return socket.emit('sessionError', { message: 'Session already running' });
      }

      const startAt = new Date();
      const endAt = new Date(+startAt + MAX_DURATION);

      await new miningSessionModel({
        sessionId,
        startAt,
        boostType: null,
        boostedAt: null,
        ended: false
      }).save();

      socket.emit('sessionStarted', { sessionId, startAt, endAt });

      miningInterval = setInterval(async () => {
        const elapsed = Date.now() - startAt;
        if (session.ended || elapsed >= MAX_DURATION) {
          clearInterval(miningInterval);
          await miningSessionModel.updateOne({ sessionId }, { ended: true });
          return socket.emit('sessionEnded', { sessionId });
        }
        const earnedPoints = Math.floor(elapsed / 1000 * MINING_RATE);
        socket.emit('updatePoints', { earnedPoints });
      }, 1000);

    } catch (err) {
      console.error(err);
      socket.emit('sessionError', { message: 'Server error starting session' });
    }
  });

  socket.on('boostMining', async ({ boostType }) => {
    try {
      console.log(`Received boost type: ${boostType}`);
      const session = socket.handshake.session; 
      const sessionId = session.sessionId;

      if (!sessionId) {
        return socket.emit("sessionError", { message: "No active session" });
      }

      const currentSession = await miningSessionModel.findOne({ sessionId, ended: false });

      if (!currentSession) {
        return socket.emit("sessionError", { message: "No active mining session" });
      }

      clearInterval(miningInterval);

      let boostedRate = MINING_RATE * BOOST_MULTIPLIER;
      console.log(`Boost applied. New rate: ${boostedRate}`);

      currentSession.boostType = boostType;
      currentSession.boostedAt = new Date();
      await currentSession.save();

      socket.emit('sessionStarted', {
        message: `Boost applied: ${boostType}`,
        boostType: currentSession.boostType,
        boostedRate: boostedRate, 
      });

      const startAt = currentSession.startAt;
      let earnedPoints = Math.floor((Date.now() - startAt) / 1000 * boostedRate);

      boostedInterval = setInterval(() => {
        earnedPoints += boostedRate; 
        socket.emit('updatePoints', { earnedPoints });
      }, 200); 

      setTimeout(() => {
        clearInterval(boostedInterval);
      }, MAX_DURATION);

    } catch (err) {
      console.log(err);
      socket.emit('sessionError', { message: 'Error applying boost' });
    }
  });

  socket.on('disconnect', async () => {
    console.log('disconnected');

    if (session.sessionId) {
      clearInterval(miningInterval);
      clearInterval(boostedInterval); 
      await miningSessionModel.updateOne(
        { sessionId: session.sessionId, ended: false },
        { ended: true }
      );
      console.log(`Mining session ended on disconnect: ${session.sessionId}`);
    }
  });
};

module.exports = { miningSessionSocketHandler };