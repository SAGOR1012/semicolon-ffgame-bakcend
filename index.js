// /* ───────────────── basic config ───────────────── */
// const express = require('express');
// const cors = require('cors');
// const jwt = require('jsonwebtoken');
// const { MongoClient } = require('mongodb');
// const { ObjectId } = require('mongodb');

// require('dotenv').config();

// const app = express();
// const port = process.env.PORT || 5000;

// /* ────────── middleware ────────── */
// app.use(cors());
// app.use(express.json());

// /* ────────── MongoDB connect ────────── */
// const uri =
//   `mongodb+srv://${process.env.DB_USER}:${process.env.DP_PASS}` +
//   `@cluster0.vv356rj.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0`;
// const client = new MongoClient(uri);

// async function run() {
//   try {
//     await client.connect();
//     console.log('✅ Connected to MongoDB Atlas');

//     /* ───── collections ───── */
//     const db = client.db('semicolonff_DB');
//     const classicMatchCollection = db.collection('classic_Match');
//     const usersCollection = db.collection('users');
//     const joinsCollection = db.collection('match_joins');
//     const withdrawCollection = db.collection('withdraw_requests');

//     /* ───────── JWT route ───────── */
//     app.post('/jwt', async (req, res) => {
//       const user = req.body;
//       const token = jwt.sign(user, process.env.ACCESS_TOKEN_SECRET, {
//         expiresIn: '1h',
//       });
//       res.send({ token });
//     });

//     /* ───────── Home ───────── */
//     app.get('/', (_, res) => res.send('semicolonff server is live ✅'));

//     /* ====================== User API ====================== */
//     // all users
//     app.get('/users', async (_, res) => {
//       try {
//         const all = await usersCollection.find().toArray();
//         res.send(all);
//       } catch (err) {
//         console.error(err);
//         res.status(500).send({ error: 'Failed to fetch users' });
//       }
//     });

//     // single user by email
//     app.get('/user/:email', async (req, res) => {
//       try {
//         const user = await usersCollection.findOne({ email: req.params.email });
//         if (!user) return res.status(404).send({ message: 'User not found' });
//         res.send(user);
//       } catch (err) {
//         console.error(err);
//         res.status(500).send({ error: 'Failed to fetch user' });
//       }
//     });

//     // create user
//     app.post('/users', async (req, res) => {
//       try {
//         const newUser = req.body;
//         const exists = await usersCollection.findOne({ email: newUser.email });
//         if (exists)
//           return res.status(400).send({ error: 'Email already exists' });

//         const result = await usersCollection.insertOne(newUser);
//         res.status(201).send(result);
//       } catch (err) {
//         console.error(err);
//         res.status(500).send({ error: 'Failed to create user' });
//       }
//     });

//     // 🔵 balance patch (NEW)
//     app.patch('/users/:id', async (req, res) => {
//       const { balance } = req.body;
//       if (balance === undefined || balance < 0)
//         return res.status(400).send({ error: 'Invalid balance value' });

//       try {
//         const id = new ObjectId(req.params.id);
//         const result = await usersCollection.updateOne(
//           { _id: id },
//           { $set: { balance } }
//         );
//         if (result.matchedCount === 0)
//           return res.status(404).send({ error: 'User not found' });

//         res.send({ message: 'Balance updated', result });
//       } catch (err) {
//         console.error(err);
//         res.status(500).send({ error: 'Balance update failed' });
//       }
//     });

//     /* ====================== Classic Match API ====================== */
//     // all matches
//     app.get('/classic', async (_, res) => {
//       try {
//         const list = await classicMatchCollection.find().toArray();
//         res.send(list);
//       } catch (err) {
//         console.error(err);
//         res.status(500).send({ error: 'Failed to fetch matches' });
//       }
//     });

//     // find  match by id
//     app.get('/classic/:id', async (req, res) => {
//       try {
//         const match = await classicMatchCollection.findOne({
//           _id: req.params.id,
//         });
//         if (!match) return res.status(404).send({ error: 'Match not found' });
//         res.send(match);
//       } catch (err) {
//         console.error(err);
//         res.status(500).send({ error: 'Failed to get match' });
//       }
//     });

