const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const fileUpload = require('express-fileupload');
require('dotenv').config();
const MongoClient = require('mongodb').MongoClient;
const port = 3500;

const app = express();
app.use(cors());
app.use(bodyParser.json());
app.use(fileUpload())


// connect mongo db
const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASSWORD}@cluster0.aew8x.mongodb.net/${process.env.DB_NAME}?retryWrites=true&w=majority`;
const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true });

client.connect(err => {
  if(err) throw err;

  const userCollection = client.db("netri").collection("users");
  const BookingCollection = client.db("netri").collection("booking");
  const serviceCollection = client.db("netri").collection("service");
  const reviewCollection = client.db("netri").collection("review");

  // Hello World
  app.get('/', (req, res) => {
    res.send('Hello world from node');
  })

  // Registration
  app.post('/registration', (req, res) => {
    const data = req.body;
    const email = req.body.email;
    data.role = 'customer';
    const emailExist = userCollection.find({email});
    emailExist.toArray((err, doc) => {
      if( doc.length > 0 ){
          res.status(404).send({message: "Email Address Already Exist"});
        }else{
          userCollection.insertOne(data)
          .then(result => {
            res.status(200).send({message: "Account Successfully Created", email: email, role: data.role});
          }
        )
      }
    })
  })

  // Login
  app.post('/login', (req, res) => {
    const email = req.body.email;
    const password = req.body.password;
    userCollection.findOne({email: email})
    .then(result => {
      if(password === result.password){
        res.send({message: "Successfully Login", name: result.name, email: email, role: result.role})
      }else {
        res.send({message: "Something went wrong"})
      }
    })
    .catch(err => res.send({message: "Email Address not valid"}));
  })

  // Booking
  app.post('/booking', (req, res) => {
    const bookingData = req.body;
    BookingCollection.insertOne(bookingData)
    .then( result => {
      if(result.insertedCount > 0){
        res.send({message: "Your Booking has been successfully completed"})
      }
    })
  })

  // All Order
  app.get('/all-order', (req, res)=>{
    const queryEmail = req.query.email;
    userCollection.find({email: queryEmail})
    .toArray((err, user) => {
      const filter = {};
      if(user[0].role === 'customer'){
        filter.email = user[0].email;
        console.log("in",filter)
      }

      BookingCollection.find(filter)
      .toArray((err, doc)=> {
        res.send(doc);
      })

    })
  })

  // Add Service
  app.post('/add-service', (req, res)=>{
    const name = req.body.service_name;
    const des = req.body.service_des;
    const hour = req.body.service_hour;
    const price = req.body.service_price;
    let uploadPath;
    let uploadedImage;

    if (!req.files || Object.keys(req.files).length === 0) {
      return res.status(400).send({error: "No files were uploaded"});
    }

    uploadedImage = req.files.serviceImage;
    uploadPath = `${__dirname}/service-images/${uploadedImage.name}`;

    uploadedImage.mv(uploadPath, (err) => {
      if(err){
        return res.status(500).send(err);
        res.send({Success: "File uploaded!", uploadPath});
      }
    })

    serviceCollection.insertOne({uploadedImage, name, des, hour, price})
    .then(result => {
      if(result.insertedCount > 0){
        res.send({result});
      }
    })
  })

  // All Services
  app.get('/all-services', (req, res) => (
    serviceCollection.find({})
    .toArray((err, doc) => {
      res.send(doc)
    })
  ))


  // Add Review
  app.post('/add-review', (req, res) => {
    const reviewData = req.body;
    const email = reviewData.email;
    reviewCollection.find({email})
    .toArray((err, doc) => {
      if(doc.length > 0){
        return res.send({message: "Your Have Provided The Review"})
      }
      reviewCollection.insertOne(reviewData)
      .then(result => {
        if(result.insertedCount > 0){
          res.send({message: "Review Added Successfully"})
        }
      })
    })
  })

  // Get Review
  app.get('/get-review', (req, res) => {
    reviewCollection.find({})
    .toArray((ree, doc) => {
      res.send(doc)
    })
  })


});


app.listen(process.env.PORT || port, ()=> console.log('App is running at port 3500'));