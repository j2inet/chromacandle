var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : new P(function (resolve) { resolve(result.value); }).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g;
    return g = { next: verb(0), "throw": verb(1), "return": verb(2) }, typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (_) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
var DISCOVERY_URL = "https://discovery.meethue.com";
var SECOND = 1000;
var MINUTE = 60 * SECOND;
var HUE_DATABASE = "hueDB";
var HUE_BRIDGE_OBJSTORE = "bridge";
var PAIRING_TIMEOUT = 3 * MINUTE;
var HueFinder = /** @class */ (function () {
    function HueFinder() {
    }
    HueFinder.prototype.find = function () {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                return [2 /*return*/, new Promise(function (resolve, reject) {
                        fetch(DISCOVERY_URL)
                            .then(function (resp) { return resp.json(); })
                            .then(function (bridgeList) { resolve(bridgeList); });
                    })];
            });
        });
    };
    return HueFinder;
}());
var HueBridge = /** @class */ (function () {
    function HueBridge(b, username) {
        if (username === void 0) { username = null; }
        this._groupMapping = new Array();
        this._sceneMapping = new Array();
        this._lightMapping = new Array();
        this._bridgeInfo = b;
        this._username = username;
    }
    ;
    HueBridge.prototype.getGroups = function () {
        return __awaiter(this, void 0, void 0, function () {
            var url;
            var _this = this;
            return __generator(this, function (_a) {
                url = "http://" + this._bridgeInfo.internalipaddress + "/api/" + this._username + "/groups";
                return [2 /*return*/, new Promise(function (resolve, reject) {
                        fetch(url)
                            .then(function (resp) { return resp.json(); })
                            .then(function (data) {
                            _this._groupMapping.length = 0;
                            for (var x in data) {
                                var g = data[x];
                                _this._groupMapping.push([x, g.name]);
                            }
                            console.log('group mapping', _this._groupMapping);
                            resolve(data);
                        })["catch"](function (err) { return reject(err); });
                    })];
            });
        });
    };
    HueBridge.prototype.setGroupState = function (groupID, action) {
        return __awaiter(this, void 0, void 0, function () {
            var _this = this;
            return __generator(this, function (_a) {
                return [2 /*return*/, new Promise(function (resolve, reject) {
                        var url = "http://" + _this._bridgeInfo.internalipaddress + "/api/" + _this._username + "/groups/" + groupID + "/action";
                        fetch(url, {
                            method: 'PUT',
                            body: JSON.stringify(action),
                            headers: {
                                'Accept': 'application/json',
                                'Content-Type': 'application/json'
                            }
                        })
                            .then(function (resp) {
                            if (resp.status >= 200 && resp.status < 300)
                                return resp;
                            reject(resp.statusText);
                        })
                            .then(function () { return resolve(); });
                    })];
            });
        });
    };
    HueBridge.prototype.getScenes = function () {
        return __awaiter(this, void 0, void 0, function () {
            var url;
            var _this = this;
            return __generator(this, function (_a) {
                url = "http://" + this._bridgeInfo.internalipaddress + "/api/" + this._username + "/scenes";
                return [2 /*return*/, new Promise(function (resolve, rejecct) {
                        fetch(url)
                            .then(function (resp) { return resp.json(); })
                            .then(function (data) {
                            var sceneMap = new Array();
                            for (var id in data) {
                                sceneMap.push([id, data[id].name]);
                            }
                            _this._sceneMapping = sceneMap;
                            resolve(data);
                        });
                    })];
            });
        });
    };
    HueBridge.prototype.getLights = function () {
        return __awaiter(this, void 0, void 0, function () {
            var _this = this;
            return __generator(this, function (_a) {
                return [2 /*return*/, new Promise(function (resolve, reject) {
                        var url = "http://" + _this._bridgeInfo.internalipaddress + "/api/" + _this._username + "/lights";
                        fetch(url)
                            .then(function (resp) { return resp.json(); })
                            .then(function (data) {
                            console.log('Lights:', data);
                            var lightMapping = new Array();
                            for (var key in data) {
                                var k = parseInt(key);
                                lightMapping.push([k, data[key].name]);
                            }
                            resolve(data);
                        })["catch"](function (err) {
                            console.log('error:', err);
                            reject(err);
                        });
                    })];
            });
        });
    };
    HueBridge.prototype.getLight = function (lightID) {
        return __awaiter(this, void 0, void 0, function () {
            var _this = this;
            return __generator(this, function (_a) {
                return [2 /*return*/, new Promise(function (resolve, reject) {
                        var url = "http://" + _this._bridgeInfo.internalipaddress + "/api/" + _this._username + "/lights/" + lightID;
                        fetch(url)
                            .then(function (resp) { return resp.json(); })
                            .then(function (data) {
                            resolve(data);
                        });
                    })];
            });
        });
    };
    HueBridge.prototype.tryPair = function () {
        return __awaiter(this, void 0, void 0, function () {
            var _this = this;
            return __generator(this, function (_a) {
                return [2 /*return*/, new Promise(function (resolve, reject) {
                        var keepTrying = true;
                        var retryExpiredTimer = setTimeout(function () {
                            reject("failed to pair");
                        }, PAIRING_TIMEOUT);
                        var tryTimer = setInterval(function () {
                            _this.pair()
                                .then(function (resp) {
                                clearTimeout(retryExpiredTimer);
                                clearInterval(tryTimer);
                                resolve(resp);
                            });
                        }, SECOND);
                    })];
            });
        });
    };
    HueBridge.prototype.pair = function () {
        return __awaiter(this, void 0, void 0, function () {
            var _this = this;
            return __generator(this, function (_a) {
                return [2 /*return*/, new Promise(function (resolve, reject) {
                        var req = { devicetype: "hue.j2i.net#browser" };
                        var reqStr = JSON.stringify(req);
                        var targetUrl = "http://" + _this._bridgeInfo.internalipaddress + "/api";
                        fetch(targetUrl, {
                            method: "POST",
                            headers: { "Content-Type": "application/json" },
                            body: reqStr
                        })
                            .then(function (resp) { return resp.json(); })
                            .then(function (data) {
                            if (data.length == 0)
                                reject("no response");
                            if (data[0].error)
                                reject(data[0].error);
                            if (data[0].success) {
                                _this._username = data[0].success.username;
                                resolve(data[0].success);
                            }
                        })["catch"](function (err) { return reject(err); });
                    })];
            });
        });
    };
    return HueBridge;
}());
var HueDBVersion = 1;
var HueDB = /** @class */ (function () {
    function HueDB() {
    }
    HueDB.prototype.ensureCreate = function () {
        return __awaiter(this, void 0, void 0, function () {
            var _this = this;
            return __generator(this, function (_a) {
                return [2 /*return*/, new Promise(function (resolve, reject) {
                        var request = indexedDB.open(HUE_DATABASE, HueDBVersion);
                        request.onerror = function (event) {
                            reject(event.target.errorCode);
                        };
                        request.onsuccess = function (event) {
                            _this._db = event.target.result;
                            resolve(_this._db);
                        };
                        request.onupgradeneeded = function (event) {
                            _this._db = event.target.result;
                            var objectStore = _this._db.createObjectStore(HUE_BRIDGE_OBJSTORE, { keyPath: "id" });
                        };
                    })];
            });
        });
    };
    HueDB.prototype.isInitialized = function () {
        return this._db != null;
    };
    HueDB.prototype.insertBridge = function (b) {
        return __awaiter(this, void 0, void 0, function () {
            var _this = this;
            return __generator(this, function (_a) {
                return [2 /*return*/, new Promise(function (resolve, reject) {
                        var trans = _this._db.transaction([HUE_BRIDGE_OBJSTORE], "readwrite");
                        trans.oncomplete = function () { return resolve("complete"); };
                        trans.onerror = function (err) { return reject(err); };
                        var objStore = trans.objectStore(HUE_BRIDGE_OBJSTORE);
                        var request = objStore.add(b);
                        request.onsuccess = function () {
                            //
                        };
                    })];
            });
        });
    };
    HueDB.prototype.deleteBridge = function (b) {
        return __awaiter(this, void 0, void 0, function () {
            var _this = this;
            return __generator(this, function (_a) {
                return [2 /*return*/, new Promise(function (resolve, reject) {
                        var trans = _this._db.transaction(["hueBridge"], "readwrite");
                        trans.oncoplete = function () { return resolve("complete"); };
                        trans.onerror = function (err) { return reject(err); };
                        trans.objectStore("hueBridge")["delete"](b.id);
                    })];
            });
        });
    };
    HueDB.prototype.readBridgeList = function () {
        return __awaiter(this, void 0, void 0, function () {
            var retVal;
            var _this = this;
            return __generator(this, function (_a) {
                retVal = new Array();
                return [2 /*return*/, new Promise(function (resolve, reject) {
                        var trans = _this._db.transaction([HUE_BRIDGE_OBJSTORE]);
                        var objectStore = trans.objectStore(HUE_BRIDGE_OBJSTORE);
                        objectStore.openCursor().onsuccess = function (event) {
                            var cursor = event.target.result;
                            if (cursor) {
                                retVal.push(cursor.value);
                                cursor["continue"]();
                            }
                            else
                                resolve(retVal);
                        };
                    })];
            });
        });
    };
    HueDB.prototype.getBridge = function (b) {
        return __awaiter(this, void 0, void 0, function () {
            var _this = this;
            return __generator(this, function (_a) {
                return [2 /*return*/, new Promise(function (resolve, reject) {
                        _this._db.transaction(HUE_BRIDGE_OBJSTORE).objectStore(HUE_BRIDGE_OBJSTORE).get(b.id).onsuccess = function (event) {
                            resolve(event.target.result);
                        };
                    })];
            });
        });
    };
    HueDB.prototype.updateBridge = function (b) {
        return __awaiter(this, void 0, void 0, function () {
            var _this = this;
            return __generator(this, function (_a) {
                return [2 /*return*/, new Promise(function (resolve, reject) {
                        var objectStore = _this._db.transaction([HUE_BRIDGE_OBJSTORE], "readwrite").objectStore(HUE_BRIDGE_OBJSTORE);
                        var request = objectStore.get(b.id);
                        request.onerror = function (err) { return reject(err); };
                        request.onsuccess = function (event) {
                            var data = event.target.result;
                            var requestUpdate = objectStore.put(b);
                            requestUpdate.onerror = function (event) {
                                reject(event);
                            };
                            requestUpdate.onsuccess = function (event) {
                                resolve(event.target.result);
                            };
                        };
                    })];
            });
        });
    };
    return HueDB;
}());
var timeColorMapping = [
    { time: 0, data: { on: true, bri: 254, hue: 0, sat: 255 } },
    { time: 2.179264, data: { on: true, bri: 254, hue: 16000, sat: 255, transitiontime: 1 } },
    { time: 7.93131, data: { on: true, bri: 254, hue: 32000, sat: 255, transitiontime: 1 } },
    { time: 10.987653, data: { on: true, bri: 254, hue: 48000, sat: 255, transitiontime: 1 } },
];
timeColorMapping = [
    { time: 0, data: { on: true, bri: 254, hue: 0, sat: 0, transitiontime: 1 } },
    { time: 2.18218, data: { on: true, bri: 254, hue: 16000, sat: 255, transitiontime: 1 } },
    { time: 8.109902, data: { on: true, bri: 254, hue: 32000, sat: 255, transitiontime: 1 } },
    { time: 11.029885, data: { on: true, bri: 254, hue: 48000, sat: 255, transitiontime: 1 } },
    { time: 12.469935, data: { on: true, bri: 254, hue: 32000, sat: 255, transitiontime: 1 } },
    { time: 13.949865, data: { on: true, bri: 254, hue: 0, sat: 255, transitiontime: 1 } },
    { time: 25.749921, data: { on: true, bri: 254, hue: 32000, sat: 255, transitiontime: 1 } },
    { time: 37.517881, data: { on: true, bri: 254, hue: 0, sat: 255, transitiontime: 1 } },
    { time: 49.269829, data: { on: true, bri: 254, hue: 32000, sat: 255, transitiontime: 1 } },
    { time: 61.134027, data: { on: true, bri: 254, hue: 0, sat: 255, transitiontime: 1 } },
    { time: 66.933685, data: { on: true, bri: 254, hue: 32000, sat: 255, transitiontime: 1 } },
    { time: 72.837406, data: { on: true, bri: 254, hue: 0, sat: 255, transitiontime: 1 } },
    { time: 84.589775, data: { on: true, bri: 254, hue: 32000, sat: 255, transitiontime: 1 } },
    { time: 90.485984, data: { on: true, bri: 254, hue: 0, sat: 255, transitiontime: 1 } },
    { time: 93.509806, data: { on: true, bri: 254, hue: 32000, sat: 255, transitiontime: 1 } },
    { time: 94.189913, data: { on: true, bri: 254, hue: 0, sat: 255, transitiontime: 1 } },
    { time: 94.861889, data: { on: true, bri: 254, hue: 16000, sat: 255, transitiontime: 1 } },
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
    { time: 243.573986, data: { on: true, bri: 32, hue: 0, sat: 64, transitiontime: 100 } }
];
function keyProcessor(e) {
    var player = document.getElementById('audioPlayer');
    console.log(player.currentTime);
}
function play() {
    var player = document.getElementById('audioPlayer');
    player.play();
}
function dance(hb) {
    var groups = hb.getGroups()
        .then(function (r) {
        document.getElementById('playButton').removeAttribute('disabled');
        console.log(r);
        var lastUpdate = 0;
        var a = {};
        a.on = true;
        a.bri = 0;
        a.hue = 0;
        a.sat = 16;
        hb.setGroupState("3", a);
        hb.getLights()
            .then(function (x) { return console.log('lights', x); });
        hb.getScenes()
            .then(function (scenes) {
            console.log('Scenes:', scenes);
        });
        console.log('__');
        hb.getLight(3)
            .then(function (light) {
            console.log('Light:', light);
        });
        var player = document.getElementById('audioPlayer');
        var lastTimeEvent = -1;
        var currentEventIndex = 0;
        setInterval(function () {
            if (currentEventIndex < timeColorMapping.length) {
                var ct = player.currentTime;
                var dTime = timeColorMapping[currentEventIndex].data.transitiontime;
                if (dTime == null)
                    dTime = 4;
                dTime /= 10;
                if (ct >= timeColorMapping[currentEventIndex].time - dTime / 2) {
                    var data;
                    data = timeColorMapping[currentEventIndex++].data;
                    hb.setGroupState("3", data);
                }
            }
            //console.log(player.currentTime)
        }, 50);
    });
}
function main() {
    //debugger;
    var lastUsername = localStorage.getItem("lastUsername");
    var db = new HueDB();
    db.ensureCreate()
        .then(function () {
        db.readBridgeList()
            .then(function (bl_db) {
            console.log('bridge list:', bl_db);
            var hf = new HueFinder();
            hf.find()
                .then(function (bl_fn) {
                var chosenBridge = null;
                if (bl_db) {
                    bl_fn.forEach(function (b) {
                        var elem = bl_db.find(function (x) { return x.id == b.id; });
                        if (elem && !chosenBridge) {
                            chosenBridge = b;
                            chosenBridge.userInfo = elem.userInfo;
                            var hueBridge = new HueBridge(b, elem.userInfo.username);
                            dance(hueBridge);
                        }
                    });
                }
                if (!chosenBridge) {
                    if (bl_fn.length > 0) {
                        chosenBridge = bl_fn[0];
                        var b = new HueBridge(chosenBridge);
                        b.tryPair()
                            .then(function (b) {
                            chosenBridge.userInfo = b;
                            db.insertBridge(chosenBridge);
                            var hueBridge = new HueBridge(chosenBridge, b.username);
                        });
                    }
                }
            });
        });
    });
    var hf = new HueFinder();
    hf.find()
        .then(function (bl) {
        console.log(bl);
        var hb = new HueBridge(bl[0], lastUsername);
        if (!lastUsername) {
            hb.tryPair()
                .then(function (resp) {
                console.log(resp);
                localStorage.setItem("lastUsername", resp.username);
            })["catch"](function (e) {
                console.log('pairing failed', e);
            });
        }
    });
}
