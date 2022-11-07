#import <Foundation/Foundation.h>
#import <React/RCTBridgeModule.h>
#import <React/RCTEventEmitter.h>
#import "React/RCTEventDispatcher.h"

@interface RCT_EXTERN_MODULE(BleDidcommSdk, RCTEventEmitter)

RCT_EXTERN_METHOD(startCentral
                  :(NSString *)serviceUUID
                  characteristicUUID:(NSString *)characteristicUUID
                  notifyCharacteristicUUID:(NSString *)notifyCharacteristicUUID
                  resolve:(RCTPromiseResolveBlock)resolve
                  reject:(RCTPromiseRejectBlock)reject)

RCT_EXTERN_METHOD(startPeripheral
                  :(NSString *)serviceUUID
                  characteristicUUID:(NSString *)characteristicUUID
                  notifyCharacteristicUUID:(NSString *)notifyCharacteristicUUID
                  resolve:(RCTPromiseResolveBlock)resolve
                  reject:(RCTPromiseRejectBlock)reject)

RCT_EXTERN_METHOD(advertise
                  :(NSDictionary *)options
                  resolve:(RCTPromiseResolveBlock)resolve
                  reject:(RCTPromiseRejectBlock)reject)

RCT_EXTERN_METHOD(write
                  :(NSString *)message
                  resolve:(RCTPromiseResolveBlock)resolve
                  reject:(RCTPromiseRejectBlock)reject)

RCT_EXTERN_METHOD(scan
                  :(NSDictionary *)options
                  resolve:(RCTPromiseResolveBlock)resolve
                  reject:(RCTPromiseRejectBlock)reject)

RCT_EXTERN_METHOD(connect
                  :(NSString *)peripheralId
                  resolve:(RCTPromiseResolveBlock)resolve
                  reject:(RCTPromiseRejectBlock)reject)

RCT_EXTERN_METHOD(notify
                  :(NSString *)message
                  resolve:(RCTPromiseResolveBlock)resolve
                  reject:(RCTPromiseRejectBlock)reject)

+ (BOOL)requiresMainQueueSetup
{
  return NO;
}

@end
