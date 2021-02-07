const express = require("express");
const Router = express.Router();
const mysql = require("../config/db");
const crypto = require('crypto');
var jwt = require("jsonwebtoken");
const fs = require('fs')
let key = fs.readFileSync('./config/privateKey.pem', 'utf8');

Router.get('/getRestaurantByTag', (req, res)=>{
    var get_data = req.query;
    mysql.query('CALL getRestaurantByTag(?)', get_data.tag_name,(err, rows)=>{
        if(!err){
            if(rows[0].length>0){
                let list_res= [];
                rows[0].forEach(function(id){
                        mysql.query(`CALL getRestaurantBySearchTag(${id.id_restaurant}, ${get_data.lat}, ${get_data.lon})`,(err, result)=>{
                            if(!err){
                                //console.log(id.id_restaurant, get_data.lat, get_data.lon);
                                list_res.push(result[0][0]);
                                if(list_res.length==rows[0].length){
                                    res.status(200).json(list_res)
                                }
                            }else{
                                console.log(err);
                            }
                        })
                })
            }else{
                res.status(200).json({result:1, errMsg:"Không tìm thấy nhà hàng"});
            }
        }else{
            res.status(400).json({result:0, errMsg:"Bad Request"});
            console.log(err);
        }
    })
}) /// bad

Router.get('/getFoodByTag',(req, res)=>{
    var req_data= req.query;
    mysql.query(`Call getFoodByTag("${req_data.tag_name}",${req_data.lat},${req_data.lon})`,(err, rows)=>{
        if(!err){
            if(rows[0].length>0){
                res.status(200).json(rows[0]);
            }else{
                res.status(200).json({result:1, message:"Không tìm thấy kết quả"});
            }
        }else{
            res.status(400).json({result:0, errMsg:"Bad Request"});
            console.log(err);
        }
    })
}) // good

Router.get('/searchNameRestaurant',(req, res)=>{
    var req_data= req.query;
    mysql.query(`Call getRestaurantBySearchName("${"%"+req_data.name+"%"}",${req_data.lat},${req_data.lon})`,(err, rows)=>{
        if(!err){
            if(rows[0].length>0){
                res.status(200).json(rows[0]);
            }else{
                res.status(200).json({result:1, message:"Không tìm thấy kết quả"});
            }
        }else{
            res.status(400).json({result:0, errMsg:"Bad Request"});
            console.log(err);
        }
    })
})// good

Router.get('/searchNameFoods',(req, res)=>{
    var req_data= req.query;
    mysql.query(`Call getFoodByName("${"%"+req_data.name+"%"}",${req_data.lat},${req_data.lon})`,(err, rows)=>{
        if(!err){
            if(rows[0].length>0){
                res.status(200).json(rows[0]);
            }else{
                res.status(200).json({result:1, message:"Không tìm thấy kết quả"});
            }
        }else{
            res.status(400).json({result:0, errMsg:"Bad Request"});
            console.log(err);
        }
    })
})// good

module.exports = Router;