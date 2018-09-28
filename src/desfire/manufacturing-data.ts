import { Utils } from './../utils';

export class DesfireManufacturingData {
  public hwVendorID: number;
  public hwType: number;
  public hwSubType: number;
  public hwMajorVersion: number;
  public hwMinorVersion: number;
  public hwStorageSize: number;
  public hwProtocol: number;

  public swVendorID: number;
  public swType: number;
  public swSubType: number;
  public swMajorVersion: number;
  public swMinorVersion: number;
  public swStorageSize: number;
  public swProtocol: number;

  public uid: string;
  public batchNo: string;
  public weekProd: number;
  public yearProd: number;

  public constructor (data: native.Array<number>) {
    let stream = new java.io.ByteArrayInputStream(data);
    this.hwVendorID     = stream.read();
    this.hwType         = stream.read();
    this.hwSubType      = stream.read();
    this.hwMajorVersion = stream.read();
    this.hwMinorVersion = stream.read();
    this.hwStorageSize  = stream.read();
    this.hwProtocol     = stream.read();

    this.swVendorID     = stream.read();
    this.swType         = stream.read();
    this.swSubType      = stream.read();
    this.swMajorVersion = stream.read();
    this.swMinorVersion = stream.read();
    this.swStorageSize  = stream.read();
    this.swProtocol     = stream.read();

    let buffer = Array.create('byte', 7);
    stream.read(buffer, 0, buffer.length);
    this.uid = Utils.toHex(Utils.fromByte(buffer as native.Array<number>), { digits: 2, concat: ':' });

    buffer = Array.create('byte', 5);
    stream.read(buffer, 0, buffer.length);
    this.batchNo = Utils.toHex(Utils.fromByte(buffer as native.Array<number>), { prefix: true, concat: true });

    this.weekProd = parseInt(stream.read().toString(16));
    this.yearProd = parseInt('20' + stream.read().toString(16));
  }

  toString(): string {
    return 'Hardware info:\n'+
           '- VendorID: ' + this.hwVendorID + '\n' + 
           '- Type/subtype: ' + Utils.toHex([this.hwType, this.hwSubType], { prefix: true, digits: 2 }).join('/') + '\n' + 
           '- Version: ' + this.hwMajorVersion + '.' + this.hwMinorVersion + '\n' + 
           '- Storage size: ' + this.hwStorageSize + '\n' + 
           '- Protocol: ' + this.hwProtocol + '\n' + 
           'Software info:\n' +
           '- VendorID: ' + this.swVendorID + '\n' + 
           '- Type/subtype: ' + Utils.toHex([this.swType, this.swSubType], { prefix: true, digits: 2 }).join('/') + '\n' + 
           '- Version: ' + this.swMajorVersion + '.' + this.swMinorVersion + '\n' + 
           '- Storage size: ' + this.swStorageSize + '\n' + 
           '- Protocol: ' + this.swProtocol + '\n' + 
           'uid: ' + this.uid + '\n' + 
           'Batch no: ' + this.batchNo + '\n' + 
           'Production date: week ' + this.weekProd + ', ' + this.yearProd
  }

  asObject() {
    return {
      hardware: {
        vendorId: this.hwVendorID,
        type: Utils.toHex(this.hwType, { prefix: true, digits: 2 }),
        subType: Utils.toHex(this.hwSubType, { prefix: true, digits: 2 }),
        versionMajor: this.hwMajorVersion,
        versionMinor: this.hwMinorVersion,
        storageSize: this.hwStorageSize,
        protocol: this.hwProtocol
      },
      software: {
        vendorId: this.swVendorID,
        type: Utils.toHex(this.swType, { prefix: true, digits: 2 }),
        subType: Utils.toHex(this.swSubType, { prefix: true, digits: 2 }),
        versionMajor: this.swMajorVersion,
        versionMinor: this.swMinorVersion,
        storageSize: this.swStorageSize,
        protocol: this.swProtocol
      },
      uid: this.uid,
      batchNo: this.batchNo,
      poductionWeek: this.weekProd,
      productionYear: this.yearProd
    }
  } 
}
