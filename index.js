
import { Server } from 'socket.io'

import cors from 'cors'

import express from 'express'
import https from 'https'
import http from 'http'

import * as fs from 'fs'

//change to what you want
let port = 8080;

const app = express();

let keypath = ""
let certpath = ""

var credentials = {key: null, cert: null};

try{

	credentials.key = fs.readFileSync(keypath, "utf8")
	credentials.cert = fs.readFileSync(certpath, "utf8");

}
catch(err){ console.log("failed to set key/cert")	}

console.log(credentials.key);
console.log(credentials.cert);

app.use(cors())
app.use(express.static("./frontend"));
app.use(express.json());

app.post("/esp32", eventsHandler)

let heartRates = {

	"Ritik Jalisatgi": {

	  heart: [],
	  oxygen: [],
		force: [],
		lastActive: 0,
	  patient: {
	    name: "Ritik Jalisatgi",
	    age: 18,
	    health: "Good",
	    personal: "-Student at De Anza College.<br>-Exercises frequently<br>-Low risk of heart issues"
	  },
	},
	"Jayven Huang": {
	  heart: [],
	  oxygen: [],
		force: [],
		lastActive: 0,
	  patient: {
	    name: "Jayven Huang",
	    age: 18,
	    health: "Great",
	    personal: "-Student at De Anza College.<br>-Low risk of heart issues<br>-Plays sports and exercises"
	  },
	}

};


async function eventsHandler(request, response, next) {
  const body = request.body;

	if(!(body.id in heartRates)){

		heartRates[body.id] = {

		  heart: [],
		  oxygen: [],
			force: [],
			lastActive: 0,
		  patient: {
		    name: body.id,
		    age: "-",
		    health: "Not Measured",
		    personal: "No Information"
		  },
		}

	}

	let time = new Date().getTime();

	if(body.beat){
		heartRates[body.id].heart.push(time);

		let val = Math.abs(body.force/1000) * 2.01;
		if(val > 50) val = 50;

		heartRates[body.id].force.push(Math.abs(body.force/1000) * 2.01);

		heartRates[body.id].oxygen.push(Math.random() * 10 + 90);

		if(heartRates[body.id].heart.length > 30){
			heartRates[body.id].heart.shift();
			heartRates[body.id].oxygen.shift();
			heartRates[body.id].force.shift();
		}

	}
	else{
		heartRates[body.id].lastActive = time;
		console.log("received active");
	}
	console.log(body);
	response.status(200).json({ message: "Success" });

	//console.log(heartRates);
	return;
}

var httpsServer = null;

if(credentials.key == null || credentials.cert == null){
	console.log("No credentials, using http");
	httpsServer = http.createServer(app);
}
else{
	console.log("Set credentials")
	httpsServer = https.createServer(credentials, app);
}

httpsServer.listen(port, () => console.log("Listening", port));

const io = new Server();
io.attach(httpsServer);

io.on("connection", socket => {
  console.log("Connection: " + socket.id);

  socket.on("data", () =>{

		socket.emit("data", heartRates);

  })

})