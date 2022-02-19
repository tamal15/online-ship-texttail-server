const express= require("express");
const { MongoClient } = require('mongodb');
const cors=require('cors');
const bodyParser = require("body-parser");
const ObjectId=require('mongodb').ObjectId;
require('dotenv').config();
const fileUpload=require('express-fileupload');
const app=express();
const port =process.env.PORT || 5000;

app.use(cors());
app.use(bodyParser.json({limit: '100mb'}));
app.use(bodyParser.urlencoded({limit: '100mb', extended: true}));
app.use(express.json());
app.use(fileUpload());

const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.ev8on.mongodb.net/myFirstDatabase?retryWrites=true&w=majority`;


const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true });


async function run() {

    try{
        await client.connect();
        console.log("connected to database");

        const database = client.db('online-shop');
        // const shopCollection= database.collection("shopping")
        const shopCollection=database.collection('shopping')
        const registrationCollection=database.collection('userReg')
        const contactCollection=database.collection('contact-customer')
        const threePicesCollection=database.collection('Three-Piece')
        const shirtOrderCollection=database.collection('shirt-order')

        
        app.post('/product', async(req,res)=>{
           const name=req.body.name;
           const price=req.body.price;
           const pic=req.files.image;
           const picData=pic.data;
           const encodeedPic=picData.toString('base64');
           const buffer=Buffer.from(encodeedPic, 'base64');
           const product={
               name,
               price,
               image:buffer
           }
           const result=await shopCollection.insertOne(product);
            res.json(result)
        });


        app.get('/product',async(req,res)=>{
            const cursor=shopCollection.find({})
            const product=await cursor.toArray();
            res.json(product)
        });

        // three piece add database 
        app.post('/threePices', async(req,res)=>{
            const name=req.body.name;
            const price=req.body.price;
            const pic=req.files.image;
            const picData=pic.data;
            const encodeedPic=picData.toString('base64');
            const buffer=Buffer.from(encodeedPic, 'base64');
            const product={
                name,
                price,
                image:buffer
            }
            const result=await threePicesCollection.insertOne(product);
             res.json(result)
         });
   
        //   database to ui threePices
        app.get('/threePices', async(req,res)=>{
            const store=threePicesCollection.find({})
            const result=await store.toArray()
            res.json(result)
        });

        // threepiece details 
        app.get('/threePices/:id', async(req,res)=>{
            const id=req.params.id;
            const query={_id:ObjectId(id)}
            const result=await threePicesCollection.findOne(query)
            res.json(result)
        })

         // parchage page or details page of get api 
    app.get('/product/:id', async(req,res)=>{
        const id=req.params.id
        const query={_id:ObjectId(id)}
        const result=await shopCollection.findOne(query)
        res.json(result)
    });

    // contact databse 
    app.post('/contact', async(req,res)=>{
        const data=req.body;
        const result=await contactCollection.insertOne(data);
        res.json(result)
    });

    // contact database show the ui 
    app.get('/contact', async(req,res)=>{
        const data=contactCollection.find({})
        const result=await data.toArray()
        res.json(result)
    })

        // reg data to the database store 
        app.post('/reg', async(req,res)=>{
            const reg=req.body;
            const result=await registrationCollection.insertOne(reg);
            console.log(result)
            res.json(result)
        })

        // googlesignin data to the database store 
        app.put('/reg', async(req,res)=>{
            const users=req.body;
            const check={email:users.email}
            const option={upsert:true}
            const update={$set:users}
            const result=registrationCollection.updateOne(check,update,option)
            res.json(result)
        })

        // admin add 
        app.put('/reg/admin', async(req,res)=>{
            const user=req.body;
            console.log('put',user)
            const cursor={email:user.email}
            const update={$set: {role:"admin"}}
            const result= await registrationCollection.updateOne(cursor,update)
            res.json(result)
        });

        // database admin check korar jonno 
        app.get('/reg/:email', async(req,res)=>{
            const email=req.params.email;
            const query= {email:email};
            const user=await registrationCollection.findOne(query)
            let isAdmin=false;
            if(user?.role==="admin"){
                isAdmin=true;
            }
            res.json({admin:isAdmin})
        });
    //    t-shirt delete 
        app.delete('/deleteManage/:id', async(req,res)=>{
            const result=await shopCollection.deleteOne({_id:ObjectId(req.params.id)});
            res.json(result)
        })

        // three piece delete 
        app.delete('/deletePiece/:id', async(req,res)=>{
            const result=await threePicesCollection.deleteOne({_id:ObjectId(req.params.id)});
            res.json(result)
        });


        // manage all product delete 
        app.delete('/delete/:id', async(req,res)=>{
            const result=await shirtOrderCollection.deleteOne({_id:ObjectId(req.params.id)});
            res.json(result)
        })

        // product order 
         // myOrder the store database of post 
    app.post('/myOrder', async(req,res)=>{
        const order=req.body;
        const result=await shirtOrderCollection.insertOne(order)
        res.json(result)
    });
    app.get('/myOrder', async(req,res)=>{
        const data=shirtOrderCollection.find({})
        const result=await data.toArray()
        res.json(result)
    })

     // get myorder 
     app.get("/myOrder/:email", async (req, res) => {
        console.log(req.params.email);
        const result = await shirtOrderCollection
          .find({ email: req.params.email })
          .toArray();
        res.send(result);
      });

      //   delete api myorder 
    app.delete('/deleteOrder/:id', async(req,res)=>{
        const result=await shirtOrderCollection.deleteOne({_id:ObjectId(req.params.id)});
        res.json(result)
    });

     // get for manage all orders 
    //  app.get('/myOrder', async(req,res)=>{
    //     const cursor=shirtOrderCollection.find({})
    //     const result=await cursor.toArray()
    //     console.log(result)
    //     res.json(result)
    // });

   // status update
   app.put("/statusUpdate/:id", async (req, res) => {
    const filter = { _id: ObjectId(req.params.id) };
    console.log(req.params.id);
    const result = await shirtOrderCollection.updateOne(filter, {
      $set: {
        status: req.body.status,
      },
    });
    res.send(result);
    console.log(result);
  });




    }

    finally{
        // await client.close();
    }
}

run().catch(console.dir)

app.get('/', (req,res)=>{
    res.send("online shopping");
   });

   app.listen(port, ()=>{
    console.log("runnning online on port", port)
  });