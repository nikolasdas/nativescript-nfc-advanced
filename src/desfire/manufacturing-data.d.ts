export declare class DesfireManufacturingData {
    hwVendorID: number;
    hwType: number;
    hwSubType: number;
    hwMajorVersion: number;
    hwMinorVersion: number;
    hwStorageSize: number;
    hwProtocol: number;
    swVendorID: number;
    swType: number;
    swSubType: number;
    swMajorVersion: number;
    swMinorVersion: number;
    swStorageSize: number;
    swProtocol: number;
    uid: string;
    batchNo: string;
    weekProd: number;
    yearProd: number;
    constructor(data: native.Array<number>);
    toString(): string;
    asObject(): {
        hardware: {
            vendorId: number;
            type: string;
            subType: string;
            versionMajor: number;
            versionMinor: number;
            storageSize: number;
            protocol: number;
        };
        software: {
            vendorId: number;
            type: string;
            subType: string;
            versionMajor: number;
            versionMinor: number;
            storageSize: number;
            protocol: number;
        };
        uid: string;
        batchNo: string;
        poductionWeek: number;
        productionYear: number;
    };
}
