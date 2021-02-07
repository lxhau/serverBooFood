const express = require("express");
const Router = express.Router();
const mysql = require("../config/db");
const crypto = require('crypto');
var jwt = require("jsonwebtoken");
const fs = require('fs')
let key = fs.readFileSync('./config/privateKey.pem', 'utf8');

Router.post('/addNewFood', (req, res)=>{
    var post_data = req.body;
    var id_restaurant;
    mysql.query('SELECT * FROM token WHERE token = ? and state = true',post_data.token,(err, result)=>{
        if(!err && result.length>0){
            jwt.verify(post_data.token, key, function(err,decoded){
                if(!err && decoded != undefined ){
                        if(decoded.role === 1){
                            id_restaurant= decoded.id_restaurant;
                            var id_product = getRndInteger();
                            var createDay = new Date();
                            var sql = "INSERT INTO `food`(`id_product`, `id_restaurant`, `nameProduct`, `price`, `discount`, `status`, `dicriptions`, `createDay`, `urlQrCode`, `active`) VALUES (?);";
                            var value = [id_product,id_restaurant,post_data.name_product,post_data.price,post_data.discount,1,post_data.discriptions,createDay,post_data.urlQrCode,1];
                            mysql.query(sql,[value], (err, rows)=>{
                                if(!err) {
                                    let addDBTag = addTag(id_product,post_data.tag);
                                    let addDBImg = addImg(id_product,post_data.hinhmonan);
                                    res.status(200).json({result:1, errMsg:'Successful'});
                                    console.log("OK");
                                }else{
                                    res.status(400).json({result:0, errMsg:"Bad Request"});
                                    console.log(err);
                                }
                            })
                        }else{
                            res.status(401).json({result:0, errMsg:'Attribute Permission Is Missing'});
                        }
                }else{
                    res.status(401).json({result:0, errMsg:'Missing Portal Request Verification Token'});
                    //console.log(err);
                }
            });
        }else{
            res.json({result:0, errMsg:"Error Token"});
        }
    })
}) /// Good

Router.get('/getAllMonAnCuaHang',(req,res)=>{
    var id_restaurant = req.query.id_restaurant;
    ///Da Viet Proceduce Rat De
    mysql.query('Call getAllMonAnCuaHang(?)',id_restaurant,(err,list_food)=>{
        if(!err){
            if(list_food[0].length>0){
                res.status(200).json(list_food[0]);
            }else{
                res.status(204).json({result:0});
            }
        }
        else{
            res.status(403).json({result:0, errMsg:'Không thể thực hiện'});
        }
    });
}) /// Good

Router.post('/disableMonAn', (req, res)=>{
    var post_data = req.body;
    var id_product = post_data.id_product;
    var name_product = post_data.name_product;

    mysql.query('SELECT * FROM token WHERE token = ? and state = true',post_data.token,(err, result)=>{
        if(!err && result.length>0){
            jwt.verify(post_data.token, key, function(err,decoded){
                if(!err && decoded != undefined){
                    mysql.query('SELECT COUNT(*) AS EXITS, food.nameProduct FROM food WHERE food.id_restaurant= ? and food.id_product = ?',[decoded.id_restaurant,id_product],(err,rows)=>{
                      //  console.log(rows[0].EXITS);
                        if(!err){
                            if(rows[0].EXITS == 1){
                             if(rows[0].nameProduct == name_product){
                                let disable = disableMonAn(id_product);
                                    if(disable == true){
                                        res.status(200).json({result:1, errMsg:'Delete Successfull'});
                                    }else{
                                        res.status(500).json({result:0, errMsg:'Không thể ghi vào DB'});
                                    }
                                }else{
                                    res.status(403).json({result:0, errMsg:'Tên Món Ăn Không Khớp'});
                                }
                            }else{
                                res.status(403).json({result:0, errMsg:'Từ chối truy cập'});
                            }
                        }else{
                            res.status(500).json({result:0, errMsg:'Không thể ghi vào DB'});
                            console.log(err)
                        }
                    })
                }else{
                    res.status(401).json({result:0, errMsg:'Missing Portal Request Verification Token'});
                    console.log(err);
                }
            });
        }else{
            res.json({result:0, errMsg:"Error Token"});
        }
    })
}) /// Good