//     // create match
//     app.post('/classic', async (req, res) => {
//       const matchData = req.body;
//       if (!matchData._id || !matchData.date || !matchData.time)
//         return res.status(400).send({ error: 'Missing required match fields' });

//       try {
//         const result = await classicMatchCollection.insertOne(matchData);
//         res.status(201).send(result);
//       } catch (err) {
//         console.error(err);
//         res.status(500).send({ error: 'Failed to create match' });
//       }
//     });

//     // update match
//     app.put('/classic/:id', async (req, res) => {
//       try {
//         const result = await classicMatchCollection.updateOne(
//           { _id: req.params.id },
//           { $set: req.body }
//         );
//         if (result.matchedCount === 0)
//           return res.status(404).send({ error: 'Match not found' });
//         res.send({ message: 'Match updated', result });
//       } catch (err) {
//         console.error(err);
//         res.status(500).send({ error: 'Failed to update match' });
//       }
//     });

//     //! delete match
//     app.delete('/classic/:id', async (req, res) => {
//       const result = await classicMatchCollection.deleteOne({
//         _id: req.params.id,
//       });
//       res.send(result);
//     });

//     /* ========= Add-Money API ========= */

//     /**
//      * Body example:
//      * {
//      *   amount:   200,           // Number (min 10)
//      *   number:   "017xxxxxxxx", // 11-digit sender number
//      *   trxId:    "A1B2C3",      // (optional)
//      *   method:   "Bkash",       // "Bkash" | "Nogod"
//      *   email:    "user@mail.com"// who is topping-up
//      * }
//      */
//     app.post('/add-money', async (req, res) => {
//       try {
//         const { amount, number, trxId = '', method, email } = req.body;

//         /* basic validation – keep it simple, the
//        frontend has already done most UI checks */
//         if (
//           !amount ||
//           amount < 10 ||
//           !number ||
//           !/^\d{11}$/.test(number) ||
//           !method ||
//           !['Bkash', 'Nogod'].includes(method) ||
//           !email
//         ) {
//           return res.status(400).send({ error: 'Invalid payload' });
//         }

//         const doc = {
//           amount: Number(amount),
//           number,
//           trxId,
//           method,
//           email,
//           status: 'pending', // you can review later
//           requestedAt: new Date(),
//         };

//         const result = await addMoneyCollection.insertOne(doc);
//         res.status(201).send(result);
//       } catch (err) {
//         console.error(err);
//         res.status(500).send({ error: 'Failed to submit add-money request' });
//       }
//     });
//     /* get add money  */
//     app.get('/add-money', async (req, res) => {
//       try {
//         const { email } = req.query; // optional ?email=user@mail.com
//         const filter = email ? { email } : {};
//         const list = await addMoneyCollection
//           .find(filter)
//           .sort({ requestedAt: -1 })
//           .toArray();
//         res.send(list);
//       } catch (err) {
//         console.error(err);
//         res.status(500).send({ error: 'Failed to fetch add-money requests' });
//       }
//     });
//     // Update money after approve or rejected
//     app.patch('/add-money/:id', async (req, res) => {
//       try {
//         const { id } = req.params;
//         const { status } = req.body; // "approved" | "rejected"
//         if (!['approved', 'rejected'].includes(status)) {
//           return res.status(400).send({ error: 'Invalid status' });
//         }

//         const _id = new ObjectId(id);
//         const moneyDoc = await addMoneyCollection.findOne({ _id });
//         if (!moneyDoc)
//           return res.status(404).send({ error: 'Request not found' });

//         await addMoneyCollection.updateOne({ _id }, { $set: { status } });

//         // if approved, credit balance
//         if (status === 'approved') {
//           await usersCollection.updateOne(
//             { email: moneyDoc.email },
//             { $inc: { balance: moneyDoc.amount } }
//           );
//         }

//         res.send({ message: 'Request updated' });
//       } catch (err) {
//         console.error(err);
//         res.status(500).send({ error: 'Failed to update request' });
//       }
//     });

//     /* ========= Add-Money API End ========= */

//     /* withdraw money api */

