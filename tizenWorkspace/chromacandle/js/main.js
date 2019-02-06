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
})(PairingScreenStates || (PairingScreenStates = {}));
class ConfirmScreenModule {
    constructor(selector) {
        this._confirmed = false;
        this._parentElement = $(selector)[0];
        this._reply = null;
        this._confirmedCallback = () => { };
    }
    setDeactivateCallback(callback) {
        this._deactivateCallback = callback;
    }
    setElement(element) {
        this._parentElement = element;
    }
    activate() {
    }
    deactivate() {
        this._confirmed = false;
        this._confirmedCallback();
        $(this._parentElement).hide();
        if (this._deactivateCallback)
            this._deactivateCallback();
    }
    show(msg) {
        $(this._parentElement).find('.modalPrompt').text(msg);
        $(this._parentElement).show();
        $(this._parentElement).css({ "opacity": "1" });
        $(this._parentElement).find('.selectedButton').removeClass('.selectedButton');
        return new Promise((resolve, reject) => {
            this._confirmed = false;
            $(this._parentElement).show();
            this._confirmedCallback = () => {
                if (this._confirmed == false)
                    reject();
                else
                    resolve(this._reply);
            };
        });
    }
    keyHandler(e) {
        switch (e.keyCode) {
            case 37: //LEFT arrow
                $(this._parentElement).find('.yesButton').addClass('selectedButton');
                $(this._parentElement).find('.noButton').removeClass('selectedButton');
                this._reply = true;
                this._confirmed = true;
                return true;
                break;
            case 39: //RIGHT arrow
                $(this._parentElement).find('.yesButton').removeClass('selectedButton');
                $(this._parentElement).find('.noButton').addClass('selectedButton');
                this._reply = false;
                this._confirmed = true;
                return true;
                break;
            case 13: //OK button
                if (this._confirmed)
                    this._confirmedCallback();
                break;
            case 10009: //RETURN button
                this._confirmed = false;
                this._confirmedCallback();
        }
        return false;
    }
}
class PairScreenModule {
    constructor(services, parentElement) {
        this._isRetryRequested = false;
        this._remainingPairTime = 0;
        this._pairTimer = 0;
        this._state = PairingScreenStates.Waiting;
        this._parentElement = parentElement;
        this._services = services;
    }
    setDeactivateCallback(callback) {
        this._deactivateCallback = callback;
    }
    setElement(element) {
        this._parentElement = element;
    }
    set bridge(bridge) {
        this._bridge = bridge;
    }
    get bridge() {
        return this._bridge;
    }
    goToState(state) {
        this._state = state;
        $(this._parentElement)
            .removeClass('PairScreen-Waiting')
            .removeClass('PairingScreen-Pairing')
            .removeClass('PairingScreen-Success');
        $(this._parentElement)
            .addClass(`PairingScreen-${state}`);
        console.log(`Changing Pairing state to PairingScreen-${state}`);
    }
    activate() {
        this.goToState(PairingScreenStates.Pairing);
        this.startPairing();
    }
    deactivate() {
        if (this._pairTimer != 0) {
            clearInterval(this._pairTimer);
        }
        if (this._deactivateCallback)
            this._deactivateCallback();
    }
    startPairing() {
        return new Promise((resolve, reject) => {
            console.log('attempting pairing');
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
                this.goToState(PairingScreenStates.Success);
                return;
            })
                .catch(() => {
                this._services.confirm("The button wasn't pressed within the allowed timeframe. Do you want to try again?")
                    .then((isRetrying) => {
                    clearInterval(this._pairTimer);
                    this._pairTimer = 0;
                    if (isRetrying)
                        this.activate();
                    else
                        this.deactivate();
                })
                    .catch(() => { });
            });
            this._pairTimer = setInterval(() => {
                if (this._remainingPairTime > 0) {
                    --this._remainingPairTime;
                    $('.connectCountdown').text(this._remainingPairTime);
                }
                else {
                    reject('timeout');
                    this._services.confirm("The button wasn't pressed within the time limit. Do you want to try again?")
                        .then((reply) => {
                    })
                        .catch(() => {
                    });
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
                this._isRetryRequested = true;
                return true;
                break;
            case 39: //RIGHT arrow
                $(this._parentElement).find('.yesButton').removeClass('selectedButton');
                $(this._parentElement).find('.noButton').addClass('selectedButton');
                this._isRetryRequested = false;
                return true;
                break;
            case 13: //OK button
                break;
        }
        return false;
    }
}
class MainModule {
    constructor() {
        this._viewState = ViewStates.SplashScreen;
        this._pairScreen = new PairScreenModule(this, $('#pairBridge')[0]);
        this._isModalActive = false;
        this._hdb = new HueDB();
        this._hueFinder = new HueFinder();
        this._discoveryBridgeList = new Array();
        this._rememberedBridgeList = new Array();
        this._selectedBridgeIndex = 0;
        this._confirmScreen = new ConfirmScreenModule('#confirmDialog');
        this._pairScreen.setDeactivateCallback(() => { this.pairingComplete(); });
    }
    pairingComplete() {
        if (this._pairScreen.bridge.username) {
            this.goToState(ViewStates.ControlLights);
        }
        else {
            this.goToState(ViewStates.SelectBridge);
        }
    }
    setDeactivateCallback(callback) {
        this._deactivateCallback = callback;
    }
    activate() {
        var self = this;
        this.goToState(ViewStates.SplashScreen);
        this.beginBridgeSearch();
        setTimeout(() => self.tryBridgeConnect(), 5000);
    }
    beginBridgeSearch() {
        this._hueFinder.find()
            .then((vBridge) => {
            this._discoveryBridgeList = vBridge;
        });
        this._hdb.ensureCreate()
            .then(() => {
            this._hdb.readBridgeList()
                .then((vBridge) => {
                this._rememberedBridgeList = vBridge;
            });
        });
    }
    tryBridgeConnect() {
        if (this._rememberedBridgeList.length == 1) {
            this.selectedBridge = (this._rememberedBridgeList[0]);
            this._discoveryBridgeList.forEach((b) => {
                if (b.id == this.selectedBridge.id)
                    this.selectedBridge.internalipaddress = b.internalipaddress;
            });
            this.goToState(ViewStates.ControlLights);
        }
        else
            this.promptBridgeSelection();
    }
    promptBridgeSelection() {
        var self = this;
        this.goToState(ViewStates.SelectBridge);
        $('#bridgeListElement').empty();
        var indx = 0;
        for (let i = 0; i < this._discoveryBridgeList.length; ++i) {
            var bridge = this._discoveryBridgeList[i];
            let structure = $('#palette').find('.bridgeButton').clone();
            $(structure).click((e) => self.bridgeClick(e));
            $(structure).find('.bridgeConnectButton').click((e) => self.bridgeConnectClick(e));
            $(structure).attr('index', indx);
            $(structure).find('.bridgeConnectButton').attr('index', indx);
            $(structure).find('.bridgeAddress').text(bridge.internalipaddress);
            $(structure).find('.bridgeId').text(bridge.id);
            $('#bridgeListElement').append(structure);
            ++indx;
        }
        this._selectedBridgeIndex = 0;
        this.highlightSelectedBridge();
    }
    highlightSelectedBridge() {
        $('.bridgeButton').removeClass('bridgeSelected');
        var parent = $(`#bridgeListElement > :nth-child(${this._selectedBridgeIndex + 1})`);
        $(parent).addClass('bridgeSelected');
    }
    selectBridgeKeyHandler(e) {
        switch (e.keyCode) {
            case 38: //UP arrow
                if (this._selectedBridgeIndex > 0)
                    --this._selectedBridgeIndex;
                this.highlightSelectedBridge();
                return true;
            case 40: //DOWN arrow
                if (this._selectedBridgeIndex < this._discoveryBridgeList.length - 1)
                    ++this._selectedBridgeIndex;
                this.highlightSelectedBridge();
                return true;
            case 13: //OK button
                this.bridgeConnect(this._discoveryBridgeList[this._selectedBridgeIndex]);
                return true;
                break;
            default:
                console.log('Key code : ' + e.keyCode);
                break;
        }
        return false;
    }
    deactivate() {
    }
    keyHandler(e) {
        if (this._isModalActive)
            return this._confirmScreen.keyHandler(e);
        else {
            switch (this._viewState) {
                case ViewStates.SelectBridge: return this.selectBridgeKeyHandler(e);
                case ViewStates.PairBridge: return this._pairScreen.keyHandler(e);
            }
        }
        return false;
    }
    confirm(msg) {
        return new Promise((resolve, reject) => {
            this._isModalActive = true;
            this._confirmScreen.show(msg)
                .then((response) => {
                this._isModalActive = false;
                resolve(response);
            })
                .catch(() => {
                this._isModalActive = false;
                reject();
            });
        });
    }
    bridgeConnect(bridgeInfo) {
        this.goToState(ViewStates.PairBridge);
        this._pairScreen.bridge = new HueBridge(bridgeInfo);
        this._pairScreen.activate();
    }
    get selectedBridge() {
        return this._discoveryBridgeList[this._selectedBridgeIndex];
    }
    set selectedBridge(b) {
        this._selectedBridgeIndex = this._discoveryBridgeList.indexOf(b);
    }
    bridgeClick(e) {
        console.log(e);
        console.log('target', e.currentTarget);
        const stringIndex = $(e.currentTarget).attr('index');
        var numberIndex = -1;
        if (stringIndex) {
            numberIndex = parseInt(stringIndex);
        }
        if (numberIndex > -1) {
            this._selectedBridgeIndex = numberIndex;
            this.highlightSelectedBridge();
        }
    }
    bridgeConnectClick(e) {
        const stringIndex = $(e.currentTarget).attr('index');
        var numberIndex = -1;
        if (stringIndex) {
            numberIndex = parseInt(stringIndex);
        }
        console.log('connect', numberIndex);
        this.bridgeConnect(this._discoveryBridgeList[numberIndex]);
    }
    goToState(state) {
        let rootVisual = document.getElementById('rootVisual');
        var newClass;
        this._viewState = state;
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
}
window.onload = () => {
    let m = new MainModule();
    document.addEventListener('keydown', (e) => m.keyHandler(e));
    m.activate();
};
