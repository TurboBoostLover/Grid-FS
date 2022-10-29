const express = require("express");
const app = express();
const mongoose = require("mongoose");
const multer = require("multer");
const { GridFsStorage } = require("multer-gridfs-storage");
require("dotenv").config();
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

// connection string to my mongo db
const mongouri =
  "mongodb+srv://user:user@cluster0.rwmrnyy.mongodb.net/?retryWrites=true&w=majority";

//connection boiler plate
try {
  mongoose.connect(mongouri, {
    useUnifiedTopology: true,
    useNewUrlParser: true,
  });
} catch (error) {
  handleError(error);
}
process.on("unhandledRejection", (error) => {
  console.log("unhandledRejection", error.message);
});

//creating bucket
let bucket;
mongoose.connection.on("connected", () => {
  var client = mongoose.connections[0].client;
  var db = mongoose.connections[0].db;
  bucket = new mongoose.mongo.GridFSBucket(db, {
    bucketName: "newBucket",
  });
  console.log(bucket);
});

//upload file to db
const storage = new GridFsStorage({
  url: mongouri,
  file: (req, file) => {
    return new Promise((resolve, reject) => {
      const filename = file.originalname;
      const fileInfo = {
        filename: filename,
        bucketName: "newBucket",
      };
      resolve(fileInfo);
    });
  },
});

//function to call to upload
const upload = multer({
  storage,
});

//get images from url *endpoint*
app.get("/fileinfo/:filename", (req, res) => {
  const file = bucket
    .find({
      filename: req.params.filename,
    })
    .toArray((err, files) => {
      if (!files || files.length === 0) {
        return res.status(404).json({
          err: "no files exist",
        });
      }
      bucket.openDownloadStreamByName(req.params.filename).pipe(res);
    });
});

//post image to url *endpoint*
app.post("/upload", upload.single("file"), (req, res) => {
  res.status(200).send("File uploaded successfully");
});

//Node for file
const PORT = process.env.PORT || 8080;
app.listen(PORT, () => {
  console.log(`Application live on localhost: ${PORT}`);
});

//node on app.js to start server
//get request at http://localhost:8080/fileinfo/<img>
//post request at http://localhost:8080/upload with attached body with an image
