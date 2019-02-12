"use strict";
//import $ from "jquery";
var ViewStates;
(function (ViewStates) {
    ViewStates[ViewStates["SplashScreen"] = 0] = "SplashScreen";
    ViewStates[ViewStates["SelectBridge"] = 1] = "SelectBridge";
    ViewStates[ViewStates["ControlLights"] = 2] = "ControlLights";
    ViewStates[ViewStates["PairBridge"] = 3] = "PairBridge";
    ViewStates[ViewStates["NoInternet"] = 4] = "NoInternet";
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
                if (this._confirmed) {
                    this._confirmedCallback();
                    this.deactivate();
                }
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
        this.startPairing()
            .then((b) => {
            setTimeout(() => {
                this.deactivate();
            }, 750);
        });
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
            $('.connectCountdown').text(this._remainingPairTime);
            this._bridge.tryPair()
                .then((userNameResponse) => {
                clearInterval(this._pairTimer);
                this._pairTimer = 0;
                resolve(this._bridge);
                this.goToState(PairingScreenStates.Success);
                return;
            })
                .catch(() => {
                clearInterval(this._pairTimer);
                this._services.confirm("The button wasn't pressed within the allowed timeframe. Do you want to try again?")
                    .then((isRetrying) => {
                    this._pairTimer = 0;
                    if (isRetrying)
                        this.activate();
                    else
                        this.deactivate();
                })
                    .catch(() => { });
            });
            this._pairTimer = setInterval(() => {
                --this._remainingPairTime;
                $('.connectCountdown').text(this._remainingPairTime);
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
            case 13: //OK button
                break;
        }
        return false;
    }
}
var CategoryMenuItems;
(function (CategoryMenuItems) {
    CategoryMenuItems["Rooms"] = "Rooms";
    CategoryMenuItems["Groups"] = "Groups";
    CategoryMenuItems["Lights"] = "Lights";
    CategoryMenuItems["Scenes"] = "Scenes";
    CategoryMenuItems["Settings"] = "Settings";
})(CategoryMenuItems || (CategoryMenuItems = {}));
// I know this looks redundant as I could have used the string values of 
// the enumerations. But I've introduced an layer between the enums and 
// what the user sees so that the internal values are not as tightly 
// coupled to what the user sees. 
var CategoryMenuText = {
    Rooms: "Rooms",
    Groups: "Groups",
    Lights: "Lights",
    Scenes: "Scenes",
    Settings: "Settings"
};
class CategoryMenuModule {
    constructor(services, parentElement) {
        this._parentElement = parentElement;
        this._services = services;
        this._selectedCategory = CategoryMenuItems.Groups;
        this.buildMenu();
        this.selectMenuItem(CategoryMenuItems.Rooms);
    }
    selectMenuItem(item) {
        this._selectedCategory = item;
        $(this._parentElement).children().removeClass('selectedCategory');
        $(this._parentElement).find(`[itemID='${item}']`).addClass('selectedCategory');
    }
    nextItem() {
        var item = $(this._parentElement).find('.selectedCategory');
        if (item.length == 0) {
            let targetItem = $(this._parentElement).children()[0];
            $(targetItem).addClass('selectedCategory');
        }
        else {
            var result = $(item[0]).next();
            if (result == null || result.length == 0) {
                $(this._parentElement).children().removeClass('selectedCategory');
                var child = $(this._parentElement).children()[0];
                $(child).addClass('selectedCategory');
            }
            else {
                $(this._parentElement).children().removeClass('selectedCategory');
                $(result).addClass('selectedCategory');
            }
        }
    }
    prevItem() {
        var item = $(this._parentElement).find('.selectedCategory');
        if (item.length == 0) {
            let targetItem = $(this._parentElement).children()[0];
            $(targetItem).addClass('selectedCategory');
        }
        else {
            var result = $(item[0]).prev();
            if (result == null || result.length == 0) {
                $(this._parentElement).children().removeClass('selectedCategory');
                var child = $(this._parentElement).children().last();
                $(child).addClass('selectedCategory');
            }
            else {
                $(this._parentElement).children().removeClass('selectedCategory');
                $(result).addClass('selectedCategory');
            }
        }
    }
    buildMenu() {
        var items = [
            CategoryMenuItems.Rooms,
            CategoryMenuItems.Groups,
            CategoryMenuItems.Lights,
            CategoryMenuItems.Scenes,
            CategoryMenuItems.Settings
        ];
        items.forEach((item) => {
            var menuItem = document.createElement("div");
            menuItem.setAttribute('itemID', item);
            menuItem.innerText = CategoryMenuText[item];
            menuItem.setAttribute('class', 'categoryMenuItem');
            this._parentElement.append(menuItem);
        });
    }
    keyHandler(e) {
        switch (e.keyCode) {
            case 38: //UP arrow
                this.prevItem();
                return true;
            case 40: //DOWN arrow
                this.nextItem();
                return true;
            case 39: //RIGHT arrow
                this.deactivate();
            default:
                break;
        }
        return false;
    }
    activate() {
    }
    deactivate() {
        if (this._callback) {
            this._callback();
        }
    }
    setDeactivateCallback(callback) {
        this._callback = callback;
    }
}
class SceneControlModule {
    constructor(parentElement, services) {
        this._services = services;
        this._parentElement = parentElement;
    }
    keyHandler(e) {
        return false;
    }
    activate() {
    }
    deactivate() {
        if (this._deactivateCallback)
            this._deactivateCallback();
    }
    setDeactivateCallback(callback) {
        this._deactivateCallback = callback;
    }
}
class LightControlModule {
    constructor(parentElement, services) {
        this._services = services;
        this._parentElement = parentElement;
    }
    keyHandler(e) {
        return false;
    }
    activate() {
    }
    deactivate() {
        if (this._deactivateCallback)
            this._deactivateCallback();
    }
    setDeactivateCallback(callback) {
        this._deactivateCallback = callback;
    }
}
class MainModule {
    constructor() {
        this._viewState = ViewStates.SplashScreen;
        this._pairScreen = new PairScreenModule(this, $('#pairBridge')[0]);
        this._isModalActive = false;
        this._categoryMenu = new CategoryMenuModule(this, $('#categoryMenuParent')[0]);
        this._hdb = new HueDB();
        this._hueFinder = new HueFinder();
        this._discoveryBridgeList = new Array();
        this._rememberedBridgeList = new Array();
        this._selectedBridgeIndex = 0;
        this._confirmScreen = new ConfirmScreenModule('#confirmDialog');
        this._pairScreen.setDeactivateCallback(() => {
            this.pairingComplete();
            var pairedBridge = this._pairScreen.bridge;
            this._hdb.insertBridge(pairedBridge._bridgeInfo);
            console.log('paired bridge', pairedBridge);
        });
    }
    pairingComplete() {
        if (this._pairScreen.bridge.username) {
            this.goToState(ViewStates.ControlLights);
            this.refreshLightState();
        }
        else {
            this.goToState(ViewStates.SelectBridge);
        }
    }
    refreshLightState() {
        if (this._hueBridge == null) {
            this._hueBridge = new HueBridge(this.getSelectedBridge(), this.getSelectedBridge().userInfo.username);
        }
        this._hueBridge.getGroups()
            .then((o) => {
            console.log('Light State', o);
            console.log(JSON.stringify(o));
        });
    }
    setDeactivateCallback(callback) {
        this._deactivateCallback = callback;
    }
    activate() {
        var self = this;
        this.goToState(ViewStates.SplashScreen);
        if (!navigator.onLine) {
            this.goToState(ViewStates.NoInternet);
        }
        this.waitUntilOnline(() => {
            this.beginBridgeSearch();
            setTimeout(() => self.tryBridgeConnect(), 5000);
        });
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
                if (vBridge.length == 0) {
                    let b = { id: "001788fffe0a3d09", internalipaddress: "192.168.1.149", userInfo: { username: "IUXQd3KXHV1eOiuMQgcpBOEnD8Hg4EY7RDuBYjcM" } };
                    this._rememberedBridgeList.push(b);
                    this._hdb.insertBridge(b);
                }
                this._rememberedBridgeList = vBridge;
            });
        });
    }
    waitUntilOnline(callback) {
        if (navigator.onLine) {
            callback();
        }
        else {
            var checkTimer = setInterval(() => {
                if (navigator.onLine) {
                    clearTimeout(checkTimer);
                    callback();
                }
            }, 1000);
        }
    }
    tryBridgeConnect() {
        if (this._rememberedBridgeList.length == 1) {
            this.setSelectedBridge(this._rememberedBridgeList[0]);
            this._discoveryBridgeList.forEach((b) => {
                if (b.id == this.getSelectedBridge().id) {
                    this.getSelectedBridge().internalipaddress = b.internalipaddress;
                }
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
                case ViewStates.ControlLights: if (this._focusedModule)
                    this._focusedModule.keyHandler(e);
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
    getSelectedBridge() {
        return this._discoveryBridgeList[this._selectedBridgeIndex];
    }
    setSelectedBridge(b) {
        this._selectedBridgeIndex = -1;
        for (var i = 0; i < this._discoveryBridgeList.length; ++i) {
            if (this._discoveryBridgeList[i].id == b.id) {
                this._selectedBridgeIndex = i;
                this._discoveryBridgeList[i].userInfo = b.userInfo;
            }
        }
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
                newClass = "controlLights";
                this.refreshLightState();
                this._focusedModule = this._categoryMenu;
                break;
            case ViewStates.SelectBridge:
                newClass = "selectBridge";
                break;
            case ViewStates.PairBridge:
                newClass = "pairBridge";
                break;
            case ViewStates.NoInternet:
                newClass = "noInternet";
                break;
            default: newClass = "splashScreen";
        }
        rootVisual.setAttribute('class', newClass);
    }
    getLightInfo() {
        return new Promise((resolve, reject) => {
        });
    }
}
window.onload = () => {
    let m = new MainModule();
    document.addEventListener('keydown', (e) => m.keyHandler(e));
    m.activate();
};
