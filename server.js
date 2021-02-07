var express = require('express');
let mysql = require('mysql');
const color=require('colors');
const dotenv= require('dotenv');
var bodyParser= require('body-parser');

//KhaiBaoRouter
const Account = require('./routes/Account');
const Food = require('./routes/Food');
const Restaurants = require('./routes/Restaurants');
const Admin = require('./routes/Admin');
const Search = require('./routes/Search');
const Home = require('./routes/Home');
//*//

const app = express();
app.set("view engine", "ejs");
app.set("views","./views");

app.use(express.static("public"));
app.use(express.static("resource"));

app.use(express.json({
    extended: true
}));

app.use(bodyParser.json());

app.use(bodyParser.urlencoded({extended: false}));

dotenv.config({
    path:'./config/config.env'
});

// Controler for web
app.get("/", function(req, res) {
    res.render("home");
})

app.get("/base-login", function(req, res) {
    res.render("login");
})


// Routes API
require("./routes/FileManager")(app);

app.use("/user",Account);
app.use("/food",Food);
app.use("/restaurant",Restaurants);
app.use("/search",Search);
app.use("/base-admin",Admin);
app.use("/home",Home);

const PORT= process.env.PORT || 3000;
app.listen(PORT,
     console.log(`Server running on port: ${PORT}`.red.underline.bold)
     );