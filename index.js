/* ───────────────── basic config ───────────────── */
const express = require('express');
const cors = require('cors');
const jwt = require('jsonwebtoken');
const { MongoClient } = require('mongodb');
const { ObjectId } = require('mongodb');

require('dotenv').config();

const app = express();
const port = process.env.PORT || 5000;

/* ────────── middleware ────────── */
app.use(cors());
app.use(express.json());

/* ────────── MongoDB connect ────────── */
const uri =
  `mongodb+srv://${process.env.DB_USER}:${process.env.DP_PASS}` +
  `@cluster0.vv356rj.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0`;
const client = new MongoClient(uri);

async function run() {
  try {
    await client.connect();
    console.log('✅ Connected to MongoDB Atlas');

    /* ───── collections ───── */
    const db = client.db('semicolonff_DB');
    const classicMatchCollection = db.collection('classic_Match');
    const usersCollection = db.collection('users');
    const joinsCollection = db.collection('match_joins');
    const addMoneyCollection = db.collection('add_money_requests');

    /* ───────── JWT route ───────── */
    app.post('/jwt', async (req, res) => {
      const user = req.body;
      const token = jwt.sign(user, process.env.ACCESS_TOKEN_SECRET, {
        expiresIn: '1h',
      });
      res.send({ token });
    });

    /* ───────── Home ───────── */
    app.get('/', (_, res) => res.send('semicolonff server is live ✅'));

    /* ====================== User API ====================== */
    // all users
    app.get('/users', async (_, res) => {
      try {
        const all = await usersCollection.find().toArray();
        res.send(all);
      } catch (err) {
        console.error(err);
        res.status(500).send({ error: 'Failed to fetch users' });
      }
    });

    // single user by email
    app.get('/user/:email', async (req, res) => {
      try {
        const user = await usersCollection.findOne({ email: req.params.email });
        if (!user) return res.status(404).send({ message: 'User not found' });
        res.send(user);
      } catch (err) {
        console.error(err);
        res.status(500).send({ error: 'Failed to fetch user' });
      }
    });

    // create user
    app.post('/users', async (req, res) => {
      try {
        const newUser = req.body;
        const exists = await usersCollection.findOne({ email: newUser.email });
        if (exists)
          return res.status(400).send({ error: 'Email already exists' });

        const result = await usersCollection.insertOne(newUser);
        res.status(201).send(result);
      } catch (err) {
        console.error(err);
        res.status(500).send({ error: 'Failed to create user' });
      }
    });

    // 🔵 balance patch (NEW)
    app.patch('/users/:id', async (req, res) => {
      const { balance } = req.body;
      if (balance === undefined || balance < 0)
        return res.status(400).send({ error: 'Invalid balance value' });

      try {
        const id = new ObjectId(req.params.id);
        const result = await usersCollection.updateOne(
          { _id: id },
          { $set: { balance } }
        );
        if (result.matchedCount === 0)
          return res.status(404).send({ error: 'User not found' });

        res.send({ message: 'Balance updated', result });
      } catch (err) {
        console.error(err);
        res.status(500).send({ error: 'Balance update failed' });
      }
    });

    /* ====================== Classic Match API ====================== */
    // all matches
    app.get('/classic', async (_, res) => {
      try {
        const list = await classicMatchCollection.find().toArray();
        res.send(list);
      } catch (err) {
        console.error(err);
        res.status(500).send({ error: 'Failed to fetch matches' });
      }
    });

    // find  match by id
    app.get('/classic/:id', async (req, res) => {
      try {
        const match = await classicMatchCollection.findOne({
          _id: req.params.id,
        });
        if (!match) return res.status(404).send({ error: 'Match not found' });
        res.send(match);
      } catch (err) {
        console.error(err);
        res.status(500).send({ error: 'Failed to get match' });
      }
    });

    // create match
    app.post('/classic', async (req, res) => {
      const matchData = req.body;
      if (!matchData._id || !matchData.date || !matchData.time)
        return res.status(400).send({ error: 'Missing required match fields' });

      try {
        const result = await classicMatchCollection.insertOne(matchData);
        res.status(201).send(result);
      } catch (err) {
        console.error(err);
        res.status(500).send({ error: 'Failed to create match' });
      }
    });

    // update match
    app.put('/classic/:id', async (req, res) => {
      try {
        const result = await classicMatchCollection.updateOne(
          { _id: req.params.id },
          { $set: req.body }
        );
        if (result.matchedCount === 0)
          return res.status(404).send({ error: 'Match not found' });
        res.send({ message: 'Match updated', result });
      } catch (err) {
        console.error(err);
        res.status(500).send({ error: 'Failed to update match' });
      }
    });

    //! delete match
    app.delete('/classic/:id', async (req, res) => {
      const result = await classicMatchCollection.deleteOne({
        _id: req.params.id,
      });
      res.send(result);
    });

    /* ========= Add-Money API ========= */

    /**
     * Body example:
     * {
     *   amount:   200,           // Number (min 10)
     *   number:   "017xxxxxxxx", // 11-digit sender number
     *   trxId:    "A1B2C3",      // (optional)
     *   method:   "Bkash",       // "Bkash" | "Nogod"
     *   email:    "user@mail.com"// who is topping-up
     * }
     */
    app.post('/add-money', async (req, res) => {
      try {
        const { amount, number, trxId = '', method, email } = req.body;

        /* basic validation – keep it simple, the
       frontend has already done most UI checks */
        if (
          !amount ||
          amount < 10 ||
          !number ||
          !/^\d{11}$/.test(number) ||
          !method ||
          !['Bkash', 'Nogod'].includes(method) ||
          !email
        ) {
          return res.status(400).send({ error: 'Invalid payload' });
        }

        const doc = {
          amount: Number(amount),
          number,
          trxId,
          method,
          email,
          status: 'pending', // you can review later
          requestedAt: new Date(),
        };

        const result = await addMoneyCollection.insertOne(doc);
        res.status(201).send(result);
      } catch (err) {
        console.error(err);
        res.status(500).send({ error: 'Failed to submit add-money request' });
      }
    });
    /* get add money  */
    app.get('/add-money', async (req, res) => {
      try {
        const { email } = req.query; // optional ?email=user@mail.com
        const filter = email ? { email } : {};
        const list = await addMoneyCollection
          .find(filter)
          .sort({ requestedAt: -1 })
          .toArray();
        res.send(list);
      } catch (err) {
        console.error(err);
        res.status(500).send({ error: 'Failed to fetch add-money requests' });
      }
    });
    // Update money after approve or rejected
    app.patch('/add-money/:id', async (req, res) => {
      try {
        const { id } = req.params;
        const { status } = req.body; // "approved" | "rejected"
        if (!['approved', 'rejected'].includes(status)) {
          return res.status(400).send({ error: 'Invalid status' });
        }

        const _id = new ObjectId(id);
        const moneyDoc = await addMoneyCollection.findOne({ _id });
        if (!moneyDoc)
          return res.status(404).send({ error: 'Request not found' });

        await addMoneyCollection.updateOne({ _id }, { $set: { status } });

        // if approved, credit balance
        if (status === 'approved') {
          await usersCollection.updateOne(
            { email: moneyDoc.email },
            { $inc: { balance: moneyDoc.amount } }
          );
        }

        res.send({ message: 'Request updated' });
      } catch (err) {
        console.error(err);
        res.status(500).send({ error: 'Failed to update request' });
      }
    });

    /* ========= Add-Money API End ========= */

    /* ====================== Join API (NEW) ====================== */
    /*
      Body example:
      {
        matchId:   "CL123",
        gameType:  "duo",
        playerNames:["name1","name2"],
        email:     "player@mail.com"
      }
    */
    /* find all booking player list  */
    app.get('/booking_player_list', async (_, res) => {
      try {
        const all = await joinsCollection.find().toArray();
        res.send(all);
      } catch (err) {
        console.error(err);
        res.status(500).send({ error: 'Failed to fetch booking player data' });
      }
    });
    /* post to database booking player list  */
    app.post('/booking_player_list', async (req, res) => {
      // app.post('/join_match', async (req, res) => {
      try {
        const join = req.body;
        if (!join.matchId || !join.gameType || !join.email)
          return res.status(400).send({ error: 'Missing required fields' });

        const exists = await joinsCollection.findOne({
          matchId: join.matchId,
          email: join.email,
        });
        if (exists)
          return res.status(409).send({ error: 'একবার জয়েন করা হয়েছে ' });

        const result = await joinsCollection.insertOne({
          ...join,
          joinedAt: new Date(),
        });
        res.status(201).send(result);
      } catch (err) {
        console.error(err);
        res.status(500).send({ error: 'Failed to join match' });
      }
    });

    //! Delete booking player list

    app.delete('/booking_player_list/:id', async (req, res) => {
      try {
        const { id } = req.params;

        // Validate id length for early rejection (optional but handy)
        if (!ObjectId.isValid(id)) {
          return res.status(400).json({ message: 'Invalid booking ID.' });
        }

        const result = await joinsCollection.deleteOne({
          _id: new ObjectId(id),
        });

        if (result.deletedCount === 0) {
          return res.status(404).json({ message: 'Booking not found.' });
        }

        res.json({ message: 'Booking deleted successfully.' });
      } catch (error) {
        console.error('Delete booking error:', error);
        res
          .status(500)
          .json({ message: 'Server error. Could not delete booking.' });
      }
    });

    /* ───────── end of run() ───────── */
  } catch (err) {
    console.error('❌ Error connecting to MongoDB:', err);
  }
}

run().catch(console.dir);

/* ───────── start server ───────── */
app.listen(port, () =>
  console.log(`🚀 semicolonff server running on port ${port}`)
);
