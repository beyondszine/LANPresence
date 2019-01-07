const Influx = require('influx');
const http = require('http');
const os = require('os');
const arpScanner = require('arpscan');
var validator = require('validator');
const winston = require('winston');
var program = require('commander');
var config = require('config');


var dbConfig = config.get('Scan.dbConfig');
var logConfig = config.get('Scan.LogConfig');
var scannerConfig = config.get('Scan.ScannerConfig');

// dbConfig.normalize();


console.log(dbConfig);
console.log(logConfig);
console.log(scannerConfig);


// function (){
//   if(process.env.dbHost){
//     logger.info('overriding hostname by environment variable');
//     dbConfig.host=process.env.dbHost;
//   }

  // if(dbConfig){
  //   validator.isPort(dbConfig.port);
  //   validator.isURL(dbConfig.host);
  //   validator.isPort(dbConfig.port);
  // }
  // else{

  // }
// }


// program
//   .version('0.1.0')
//   .option('-s, --scanner', 'arp scan command')
//   .action(scannerdetected)
  // .option('-c, --scanner-command', 'scanner binary command')
  // .option('-n, --network', 'Network Domain to scan with subnet')
  // .option('-i, --interface', 'Network Interface to send packets to')
  // .option('-h, --host', 'Database Hostname Address')
  // .option('-u, --username', 'Database username')
  // .option('-p, --password', 'Database password')
  // .parse(process.argv);



function scannerdetected(dir,cmd){
  console.log('scanner detected');
  console.log('dir : ',dir);
  console.log('cmd : ',cmd);
};

if(program.scanner) {
  console.log('  - scanner to use');
  process.exit(0);
}
else{
  console.log('No program scanner passed');
  process.exit(-1);
}

const logger = winston.createLogger({
  levels: winston.config.syslog.levels,
  transports: [
    // new winston.transports.Console({ level: 'debug' }),
    new winston.transports.File({
      filename: logConfig.logFile,
      level: logConfig.logLevel
    })
  ]
});


// Make all of them user interface variables & allow interfaces to be selected from drop down of available interfaces.

var options={
    command :   '/usr/sbin/arp-scan',
    args    :   ['192.168.1.1/24'],
    interface : 'wlp2s0',
    sudo    :   false
};

var macToName = {
  "C0:EE:FB:FD:A9:B0" : "Shandilya's Phone",
  "24:6E:96:06:E0:E8"  : "monster",
  "D4:6E:0E:E8:28:00" : "Almighty Router",
  "A0:99:9B:17:1F:75" : "Ashutosh's Macbook",
  "7C:8B:CA:16:DB:15" : "Veda System",
  "78:31:C1:D4:EB:06" : "Virendra's MacBook",
  "94:DB:C9:B1:C7:3E" : "Yadav's laptop",
  "78:0C:B8:D8:87:1D" : "Intel",
  "EC:88:92:02:72:57" : "Motorola",
  "5C:96:56:E7:C5:AD" : "PS4",
  "18:F6:43:F1:49:F6" : "Apple device"
};

const influx = new Influx.InfluxDB({
  // host: '192.168.1.113:8086',
  host: 'localhost:8086',
  database: 'Presence',
  schema: [
    {
      measurement: 'presenceIdentifier2',
      fields: {
        alive: Influx.FieldType.BOOLEAN
      },
      tags: ['host','mac','ip', 'hostname', 'nickname' ]
    }
  ]
});

function onResult(err, data){
    if(err){
        logger.error("Error occured",err);
        throw err;
    }
    else{
        // console.log("Printing all data\n\n",data);
        data.forEach(function(arpresponse){
            logger.info(new Date()+"  IP addresses:  "+arpresponse.ip +"MAC addresses:  "+arpresponse.mac);
            let resolveHostname = (function (){
              // console.log(arpresponse.mac);
              // console.log(macToName);
              for (per_mac in macToName){
                if(per_mac == arpresponse.mac){
                  console.log(macToName[per_mac]);
                  return macToName[per_mac];
                }
                // else{
                //   console.log("MAC association not found!");
                //   return "UNKNOWN NODE";
                // }
              }
              return arpresponse.mac;
            })();

            influx.writePoints([
                {
                  measurement: 'presenceIdentifier2',
                  tags: { 
                    host: os.hostname(), 
                    mac :  arpresponse.mac,
                    ip : arpresponse.ip,
                    nickname : resolveHostname,
                    hostname : "nextrelease"
                  },
                  fields: { alive : true },
                }
              ]).catch(err => {
                logger.error(`Error saving data to InfluxDB! ${err.stack}`);
              });
        });
    } 
};


influx.getDatabaseNames()
  .then(names => {
    if (!names.includes('Presence')) {
      return influx.createDatabase('Presence');
    }
  })
  .then(() => {
    // let interfacesObject=os.networkInterfaces();
    // let totalInterfaces = Object.keys(interfacesObject);
    // if(totalInterfaces.length==1){
    //   options.interface = totalInterfaces[0];
    //   options.args = function(){
    //     interfacesObject[totalInterfaces[0]].forEach(function(version){
    //       if(version.family=='IPv4'){
    //         return version.cidr;
    //       }
    //     });
    //   };
    arpScanner(onResult, options);
    // }
  })
  .catch(err => {
    logger.error(`Error creating Influx database!`,err)
  });