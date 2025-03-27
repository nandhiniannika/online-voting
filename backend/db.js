const mongoose = require('mongoose');
const mongoURI = "mongodb://localhost:27017/?directConnection=true";
const connectToMongo = async()=>{
    mongoose.connect(mongoURI);
    console.log("Successfully connected to database")
}

module.exports = connectToMongo;