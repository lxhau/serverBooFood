const express = require("express");
const Router = express.Router();
const mysql = require("../config/db");
const crypto = require('crypto');
var jwt = require("jsonwebtoken");
const fs = require('fs')
let key = fs.readFileSync('./config/privateKey.pem', 'utf8');



Router.post('/register', (req, res) => {
    let user = req.body;
    try{
        mysql.query('SELECT * FROM ACCOUNT where phone = ?',user.phone, (err, rows) => {
        if (!err){
           if(rows.length>0){
                return res.status(400).json({
                success:false,
                msg: 'Number Phone already exists'
                });
            }
            else{
                var password = user.password;
                var hash_data = saltHashPassword(password);
                var password = hash_data.passwordhash;
                var salt = hash_data.salt;
                var avatar= "https://gravatar.com/avatar/?s=200&d=retro"
                var created = new Date();
                var id_user = getRndInteger();

                var sql = "INSERT INTO ACCOUNT (id_user, email, phone, ROLE, first_Name, last_Name, salt, hash_Password, url_avt, create_Day, active) VALUES ( ? );";
                var values = [id_user,null,user.phone,0,user.first_Name, user.last_Name,salt,password,avatar,created,true];

                mysql.query(sql,[values],(err,rows)=>{
                    if(!err){
                        return res.status(200).json({
                        success:true,
                        message: `Create Successfully ${user.phone}`
                        });
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

}); /// good

Router.post('/login', (req, res)=>{
    let post_data = req.body;
    try{
        mysql.query('SELECT * FROM ACCOUNT where phone = ?',post_data.phone,(err, rows)=>{
            if(!err){
                if(rows.length>0){
                    var salt = rows[0].salt;
                    var encrypted_password = verifyPassword(post_data.password,salt).passwordhash;
                    if(encrypted_password == rows[0].hash_Password){
                        if(rows[0].role === 1){
                            res.status(403).json({result:0,errMsg:'Access Denied'});
                        }else{
                            jwt.sign({
                            id: rows[0].id_user,
                            role: rows[0].role,
                            active: rows[0].active,
                            phone: rows[0].phone
                            }, key, {expiresIn:Math.floor(Date.now()/1000)+60*60*24*30*3}, function(err, token){
                            if(err){
                                res.json({result:0, errMsg:err});
                            }else{
                                var created = new Date();
                                var id_token= getRndInteger();
                                var sql = "INSERT INTO TOKEN (id_token, id_user, state, RegDate, token) VALUES ( ? );";
                                var values = [id_token,rows[0].id_user,true,created,token];
                                mysql.query(sql,[values],(err,row)=>{
                                    if(!err){
                                        return res.status(200).json({
                                            result:1,
                                            msg: 'Successfully',
                                            avatar: rows[0].url_avt,
                                            DisplayName: rows[0].first_Name + " " +rows[0].last_Name,
                                            token: token
                                            });
                                    }else{
                                        res.status(400).json({result:0, errMsg:"Bad Request"});
                                        console.log(err);
                                    }
                                })
                            }
                            });
                        }
                    }else{
                        res.json({result:0, errMsg:"Wrong password."});
                    }
                }else{
                    res.json({result:0, errMsg:"Account does not exist"});
                }
            }else{
                res.status(400).json({result:0, errMsg:"Bad Request"});
                console.log(err);
            }
        })
    }catch (err){
        res.status(400).json({result:0, errMsg:"Bad Request"});
    }
}) /// good

Router.post('/loginMerchant', (req, res)=>{
    let post_data = req.body;
    try{
        mysql.query('SELECT * FROM ACCOUNT where phone = ?',post_data.phone,(err, rows)=>{
            if(!err){
                if(rows.length>0){
                    var salt = rows[0].salt;
                    var encrypted_password = verifyPassword(post_data.password,salt).passwordhash;
                    if(encrypted_password == rows[0].hash_Password){
                        if(rows[0].role === 0){
                            res.status(403).json({result:0,errMsg:'AccessDenied'});
                        }else{
                            mysql.query('SELECT * from MERCHANT where id_user =? ',rows[0].id_user,(err, kq)=>{
                                if(!err){
                                    if(kq[0].active === 0){
                                     jwt.sign({
                                        id: rows[0].id_user,
                                        id_restaurant: kq[0].id_restaurant,
                                        role: rows[0].role,
                                        active: rows[0].active,
                                        phone: rows[0].phone
                                        }, key, {expiresIn:Math.floor(Date.now()/1000)+60*60*24*30*3}, function(err, token){
                                        if(err){
                                            res.json({result:0, errMsg:err});
                                        }else{
                                            var created = new Date();
                                            var id_token= getRndInteger();
                                            var sql = "INSERT INTO TOKEN (id_token, id_user, state, RegDate, token) VALUES ( ? );";
                                            var values = [id_token,rows[0].id_user,true,created,token];
                                            mysql.query(sql,[values],(err,row)=>{
                                                if(!err){
                                                    return res.status(200).json({
                                                        result:1,
                                                        msg: 'Successfully',
                                                        avatar: rows[0].url_avt,
                                                        DisplayName: rows[0].first_Name + " " +rows[0].last_Name,
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
                                        res.status(403).json({result:0, errMsg:"Account is not activated"});
                                    }
                                }else{
                                    res.status(400).json({result:0, errMsg:"Bad Request"});
                                    console.log(err);
                                }
                            })
                        }
                    }else{
                        res.status(403).json({result:0, errMsg:"Wrong password."});
                    }
                }else{
                    res.status(403).json({result:0, errMsg:"Account does not exist"});
                }
            }else{
                res.status(400).json({result:0, errMsg:"Bad Request"});
                console.log(err);
            }
        })
    }catch (err){
        console.log(err);
    }
}) /// good

Router.post('/verifytoken',(req, res)=>{
    var post_data = req.body;
    mysql.query('SELECT * FROM token WHERE token = ? and state = true',post_data.token,(err, result)=>{
        if(!err && result.length>0){
            jwt.verify(post_data.token, key, function(err, decoded) {
                if(!err && decoded !== undefined){
                    res.json({result:1, User:decoded});
                }else{
                    res.json({result:0, errMsg:"Error Token"});
                }
            });
        }else{
            res.json({result:0, errMsg:"Error Token"});
        }
    })
}) ///good

Router.put("/logout", function(req, res){
    var token = req.query.token;
    try{
        mysql.query('SELECT * FROM TOKEN WHERE token = ? and state = true',token,(err, row)=>{
            if(!err && row.length>0){
                var sql ='UPDATE `token` SET `state`= false WHERE token = ?';
                var values = [token];
                mysql.query(sql,[values],(err, rows)=>{
                    if(!err){
                        res.status(201).json({result:1, errMsg:"Logout successfully."});
                    }else{
                        res.status(400).json({result:0, errMsg:"Logout error."});
                    }
                })
            }else{
                res.status(400).json({result:0, errMsg:"Error Token"});
            }
        })
    }catch(err){
        res.status(400).json({result:0, errMsg:"Bad Request"});
    }
}); // good

Router.post('/resetPassword', (req, res)=>{
    var post_data = req.body;
    var oldPassword=post_data.oldPassword;
    var newPassword=post_data.newPassword;
    var id_user;

    mysql.query('SELECT * FROM token WHERE token = ? and state = true',post_data.token,(err, row)=>{
        if(!err && row.length>0){
            jwt.verify(post_data.token, key, function(err,decoded){
                if(!err && decoded != undefined){
                    id_user= decoded.id;
                    try{
                        mysql.query('SELECT * FROM ACCOUNT where id_user = ?',id_user,(err, rows)=>{
                            if(!err && rows.length>0){
                                var encrypted_password = verifyPassword(oldPassword,rows[0].salt).passwordhash;
                                if(encrypted_password === rows[0].hash_Password){
                                    var hash_data = saltHashPassword(newPassword);
                                    mysql.query('UPDATE ACCOUNT SET `hash_Password`= ?,`salt`= ? WHERE id_user =?',[hash_data.passwordhash,hash_data.salt,id_user],(err, rs)=>{
                                        if(!err){
                                            logout(post_data.token);
                                            res.status(200).json({result:1,message:'Password changed successfully'});
                                        }else{
                                            res.status(501).json({result:0, errMsg:'Unidentified'});
                                        }
                                    })
                                }else{
                                    res.status(403).json({result:0, errMsg:'Password Not Match'});
                                }
                            }else{
                                res.status(501).json({result:0, errMsg:'Unidentified'});
                            }
                        })
                    }catch(err){
                        res.status(501).json({result:0, errMsg:'Unidentified'});
                        console.log(err);
                    }
                }else{
                    console.log(err);
                    res.status(401).json({result:0, errMsg:'Missing Portal Request Verification Token'});
                }
            })
        }else{
            res.json({result:0, errMsg:"Error Token"});
        }
    })
}) /// good

Router.post('/forgotPassword', (req,res)=>{
})

Router.post('/updateEmail', (req, res)=>{
    var email = req.body.email;
    var token = req.body.token;
    mysql.query('SELECT * FROM token WHERE token = ? and state = true',token,(err, row)=>{
        if(!err && row.length>0){
            jwt.verify(token, key, function(err,decoded){
                if(!err && decoded != undefined){
                    if(validateEmail(email)){
                        mysql.query('SELECT * FROM ACCOUNT where ACCOUNT.email=?', email,(err, rows)=>{
                            if(!err){
                                if(rows.length>0){
                                        res.status(400).json({result:0, errMsg:'Email đã tồn tại'});
                                }else{
                                    mysql.query('UPDATE `ACCOUNT` SET `email`= ? WHERE ACCOUNT.id_user =?',[email,decoded.id],(err, rowKH)=>{
                                        if(!err){
                                            res.status(200).json({result:1, message:'Cập Nhật Email Mới Thành Công'});
                                        }else{
                                            res.status(403).json({result:1, message:'Thất Bại'});
                                        }
                                    })
                                }
                            }else{
                                    res.status(403).json({result:0, errMsg:'Không thể thực hiện'});
                            }
                        })
                    }else{
                        res.status(400).json({result:0, errMsg:'Email không đúng định dạng'});
                    }
                }else{
                    console.log(err);
                    res.status(401).json({result:0, errMsg:'Missing Portal Request Verification Token'});
                }
            })
        }else{
            res.json({result:0, errMsg:"Error Token"});
        }
    })
    
}) /// good


let validateEmail = (email) =>{
    const re = /^(([^<>()[\]\\.,;:\s@\"]+(\.[^<>()[\]\\.,;:\s@\"]+)*)|(\".+\"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
    return re.test(email);
}

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

let logout = (token) => {
    var sql ='UPDATE `token` SET `state`= false WHERE token = ?';
    var values = [token];
    mysql.query(sql,[values],(err, rows)=>{
        if(!err){
            //res.json({result:1, errMsg:"Logout successfully."});
        }else{
           // res.json({result:0, errMsg:"Logout error."});
        }
    })
} /// good

module.exports = Router;