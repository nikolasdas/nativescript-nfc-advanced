import { DesfireFile } from './file';
import { DesfireManufacturingData } from './manufacturing-data';
import { Utils } from './../utils';

export class DesfireProtocol {
  private static GET_MANUFACTURING_DATA    = Utils.byte(0x60);
  private static GET_APPLICATION_DIRECTORY = Utils.byte(0x6A);
  private static GET_ADDITIONAL_FRAME      = Utils.byte(0xAF);
  private static SELECT_APPLICATION        = Utils.byte(0x5A);
  private static READ_DATA                 = Utils.byte(0xBD);
  private static READ_RECORD               = Utils.byte(0xBB);
  private static GET_VALUE                 = Utils.byte(0x6C);
  private static GET_FILES                 = Utils.byte(0x6F);
  private static GET_FILE_SETTINGS         = Utils.byte(0xF5);

  private static OPERATION_OK         = Utils.byte(0x00);
  private static PERMISSION_DENIED    = Utils.byte(0x9D);
  private static AUTHENTICATION_ERROR = Utils.byte(0xAE);
  private static ADDITIONAL_FRAME     = Utils.byte(0xAF);

  private tag: android.nfc.tech.IsoDep;

  constructor(tag: android.nfc.tech.IsoDep) {
    this.tag = tag;
  }

  getManufacturingData(): DesfireManufacturingData {
    let buffer = this.sendRequest(DesfireProtocol.GET_MANUFACTURING_DATA);
    if (buffer.length != 28)
        throw 'Invalid response';
    return new DesfireManufacturingData(buffer);
  }

  getAppList(): number[] {
    let buffer = this.sendRequest(DesfireProtocol.GET_APPLICATION_DIRECTORY);
    let appIds = [];
    for (let i = 0; i < buffer.length; i += 3) {
      let appId = Array.create('byte', 3);
      Utils.copyArray(buffer, i, appId, 0, 3);
      appIds.push(Utils.byteArrayToInt(Utils.reverseArray(appId)));
    }
    return appIds;
  }

  selectApp(appId: number) {
    let buffer = Array.create('byte', 3);
    buffer[0] = Utils.byte(appId & 0xFF);
    buffer[1] = Utils.byte((appId & 0xFF00) >> 8);
    buffer[2] = Utils.byte((appId & 0xFF0000) >> 16);
    this.sendRequest(DesfireProtocol.SELECT_APPLICATION, buffer);
  }

  getFileList(): number[] {
    let buffer = this.sendRequest(DesfireProtocol.GET_FILES);
    let fileIds = [];
    for (let i = 0; i < buffer.length; i++) {
        fileIds.push(buffer[i]);
    }
    return fileIds;
  }

  getFile(fileId: number): DesfireFile {
    let data = this.sendRequest(DesfireProtocol.GET_FILE_SETTINGS, [Utils.byte(fileId)]);
    return DesfireFile.create(data);
  }

  readFile(fileId: number): native.Array<number> {
    return this.sendRequest(DesfireProtocol.READ_DATA, 
      [Utils.byte(fileId),
      Utils.byte(0x0), Utils.byte(0x0), Utils.byte(0x0),
      Utils.byte(0x0), Utils.byte(0x0), Utils.byte(0x0)]);
  }

  readRecord(fileId: number): native.Array<number> {
    return this.sendRequest(DesfireProtocol.READ_RECORD,
      [Utils.byte(fileId),
      Utils.byte(0x0), Utils.byte(0x0), Utils.byte(0x0),
      Utils.byte(0x0), Utils.byte(0x0), Utils.byte(0x0)]);
  }

  getValue(fileId: number): number {
    let buffer = this.sendRequest(DesfireProtocol.GET_VALUE, [Utils.byte(fileId)]);
    buffer = Utils.reverseArray(buffer);
    return Utils.byteArrayToInt(buffer);
  }

  private sendRequest(cmd: number, params: native.Array<number> = null): native.Array<number> {
    let output = new java.io.ByteArrayOutputStream();
    let buffer = this.tag.transceive(this.wrapMessage(cmd, params));
    while (true) {
      if (buffer[buffer.length - 2] != Utils.byte(0x91)) {
        throw 'Invalid response';
      }
      output.write(buffer, 0, buffer.length - 2);
      let status = buffer[buffer.length - 1];
      if (status == DesfireProtocol.OPERATION_OK) {
        break;
      } else if (status == DesfireProtocol.ADDITIONAL_FRAME) {
        buffer = this.tag.transceive(this.wrapMessage(DesfireProtocol.GET_ADDITIONAL_FRAME));
      } else if (status == DesfireProtocol.PERMISSION_DENIED) {
        throw 'Permission denied';
      } else if (status == DesfireProtocol.AUTHENTICATION_ERROR) {
        throw 'Authentication error';
      } else {
        throw 'Unknown status code: ' + Utils.toHex(status & 0xFF);
      }
    }
    return output.toByteArray();
  }

  private wrapMessage(cmd: number, params: native.Array<number> = null): native.Array<number> {
    let stream = new java.io.ByteArrayOutputStream();
    stream.write(Utils.byte(0x90));
    stream.write(cmd);
    stream.write(Utils.byte(0x00));
    stream.write(Utils.byte(0x00));
    if (params != null) {
      stream.write(Utils.byte(params.length));
      stream.write(params);
    }
    stream.write(Utils.byte(0x00));
    return stream.toByteArray();
  }
}
