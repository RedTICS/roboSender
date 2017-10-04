import {
    SMSendpoints
} from './../config.private';

let soap = require('soap');
let libxmljs = require('libxmljs');

// El mensaje puede ser el código de verificación, recordatorio de turno, etc.
export interface SmsOptions {
    telefono: number;
    mensaje: string;
}

export function sendSms(smsOptions: SmsOptions) {
    return new Promise((resolve, reject)=>{
        let argsOperador = {
            telefono: smsOptions.telefono
        };
    
        let opciones = {
            ignoredNamespaces: {
                namespaces: ['ws'],
                override: true
            }
        };
    
        let argsNumero = {};
    
        soap.createClient(SMSendpoints.urlOperador, opciones, function (errCreate, clientOperador) {
            if (errCreate) {
                reject(errCreate);
            } else {
    
                if (clientOperador) {
                    clientOperador.recuperarOperador(argsOperador, function (errOperador, result, raw) {
                        // Server down?
                        if (clientOperador.lastResponse) {
                            try {
                                let xmlFault = libxmljs.parseXml(clientOperador.lastResponse);
                                let xmlFaultString = xmlFault.get('//faultstring');
                                if (xmlFaultString) {
                                    return reject(xmlFaultString.text());
                                }
                            } catch (e) {
                                return reject(e);
                            }
                        }
                        if (result && result.return) {
                            let carrier;
                            try {
                                let xml = result.return;
                                let xmlDoc = libxmljs.parseXml(xml);
                                let xmlDato = xmlDoc.get('//dato');
                                carrier = operador(xmlDato.text());
                            } catch (ee) {
                                console.log('ERROR DE PARSEO 2: ', ee, smsOptions.telefono);
                                return reject(ee);
                            }
    
                            if (carrier) {
                                argsNumero = {
                                    destino: argsOperador.telefono,
                                    mensaje: smsOptions.mensaje,
                                    operador: carrier,
                                    aplicacion: '',
                                    mobilein: '1'
                                };
    
                                soap.createClient(SMSendpoints.urlNumero, opciones, function (err, clientEnvio) {
                                    clientEnvio.envioSMSOperador(argsNumero, function (errEnvio, resultEnvio, _raw) {
                                        let status;
                                        try {
                                            let xmlEnvio = resultEnvio.return;
                                            let xmlEnvioDoc = libxmljs.parseXml(xmlEnvio);
                                            let xmlEnvioDato = xmlEnvioDoc.get('//status');
                                            status = xmlEnvioDato.text();
                                        } catch (eee) {
                                            return reject(eee);
                                        }
                                        if (errEnvio) {
                                            return reject(errEnvio);
                                        } else {
                                            return status === '0' ? resolve(status) : reject(status);
                                        }
                                    });
                                });
                            } else {
                                return reject();
                            }
                        }
                    });
                } else {
                    return reject();
                }
            }
        });
    
        function operador(operadorName) {
            let idOperador = '';
    
            switch (operadorName) {
                case 'MOVISTAR':
                    idOperador = '1';
                    break;
                case 'CLARO':
                    idOperador = '3';
                    break;
                case 'PERSONAL':
                    idOperador = '4';
                    break;
                default:
                    idOperador = 'No existe operador';
                    break;
            }
            return idOperador;
        }
    })
    
}