//     /* find all booking player list  */
//     app.get('/booking_player_list', async (_, res) => {
//       try {
//         const all = await joinsCollection.find().toArray();
//         res.send(all);
//       } catch (err) {
//         console.error(err);
//         res.status(500).send({ error: 'Failed to fetch booking player data' });
//       }
//     });
//     /* post to database booking player list  */
//     app.post('/booking_player_list', async (req, res) => {
//       // app.post('/join_match', async (req, res) => {
//       try {
//         const join = req.body;
//         if (!join.matchId || !join.gameType || !join.email)
//           return res.status(400).send({ error: 'Missing required fields' });

//         const exists = await joinsCollection.findOne({
//           matchId: join.matchId,
//           email: join.email,
//         });
//         if (exists)
//           return res.status(409).send({ error: 'একবার জয়েন করা হয়েছে ' });

//         const result = await joinsCollection.insertOne({
//           ...join,
//           joinedAt: new Date(),
//         });
//         res.status(201).send(result);
//       } catch (err) {
//         console.error(err);
//         res.status(500).send({ error: 'Failed to join match' });
//       }
//     });

//     //! Delete booking player list

//     app.delete('/booking_player_list/:id', async (req, res) => {
//       try {
//         const { id } = req.params;

//         // Validate id length for early rejection (optional but handy)
//         if (!ObjectId.isValid(id)) {
//           return res.status(400).json({ message: 'Invalid booking ID.' });
//         }

//         const result = await joinsCollection.deleteOne({
//           _id: new ObjectId(id),
//         });

//         if (result.deletedCount === 0) {
//           return res.status(404).json({ message: 'Booking not found.' });
//         }

//         res.json({ message: 'Booking deleted successfully.' });
//       } catch (error) {
//         console.error('Delete booking error:', error);
//         res
//           .status(500)
//           .json({ message: 'Server error. Could not delete booking.' });
//       }
//     });

//     // Post withdraw request
//     app.post('/withdraw', async (req, res) => {
//       try {
//         const { amount, number, method, email } = req.body;

//         // Basic validation
//         if (
//           !amount ||
//           amount < 50 ||
//           !number ||
//           !/^\d{11}$/.test(number) ||
//           !method ||
//           !['Bkash', 'Nogod'].includes(method) ||
//           !email
//         ) {
//           return res
//             .status(400)
//             .send({ error: 'Invalid withdraw request data' });
//         }

//         const withdrawDoc = {
//           amount,
//           number,
//           method,
//           email,
//           status: 'pending',
//           requestedAt: new Date(),
//         };

//         const result = await withdrawCollection.insertOne(withdrawDoc);
//         res.status(201).send(result);
//       } catch (err) {
//         console.error('Withdraw Error:', err);
//         res.status(500).send({ error: 'Failed to submit withdraw request' });
//       }
//     });

//     app.get('/withdraw', async (req, res) => {
//       const { email } = req.query;
//       const filter = email ? { email } : {};

//       try {
//         const list = await withdrawCollection
//           .find(filter)
//           .sort({ requestedAt: -1 })
//           .toArray();
//         res.send(list);
//       } catch (err) {
//         console.error(err);
//         res.status(500).send({ error: 'Failed to fetch withdraw requests' });
//       }
//     });

//     /* ───────── end of run() ───────── */
//   } catch (err) {
//     console.error('❌ Error connecting to MongoDB:', err);
//   }
// }

// run().catch(console.dir);

// /* ───────── start server ───────── */
// app.listen(port, () =>
//   console.log(`🚀 semicolonff server running on port ${port}`)
// );

