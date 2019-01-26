const DISCOVERY_URL = "https://discovery.meethue.com";
const SECOND = 1000;
const MINUTE = 60*SECOND;

const PAIRING_TIMEOUT = 3*MINUTE;

interface BridgeInfo {
	id:string;
	internalipaddress:string;
}

interface BridgeInfoEx extends BridgeInfo {

}

class HueFinder {
	constructor() { 

	}

	async find() : Promise<Array<BridgeInfo>> {
		return new Promise((resolve,reject)=> {
			fetch(DISCOVERY_URL)
			.then(resp=>resp.json())
			.then(bridgeList=> {resolve(bridgeList);});
		});
	}
}

interface lightState {
	on:boolean, 
	bri: Number, 
	hue:Number, 
	effect:string, 
	xy:Array<Number>,
	ct:number, 
	alert:string, 
	colormode:string, 
	mode:string
}

interface usernameResponse {
	username:string;
}

interface Action { 
	on:boolean, 
	bri:Number, 
	hue:Number, 
	sat:Number,
	effect:string, 
	xy:Array<Number>,
	ct:Number, 
	alert:string, 
	colormode:string
}

interface LightGroup {
	name:string, 
	type:string, 
	action:Action
}

interface LightGroupList {
	
}

class HueBridge { 
	constructor(b:BridgeInfo, username:string) {
		this._bridgeInfo = b;
		this._username = username;
	};

	async getGroups():Promise<lightGroups> { 

	}
	async tryPair(): Promise<usernameResponse> {
		return new Promise<string>((resolve, reject) => 
		{
			let keepTrying = true;
			let retryExpiredTimer = setTimeout(()=>{
				reject("failed to pair");
			}, PAIRING_TIMEOUT);
			let tryTimer = setInterval(()=>{
				this.pair()
				.then(resp=>{
					clearTimeout(retryExpiredTimer);
					clearInterval(tryTimer);
					resolve(resp);
				});
			}, SECOND);
		});
	}

	private async pair() :Promise<string>{
		return new Promise((resolve, reject)=> {
			var req = { devicetype: "hue.j2i.net#browser" };
   			var reqStr = JSON.stringify(req);
			const targetUrl = `http://${this._bridgeInfo.internalipaddress}/api`
			fetch(targetUrl,
				{
					method: "POST",
					headers: { "Content-Type": "application/json" },
					body: reqStr
				 }
				)
				.then(resp=>resp.json())
				.then(data=>{
					if(data.length == 0) reject("no response");
					if(data[0].error) reject(data[0].error);
					if(data[0].success) {
						this._username = data[0].success.username;
						resolve(data[0].success);
					}
				})
				.catch(err=>reject(err));
		})
	}
	_bridgeInfo:BridgeInfo;
	_username:string;
}

function main():void  { 
	debugger;
	let lastUsername:string = localStorage.getItem("lastUsername");
	var hf = new HueFinder();
	hf.find()
	.then(bl=>{
		console.log(bl);

		let hb = new HueBridge(bl[0],lastUsername);
		if(!lastUsername) {
			hb.tryPair()
			.then (resp=>{
				console.log(resp);
				localStorage.setItem("lastUsername", resp.username);
			})
			.catch((e) => {
				console.log('pairing failed', e)
			});
		}
	});
}