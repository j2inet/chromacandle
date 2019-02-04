"use strict";
//import $ from "jquery";
var ViewStates;
(function (ViewStates) {
    ViewStates[ViewStates["SplashScreen"] = 0] = "SplashScreen";
    ViewStates[ViewStates["SelectBridge"] = 1] = "SelectBridge";
    ViewStates[ViewStates["ControlLights"] = 2] = "ControlLights";
})(ViewStates || (ViewStates = {}));
;
var hdb = new HueDB();
var hueFinder = new HueFinder();
var discoveryBridgeList;
var rememberedBridgeList;
var selectedBridge;
var selectedBridgeIndex = 0;
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
            //if(selectedBridgeIndex < discoveryBridgeList.length-1)
            ++selectedBridgeIndex;
            highlightSelectedBridge();
            break;
        case 13: //OK button
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
function bridgeConnect(e) {
    const stringIndex = $(e.currentTarget).attr('index');
    var numberIndex = -1;
    if (stringIndex) {
        numberIndex = parseInt(stringIndex);
    }
    console.log('connect', numberIndex);
}
function promptBridgeSelection() {
    goToState(ViewStates.SelectBridge);
    $('#bridgeListElement').empty();
    var indx = 0;
    for (let x = 0; x < 2; ++x)
        for (let i = 0; i < discoveryBridgeList.length; ++i) {
            var bridge = discoveryBridgeList[i];
            let structure = $('#palette').find('.bridgeButton').clone();
            $(structure).click(bridgeClick);
            $(structure).find('.bridgeConnectButton').click(bridgeConnect);
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
    // TODO:: Do your initialization job
    console.log('init() called');
    // add eventListener for keydown
}
;
// window.onload can work without <body onload="">
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
        default: newClass = "splashScreen";
    }
    rootVisual.setAttribute('class', newClass);
}
