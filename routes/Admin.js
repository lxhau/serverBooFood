const express = require("express");
const Router = express.Router();
const mysql = require("../config/db");
const crypto = require('crypto');
var jwt = require("jsonwebtoken");
const fs = require('fs');
let key = fs.readFileSync('./config/privateKey.pem', 'utf8');
let usrKEY = fs.readFileSync('./config/usrKEY.pem', 'utf8');
let pwdKEY = fs.readFileSync('./config/pwdKEY.pem', 'utf8');
const sendMail = require('./functions/mailer');

Router.post('/login', function(req, res){
    var post_data= req.body;
   // console.log(post_data);

    if(post_data.email == usrKEY){
        if(post_data.email == usrKEY && post_data.password == pwdKEY){
            jwt.sign({
            role: 0,
            active: 1,
            email: usrKEY
            }, key, {expiresIn:Math.floor(Date.now()/1000)+60*60*24*7}, function(err, token){
            if(err){
                res.json({result:0, errMsg:err});
            }else{
                return res.status(200).json({
                    result:1,
                    msg: 'Wellcome To BooFood',
                    avatar: "https://gravatar.com/avatar/?s=200&d=retro",
                    DisplayName: 'Admin',
                    token: token
                    });
            }
            });
        }else{
             res.status(403).json({result:0,errMsg:'AccessDenied'});
        }
    }else{
        try{
            mysql.query('SELECT * FROM ADMIN where email = ?',post_data.email,(err, rows)=>{
                if(!err){
                    if(rows.length>0){
                        var salt = rows[0].salt;
                        var encrypted_password = verifyPassword(post_data.password,salt).passwordhash;
                        //console.log(post_data.password);
                        //console.log(salt, encrypted_password);
                       // console.log(rows[0].hashpass)
                        if(encrypted_password == rows[0].hashpass){
                                jwt.sign({
                                id_admin: rows[0].id_admin,
                                role: rows[0].role,
                                active: rows[0].state
                                }, key, {expiresIn:Math.floor(Date.now()/1000)+60*60*24*30*3}, function(err, token){
                                if(err){
                                    res.json({result:0, errMsg:err});
                                }else{
                                    var created = new Date();
                                    var id_token= getRndInteger();
                                    var sql = "INSERT INTO TOKEN_ADMIN (id_token, id_admin, state, RegDate, token) VALUES ( ? );";
                                    var values = [id_token,rows[0].id_admin,true,created,token];
                                    mysql.query(sql,[values],(err,row)=>{
                                        if(!err){
                                            return res.status(200).json({
                                                result:1,
                                                msg: 'Successfully',
                                                DisplayName: rows[0].FullName,
                                                token: token
                                                });
                                        }else{
                                            res.status(400).json({result:0, errMsg:"Bad Request"});
                                            console.log(err);
                                        }
                                    })
                                }
                            });
                        }else{
                            res.send("Wrong password.")
                            //res.json({result:0, errMsg:"Wrong password."});
                        }
                    }else{
                        res.send("Account does not exist")
                       // res.json({result:0, errMsg:"Account does not exist"});
                    }
                }else{
                    res.status(400).json({result:0, errMsg:"Bad Request"});
                    console.log(err);
                }
            })
        }catch (err){
            res.status(400).json({result:0, errMsg:"Bad Request"});
        }
    }
}) // good

Router.post('/addNewStaff', function(req, res) {
    var post_data = req.body;
    try{
     jwt.verify(post_data.token, key, function(err,decoded){
        if(!err && decoded != undefined){
            if(decoded.role==0){
                try{
                    mysql.query('SELECT * FROM ADMIN where email = ?',post_data.email, (err, rows) => {
                    if (!err){
                       if(rows.length>0){
                            return res.status(400).json({
                            success:false,
                            msg: 'Email already exists'
                            });
                        }
                        else{
                            var plain = genRandomString(12);
                            var password = plain;
                            var hash_data = saltHashPassword(password);
                            var password = hash_data.passwordhash;
                            var salt = hash_data.salt;
                            var created = new Date();
                            var id_admin = getRndInteger();
                            var sql = "INSERT INTO `ADMIN`(`id_admin`, `salt`, `hashpass`, `FullName`, `email`, `createDay`, `state`, `role`) VALUES (?);";
                            var values = [id_admin,salt,password,post_data.fullName,post_data.email,created,1,1];
                            mysql.query(sql,[values],function (err,rows){
                                if(!err){
                                sendMail (post_data.fullName, post_data.email,plain);
                                   //Sent Mail
                                   if(result === true){
                                       return res.status(200).json({
                                        success:true,
                                        msg: 'Create Successfully'
                                    });
                                   }
                                }else{
                                    res.status(400).json({result:0, errMsg:"Bad Request"});
                                    console.log(err);
                                }
                            })
                        }
                    }else{
                        res.status(400).json({result:0, errMsg:"Bad Request"});
                        console.log(err);
                    }
                })
                }catch(err){
                    res.status(400).json({result:0, errMsg:"Bad Request"});
                    console.log(err);
                }

            }else{
                res.status(400).json({result:0, errMsg:"Bad Request"});
            }
        }else{
            res.status(401).json({result:0, errMsg:"Missing Portal Request Verification Token"});
        }
    })
    }catch(err){
    res.status(501).json({result:0, errMsg:"Bad Request"});
    }
}) //good

var genRandomString = function(length){
    return crypto.randomBytes(Math.ceil(length/2)).toString('hex').slice(0,length);
};

var sha512 = function(password,salt){
    var hash = crypto.createHmac('sha512',salt);
    hash.update(password);
    var value = hash.digest('hex');
    return {
        salt:salt,
        passwordhash:value
    };
};

function saltHashPassword(userpassword){
    var salt = genRandomString(16);
    var passwordData = sha512(userpassword,salt);
    return passwordData;
}

function verifyPassword(userpassword,salt){
    var passwordData = sha512(userpassword,salt);
    return passwordData;
}

function getRndInteger() {
    return Math.floor(100000000 + Math.random() * 90000000);
}


module.exports = Router;