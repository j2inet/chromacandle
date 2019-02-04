//--Sensor
//https://developer.tizen.org/ko/development/api-references/web-application?redirect=https://developer.tizen.org/dev-guide/2.3.1/org.tizen.web.apireference/html/device_api/mobile/tizen/sensor.html


declare enum SensorType { "LIGHT", "MAGNETIC", "PRESSURE",  "PROXIMITY", "ULTRAVIOLET", "HRM_RAW" }

declare enum ProximityState { "FAR", "NEAR" }

declare enum MagneticSensorAccuracy { "ACCURACY_UNDEFINED", "ACCURACY_BAD", "ACCURACY_NORMAL", "ACCURACY_GOOD", "ACCURACY_VERYGOOD" }

interface tizenInterface extends SensorServiceManagerObject {
    //application:ApplicationManager;
}

interface SensorServiceManagerObject {
 sensorservice:SensorService;
}



interface SensorService {
    getDefaultSensor( type:SensorType):Sensor;
    getAvailableSensors():Array<SensorType>;
}

interface Sensor {

    sensorType:SensorType;
    start(successCallback:SuccessCallback,
                            errorCallback?:ErrorCallback):void;
    stop():void;
    setChangeListener(successCallback:SensorDataSuccessCallback):void;
    unsetChangeListener() :void;
}

interface LightSensor extends  Sensor {

    getLightSensorData(successCallback:SensorDataSuccessCallback,
                            errorCallback?:ErrorCallback):void;
}

interface MagneticSensor extends Sensor {

    getMagneticSensorData(successCallback:SensorDataSuccessCallback,
                            errorCallback?:ErrorCallback):void;
}

interface PressureSensor extends Sensor {

    getPressureSensorData(successCallback:SensorDataSuccessCallback,
                             errorCallback?: ErrorCallback):void;
}

interface ProximitySensor extends Sensor {

    getProximitySensorData(successCallback:SensorDataSuccessCallback,
                            errorCallback:ErrorCallback):void;
}

interface UltravioletSensor extends Sensor {
    getUltravioletSensorData( successCallback:SensorDataSuccessCallback,
                            errorCallback?:ErrorCallback) :void;
}

interface HRMRawSensor extends Sensor {

    getHRMRawSensorData(successCallback:SensorDataSuccessCallback,
                             errorCallback?:ErrorCallback):void;
}

interface SensorData {
 }

interface SensorLightData extends SensorData {
    lightLevel:double;
} 

interface SensorMagneticData extends SensorData {
    x:double;
    y:double;
    z:double;
    accuracy:MagneticSensorAccuracy;
}

interface SensorPressureData extends SensorData {
    pressure:double;
}

interface SensorProximityData extends SensorData {

    readonly  proximityState:ProximityState;
}

interface SensorUltravioletData extends SensorData {

    readonly ultravioletLevel:long;
}

interface SensorHRMRawData extends SensorData {

    readonly lightType:DOMString;

    readonly  lightIntensity:ulong;
}

interface SensorDataSuccessCallback {
    onsuccess( sensorData?:SensorData):void;
}
