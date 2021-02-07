const express = require("express");
const Router = express.Router();
const mysql = require("../config/db");
const crypto = require('crypto');
var jwt = require("jsonwebtoken");
const fs = require('fs')
let key = fs.readFileSync('./config/privateKey.pem', 'utf8');

Router.get('/getBanner',(req, res) => {
/// Lấy danh sách banners
})

Router.get('/getSponsored',(req, res) => {
/// Được tài trợ
})

Router.get('/getMerchantDiscountTo20',(req, res)=>{
/// Giảm giá lên đến 20% (5 to 20)
})

Router.get('/getMerchantDiscountTo35',(req, res)=>{
/// Giảm giá lên đến 35% (21 to 35)
})

Router.get('/getMerchantDiscountTo50',(req, res)=>{
/// Giảm giá lên đến 50% (36 to 50)
})

Router.get('/getMerchantVegetarianDish',(req, res)=>{
/// Món chay
})

Router.get('/getBreakfast',(req, res)=>{
/// Ăn Sáng
})

Router.get('/getLunch',(req, res)=>{
/// Ăn trưa
})

Router.get('/getMidnight',(req, res)=>{
/// Ăn tối
})

Router.get('/getMerchantAround',(req, res)=>{
    /// Quán quanh đây
})

module.exports = Router;