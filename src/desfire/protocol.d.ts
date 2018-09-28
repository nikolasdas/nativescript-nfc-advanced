import { DesfireFile } from './file';
import { DesfireManufacturingData } from './manufacturing-data';
export declare class DesfireProtocol {
    private static GET_MANUFACTURING_DATA;
    private static GET_APPLICATION_DIRECTORY;
    private static GET_ADDITIONAL_FRAME;
    private static SELECT_APPLICATION;
    private static READ_DATA;
    private static READ_RECORD;
    private static GET_VALUE;
    private static GET_FILES;
    private static GET_FILE_SETTINGS;
    private static OPERATION_OK;
    private static PERMISSION_DENIED;
    private static AUTHENTICATION_ERROR;
    private static ADDITIONAL_FRAME;
    private tag;
    constructor(tag: android.nfc.tech.IsoDep);
    getManufacturingData(): DesfireManufacturingData;
    getAppList(): number[];
    selectApp(appId: number): void;
    getFileList(): number[];
    getFile(fileId: number): DesfireFile;
    readFile(fileId: number): native.Array<number>;
    readRecord(fileId: number): native.Array<number>;
    getValue(fileId: number): number;
    private sendRequest(cmd, params?);
    private wrapMessage(cmd, params?);
}
