

enum ViewStates {
	SelectBridge,
	ControlLights
};

//Initialize function
var init = function () {
	let hdb = new HueDB();
	let hueFinder = new HueFinder();
	let targetElement = document.getElementById("splashScreen");
	if(targetElement) {
		setTimeout(function(){
			targetElement!.style.opacity = '1';	
			setTimeout(function(){
				targetElement!.style.opacity='0';
			},4000)
		}, 1000);
	}
	
    // TODO:: Do your initialization job
    console.log('init() called');
    
    document.addEventListener('visibilitychange', function() {
        if(document.hidden){
            // Something you want to do when hide or exit.
        } else {
            // Something you want to do when resume.
        }
    });
 
    // add eventListener for keydown
    document.addEventListener('keydown', function(e) {
    	switch(e.keyCode){
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
    	case 10009: //RETURN button
		tizen.application.getCurrentApplication().exit();
    		break;
    	default:
    		console.log('Key code : ' + e.keyCode);
    		break;
    	}
    });
};
// window.onload can work without <body onload="">
window.onload = init;


function goToState(state:ViewStates) {
	
}

