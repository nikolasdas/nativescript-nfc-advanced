import { Utils } from './../utils';

export abstract class DesfireFile {
  public fileType: number;
  public fileTypeName: string;
  public commSetting: number;
  public accessRights: Array<number>;

  private static STANDARD_DATA_FILE = Utils.byte(0x00);
  private static BACKUP_DATA_FILE   = Utils.byte(0x01);
  private static VALUE_FILE         = Utils.byte(0x02);
  private static LINEAR_RECORD_FILE = Utils.byte(0x03);
  private static CYCLIC_RECORD_FILE = Utils.byte(0x04);

  constructor(stream: java.io.ByteArrayInputStream) {
    this.fileType = Utils.byte(stream.read());
    this.fileTypeName = DesfireFile.getFileTypeName(this.fileType);
    this.commSetting = Utils.byte(stream.read());
    let buffer = Array.create('byte', 2);
    stream.read(buffer, 0, buffer.length);
    this.accessRights = Utils.fromByte(buffer as native.Array<number>);
  }

  asObject(): object {
    return {};
  }

  static create(data: native.Array<number>): DesfireFile {
    let fileType = Utils.byte(data[0]);
    let stream = new java.io.ByteArrayInputStream(data);

    switch (fileType) {
      case DesfireFile.STANDARD_DATA_FILE:
      case DesfireFile.BACKUP_DATA_FILE:
        return new DesfireStandardFile(stream);
      case DesfireFile.LINEAR_RECORD_FILE:
      case DesfireFile.CYCLIC_RECORD_FILE:
        return new DesfireRecordFile(stream);
      case DesfireFile.VALUE_FILE:
        return new DesfireValueFile(stream);
      default:
        throw 'Unknown file type: ' + Utils.toHex(fileType);
    }
  }

  static getFileTypeName(fileType: number): string {
    switch (fileType) {
      case DesfireFile.STANDARD_DATA_FILE:
        return 'STANDARD_DATA_FILE';
      case DesfireFile.BACKUP_DATA_FILE:
        return 'BACKUP_DATA_FILE';
      case DesfireFile.LINEAR_RECORD_FILE:
        return 'LINEAR_RECORD_FILE';
      case DesfireFile.CYCLIC_RECORD_FILE:
        return 'CYCLIC_RECORD_FILE';
      case DesfireFile.VALUE_FILE:
        return 'VALUE_FILE';
      default:
        return 'UNKNOWN';
    }
  }

  protected helper(stream: java.io.ByteArrayInputStream, size: number): number {
    let buffer = Array.create('byte', size);
    stream.read(buffer, 0, size);
    return Utils.byteArrayToInt(Utils.reverseArray(buffer));
  }
}

export class DesfireStandardFile extends DesfireFile {
  public fileSize: number;

  constructor(stream: java.io.ByteArrayInputStream) {
    super(stream);
    this.fileSize = this.helper(stream, 3);
  }

  asObject(): object {
    return { fileSize: this.fileSize };
  }
}

export class DesfireRecordFile extends DesfireFile {
  public recordSize: number;
  public maxRecords: number;
  public curRecords: number;

  public constructor(stream: java.io.ByteArrayInputStream) {
    super(stream);
    this.recordSize = this.helper(stream, 3);
    this.maxRecords = this.helper(stream, 3);
    this.curRecords = this.helper(stream, 3);
  }

  asObject(): object {
    return {
      recordSize: this.recordSize,
      maxRecords: this.maxRecords,
      curRecords: this.curRecords
    };
  }
}

export class DesfireValueFile extends DesfireFile {
  public lowerLimit: number;
  public upperLimit: number;
  public value: number;
  public limitedCreditEnabled: boolean;

  public constructor(stream: java.io.ByteArrayInputStream) {
    super(stream);
    this.lowerLimit = this.helper(stream, 4);
    this.upperLimit = this.helper(stream, 4);
    this.value = this.helper(stream, 4);
    let buffer = Array.create('byte', 1);
    stream.read(buffer, 0, buffer.length);
    this.limitedCreditEnabled = buffer[0] != Utils.byte(0x00);
  }

  asObject(): object {
    return {
      lowerLimit: this.lowerLimit,
      upperLimit: this.upperLimit,
      value: this.value,
      limitedCreditEnabled: this.limitedCreditEnabled
    };
  }
}
