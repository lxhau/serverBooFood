let nodemailer = require('nodemailer');
var smtpTransport = require('nodemailer-smtp-transport');
var handlebars = require('handlebars');
var fs = require('fs');

function sendmail(name,recice_mail, password){
    var readHTMLFile = function(path, callback) {
        fs.readFile(path, {encoding: 'utf-8'}, function (err, html) {
            if (err) {
                throw err;
                callback(err);
            }
            else {
                callback(null, html);
            }
        });
    };

    smtpTransport = nodemailer.createTransport(smtpTransport({
        host: 'smtp.gmail.com',
        secure: false,
        port: 587,
        auth: {
            user: 'developer.lxh@gmail.com',
            pass: '11225858692548'
        }
    }));

    readHTMLFile(__dirname + '\\mail.html', function(err, html) {
        var template = handlebars.compile(html);
        var replacements = {
            fullName: name,
            emailstaff: recice_mail,
            passwordstaff: password
        };
        var htmlToSend = template(replacements);

        var mailOptions = {
            from: 'Base BOOFOOD <developer.lxh@gmail.com>',
            to : recice_mail,
            subject : 'Chào Mừng Bạn Đến Với BOO FOOD',
            html : htmlToSend
         };
        smtpTransport.sendMail(mailOptions, function (error, response) {
            if (error) {
                console.log(error);
                callback(error);
            }else{
                return console.log(response.messageId);
            }
        });
    });
}

module.exports = sendmail;