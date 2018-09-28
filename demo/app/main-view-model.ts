import { Observable } from 'tns-core-modules/data/observable';
import { NfcAdvanced, NfcTagData, DesfireTagData, DesfireProtocol, DesfireValueFile } from 'nativescript-nfc-advanced';

export class HelloWorldModel extends Observable {
  public available: boolean;
  public enabled: boolean;
  public id: string;
  public techList: string;
  public tagType: string;
  public value: number;
  public lastTransaction: number;
  private nfcAdvanced: NfcAdvanced;

  constructor() {
    super();
    this.available = false;
    this.enabled = false;
    this.id = '';
    this.techList = '';
    this.tagType = '';
    this.value = 0;
    this.lastTransaction = 0;
    this.nfcAdvanced = new NfcAdvanced();
    this.nfcAdvanced.available().then((res) => {
      this.set('available', res);
    });
    this.nfcAdvanced.enabled().then((res) => {
      this.set('enabled', res);
    });
    this.nfcAdvanced.setOnTagDiscoveredListener((data: NfcTagData) => {
      this.set('id', data.id);
      this.set('techList', data.techList.join(', '));
      this.set('tagType', data.tagType);
      if (data.tagType == 'MIFARE DESFire') {
        try {
          let appId = 0x15845F;
          let fileId = 1;
          (data as DesfireTagData).protocol.selectApp(appId);
          this.set('value', (data as DesfireTagData).protocol.getValue(fileId));
          this.set('lastTransaction', ((data as DesfireTagData).protocol.getFile(fileId) as DesfireValueFile).value);
        } catch (e) {}
      }
    }).then(() => {
      console.log("OnTagDiscovered Listener set");
    });
  }
}
