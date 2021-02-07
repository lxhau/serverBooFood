var multer = require("multer");

var storge = multer.diskStorage({
    destination: function(req, file, cb){
        cb(null,"public/upload/avatar_user");
    },
    filename:function(req, file, cb){
        cb(null,"BF_" + Date.now() + "_" + file.originalname);
    }
});

var upload = multer({
    storage: storge,
    limits:{
        fileSize: 1024 * 1024
    },
    fileFilter: function(req, file, cb){
        if(file.mimetype == "image/png" ||
        file.mimetype == "image/jpeg" ||
        file.mimetype == "image/jpg" ||
        file.mimetype == "image/bmp"
        ){
            cb(null,true);
        }else{
            return cb(new Error("Your file is not a support"));
        }
    }
}).single("avatar");

module.exports = function(app){
    app.get('/testupload', function(req, res){
        res.render('Testupload');
    });

    app.post('/uploadfile', function(req, res){
        upload(req, res, function(err){
            if(err instanceof multer.MulterError){
                res.json({resurl:0, errMsg:err.message});
            }else if(err){
                res.json({resurl:0, errMsg:err.message});
            }else{
                res.json({resurl:1, urlFile:req.file});
            }
        });
    })
}