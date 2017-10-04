import * as mailTools from './utils/sendMail';
import * as smsTools from './utils/sendSms';
import * as configPrivate from './config.private';

let mongoClient = require('mongodb').MongoClient;
let col = 'sendMessageCache';
let condition = {
    status: 'pending'
};
let urlAndes = configPrivate.urlMongoAndes;
let counter = 0;

mongoClient.connect(urlAndes, function (err, db) {

    db.collection(col).find(condition).toArray(function (error, enviosPendientes: any) {
        if (error) {
            console.log(error);
        }

        enviosPendientes.forEach(async env => {
            try {
                console.log('entra al trie?');
                if (env.email) {
                    let mailOptions: any = {
                        from: configPrivate.enviarMail.host,
                        to: env.email,
                        subject: env.subject,
                        text: env.message,
                        html: env.message
                    };
                    await mailTools.sendMail(mailOptions);
                }
                if (env.phone) {
                    let smsOptions: any = {
                        telefono: env.phone,
                        mensaje: env.message
                    };
                    await smsTools.sendSms(smsOptions)
                }
                await changeState(db, env, 'success');
                
            } catch (errorSending) {
                console.log('entro opr eoor')
                if (env.tries > 5) {
                    await changeState(db, env, 'error');
                } else {
                    await changeState(db, env, 'pending');
                }
            }
            counter++;
            if (counter === enviosPendientes.length) {
                console.log('cierra la base');
                db.close();
            }
        });
        

    });
});

function changeState(db, env, newState) {
    console.log('entra al change state');
    return new Promise((resolve, reject) => {
        db.collection(col).updateOne({
            _id: env._id
        }, {
            $set: {
                status: newState,
                tries: env.tries + 1,
                updatedAt: new Date()
            }
        }, function (err) {
            if (err) {
                reject(err)
            } else {
                resolve();
            }
        })
    })
}