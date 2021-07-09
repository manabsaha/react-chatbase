const express = require("express");
const app = express();
const bodyParser = require("body-parser");
const cors = require("cors");
const mysql = require("mysql");
const { table } = require("console");

const http = require('http').createServer(app);
const io = require('socket.io')(http);

const cookieParser = require("cookie-parser");
const session = require("express-session");

const bcrypt = require("bcrypt");
const saltRounds = 10;

const port = 3001;
app.use(cors({
    origin: ["http://localhost:3000"],
    methods: ["GET", "POST"],
    credentials: true,
}));
app.use(express.json());
app.use(bodyParser.urlencoded({extended:true}));

app.use(cookieParser());
app.use(
    session({
      key: "userId",
      secret: "chatbasesecretkey",
      resave: false,
      saveUninitialized: false,
      cookie: {
        expires: 60 * 60 * 24,
      },
    })
  );

const db = mysql.createPool({
    host: "localhost",
    user: "root",
    password: "",
    database: "chatbase",
});

app.get("/",(req,res)=>{
    res.send("Backend from videochat..!!");
});

app.post("/send",(req,res)=>{
    const obj = req.body.userdata;
    const d = new Date();
    const sql = "insert into "+obj.table_name+" (msgId,sender,receiver,msg,time) values(?,?,?,?,?)";
    const values = [obj.msgId,obj.sender,obj.receiver,obj.msg,d];
    db.query(sql,values,(err,result)=>{
        if(err){
            console.log(err);
        }
    });
    const sql2 = "update userchatmap set lastupdate = ? where table_id = ?";
    const values2 = [d, obj.table_name];
    db.query(sql2,values2,(err,result)=>{
        if(err){
            console.log(err);
        }
    });

});

app.get("/chat",(req,res)=>{
    const table_name = req.query.table_name;
    const sql = "select * from "+table_name+" order by time asc";
    const values = [];
    db.query(sql,values,(err,result)=>{
        if(err){
            console.log(err);
        }
        else{
            //success
            res.send(result);
        }
    });
});

app.get("/chatlist", (req,res)=>{
    const username = req.query.user;
    const sql = "select user1, user2, table_id from userchatmap where (user1 = (?) or user2 = (?)) order by lastupdate desc";
    const values = [username, username];
    db.query(sql, values, (err, result) => {
        if (err){
            console.log(err);
        }
        else{
            res.send(result)
        }
    })

});
app.get("/receiver", (req,res)=>{
    const username = req.query.user;
    const table_id = req.query.table_id;
    const sql = "select * from userchatmap where table_id='"+table_id+"'";
    const values = [username];
    db.query(sql, values, (err, result) => {
        if (err){
            console.log(err);
        }
        else{
            //console.log(result[0].user1, result[0].user2, username);
            if (username==result[0].user1){
                res.send(result[0].user2);
            }
            else{
                res.send(result[0].user1);
            }
            
        }
    })
       const sql2 = "update "+table_id+" set status='READ' where receiver=?";
       const values2 = [username];
       db.query(sql2, values2, (err2, results2) => {
           if (err2){
               console.log(err);
           }
       })

});

app.post("/createchat",(req,res)=>{
    const user1 = req.body.touser;
    const user2 = req.body.curuser;
    console.log(user1,user2)
    const d = new Date();
    //const dt= d.toLocaleString('en-US', { timeZone: 'Asia/Kolkata' });
    const chatid = user1+user2;
    const sql1 = "insert into userchatmap values(?,?,?,?)";
    const values1 = [chatid,user1,user2,d];
    db.query(sql1, values1, (err, result) => {
        if (err){
            console.log(err);
        }
    })

    const sql2 = "create table "+chatid+" (msgID varchar(255), sender varchar(255), receiver varchar(255), msg varchar(4095), time datetime, status varchar(50) default 'SENT')";
    const values2 = [];
    db.query(sql2, values2, (err, result) => {
        if (err){
            console.log(err);
        }
    })
    
});



//realtime message sync
io.on('connection',socket=>{
    socket.on('message',msgObj=>{
        io.emit('message',msgObj)
    })
});

app.post("/register", (req, res) => {
    const username = req.body.username;
    const password = req.body.password;
    const fullname = req.body.fullname;
  
    bcrypt.hash(password, saltRounds, (err, hash) => {
      if (err) {
        console.log(err);
      }
  
      db.query(
        "INSERT INTO myusers (username, password, fullname) VALUES (?,?,?)",
        [username, hash,fullname], (err, result) => {
            if(err){
                console.log(err);
                res.send({message: "Account creation failed"});
            }
            else{
                res.send({message:"Account successfully created. Go back to login"});
            }
        }
      );
    });
});

app.post("/login", (req, res) => {
    const username = req.body.username;
    const password = req.body.password;
  
    db.query(
      "SELECT * FROM myusers WHERE username = ?;",
      [username], (err, result) => {
        if (err) {
          res.send({ err: err });
        }
        
        if (result.length > 0) {
            bcrypt.compare(password, result[0].password, (error, response) => {
                if (response) {
                  req.session.user = result;
                  //console.log(req.session.user);
                  res.send(result);
                } else {
                  res.send({ message: "Wrong username/password combination!" });
                }
              });
        } 
        else{
            res.send({ message: "User doesn't exist" });
        }
      }
    );
});

app.get("/login", (req, res) => {
if (req.session.user) {
    res.send({ loggedIn: true, user: req.session.user });
} else {
    res.send({ loggedIn: false });
}
});

app.get("/logout",(req,res)=>{
    if(req.session.user){
        req.session.destroy();
        res.send({message:"logged out"})
    }
    else{
        res.send({message:"already logged out"})
    }
})

http.listen(port,()=>{
    console.log("Running express on port 3001");
});