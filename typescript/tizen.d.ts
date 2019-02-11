// Type definitions for Tizen Web
// Project: https://tizen.org
// Definitions by: Joel Ivory Johnson <https://www.j2i.net>
// Definitions: https://github.com/DefinitelyTyped/DefinitelyTyped

///  https://www.tizen.org/ko/tv/web_device_api/application?langredirect=1#ApplicationManager

declare	interface Window {  tizen:tizenInterface}
declare var tizen:tizenInterface;

interface tizenInterface {
    application:ApplicationManager;
}



type ApplicationId = string;
type ApplicationContextId = string;
type PackageId = string; //??
type SuccessCallback = (...args: any[]) => void;
type ErrorCallback = (...args: any[]) => void;

interface ApplicationControlDataArrayReplyCallback {
    onsuccess( data?:Array<ApplicationControlData>):void;
     onfailure():void;
}

//Questionable
declare enum ApplicationControlLaunchMode {
    SINGLE = "SINGLE", 
    GROUP = "GROUP"
}

interface ApplicationCertificate {
    type:string;
    value:string;
  }

interface ApplicationContext {
    id:ApplicationContextId;
    appId:ApplicationId;
  }
  interface ApplicationMetaData {

    key:string;
    value:string;
}

interface ApplicationControlData {
    key:string;
    value:Array<string>;
}

interface ApplicationContextArraySuccessCallback {
    onsuccess( contexts:Array<ApplicationContext>):void;
}

interface ApplicationInformationArraySuccessCallback {
    onsuccess(informationArray:Array<ApplicationInformation>):void;
}

interface ApplicationInformationEventCallback {
    oninstalled(info:ApplicationInformation):void;
    onupdated(info:ApplicationInformation):void;
    onuninstalled(id:ApplicationId):void;
}

interface ApplicationInformation {

    id:ApplicationId ;
    name:string;
    iconPath:string;
    version:string;
    show:boolean;
    categories:Array<string>;
    installDate:Date;
    size:number;
    packageId:PackageId;
}

interface FindAppControlSuccessCallback {
    onsuccess( informationArray:Array<ApplicationInformation>, appControl:ApplicationControl):void;
}


interface ApplicationControl {
    operation:string;
    uri:string|null;
    mime:string|null;
    category:string|null;
    data:Array<ApplicationControlData>;
    launchMode:ApplicationControlLaunchMode;
}

interface RequestedApplicationControl {
    readonly  appControl:ApplicationControl;
    readonly  callerAppId:string;//ApplicationId
    replyResult( data?:Array<ApplicationControlData>):void;
    replyFailure():void;
}

interface Application { 
    exit():void;
    hide():void;
}

//https://www.tizen.org/ko/tv/web_device_api/application?langredirect=1#ApplicationManager
interface ApplicationManager { 
    getCurrentApplication():Application;

    kill(contextId:string,
              successCallback:SuccessCallback,
              errorCallback:ErrorCallback):void ;

    launch( id:string, //ApplicationId
                successCallback:SuccessCallback,
                errorCallback:ErrorCallback):void;
    launchAppControl(appControl:ApplicationControl,
                        id?:ApplicationId, //ApplicationId
                          successCallback?:SuccessCallback,
                          errorCallback?:ErrorCallback,
                          replyCallback?:ApplicationControlDataArrayReplyCallback):void ;
     findAppControl(appControl:ApplicationControl,
                        successCallback:FindAppControlSuccessCallback,
                        errorCallback:ErrorCallback):void;

    getAppsContext(successCallback:ApplicationContextArraySuccessCallback,
                        errorCallback:ErrorCallback):void ;
    getAppContext(contextId:string):ApplicationContext;
    getAppsInfo(successCallback:ApplicationInformationArraySuccessCallback,
                     errorCallback?:ErrorCallback):void;
    getAppInfo(id?:ApplicationId ):ApplicationInformation;
    getAppCerts(id?:ApplicationId ):Array<ApplicationCertificate>;
    getAppSharedURI(id?:ApplicationId ):string;
    getAppMetaData(id?:ApplicationId ):Array<ApplicationMetaData>;
    addAppInfoEventListener(eventCallback:ApplicationInformationEventCallback):number;
    removeAppInfoEventListener( watchId:number):void ;    
}

//------

type double = number;
type long = number;
type DOMString = string;
type ulong = number;

declare enum PowerResource    
{ 
    SCREEN = "SCREEN", 
    CPU = "CPU" 
}


declare enum PowerScreenState { 
    SCREEN_OFF = "SCREEN_OFF", 
    SCREEN_DIM = "SCREEN_DIM", 
    SCREEN_NORMAL = "SCREEN_NORMAL", 
    SCREEN_BRIGHT = "SCREEN_BRIGHT" 
}

declare enum PowerCpuState { 
    CPU_AWAKE = "CPU_AWAKE" 
}

type PowerState = PowerScreenState|PowerCpuState;


interface PowerManagerObject {
    power:PowerManager;
}

interface PowerManager {
    request( resource:PowerResource, state:PowerState):void;
    release(resource:PowerResource):void;
    setScreenStateChangeListener(listener:ScreenStateChangeCallback):void;
    unsetScreenStateChangeListener():void;
    getScreenBrightness():double;
    setScreenBrightness(brightness:double) :void;
     isScreenOn():boolean;
    restoreScreenBrightness():void;
    turnScreenOn():void;
    turnScreenOff():void;
}

interface ScreenStateChangeCallback {
    onchanged(previousState:PowerScreenState, changedState:PowerScreenState):void;
}

