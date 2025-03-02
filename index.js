//* basic config start ...
const express = require('express');
const app = express();
const cors = require('cors');
const { MongoClient } = require('mongodb');
require('dotenv').config();
const port = process.env.PORT || 5000;

// ------middleware start---
app.use(cors());
app.use(express.json());
// ------middleware end---

// MongoDB connection URI
const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DP_PASS}@cluster0.vv356rj.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0`;
const client = new MongoClient(uri);

async function run() {
  try {
    await client.connect();
    console.log('connected to mongoDB atlas successfully');
    // kon database er sathe connect korbo seitar nam & collection nam dite hobe.  Get the database and collection on which to run the operation

    const classicMatchCollection = client
      .db('semicolonff_DB')
      .collection('classic_Match');

    // Test route
    app.get('/', (req, res) => {
      res.send('semicolonff testing');
    });

    app.get('/classic', async (req, res) => {
      const result = await classicMatchCollection.find().toArray(); // toArry dile result gulo  arry akare show korbe
      res.send(result);
    });
  } catch (error) {
    console.error('Error connection to mongodb ', error);
  } finally {
    // Optionally, close the client when needed
    // await client.close();
  }
}

//* basic config end ...

// Run the database connection
run().catch(console.dir);

//---- basic------
app.listen(port, () => {
  console.log(`semicolon ff server is running on port ${port}`);
});
//---- basic------
