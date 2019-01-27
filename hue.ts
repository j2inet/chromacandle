const DISCOVERY_URL = "https://discovery.meethue.com";
const SECOND = 1000;
const MINUTE = 60*SECOND;

const HUE_DATABASE="hueDB";
const HUE_BRIDGE_OBJSTORE = "bridge";

const PAIRING_TIMEOUT = 3*MINUTE;

interface IUsernameResponse {
	username:string;
}

interface IBridgeInfo {
	id:string;
	internalipaddress:string;
	userInfo:IUsernameResponse;
}

interface IBridgeInfoEx extends IBridgeInfo {

}

class HueFinder {
	constructor() { 

	}

	async find() : Promise<Array<IBridgeInfo>> {
		return new Promise((resolve,reject)=> {
			fetch(DISCOVERY_URL)
			.then(resp=>resp.json())
			.then(bridgeList=> {resolve(bridgeList);});
		});
	}
}

interface ILightState {
	on:boolean, 
	bri: Number, 
	hue:Number, 
	sat:Number,
	effect:string, 
	xy:Array<Number>,
	ct:number, 
	alert:string, 
	colormode:string, 
	transitiontime:Number,
	mode:string,
	reachable
}
interface ICTRange { 
	min:Number, 
	max:Number
}

interface IControl { 
	mindimlevel:Number, 
	maxlumen: Number, 
	colorgamuttype:string, 
	colorgamut:Array<Array<Number>>,
	ct:ICTRange
}

interface ICapabilities {
	certified:boolean, 
	control:IControl
	streaming:IStreamingCapabilities
}

interface IStreamingCapabilities { 
	renderer:boolean,
	proxy:boolean
}
interface IBulbConfig {
	archetype:string, 
	function:string, 
	direction:string
}

interface IBulbState { 
	state:ILightState,
	type:string, 
	name:string, 
	modelid:string, 
	manufacturername:string, 
	productname:string, 
	capabilities:ICapabilities,
	config:IBulbConfig,
	uniqueid:string, 
	swversion:string
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

interface ILightGroup {
	name:string, 
	type:string, 
	action:Action
}

interface LightGroupList {

}


class HueBridge { 
	constructor(b:IBridgeInfo, username:string = null) {
		this._bridgeInfo = b;
		this._username = username;
	};

	async getGroups():Promise<Object> { 
		const url = `http://${this._bridgeInfo.internalipaddress}/api/${this._username}/groups`;
		return new Promise((resolve, reject)=> {
			fetch(url)
			.then(resp=>resp.json())
			.then(data=>{
				this._groupMapping.length = 0;
				for(let x in data) {
					let g = data[x] as ILightGroup;
					this._groupMapping.push([x,g.name])
				}
				console.log('group mapping', this._groupMapping);
			
				resolve(data);
			})
			.catch(err=>reject(err));
		});
	}

	async setGroupState(groupID, action:ILightState) {
		return new Promise((resolve,reject)=> {
			const url = `http://${this._bridgeInfo.internalipaddress}/api/${this._username}/groups/${groupID}/action`;
			fetch(url, {
				method:'PUT',
				body:JSON.stringify(action), 
				headers: {
					'Accept': 'application/json',
					'Content-Type': 'application/json'
				  }
			})
			.then(resp=>{
				if(resp.status>=200 && resp.status < 300)
					return resp;
				reject(resp.statusText);
			})
			.then(()=>resolve());
		});
	}

	async getLights(): Promise<Object> {
		return new Promise((resolve,reject)=> {
			const url = `http://${this._bridgeInfo.internalipaddress}/api/${this._username}/lights`;

		});
	}