/* ───────────────── basic config ───────────────── */
const express = require('express');
const cors = require('cors');
const jwt = require('jsonwebtoken');
const { MongoClient, ObjectId } = require('mongodb'); // Ensure ObjectId is imported

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
    const withdrawCollection = db.collection('withdraw_requests');
    const addMoneyCollection = db.collection('add_money_requests'); // Assuming this collection name

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

        // Initialize balance if not provided (e.g., new user registration)
        const userToInsert = {
          ...newUser,
          balance: newUser.balance === undefined ? 0 : newUser.balance, // Default balance to 0
        };
        const result = await usersCollection.insertOne(userToInsert);
        res.status(201).send(result);
      } catch (err) {
        console.error(err);
        res.status(500).send({ error: 'Failed to create user' });
      }
    });

    // update user balance (generic - can be used by admin)
    app.patch('/users/balance/:userId', async (req, res) => {
      const { balance } = req.body;
      const { userId } = req.params;

      if (balance === undefined || typeof balance !== 'number' || balance < 0) {
        return res.status(400).send({ error: 'Invalid balance value' });
      }

      try {
        if (!ObjectId.isValid(userId)) {
          return res.status(400).send({ error: 'Invalid user ID format' });
        }
        const id = new ObjectId(userId);
        const result = await usersCollection.updateOne(
          { _id: id },
          { $set: { balance: parseFloat(balance) } } // Ensure balance is a float
        );
        if (result.matchedCount === 0) {
          return res.status(404).send({ error: 'User not found' });
        }
        res.send({ message: 'Balance updated successfully', result });
      } catch (err) {
        console.error('Balance update failed:', err);
        res.status(500).send({ error: 'Balance update failed' });
      }
    });

    /* ====================== Classic Match API ====================== */
    // (Your existing Classic Match API code remains here)
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
          _id: req.params.id, // Assuming _id is string in frontend, convert if needed or ensure it's ObjectId
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
      // Basic validation, adjust as needed
      if (!matchData._id || !matchData.date || !matchData.time) {
        // Assuming _id is provided by client, usually MongoDB generates this
        return res.status(400).send({ error: 'Missing required match fields' });
      }
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
          { _id: req.params.id }, // Adjust if _id needs ObjectId conversion
          { $set: req.body }
        );
        if (result.matchedCount === 0) {
          return res.status(404).send({ error: 'Match not found' });
        }
        res.send({ message: 'Match updated', result });
      } catch (err) {
        console.error(err);
        res.status(500).send({ error: 'Failed to update match' });
      }
    });

    // delete match
    app.delete('/classic/:id', async (req, res) => {
      try {
        const result = await classicMatchCollection.deleteOne({
          _id: req.params.id, // Adjust if _id needs ObjectId conversion
        });
        if (result.deletedCount === 0) {
          return res
            .status(404)
            .send({ error: 'Match not found for deletion' });
        }
        res.send(result);
      } catch (error) {
        console.error('Failed to delete match:', error);
        res.status(500).send({ error: 'Failed to delete match' });
      }
    });

    /* ========= Add-Money API ========= */
    app.post('/add-money', async (req, res) => {
      try {
        const { amount, number, trxId = '', method, email } = req.body;

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
          status: 'pending',
          requestedAt: new Date(),
        };

        const result = await addMoneyCollection.insertOne(doc);
        res.status(201).send(result);
      } catch (err) {
        console.error(err);
        res.status(500).send({ error: 'Failed to submit add-money request' });
      }
    });

    app.get('/add-money', async (req, res) => {
      try {
        const { email } = req.query;
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

    app.patch('/add-money/:id', async (req, res) => {
      try {
        const { id } = req.params;
        const { status } = req.body;
        if (!['approved', 'rejected'].includes(status)) {
          return res.status(400).send({ error: 'Invalid status' });
        }

        if (!ObjectId.isValid(id)) {
          return res.status(400).send({ error: 'Invalid request ID format' });
        }
        const _id = new ObjectId(id);
        const moneyDoc = await addMoneyCollection.findOne({ _id });
        if (!moneyDoc)
          return res.status(404).send({ error: 'Request not found' });

        await addMoneyCollection.updateOne({ _id }, { $set: { status } });

        if (status === 'approved') {
          const userUpdateResult = await usersCollection.updateOne(
            { email: moneyDoc.email },
            { $inc: { balance: moneyDoc.amount } } // $inc adds to existing balance
          );
          if (userUpdateResult.matchedCount === 0) {
            console.warn(
              `User ${moneyDoc.email} not found for balance update during add-money approval.`
            );
            // Decide if this should be an error response to admin
          }
        }
        res.send({ message: 'Request updated successfully' });
      } catch (err) {
        console.error(err);
        res.status(500).send({ error: 'Failed to update request' });
      }
    });

    /* ========= Match Join (Booking Player List) API ========= */
    app.get('/booking_player_list', async (_, res) => {
      try {
        const all = await joinsCollection.find().toArray();
        res.send(all);
      } catch (err) {
        console.error(err);
        res.status(500).send({ error: 'Failed to fetch booking player data' });
      }
    });

    app.post('/booking_player_list', async (req, res) => {
      try {
        const join = req.body;
        if (!join.matchId || !join.gameType || !join.email)
          // Add other necessary validations
          return res
            .status(400)
            .send({ error: 'Missing required fields for joining match' });

        const exists = await joinsCollection.findOne({
          matchId: join.matchId,
          email: join.email,
        });
        if (exists)
          return res
            .status(409)
            .send({ error: 'আপনি এই ম্যাচে ইতিমধ্যে একবার জয়েন করেছেন।' });

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

    app.delete('/booking_player_list/:id', async (req, res) => {
      try {
        const { id } = req.params;
        if (!ObjectId.isValid(id)) {
          return res
            .status(400)
            .json({ message: 'Invalid booking ID format.' });
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

    /* ====================== Withdraw API ====================== */
    // POST withdraw request (handles balance deduction)
    app.post('/withdraw', async (req, res) => {
      try {
        const { amount, number, method, email, userId } = req.body; // Assuming userId is passed from frontend

        const parsedAmount = Number(amount);

        // Enhanced Validation
        if (
          !parsedAmount ||
          parsedAmount < 50 || // Minimum withdrawal amount
          !number ||
          !/^(01[3-9]\d{8})$/.test(number) || // Stricter Bangladeshi mobile number pattern
          !method ||
          !['Bkash', 'Nogod'].includes(method) ||
          !email
        ) {
          return res
            .status(400)
            .send({
              message:
                'অবৈধ উত্তোলনের অনুরোধের ডেটা। অনুগ্রহ করে সকল তথ্য সঠিকভাবে দিন।',
            });
        }

        // Find the user by email (more reliable for identifying the user for balance)
        const user = await usersCollection.findOne({ email: email });
        if (!user) {
          return res
            .status(404)
            .send({ message: 'ব্যবহারকারীকে খুঁজে পাওয়া যায়নি।' });
        }

        // Verify userId if passed and matches the found user's _id (optional, but good for consistency)
        if (userId && user._id.toString() !== userId) {
          console.warn(
            `Withdrawal attempt for email ${email} with mismatched userId ${userId}. Proceeding with email-found user.`
          );
          // This is a sanity check; primary identification is via email for balance.
        }

        // Check balance
        if (user.balance === undefined || user.balance < parsedAmount) {
          return res
            .status(400)
            .send({ message: 'আপনার অ্যাকাউন্টে পর্যাপ্ত ব্যালেন্স নেই।' });
        }

        // Deduct balance
        const newBalance = user.balance - parsedAmount;
        const updateUserResult = await usersCollection.updateOne(
          { email: email }, // Update by email
          { $set: { balance: newBalance } }
        );

        if (
          updateUserResult.modifiedCount === 0 &&
          updateUserResult.matchedCount > 0
        ) {
          // Matched but not modified could mean balance was already what it was set to (highly unlikely here)
          // or an issue with the update. This case warrants investigation if it occurs.
          console.error(
            `Balance deduction issue for ${email}. Matched: ${updateUserResult.matchedCount}, Modified: ${updateUserResult.modifiedCount}`
          );
          // For safety, you might not proceed with logging the withdrawal if balance update wasn't confirmed.
          // However, $set should typically modify if the value is different.
        } else if (updateUserResult.matchedCount === 0) {
          // This should ideally not happen if user was found above, but as a safeguard:
          console.error(
            `Failed to find user ${email} during balance update for withdrawal.`
          );
          return res
            .status(500)
            .send({
              message:
                'ব্যালেন্স আপডেট করার সময় ব্যবহারকারীকে খুঁজে পাওয়া যায়নি।',
            });
        }

        // Create withdraw document
        const withdrawDoc = {
          amount: parsedAmount,
          number,
          method,
          email: user.email, // Use email from the authenticated/verified user record
          userId: user._id, // Use _id from the authenticated/verified user record
          status: 'pending', // Admin will approve/reject later for actual payout
          requestedAt: new Date(),
        };

        const result = await withdrawCollection.insertOne(withdrawDoc);
        res.status(201).send({
          message:
            'উত্তোলন অনুরোধ সফল হয়েছে এবং আপনার ব্যালেন্স আপডেট করা হয়েছে।',
          withdrawId: result.insertedId,
          newBalance: newBalance, // Optionally send back the new balance
        });
      } catch (err) {
        console.error('Withdraw Error:', err);
        res
          .status(500)
          .send({
            message:
              'উত্তোলনের অনুরোধ প্রক্রিয়া করতে ব্যর্থ হয়েছে। অনুগ্রহ করে কিছুক্ষণ পর আবার চেষ্টা করুন।',
          });
      }
    });

    // GET withdraw requests (for admin or user history)
    app.get('/withdraw', async (req, res) => {
      const { email } = req.query; // Filter by email for user-specific history
      const filter = email ? { email } : {}; // If no email, admin gets all

      try {
        const list = await withdrawCollection
          .find(filter)
          .sort({ requestedAt: -1 }) // Show newest first
          .toArray();
        res.send(list);
      } catch (err) {
        console.error('Fetch Withdraw Requests Error:', err);
        res
          .status(500)
          .send({ error: 'উত্তোলনের অনুরোধগুলো আনতে ব্যর্থ হয়েছে।' });
      }
    });

    // PATCH withdraw request status (for admin to approve/reject)
    // Note: Balance is already deducted. This is for marking the request as processed/paid or cancelled.
    // If rejected AND you want to refund, you'd add money back to user's balance here.
    app.patch('/withdraw/:withdrawId/status', async (req, res) => {
      const { withdrawId } = req.params;
      const { status, adminNotes } = req.body; // e.g., status: "approved", "rejected", "paid"

      if (!ObjectId.isValid(withdrawId)) {
        return res.status(400).send({ message: 'অবৈধ উত্তোলন অনুরোধের আইডি।' });
      }
      if (
        !status ||
        !['approved', 'rejected', 'paid', 'cancelled'].includes(status)
      ) {
        return res.status(400).send({ message: 'অবৈধ স্ট্যাটাস মান।' });
      }

      try {
        const withdrawRequest = await withdrawCollection.findOne({
          _id: new ObjectId(withdrawId),
        });
        if (!withdrawRequest) {
          return res
            .status(404)
            .send({ message: 'উত্তোলন অনুরোধ খুঁজে পাওয়া যায়নি।' });
        }

        // If a request is being rejected *after* balance deduction and you want to refund:
        if (status === 'rejected' && withdrawRequest.status === 'pending') {
          // Check current status to prevent double refunds
          // Refund the amount to the user's balance
          await usersCollection.updateOne(
            { email: withdrawRequest.email },
            { $inc: { balance: withdrawRequest.amount } }
          );
          toast.info(
            `টাকা ${withdrawRequest.amount} ব্যবহারকারীর ${withdrawRequest.email} অ্যাকাউন্টে ফেরত দেওয়া হয়েছে।`
          );
        }

        const updateDoc = { $set: { status: status } };
        if (adminNotes) {
          updateDoc.$set.adminNotes = adminNotes;
        }
        if (status === 'paid' || status === 'approved') {
          // 'approved' might mean admin confirmed details, 'paid' means money sent
          updateDoc.$set.processedAt = new Date();
        }

        const result = await withdrawCollection.updateOne(
          { _id: new ObjectId(withdrawId) },
          updateDoc
        );

        if (result.matchedCount === 0) {
          return res
            .status(404)
            .send({
              message: 'উত্তোলন অনুরোধ খুঁজে পাওয়া যায়নি আপডেটের জন্য।',
            });
        }

        res.send({
          message: `উত্তোলন অনুরোধ সফলভাবে "${status}" হিসেবে আপডেট করা হয়েছে।`,
        });
      } catch (err) {
        console.error('Update Withdraw Status Error:', err);
        res
          .status(500)
          .send({
            message: 'উত্তোলন অনুরোধের স্ট্যাটাস আপডেট করতে ব্যর্থ হয়েছে।',
          });
      }
    });

    /* ───────── end of run() ───────── */
  } catch (err) {
    console.error('❌ Error connecting to MongoDB:', err);
    // process.exit(1); // Optionally exit if DB connection fails critically
  }
}

run().catch(console.dir);

/* ───────── start server ───────── */
app.listen(port, () =>
  console.log(`🚀 semicolonff server running on port ${port}`)
);
