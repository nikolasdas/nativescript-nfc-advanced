export declare abstract class DesfireFile {
    fileType: number;
    commSetting: number;
    accessRights: Array<number>;
    private static STANDARD_DATA_FILE;
    private static BACKUP_DATA_FILE;
    private static VALUE_FILE;
    private static LINEAR_RECORD_FILE;
    private static CYCLIC_RECORD_FILE;
    constructor(stream: java.io.ByteArrayInputStream);
    asObject(): object;
    static create(data: native.Array<number>): DesfireFile;
    static getFileTypeName(fileType: number): string;
    protected helper(stream: java.io.ByteArrayInputStream, size: number): number;
}
export declare class DesfireStandardFile extends DesfireFile {
    fileSize: number;
    constructor(stream: java.io.ByteArrayInputStream);
    asObject(): object;
}
export declare class DesfireRecordFile extends DesfireFile {
    recordSize: number;
    maxRecords: number;
    curRecords: number;
    constructor(stream: java.io.ByteArrayInputStream);
    asObject(): object;
}
export declare class DesfireValueFile extends DesfireFile {
    lowerLimit: number;
    upperLimit: number;
    value: number;
    limitedCreditEnabled: boolean;
    constructor(stream: java.io.ByteArrayInputStream);
    asObject(): object;
}
