"use strict";
//import $ from "jquery";
var ViewStates;
(function (ViewStates) {
    ViewStates[ViewStates["SplashScreen"] = 0] = "SplashScreen";
    ViewStates[ViewStates["SelectBridge"] = 1] = "SelectBridge";
    ViewStates[ViewStates["ControlLights"] = 2] = "ControlLights";
    ViewStates[ViewStates["PairBridge"] = 3] = "PairBridge";
})(ViewStates || (ViewStates = {}));
;
var PairingScreenStates;
(function (PairingScreenStates) {
    PairingScreenStates["Waiting"] = "Waiting";
    PairingScreenStates["Pairing"] = "Pairing";
    PairingScreenStates["Success"] = "Success";
    PairingScreenStates["Failed"] = "Failed";
})(PairingScreenStates || (PairingScreenStates = {}));
class PairScreenModule {
    constructor() {
        this._remainingPairTime = 0;
        this._pairTimer = 0;
        this._bridge = null;
        this._state = PairingScreenStates.Waiting;
        this._parentElement = null;
    }
    setElement(element) {
        this._parentElement = element;
    }
    setBridge(bridge) {
        this._bridge = bridge;
    }
    setState(state) {
        this._state = state;
        $(this._parentElement)
            .removeClass('PairScreen-Waiting')
            .removeClass('PairingScreen-Pairing')
            .removeClass('PairingScreen-Success')
            .removeClass('PairingScreen-Failed');
        $(this._parentElement)
            .addClass(`PairingScreen-${state}`);
    }
    activate() {
        this.setState(PairingScreenStates.Pairing);
        this.startPairing();
    }
    deactivate() {
        if (this._pairTimer != 0) {
            clearInterval(this._pairTimer);
        }
    }
    startPairing() {
        return new Promise((resolve, reject) => {
            if (this._bridge == null) {
                reject();
                return;
            }
            this._remainingPairTime = PAIRING_TIMEOUT / SECOND;
            this._bridge.tryPair()
                .then((userNameResponse) => {
                clearInterval(this._pairTimer);
                this._pairTimer = 0;
                resolve(this._bridge);
                this.setState(PairingScreenStates.Success);
                return;
            })
                .catch(() => {
                this.setState(PairingScreenStates.Failed);
            });
            this._pairTimer = setInterval(() => {
                if (this._remainingPairTime > 0) {
                    --this._remainingPairTime;
                    $('.connectCountdown').text(this._remainingPairTime);
                }
                else {
                    reject('timeout');
                    this.setState(PairingScreenStates.Failed);
                    clearInterval(this._pairTimer);
                    this._pairTimer = 0;
                }
            }, 1000);
        });
    }
    keyHandler(e) {
        switch (e.keyCode) {
            case 37: //LEFT arrow
                $(this._parentElement).find('.yesButton').addClass('selectedButton');
                $(this._parentElement).find('.noButton').removeClass('selectedButton');
                break;
            case 39: //RIGHT arrow
                $(this._parentElement).find('.yesButton').removeClass('selectedButton');
                $(this._parentElement).find('.noButton').addClass('selectedButton');
                break;
            case 13: //OK button
                break;
        }
    }
}
var hdb = new HueDB();
var hueFinder = new HueFinder();
var discoveryBridgeList;
var rememberedBridgeList;
var selectedBridge;
var selectedBridgeIndex = 0;
var smPair = new PairScreenModule();
function activate() {
    if (rememberedBridgeList.length == 1) {
        selectedBridge = rememberedBridgeList[0];
        discoveryBridgeList.forEach((b) => {
            if (b.id == selectedBridge.id)
                selectedBridge.internalipaddress = b.internalipaddress;
        });
        goToState(ViewStates.ControlLights);
    }
    else
        promptBridgeSelection();
}
function highlightSelectedBridge() {
    $('.bridgeButton').removeClass('bridgeSelected');
    var parent = $(`#bridgeListElement > :nth-child(${selectedBridgeIndex + 1})`);
    $(parent).addClass('bridgeSelected');
}
function selectBridgeKeyHandler(e) {
    switch (e.keyCode) {
        case 38: //UP arrow
            if (selectedBridgeIndex > 0)
                --selectedBridgeIndex;
            highlightSelectedBridge();
            break;
        case 40: //DOWN arrow
            if (selectedBridgeIndex < discoveryBridgeList.length - 1)
                ++selectedBridgeIndex;
            highlightSelectedBridge();
            break;
        case 13: //OK button
            bridgeConnect(discoveryBridgeList[selectedBridgeIndex]);
            break;
        default:
            console.log('Key code : ' + e.keyCode);
            break;
    }
}
function bridgeClick(e) {
    console.log(e);
    console.log('target', e.currentTarget);
    const stringIndex = $(e.currentTarget).attr('index');
    var numberIndex = -1;
    if (stringIndex) {
        numberIndex = parseInt(stringIndex);
    }
    if (numberIndex > -1) {
        selectedBridgeIndex = numberIndex;
        highlightSelectedBridge();
    }
}
function bridgeConnectClick(e) {
    const stringIndex = $(e.currentTarget).attr('index');
    var numberIndex = -1;
    if (stringIndex) {
        numberIndex = parseInt(stringIndex);
    }
    console.log('connect', numberIndex);
    bridgeConnect(discoveryBridgeList[numberIndex]);
}
function bridgeConnect(bridgeInfo) {
    smPair.setBridge(new HueBridge(bridgeInfo));
    smPair.activate();
    goToState(ViewStates.PairBridge);
}
function promptBridgeSelection() {
    goToState(ViewStates.SelectBridge);
    $('#bridgeListElement').empty();
    var indx = 0;
    for (let i = 0; i < discoveryBridgeList.length; ++i) {
        var bridge = discoveryBridgeList[i];
        let structure = $('#palette').find('.bridgeButton').clone();
        $(structure).click(bridgeClick);
        $(structure).find('.bridgeConnectButton').click(bridgeConnectClick);
        $(structure).attr('index', indx);
        $(structure).find('.bridgeConnectButton').attr('index', indx);
        $(structure).find('.bridgeAddress').text(bridge.internalipaddress);
        $(structure).find('.bridgeId').text(bridge.id);
        $('#bridgeListElement').append(structure);
        ++indx;
    }
    selectedBridgeIndex = 0;
    highlightSelectedBridge();
}
function addKeyListener() {
    document.addEventListener('keydown', function (e) {
        switch (e.keyCode) {
            /*
        case 37: //LEFT arrow
            break;
        case 38: //UP arrow
            break;
        case 39: //RIGHT arrow
            break;
        case 40: //DOWN arrow
            break;
        case 13: //OK button
            break;
            */
            case 10009: //RETURN button
                tizen.application.getCurrentApplication().exit();
                break;
            default:
                selectBridgeKeyHandler(e);
                console.log('Key code : ' + e.keyCode);
                break;
        }
    });
}
//Initialize function
function main() {
    smPair.setElement($('#pairBridge')[0]);
    addKeyListener();
    hueFinder.find()
        .then((vBridge) => {
        discoveryBridgeList = vBridge;
    });
    hdb.ensureCreate()
        .then(() => {
        hdb.readBridgeList()
            .then((vBridge) => {
            rememberedBridgeList = vBridge;
        });
    });
    var targetElement = document.getElementById("splashScreen");
    if (targetElement) {
        goToState(ViewStates.SplashScreen);
        //targetElement!.style.opacity = '1';	
        setTimeout(function () {
            $('#splashScreen').css({ "opacity": "0" });
            setTimeout(activate, 4000);
        }, 4000);
    }
    console.log('init() called');
}
;
window.onload = main;
function goToState(state) {
    let rootVisual = document.getElementById('rootVisual');
    var newClass;
    switch (state) {
        case ViewStates.SplashScreen:
            newClass = "splashScreen";
            break;
        case ViewStates.ControlLights:
            newClass = "controlLisghts";
            break;
        case ViewStates.SelectBridge:
            newClass = "selectBridge";
            break;
        case ViewStates.PairBridge:
            newClass = "pairBridge";
            break;
        default: newClass = "splashScreen";
    }
    rootVisual.setAttribute('class', newClass);
}
