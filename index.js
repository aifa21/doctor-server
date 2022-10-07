const express = require("express");
const bodyParser = require("body-parser");
const cors = require("cors");
const fs = require("fs-extra");
const fileUpload = require("express-fileupload");
require("dotenv").config();
const ObjectId = require('mongodb').ObjectId;
const app = express();

const MongoClient = require("mongodb").MongoClient;
 const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.xu8lv.mongodb.net/${process.env.DB_NAME}?retryWrites=true&w=majority`;

const port = process.env.PORT||5000;
//hotel-booking-a597f



app.get("/", (req, res) => {
  res.send("hello world");
});
app.use(cors());
app.use(bodyParser.json());
app.use(express.static("doctors"));
app.use(fileUpload());

const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true });

async function run() {
  try{
  await client.connect((err) => {
  console.log("database connected");
  const appointmentsCollection = client.db("doctorsPortal").collection("appointments");
  const prescriptionCollection = client.db("doctorsPortal").collection("prescriptions");
  const userCollection = client.db("doctorsPortal").collection("users");
  const doctorCollection = client.db("doctorsPortal").collection("doctors");
  // POST

  app.post("/addAppointment", (req, res) => {
    const appointment = req.body;
    console.log(appointment);
    appointmentsCollection.insertOne(appointment).then((result) => {
      res.send(result.insertCount > 0);
    });
  });

  app.post("/addPrescription", (req, res) => {
    const prescription = req.body;
    console.log(prescription);
    prescriptionCollection.insertOne(prescription).then((result) => {
      res.send(result.insertCount > 0);
    });
  });

  app.post("/appointmentsByDate", (req, res) => {
    const date = req.body;
    const email=req.body.email;

    // console.log(date);
    doctorCollection.find({ email: email })
      .toArray((err, doctors) => {
       const filter={date:date.date} 
       if(doctors.length===0){
         filter.email=email;
       }
      
    appointmentsCollection.find( filter)
      .toArray((err, documents) => {
        res.send(documents);
      })
  })
});
// is Doctor
app.post("/isDoctor", (req, res) => {
  const email = req.body.email;
  console.log("email",email);
  doctorCollection.find({ email: email })
      .toArray((err, doctors) => {
          res.send(doctors.length > 0);
      })
})


  // add doctors
  app.post("/addDoctors", async(req, res) => {
    const doctors = req.body;
    console.log("doc",doctors);
    const result = await doctorCollection.insertOne(doctors);
      res.send(result);
  });

  app.get("/singleDoctor",async (req, res) => {
    const doctorEmail = req.query.email;
    const doctorQuery = { email: doctorEmail }
   
     const doctorCursor = doctorCollection.find( doctorQuery );
    
     const doctor = await doctorCursor.toArray();
     console.log("qqq",doctor);
             res.json(doctor);
  
  });
  //add users

 app.post("/users", async(req, res) => {
    const users = req.body;
    console.log(users);
    const result=await usersCollection.insertOne(doctors);
    console.log(result);
    res.send(result);
   
  });
  //if user exist it will not enter in db else viceversa
  app.put('/users', async (req, res) => {
    const user = req.body;
    const filter = { email: user.email };
    const options = { upsert: true };
    const updateDoc = { $set: user };
    const result = await usersCollection.updateOne(filter, updateDoc, options);
    res.json(result);
});
  // .. update status ...
  app.patch('/updateStatus/:id', (req, res) => {
    const id = ObjectId(req.params.id)
    console.log(id);
    appointmentsCollection.updateOne({ _id: id }, {
    $set: { status: req.body.status, color: req.body.color }
   })
    .then(result => {
      // console.log(result);
      }) ;
    });

    //.. UPDATE DOCTOR'S INFORMATION  ...
    app.put('/addDoctors/:id', async (req, res) => {
      const user = req.query;
      const id = ObjectId(req.params.id)
			console.log("idd",id);
			const updatedReq = req.body;
			console.log("Comming form UI", updatedReq);
      const options = { upsert: true };
       const updateDoc = {
         $set: {   
                   name:req.body.name,
                   degree:req.body.degree,
                   designation:req.body.designation,
                   days:req.body.days,
                   time:req.body.time,
                   img:req.body.img
                  }
       };
       const result = await doctorCollection .updateOne({_id:id}, updateDoc, options);
    
      res.send();
    });

   //api for deleting user by admin
 app.delete('/deleteUser/:id', (req, res) => {
  const id = ObjectId(req.params.id);
  console.log("did=",id);
  appointmentsCollection.findOneAndDelete({ _id: id })
      .then(res => console.log("successfully deleted"))
     
})
  //get the information from database
  app.get("/appointments", (req, res) => {
    appointmentsCollection.find({}).toArray((err, documents) => {
      res.send(documents);
    });
  });
//.specific appointment
  app.get("/specificAppointments",async (req, res) => {
    const email = req.query.email;
    const query = { email: email }
   
     const cursor = appointmentsCollection.find(query);
     const appointments = await cursor.toArray();
     console.log("qc",appointments);
             res.json(appointments);
  
  });

  app.get("/prescription", (req, res) => {
    prescriptionCollection.find({}).toArray((err, documents) => {
      res.send(documents);
    });
  });
  //.specific prescription
  app.get("/specificPrescription",async (req, res) => {
    const email = req.query.email;
    const query = { email: email }
    console.log(query);
     const cursor = prescriptionCollection.find(query);
     const prescription = await cursor.toArray();
             res.json(prescription);
  
  });

  app.get("/addDoctors", (req, res) => {
    doctorCollection.find({}).toArray((err, documents) => {
      res.send(documents);
    });
  });
  app.get("/addAdmins", (req, res) => {
    adminCollection.find({}).toArray((err, documents) => {
      res.send(documents);
    });
  });
});
  }
  finally {
    // await client.close();
}
}

run().catch(console.dir);

app.get('/', (req, res) => {
    res.send('Hello Doctors portal!')
})

app.listen(port, () => {
    console.log(`listening at ${port}`)
})
