import { Observable } from 'tns-core-modules/data/observable';
import {
  NfcAdvanced, NfcTagData, MifareClassicTagData, DesfireTagData, DesfireFile
} from 'nativescript-nfc-advanced';
import { Utils } from 'nativescript-nfc-advanced/utils';

export class HelloWorldModel extends Observable {
  public available: boolean;
  public enabled: boolean;
  public id: string;
  public techList: string;
  public tagType: string;
  public output: string;
  private nfcAdvanced: NfcAdvanced;

  constructor() {
    super();
    this.available = false;
    this.enabled = false;
    this.id = '';
    this.techList = '';
    this.tagType = '';
    this.output = '';
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
      this.set('tagType', data.tagType + (data.tagSubtype ? ' ' + data.tagSubtype : ''));
      let output = '';
      if (data.tagType == 'MIFARE Classic') {
        output += '\n\n' + (data as MifareClassicTagData).size + ' bytes';
        output += '\n' + (data as MifareClassicTagData).sectorCount + ' Sectors';
        output += '\n' + (data as MifareClassicTagData).blockCount + ' Blocks';
      } else if (data.tagType == 'MIFARE DESFire') {
        try {
          output += '\n\n' + (data as DesfireTagData).protocol.getManufacturingData().toString();
        } catch (e) {}
        try {
          let apps = (data as DesfireTagData).protocol.getAppList();
          output += '\n\nApps: ' + Utils.arrayToString(Utils.toHex(apps, { prefix: true, digits: 6 }), true);
          for (let i = 0; i < apps.length; i++) {
            try {
              (data as DesfireTagData).protocol.selectApp(apps[i]);
              let files = (data as DesfireTagData).protocol.getFileList();
              for (let j = 0; j < files.length; j++) {
                let value, type, commSetting, accessRights, content;
                try {
                  value = (data as DesfireTagData).protocol.getValue(files[j]).toString();
                } catch (e) {}
                try {
                  let file = (data as DesfireTagData).protocol.getFile(files[j]);
                  type = file.fileTypeName;
                  commSetting = file.commSetting;
                  accessRights = file.accessRights;
                  content = JSON.stringify(file.asObject());
                } catch (e) {}
                output += '\n\nApp ' + Utils.toHex(apps[i], { prefix: true, digits: 6 }) + ', File ' + files[j];
                output += '\n    Value: ' + (value || '---');
                output += '\n    Type: ' + (type || 'UNKNOWN');
                output += '\n    commSetting: ' + (commSetting || '---');
                output += '\n    accessRights: ' + Utils.arrayToString(accessRights || [], true);
                output += '\n     Content: ' + (content || '---');
              }
            } catch (e) {}
          }
        } catch (e) {}
      }
      this.set('output', output);
    }).then(() => {
      console.log("OnTagDiscovered Listener set");
    });
  }
}
