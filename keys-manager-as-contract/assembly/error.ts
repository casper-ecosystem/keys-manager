//@ts-nocheck
import {ErrorCode} from 'casper-contract/error';

export enum Error {
    UnknownApiCommand = 1,
    PermissionDenied = 2,
    ThresholdViolation = 3,
    MaxKeysLimit = 4,
    DuplicateKey = 5,
    KeyManagementThresholdError = 6,
    DeploymentThresholdError = 7,
    InsufficientTotalWeight = 8,
    MissingArgument0 = 20,
    MissingArgument1 = 21,
    MissingArgument2 = 22,
    InvalidArgument0 = 23,
    InvalidArgument1 = 24,
    InvalidArgument2 = 25,
    UnsupportedNumberOfArguments = 30,
}

export function missing_argument(i: u32) :Error {
    switch(i){
        case 0:
            return Error.MissingArgument0;
        case 1:
            return Error.MissingArgument1
        case 2:
            return Error.MissingArgument2;
        default :
            return Error.UnsupportedNumberOfArguments;
    }
}

export function invalid_argument(i: u32): Error {
    switch(i){
        case 0:
            return Error.InvalidArgument0;
        case 1:
            return Error.InvalidArgument1
        case 2:
            return Error.InvalidArgument2;
        default :
            return Error.UnsupportedNumberOfArguments;
    }
}

export function toApiError(e:Error) : ErrorCode {
    return Error.fromUserError(<u16>e);
}