	async tryPair(): Promise<IUsernameResponse> {
		return new Promise<IUsernameResponse>((resolve, reject) => 
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

	private async pair() :Promise<IUsernameResponse>{
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
	_bridgeInfo:IBridgeInfo;
	_username:string;
	_groupMapping:Array<[string, string]> = new Array<[string, string]>();
}


const HueDBVersion = 1;
class HueDB {
	constructor() {

	}

	async ensureCreate() :Promise<Object> { 
		return new Promise((resolve, reject)=>{
			var request:IDBOpenDBRequest = indexedDB.open(HUE_DATABASE, HueDBVersion);
			request.onerror = (event:any) => {
				reject(event.target.errorCode);
			}
			request.onsuccess = (event:any)=>{
				this._db = event.target.result;
				resolve(this._db);
			};
			request.onupgradeneeded = (event:any) => { 
				this._db = event.target.result;
				var objectStore = this._db.createObjectStore(HUE_BRIDGE_OBJSTORE, {keyPath:"id"});				
			};
		});
	}

	isInitialized():boolean {
		return this._db!=null;
	}

	async insertBridge(b:IBridgeInfo) {
		return new Promise((resolve, reject)=> {
			let trans = this._db.transaction([HUE_BRIDGE_OBJSTORE], "readwrite");
			trans.oncomplete = ()=>resolve("complete");
			trans.onerror = (err)=>reject(err);
			let objStore = trans.objectStore(HUE_BRIDGE_OBJSTORE);
			let request = objStore.add(b);	
			request.onsuccess = () => {
				//
			}
		});
	}

	async deleteBridge(b:IBridgeInfo) {
		return new Promise((resolve, reject)=> {
			var trans = this._db.transaction(["hueBridge"], "readwrite");
			trans.oncoplete = () => resolve("complete");
			trans.onerror = (err) => reject(err);
			trans.objectStore("hueBridge").delete(b.id);
		});
	}

	async readBridgeList():Promise<Array<IBridgeInfo>> {
		var retVal = new Array<IBridgeInfo>();
		return new Promise((resolve, reject)=> {
			var trans = this._db.transaction([HUE_BRIDGE_OBJSTORE]);
			var objectStore = trans.objectStore(HUE_BRIDGE_OBJSTORE);
			objectStore.openCursor().onsuccess = (event) => {
				var cursor = event.target.result;
				if(cursor) {
					retVal.push(cursor.value);
					cursor.continue();
				} else 
					resolve(retVal);

			}
		});
	}

	async getBridge(b:IBridgeInfo) {
		return new Promise((resolve, reject)=> {
			this._db.transaction(HUE_BRIDGE_OBJSTORE).objectStore(HUE_BRIDGE_OBJSTORE).get(b.id).onsuccess = (event) => { 
				resolve(event.target.result);
			}
		});

		
	}

	async updateBridge(b:IBridgeInfo) {
		return new Promise((resolve, reject) => {
			var objectStore = this._db.transaction([HUE_BRIDGE_OBJSTORE], "readwrite").objectStore(HUE_BRIDGE_OBJSTORE);
			var request = objectStore.get(b.id);
			request.onerror = (err)=>reject(err);
			request.onsuccess = (event) => { 
				var data = event.target.result;
				var requestUpdate = objectStore.put(b);
				requestUpdate.onerror = (event) => {
					reject(event);
				}
				requestUpdate.onsuccess = (event) => {
					resolve(event.target.result);
				}
			};
		});
	}

	private _db:any;
}

let timeColorMapping = 
[
	{time:0,  data:{on:true, bri:254, hue:0, sat:255}},
	{time:2.179264, data:{on:true, bri:254, hue:16000, sat:255, transitiontime:1}},
	{time:7.93131, data:{on:true, bri:254, hue:32000, sat:255, transitiontime:1}},
	{time:10.987653, data:{on:true, bri:254, hue:48000, sat:255, transitiontime:1}},
];

timeColorMapping = [
	{ time:0,  data:{on:true, bri:254, hue:0, sat:0, transitiontime:1}},
	{ time:2.18218,  data:{on:true, bri:254, hue:16000, sat:255, transitiontime:1}},
	{ time: 8.109902,  data:{on:true, bri:254, hue:32000, sat:255, transitiontime:1}},
	{ time: 11.029885,  data:{on:true, bri:254, hue:48000, sat:255, transitiontime:1}},
	{ time: 12.469935,  data:{on:true, bri:254, hue:32000, sat:255, transitiontime:1}},
	{ time: 13.949865,  data:{on:true, bri:254, hue:0, sat:255, transitiontime:1}},
	{ time: 25.749921,  data:{on:true, bri:254, hue:32000, sat:255, transitiontime:1}},
	{ time: 37.517881,  data:{on:true, bri:254, hue:0, sat:255, transitiontime:1}},
	{ time: 49.269829,  data:{on:true, bri:254, hue:32000, sat:255, transitiontime:1}},
	{ time: 61.134027,  data:{on:true, bri:254, hue:0, sat:255, transitiontime:1}},
	{ time: 66.933685,  data:{on:true, bri:254, hue:32000, sat:255, transitiontime:1}},
	{ time: 72.837406,  data:{on:true, bri:254, hue:0, sat:255, transitiontime:1}},
	{ time: 84.589775,  data:{on:true, bri:254, hue:32000, sat:255, transitiontime:1}},
	{ time: 90.485984,  data:{on:true, bri:254, hue:0, sat:255, transitiontime:1}},
	{ time: 93.509806,  data:{on:true, bri:254, hue:32000, sat:255, transitiontime:1}},
	{ time: 94.189913,  data:{on:true, bri:254, hue:0, sat:255, transitiontime:1}},
	{ time: 94.861889,  data:{on:true, bri:254, hue:16000, sat:255, transitiontime:1}},
    { time: 95.597983, data: { on: true, bri: 254, hue: 48000, sat: 255, transitiontime: 1 } },
    { time: 96.389919, data: { on: true, bri: 254, hue: 16000, sat: 255, transitiontime: 1 } },
    { time: 119.965844, data: { on: true, bri: 254, hue: 32000, sat: 255, transitiontime: 1 } },
    { time: 131.757882, data: { on: true, bri: 254, hue: 48000, sat: 255, transitiontime: 1 } },
    { time: 143.509912, data: { on: true, bri: 254, hue: 16000, sat: 255 } },
    { time: 155.261646, data: { on: true, bri: 254, hue: 48000, sat: 255 } },
    { time: 167.053874, data: { on: true, bri: 254, hue: 32000, sat: 255 } },
    { time: 178.829756, data: { on: true, bri: 254, hue: 16000, sat: 255 } },
    { time: 184.733943, data: { on: true, bri: 254, hue: 8000, sat: 255 } },
    { time: 190.645682, data: { on: true, bri: 254, hue: 48000, sat: 255 } },
    { time: 202.36593, data: { on: true, bri: 254, hue: 12000, sat: 255 } },
    { time: 214.13379, data: { on: true, bri: 254, hue: 16000, sat: 255 } },
    { time: 220.005664, data: { on: true, bri: 254, hue: 48000, sat: 255 } },
    { time: 223.005904, data: { on: true, bri: 254, hue: 16000, sat: 255 } },
    { time: 224.429941, data: { on: true, bri: 254, hue: 32000, sat: 255 } },
    { time: 225.917788, data: { on: true, bri: 128, hue: 16000, sat: 255 } },
    { time: 237.765938, data: { on: true, bri: 128, hue: 48000, sat: 255 } },
    { time: 240.621472, data: { on: true, bri: 128, hue: 32000, sat: 255 } },
    { time: 243.573986, data: { on: true, bri: 32, hue: 0, sat: 64, transitiontime:100 } }
	];

function keyProcessor(e) {

	var player:any = document.getElementById('audioPlayer');
	console.log(player.currentTime);
}

function play() { 
	var player:any = document.getElementById('audioPlayer');
	player.play();
}
function dance(hb:HueBridge) { 
	let groups = hb.getGroups()
	.then((r)=> {
		document.getElementById('playButton').removeAttribute('disabled');
		console.log(r);
		let lastUpdate:Number = 0;
		let a:ILightState = {} as ILightState;
		a.on = true;
		a.bri = 254;
		a.hue = 0;
		a.sat = 16;
		hb.setGroupState("3", a);
		var player:any = document.getElementById('audioPlayer');
		let lastTimeEvent = -1;
		let currentEventIndex = 0;
		setInterval(()=>{
			if(currentEventIndex< timeColorMapping.length) {
				let ct = player.currentTime;
				let dTime = timeColorMapping[currentEventIndex].data.transitiontime;
				if(dTime == null)
					dTime = 4;
				dTime/=10;
				if(ct>=timeColorMapping[currentEventIndex].time - dTime/2) {
					var data:unknown;
					data = timeColorMapping[currentEventIndex++].data ;
					hb.setGroupState("3",data  as ILightState);
				}
			}
			//console.log(player.currentTime)
		}, 50)
	});
}

function main():void  { 
	//debugger;
	let lastUsername:string = localStorage.getItem("lastUsername");
	let db = new HueDB();
	db.ensureCreate()
	.then(()=> {
		db.readBridgeList()
		.then((bl_db)=> {
			console.log('bridge list:',bl_db);
			var hf = new HueFinder();
			hf.find()
			.then(bl_fn=> {
				var chosenBridge:IBridgeInfo = null;
				if(bl_db) {
					bl_fn.forEach((b)=> { 
						var elem = bl_db.find((x)=>x.id==b.id);
						if(elem && !chosenBridge) {
							chosenBridge = b;
							chosenBridge.userInfo = elem.userInfo;
							let hueBridge = new HueBridge(b, elem.userInfo.username);
							dance(hueBridge);
						}
					});
				}
				if(!chosenBridge) {
					if(bl_fn.length>0)  {
						chosenBridge = bl_fn[0];
						let b = new HueBridge(chosenBridge);
						b.tryPair()
						.then((b)=> {
							chosenBridge.userInfo = b;
							db.insertBridge(chosenBridge);
							let hueBridge = new HueBridge(chosenBridge, b.username);
						})
					}
				}
			});
		});
	});
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