//import $ from "jquery";


enum ViewStates {
	SplashScreen,
	SelectBridge,
    ControlLights,
    PairBridge
};


enum PairingScreenStates {
    Waiting = "Waiting",
    Pairing = "Pairing",
    Success = "Success",
    Failed = "Failed"
}

class PairScreenModule implements ScreenModule {

    constructor() {
        this._bridge = null;
        this._state = PairingScreenStates.Waiting;
        this._parentElement = null;
    }

    setElement(element: Element) {
        this._parentElement = element;
	}
	
    setBridge(bridge: HueBridge): void {
        this._bridge = bridge;
    }

    setState(state: PairingScreenStates): void {
        this._state = state;
        $(this._parentElement!)
            .removeClass('PairScreen-Waiting')
            .removeClass('PairingScreen-Pairing')
            .removeClass('PairingScreen-Success')
            .removeClass('PairingScreen-Failed');
        $(this._parentElement!)
            .addClass(`PairingScreen-${state}`);
    }

    activate(): void {
        this.setState(PairingScreenStates.Pairing);
		this.startPairing();
		$(this._parentElement!).find('.yesButton').addClass('selectedButton');
		$(this._parentElement!).find('.noButton').removeClass('selectedButton');
	}
	
    deactivate(): void {
        if (this._pairTimer != 0) {
            clearInterval(this._pairTimer);
        }
    }

    startPairing(): Promise<HueBridge> {
        return new Promise<HueBridge>((resolve, reject) => {
            if (this._bridge == null) {
                reject();
                return;
            }
            this._remainingPairTime = PAIRING_TIMEOUT / SECOND;
            this._bridge!.tryPair()
                .then((userNameResponse) => {
                    clearInterval(this._pairTimer);
                    this._pairTimer = 0;
                    resolve(this._bridge!);
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
                } else {
                    reject('timeout');
                    this.setState(PairingScreenStates.Failed);
                    clearInterval(this._pairTimer);
                    this._pairTimer = 0;
                }
            }, 1000);
        });
    }


    keyHandler(e: keyArgs): boolean {
        switch (e.keyCode) {
            case 37: //LEFT arrow
                $(this._parentElement!).find('.yesButton').addClass('selectedButton');
				$(this._parentElement!).find('.noButton').removeClass('selectedButton');
				this._isRetryRequested = true;
				return true;
                break;
            case 39: //RIGHT arrow
                $(this._parentElement!).find('.yesButton').removeClass('selectedButton');
				$(this._parentElement!).find('.noButton').addClass('selectedButton');
				this._isRetryRequested = false;
				return true;
                break;
            case 13: //OK button
                break;

		}
		return false;
    }

	private _isRetryRequested:boolean = false;
    private _remainingPairTime = 0;
    private _bridge: HueBridge|null;
    private _pairTimer = 0;
    private _state: PairingScreenStates;
    private _parentElement: Element|null;
}




var hdb = new HueDB();
var hueFinder = new HueFinder();

var discoveryBridgeList:Array<IBridgeInfo>;
var rememberedBridgeList:Array<IBridgeInfo>;
var selectedBridge:IBridgeInfo;
var selectedBridgeIndex = 0;

var smPair: PairScreenModule = new PairScreenModule();
var viewState:ViewStates = ViewStates.SplashScreen;

type keyArgs = any;

interface ScreenModule {
    keyHandler(e: keyArgs): boolean;
    activate(): void;
    deactivate(): void;
}


function activate():void {
	if(rememberedBridgeList.length == 1) {
		selectedBridge = rememberedBridgeList[0];
		discoveryBridgeList.forEach((b)=> {
			if(b.id == selectedBridge.id)
				selectedBridge.internalipaddress = b.internalipaddress;
		});
		goToState(ViewStates.ControlLights);
	} else
		promptBridgeSelection();
}


function highlightSelectedBridge() { 
	$('.bridgeButton').removeClass('bridgeSelected');
	var parent = $(`#bridgeListElement > :nth-child(${selectedBridgeIndex+1})`);	
	$(parent).addClass('bridgeSelected');
}

function selectBridgeKeyHandler(e:any) {
	switch(e.keyCode){
		case 38: //UP arrow
			if(selectedBridgeIndex>0)
				--selectedBridgeIndex;
			highlightSelectedBridge();
    		break;
		case 40: //DOWN arrow
			if(selectedBridgeIndex < discoveryBridgeList.length-1)
				++selectedBridgeIndex
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


function bridgeClick(e:any) { 
	console.log(e);
	console.log('target', e.currentTarget)
	const  stringIndex = $(e.currentTarget).attr('index');
	var numberIndex:number = -1;
	if(stringIndex) {
		numberIndex = parseInt(stringIndex);
	}
	if(numberIndex>-1) {
		selectedBridgeIndex = numberIndex;
		highlightSelectedBridge();
	}
}

function bridgeConnectClick(e:any) { 
	const  stringIndex = $(e.currentTarget).attr('index');
	var numberIndex:number = -1;
	if(stringIndex) {
		numberIndex = parseInt(stringIndex);
	}	
    console.log('connect', numberIndex);
    bridgeConnect(discoveryBridgeList[numberIndex]);
}

function bridgeConnect(bridgeInfo: IBridgeInfo) {
    smPair.setBridge(new HueBridge(bridgeInfo));
    smPair.activate();
    goToState(ViewStates.PairBridge);
}

function promptBridgeSelection() { 

	goToState(ViewStates.SelectBridge);
	$('#bridgeListElement').empty();
	var indx = 0;	
	for(let i:number = 0;i<discoveryBridgeList.length;++i) {
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
    document.addEventListener('keydown', function(e) {
		switch(viewState) {
			case ViewStates.SplashScreen:
			break;
			case ViewStates.PairBridge:
			smPair.keyHandler(e);
			break;
			case ViewStates.ControlLights:
			break;
			case ViewStates.SelectBridge:
			selectBridgeKeyHandler(e);
			break;
			default:
			break;
		}
    	switch(e.keyCode){
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
	.then((vBridge)=>{
		discoveryBridgeList = vBridge;
	});
	hdb.ensureCreate()
	.then(()=>{
		hdb.readBridgeList()
		.then ((vBridge) => {
			rememberedBridgeList = vBridge;
		});
	});
	var targetElement = document.getElementById("splashScreen");
	if(targetElement) {			
		goToState(ViewStates.SplashScreen);
		//targetElement!.style.opacity = '1';	
		setTimeout(function (){
			$('#splashScreen').css({"opacity":"0"});			
			setTimeout(activate, 4000);
		},4000)			
	}
    console.log('init() called');
};
window.onload = main;


function goToState(state:ViewStates) {
	let rootVisual = document.getElementById('rootVisual');
	var newClass:string;
	viewState = state;
	switch(state) {
		case ViewStates.SplashScreen: newClass="splashScreen"		; break;
		case ViewStates.ControlLights: newClass="controlLisghts";	break;
        case ViewStates.SelectBridge: newClass = "selectBridge"; break;
        case ViewStates.PairBridge: newClass = "pairBridge"; break;
		default: newClass = "splashScreen";
	}
    rootVisual!.setAttribute('class', newClass);
}