Router.get('/getDetailsFood',(req, res)=>{
    var id_product = req.query.id_product;
    mysql.query('SELECT *, Count(id_product) as sl FROM food WHERE food.id_product=? AND food.active=1',id_product,(err,rows)=>{
        if(!err && rows[0].sl>0){
            mysql.query('Call getImage(?)',id_product,(err,rowIMG)=>{
                if(!err){
                    mysql.query('Call getTag(?)',id_product,(err,rowTag)=>{
                        if(!err){
                            res.status(200).json({
                                id_product:rows[0].id_product,
                                id_restaurant:rows[0].id_restaurant,
                                name_product:rows[0].name_product,
                                price:rows[0].price,
                                discount:rows[0].discount,
                                status:rows[0].status,
                                dicriptions:rows[0].dicriptions,
                                createDay:rows[0].createDay,
                                urlQrCode:rows[0].urlQrCode,
                                list_img: rowIMG[0],
                                list_tag: rowTag[0]
                            });
                        }else{
                            res.status(401).json({result:1, errMsg:'Không tìm thấy món ăn'});
                        }
                    })
                }else{
                    res.status(401).json({result:1, errMsg:'Không tìm thấy món ăn'});
                }
            });


        }else{
            res.status(401).json({result:1, errMsg:'Không Tìm Thấy hoặc Món Đã Bị Gỡ Khỏi Cửa Hàng'});
        }
    });
}) /// good

/// function
let addTag = (id_product, post_data)=>{
try{
        post_data.forEach(function(tag){
        mysql.query('SELECT tag.id_tag from tag where tag.tag_name=?',tag.tag_name,function(err,result){
            if(!err){
                if(result.length>0){
                    var id=result[0].id_tag;
                    var valuePut = [getRndInteger(),id,id_product];
                    mysql.query('INSERT INTO `tag_food`(`id_hashtag_monan`,`id_tag`,`id_product`) Values ( ? );',[valuePut], function(err,result){
                        if(err){
                            console.log(err);
                            return false;
                        }
                    })
                }else{
                    let id_tag=getRndInteger();
                    var sql = 'INSERT INTO `tag`(`id_tag`, `tag_name`) VALUES (?);'
                    var value=[id_tag,tag.tag_name];
                    //console.log(id_tag,tag.tag_name);
                    mysql.query(sql,[value],(err,rows)=>{
                        if(err){
                            console.log(err);
                            return false;
                        }else{
                            var id=getRndInteger();
                            var valuetag=[id,id_tag,id_product];
                            mysql.query('INSERT INTO `tag_food`(`id_hashtag_monan`, `id_tag`, `id_product`) VALUES (?);',[valuetag], (err,result)=>{
                            if(err){
                                console.log(result[0].id_tag)
                                console.log(err);
                                return false;
                            }
                        })
                        }
                    })
                }
            }
        })
        })
        return true;

    }catch(err){
        console.log(err);
        return false;
    }
} //good

let disableMonAn = (id_product)=>{

    try{
            mysql.query('UPDATE `food` SET `active`= 0 WHERE mon_an.id_product = ?',id_product,(err,rows)=>{
                if(err){
                    return false;
                }
            })
            return true;
        }catch(err){
            console.log(err);
            return false;
        }
} //good

let addImg = (id_product, post_data)=>{
   try{
        post_data.forEach(function(img){
            var sql = 'INSERT INTO `image_food`(`id_photo`, `id_product`, `url_image`) VALUES (?);';
            var value=[getRndInteger(),id_product,img.link_img];
            mysql.query(sql,[value],(err,rows)=>{
                if(err){
                    return false;
                }
            })
        })
        return true;
    }catch(err){
        console.log(err);
        return false;
    }
} //good

function getRndInteger() {
    return Math.floor(100000000 + Math.random() * 900000000);
}

module.exports = Router;