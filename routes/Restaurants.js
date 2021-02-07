const express = require("express");
const Router = express.Router();
const mysql = require("../config/db");
const crypto = require('crypto');
var jwt = require("jsonwebtoken");
const fs = require('fs')
let key = fs.readFileSync('./config/privateKey.pem', 'utf8');

Router.post('/reqOpenMerchant', async (req,res) =>{
    let post_data= req.body;
    var id_user;
    mysql.query('Select * from ACCOUNT where phone = ?',post_data.phone,(err,rows)=>{
        if(!err){
            if(rows.length>0){
                res.status(400).json({result:0, errMsg:"Number Phone already exists"});
            }
            else{
                mysql.query('SELECT * FROM token WHERE token = ? and state = true',post_data.token,(err, result)=>{
                    if(!err && result.length>0){
                        jwt.verify(post_data.token, key, function(err,decoded){
                            if(!err && decoded != undefined){
                                id_user= decoded.id;
                                var id_restaurant= getRndInteger(id_user);
                                var reqDay=new Date();
                                var sql="INSERT INTO MERCHANT (`id_restaurant`, `id_user`, `state`, `locations`, `phone`, `name_restaurant`, `active`, `latitude`, `longitude`, `acceptDay`, `lockDay`, `reqDay`, `avartar`) VALUES ( ? );"
                                var values=[id_restaurant,id_user,false,post_data.location,post_data.phone,post_data.name_restaurant,-1,post_data.lat,post_data.lon,null,null,reqDay,post_data.avartar]
                                mysql.query(sql, [values], async (err,row) => {
                                    if(!err){
                                    let result = logout(post_data.token);
                                    let update = updatedrole(id_user);
                                        return res.status(200).json({
                                        result:1,
                                        msg: 'Successfully',
                                        });
                                    }else{
                                        res.status(501).json({resultquery:0, errMsg:err.sqlMessage});
                                        console.log(err);
                                    }
                                })
                            }else{
                                res.status(401).json({result:0, errMsg:'Missing Portal Request Verification Token'});
                                console.log(err);
                            }
                            });
                    }else{
                        res.status(401).json({result:0, errMsg:"Error Token"});
                    }
                })
            }
        }else{
            res.status(400).json({result:0, errMsg:"Number Phone already exists"});
            console.log(err);
        }
    })
}) // good

Router.post('/Open_CloseMerchant',(req, res)=>{
    var post_data = req.body;
    var id_restaurant;

    mysql.query('SELECT * FROM token WHERE token = ? and state = true',post_data.token,(err, result)=>{
        if(!err && result.length>0){
            jwt.verify(post_data.token, key, function(err,decoded){
                if(!err && decoded != undefined){
                    id_restaurant= decoded.id_restaurant;
                    mysql.query('UPDATE MERCHANT SET `state`=? where id_restaurant=?',[post_data.state,id_restaurant],(err, rows)=>{
                        if(!err){
                            res.status(200).json({result:1, message:'OK'});
                        }else{
                            res.status(501).json({result:0, errMsg:'Unidentified'});
                        }
                    })
                }else{
                    res.status(401).json({result:0, errMsg:'Missing Portal Request Verification Token'});
                    console.log(err);
                }
            })
        }else{
            res.json({result:0, errMsg:"Error Token"});
        }
    })
}) // good

Router.post('/AcceptOpenMerchant',(req, res)=>{
    var post_data=req.body;
    //console.log(post_data.token);
try{
    mysql.query('SELECT * FROM token_admin WHERE token = ? and state = true',post_data.token,(err, result)=>{
        if(!err && result.length>0){
            jwt.verify(post_data.token, key, function(err,decoded){
                if(!err && decoded != undefined){
                    var acceptDay=new Date();
                    mysql.query('UPDATE MERCHANT SET `active`= 0, `acceptDay`= ? where id_restaurant=?',[acceptDay,post_data.id_restaurant],(err, rows)=>{
                        if(!err){
                            let log =  writeLogAdminMerchant(post_data.id_restaurant,decoded.id_admin,post_data.actOld,post_data.actNew,post_data.note);
                            res.status(200).json({result:1, message:'OK'});
                        }else{
                            res.status(501).json({result:0, errMsg:'Unidentified'});
                        }
                    })
                }else{
                    res.status(401).json({result:0, errMsg:'Missing Portal Request Verification Token'});
                    console.log(err);
                }
            })
        }else{
            res.json({result:0, errMsg:"Error Token"});
        }
    })
}catch(e){
console.log(e);
}
}) // good

Router.post('/disableMerchant',(req, res)=>{
    var post_data=req.body;
    mysql.query('SELECT * FROM token_admin WHERE token = ? and state = true',post_data.token,(err, result)=>{
        if(!err && result.length>0){
            jwt.verify(post_data.token, key, function(err,decoded){
                if(!err && decoded != undefined){
                    var lookDay=new Date();
                    mysql.query('UPDATE MERCHANT SET `active`= 1,`lockDay`=? where id_restaurant=?',[lookDay,post_data.id_restaurant],(err, rows)=>{
                        if(!err){
                            let log =  writeLogAdminMerchant(post_data.id_restaurant,decoded.id_admin,post_data.actOld,post_data.actNew,post_data.note);
                            res.status(200).json({result:1, message:'OK'});
                        }else{
                            res.status(501).json({result:0, errMsg:'Unidentified'});
                        }
                    })
                }else{
                    res.status(401).json({result:0, errMsg:'Missing Portal Request Verification Token'});
                    console.log(err);
                }
            })
        }else{
            res.json({result:0, errMsg:"Error Token"});
        }
    })
}) // good

let logout = (token) => {
    var sql ='UPDATE `token` SET `state`= false WHERE token = ?';
    var values = [token];
    mysql.query(sql,[values],(err, rows)=>{
        if(!err){
            return true;
        }else{
           return false;
        }
    });
    return false;
}

let updatedrole = (id_user)=>{
    mysql.query('UPDATE ACCOUNT SET `role`= 1 WHERE ACCOUNT.id_user=? ',id_user,(err, rows)=>{
        if(!err){
            console.log("OK");
        }
    })
}

let writeLogAdminMerchant = (id_restaurant,id_admin,actOld,actNew,note)=>{
    var updateDay=new Date();
    var id_log_merchant=getRndInteger(0);
    var values = [id_log_merchant,id_restaurant,id_admin,actOld,actNew,note,updateDay];
    mysql.query('INSERT INTO log_admin_merchant (id_log_merchant, id_restaurant, id_admin, activeOld, activeNew, note, dateUpdate) VALUES ( ? );',[values],(err, rows)=>{
        if(!err){
            console.log(`Admin ${id_admin} vừa thực hiện cập nhật cửa hàng ${id_restaurant}.`);
        }else{
            console.log(`Xãy ra lỗi cập nhật LOG`);
           // console.log(err);
           //console.log(id_log_merchant,id_admin,id_restaurant,actOld,actNew,note,updateDay)
        }
    })
}

function getRndInteger(id_user) {
    return Math.floor(100000000 + Math.random() * 900000000);
}

module.exports = Router;