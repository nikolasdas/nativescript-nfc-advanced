import {
  NfcApi, NfcTagData, NfcNdefData, NfcNdefRecord, WriteTagOptions, NfcUriProtocols, NdefListenerOptions
} from "./nfc-advanced.common";
import * as utils from "tns-core-modules/utils/utils";
import * as application from "tns-core-modules/application";
import * as frame from "tns-core-modules/ui/frame";
import { Utils } from './utils';

import { DesfireProtocol } from './desfire/protocol';
import { DesfireFile } from './desfire/file';
import { DesfireTagData } from './desfire/tag-data';
import { MifareClassicTagData, MifareUltralightTagData } from './mifare/tag-data';

declare let Array: any;

let onTagDiscoveredListener: (data: NfcTagData) => void = null;
let onNdefDiscoveredListener: (data: NfcNdefData) => void = null;

class NfcIntentHandler {
  savedIntent: android.content.Intent = null;

  parseMessage(): void {
    const activity = application.android.foregroundActivity || application.android.startActivity;
    let intent = activity.getIntent();
    if (intent === null || this.savedIntent === null)
      return;
    let action = intent.getAction();
    if (action === null)
      return;

    let tag = intent.getParcelableExtra(android.nfc.NfcAdapter.EXTRA_TAG) as android.nfc.Tag;

    switch (action) {
      case android.nfc.NfcAdapter.ACTION_NDEF_DISCOVERED:
        let messages = intent.getParcelableArrayExtra(android.nfc.NfcAdapter.EXTRA_NDEF_MESSAGES);
        this.onNdefDiscovered(tag, messages);
        activity.getIntent().setAction('');
        break;
      case android.nfc.NfcAdapter.ACTION_TECH_DISCOVERED:
        this.onTechDiscovered(tag);
        activity.getIntent().setAction('');
        break;
      case android.nfc.NfcAdapter.ACTION_TAG_DISCOVERED:
        this.onTagDiscovered(tag);
        activity.getIntent().setAction('');
        break;
    }
  }

  private onNdefDiscovered(tag: android.nfc.Tag, messages) {
    let ndef = android.nfc.tech.Ndef.get(tag);
    let ndefJson: NfcNdefData = this.ndefToJSON(ndef);
    if (ndef === null && messages !== null) {
      if (messages.length > 0) {
        let message = messages[0] as android.nfc.NdefMessage;
        ndefJson.message = this.messageToJSON(message);
        ndefJson.type = "NDEF Push Protocol";
      }
      if (messages.length > 1) {
        console.log("Expected 1 ndefMessage but found " + messages.length);
      }
    }
    if (onNdefDiscoveredListener != null) {
      onNdefDiscoveredListener(ndefJson);
    } else {
      console.log("Ndef discovered, but no listener was set via setOnNdefDiscoveredListener. Ndef: " + JSON.stringify(ndefJson));
    }
  }

  private onTechDiscovered(tag: android.nfc.Tag) {
    let techList = tag.getTechList();
    for (let i = 0; i < tag.getTechList().length; i++) {
      let tech = tag.getTechList()[i];
      /*
      let tagTech = techList(t);
      console.log("tagTech: " + tagTech);
      if (tagTech === NdefFormatable.class.getName()) {
        fireNdefFormatableEvent(tag);
      } else if (tagTech === Ndef.class.getName()) {
        let ndef = Ndef.get(tag);
        fireNdefEvent(NDEF, ndef, messages);
      }
      */
    }
  }

  private onTagDiscovered(tag: android.nfc.Tag) {
    let id = this.getId(tag);
    let techList = this.getTechList(tag);
    let result: NfcTagData;
    let techTag: android.nfc.tech.TagTechnology;
    if (techList.indexOf('MifareClassic') != -1) {
      [result, techTag] = this.handleMifareClassic(tag);
    } else if (techList.indexOf('MifareUltralight') != -1) {
      [result, techTag] = this.handleMifareUltralight(tag);
    } else if (techList.indexOf('IsoDep') != -1) {
      [result, techTag] = this.handleDesfire(tag);
    } else {
      result.tagType = 'Unknown';
    }
    result.id = id;
    result.techList = techList;

    if (onTagDiscoveredListener != null) {
      if (techTag)
        techTag.connect();
      onTagDiscoveredListener(result);
      if (techTag)
        techTag.close();
    } else
      console.log("Tag discovered, but no listener was set via setOnTagDiscoveredListener. Ndef: " + JSON.stringify(result));
  }

  private getId(tag: android.nfc.Tag): string {
    if (tag == null)
      return null;
    return Utils.toHex(Utils.fromByte(tag.getId()), { digits: 2, concat: ':' });
  }

  private getTechList(tag: android.nfc.Tag): string[] {
    if (tag == null)
      return null;
    return Utils.nativeArrayToArray(tag.getTechList()).map(x => x.replace('android.nfc.tech.', ''));
  }

  private handleMifareClassic(tag: android.nfc.Tag): [MifareClassicTagData, android.nfc.tech.TagTechnology] {
    let mifareClassicTag = android.nfc.tech.MifareClassic.get(tag);
    let tagType = 'MIFARE Classic';
    let tagSubtype;
    switch (mifareClassicTag.getType()) {
      case android.nfc.tech.MifareClassic.TYPE_CLASSIC:
        break;
      case android.nfc.tech.MifareClassic.TYPE_PLUS:
        tagSubtype = 'Plus';
        break;
      case android.nfc.tech.MifareClassic.TYPE_PRO:
        tagSubtype = 'Pro';
        break;
    }
    let size = mifareClassicTag.getSize();
    let sectorCount = mifareClassicTag.getSectorCount();
    let blockCount = mifareClassicTag.getBlockCount();

    return [{ id: null, techList: null, tagType, tagSubtype, blockCount, sectorCount, size }, mifareClassicTag];
  }

  private handleMifareUltralight(tag: android.nfc.Tag): [MifareUltralightTagData, android.nfc.tech.TagTechnology] {
    let mifareUlTag = android.nfc.tech.MifareUltralight.get(tag);
    let tagType = 'MIFARE Ultralight';
    let tagSubtype;
    switch (mifareUlTag.getType()) {
      case android.nfc.tech.MifareUltralight.TYPE_ULTRALIGHT:
        break;
      case android.nfc.tech.MifareUltralight.TYPE_ULTRALIGHT_C:
        tagSubtype = 'C';
        break;
    }
    return [{ id: null, techList: null, tagType, tagSubtype }, mifareUlTag];
  }

  private handleDesfire(tag: android.nfc.Tag): [DesfireTagData, android.nfc.tech.TagTechnology] {
    let isoDepTag = android.nfc.tech.IsoDep.get(tag);
    let tagType = 'MIFARE DESFire';
    let protocol = new DesfireProtocol(isoDepTag);
    return [{ id: null, techList: null, tagType, protocol }, isoDepTag];
  }

  byteArrayToJSArray(bytes): Array<number> {
    if (bytes == null)
      return null;
    let result = [];
    for (let i = 0; i < bytes.length; i++) {
      result.push(bytes[i]);
    }
    return result;
  }

  byteArrayToJSON(bytes): string {
    if (bytes == null)
      return null;
    let json = new org.json.JSONArray();
    for (let i = 0; i < bytes.length; i++) {
      json.put(bytes[i]);
    }
    return json.toString();
  }

  bytesToHexString(bytes): string {
    if (bytes == null)
      return null;
    let dec, hexstring, bytesAsHexString = "";
    for (let i = 0; i < bytes.length; i++) {
      if (bytes[i] >= 0) {
        dec = bytes[i];
      } else {
        dec = 256 + bytes[i];
      }
      hexstring = dec.toString(16);
      // zero padding
      if (hexstring.length === 1) {
        hexstring = "0" + hexstring;
      }
      bytesAsHexString += hexstring;
    }
    return bytesAsHexString;
  }

  bytesToString(bytes): string {
    if (bytes == null)
      return null;
    let result = "";
    let i, c, c1, c2, c3;
    i = c = c1 = c2 = c3 = 0;

    // Perform byte-order check
    if (bytes.length >= 3) {
      if ((bytes[0] & 0xef) === 0xef && (bytes[1] & 0xbb) === 0xbb && (bytes[2] & 0xbf) === 0xbf) {
        // stream has a BOM at the start, skip over
        i = 3;
      }
    }

    while (i < bytes.length) {
      c = bytes[i] & 0xff;

      if (c < 128) {
        result += String.fromCharCode(c);
        i++;

      } else if ((c > 191) && (c < 224)) {
        if (i + 1 >= bytes.length) {
          throw "Un-expected encoding error, UTF-8 stream truncated, or incorrect";
        }
        c2 = bytes[i + 1] & 0xff;
        result += String.fromCharCode(((c & 31) << 6) | (c2 & 63));
        i += 2;

      } else {
        if (i + 2 >= bytes.length || i + 1 >= bytes.length) {
          throw "Un-expected encoding error, UTF-8 stream truncated, or incorrect";
        }
        c2 = bytes[i + 1] & 0xff;
        c3 = bytes[i + 2] & 0xff;
        result += String.fromCharCode(((c & 15) << 12) | ((c2 & 63) << 6) | (c3 & 63));
        i += 3;
      }
    }
    return result;
  }

  ndefToJSON(ndef: android.nfc.tech.Ndef): NfcNdefData {
    if (ndef === null) {
      return null;
    }

    let result = {
      type: ndef.getType()[0],
      maxSize: ndef.getMaxSize(),
      writable: ndef.isWritable(),
      message: this.messageToJSON(ndef.getCachedNdefMessage()),
      canMakeReadOnly: ndef.canMakeReadOnly()
    } as NfcNdefData;


    let tag = ndef.getTag();
    if (tag !== null) {
      result.id = this.getId(tag);
      result.techList = this.getTechList(tag);
    }

    return result;
  }

  messageToJSON(message: android.nfc.NdefMessage): Array<NfcNdefRecord> {
    try {
      if (message === null) {
        return null;
      }
      let records = message.getRecords();
      let result = [];
      for (let i = 0; i < records.length; i++) {
        let record = this.recordToJSON(records[i]);
        result.push(record);
      }
      return result;
    } catch (e) {
      console.log("Error in messageToJSON: " + e);
      return null;
    }
  }

  recordToJSON(record: android.nfc.NdefRecord): NfcNdefRecord {
    let payloadAsString = this.bytesToString(record.getPayload());
    const payloadAsStringWithPrefix = payloadAsString;
    const type = record.getType()[0];

    if (type === android.nfc.NdefRecord.RTD_TEXT[0]) {
      let languageCodeLength = record.getPayload()[0];
      payloadAsString = payloadAsStringWithPrefix.substring(languageCodeLength + 1);

    } else if (type === android.nfc.NdefRecord.RTD_URI[0]) {
      let prefix = NfcUriProtocols[record.getPayload()[0]];
      if (!prefix) {
        prefix = "";
      }
      payloadAsString = prefix + payloadAsString.slice(1);
    }

    return {
      tnf: record.getTnf(),
      type: type,
      id: this.byteArrayToJSArray(record.getId()),
      payload: this.byteArrayToJSON(record.getPayload()),
      payloadAsHexString: this.bytesToHexString(record.getPayload()),
      payloadAsStringWithPrefix: payloadAsStringWithPrefix,
      payloadAsString: payloadAsString
    };
  }
}

let nfcIntentHandler = new NfcIntentHandler();

@JavaProxy("com.tns.NativeScriptNfcActivity")
class Activity extends android.app.Activity {
  private _callbacks: frame.AndroidActivityCallbacks;

  onCreate(savedInstanceState: android.os.Bundle): void {
    if (!this._callbacks)
      (<any>frame).setActivityCallbacks(this);
    this._callbacks.onCreate(this, savedInstanceState, super.onCreate);
  }

  onSaveInstanceState(outState: android.os.Bundle): void {
    this._callbacks.onSaveInstanceState(this, outState, super.onSaveInstanceState);
  }

  onStart(): void {
    this._callbacks.onStart(this, super.onStart);
  }

  onStop(): void {
    this._callbacks.onStop(this, super.onStop);
  }

  onDestroy(): void {
    this._callbacks.onDestroy(this, super.onDestroy);
  }

  public onBackPressed(): void {
    this._callbacks.onBackPressed(this, super.onBackPressed);
  }

  public onRequestPermissionsResult(requestCode: number, permissions: Array<String>, grantResults: Array<number>): void {
    this._callbacks.onRequestPermissionsResult(this, requestCode, permissions, grantResults, undefined /*TODO: Enable if needed*/);
  }

  onActivityResult(requestCode: number, resultCode: number, data: android.content.Intent): void {
    this._callbacks.onActivityResult(this, requestCode, resultCode, data, super.onActivityResult);
  }

  onNewIntent(intent: android.content.Intent): void {
    super.onNewIntent(intent);
    const activity = application.android.foregroundActivity || application.android.startActivity;
    if (activity) {
      activity.setIntent(intent);
      nfcIntentHandler.savedIntent = intent;
      nfcIntentHandler.parseMessage();
    }
  }
}

export class NfcAdvanced implements NfcApi {
  private pendingIntent: android.app.PendingIntent;
  private intentFilters: any;
  private techLists: any;
  private static firstInstance = true;

  constructor() {
    this.intentFilters = [];
    this.techLists = Array.create("[Ljava.lang.String;", 0);
    const activity = application.android.foregroundActivity || application.android.startActivity;
    let intent = new android.content.Intent(activity, activity.getClass());
    intent.addFlags(android.content.Intent.FLAG_ACTIVITY_SINGLE_TOP | android.content.Intent.FLAG_ACTIVITY_CLEAR_TOP);
    this.pendingIntent = android.app.PendingIntent.getActivity(activity, 0, intent, 0);
    let nfcAdapter = android.nfc.NfcAdapter.getDefaultAdapter(activity);
    if (NfcAdvanced.firstInstance) {
      NfcAdvanced.firstInstance = false;
      application.android.on(application.AndroidApplication.activityPausedEvent, (args: application.AndroidActivityEventData) => {
        let pausingNfcAdapter = android.nfc.NfcAdapter.getDefaultAdapter(args.activity);
        if (pausingNfcAdapter !== null) {
          try {
            nfcAdapter.disableForegroundDispatch(args.activity);
          } catch (e) {
            console.log("Illegal State Exception stopping NFC. Assuming application is terminating.");
          }
        }
      });
      application.android.on(application.AndroidApplication.activityResumedEvent, (args: application.AndroidActivityEventData) => {
        let resumingNfcAdapter = android.nfc.NfcAdapter.getDefaultAdapter(args.activity);
        if (resumingNfcAdapter !== null && !args.activity.isFinishing()) {
          resumingNfcAdapter.enableForegroundDispatch(args.activity, this.pendingIntent, this.intentFilters, this.techLists);
          nfcIntentHandler.parseMessage();
        }
      });
    }
  }

  public available(): Promise<boolean> {
    return new Promise(resolve => {
      resolve(this.getNfcAdapter() !== null);
    });
  }

  public enabled(): Promise<boolean> {
    return new Promise(resolve => {
      let nfcAdapter = this.getNfcAdapter();
      resolve(nfcAdapter !== null && nfcAdapter.isEnabled());
    });
  }

  private getNfcAdapter(): globalAndroid.nfc.NfcAdapter {
    return android.nfc.NfcAdapter.getDefaultAdapter(utils.ad.getApplicationContext());;
  }

  public setOnTagDiscoveredListener(callback: (data: NfcTagData) => void): Promise<any> {
    return new Promise(resolve => {
      onTagDiscoveredListener = callback;
      resolve();
    });
  }

  public setOnNdefDiscoveredListener(callback: (data: NfcNdefData) => void, options?: NdefListenerOptions): Promise<any> {
    return new Promise(resolve => {
      onNdefDiscoveredListener = callback;
      resolve();
    });
  }

  public eraseTag(): Promise<any> {
    return new Promise((resolve, reject) => {
      let intent = application.android.foregroundActivity.getIntent();
      if (intent === null || nfcIntentHandler.savedIntent === null) {
        reject("Can't erase tag; didn't receive an intent");
        return;
      }

      let tag = nfcIntentHandler.savedIntent.getParcelableExtra(android.nfc.NfcAdapter.EXTRA_TAG) as android.nfc.Tag;
      let records = new Array.create(android.nfc.NdefRecord, 1);
      let tnf = android.nfc.NdefRecord.TNF_EMPTY;
      let type = Array.create("byte", 0);
      let id = Array.create("byte", 0);
      let payload = Array.create("byte", 0);
      records[0] = new android.nfc.NdefRecord(tnf, type, id, payload);
      let ndefClass = android.nfc.NdefMessage as any;
      let ndefMessage = new ndefClass(records);
      let errorMessage = this.writeNdefMessage(ndefMessage, tag);
      if (errorMessage === null)
        resolve();
      else
        reject(errorMessage);
    });
  }

  public writeTag(arg: WriteTagOptions): Promise<any> {
    return new Promise((resolve, reject) => {
      try {
        if (!arg) {
          reject("Nothing passed to write");
          return;
        }
        let intent = application.android.foregroundActivity.getIntent();
        if (intent === null || nfcIntentHandler.savedIntent === null) {
          reject("Can not write to tag; didn't receive an intent");
          return;
        }

        let tag = nfcIntentHandler.savedIntent.getParcelableExtra(android.nfc.NfcAdapter.EXTRA_TAG) as android.nfc.Tag;
        let records = this.jsonToNdefRecords(arg);
        let ndefClass = android.nfc.NdefMessage as any;
        let ndefMessage = new ndefClass(records);
        let errorMessage = this.writeNdefMessage(ndefMessage, tag);
        if (errorMessage === null)
          resolve();
        else
          reject(errorMessage);
      } catch (ex) {
        reject(ex);
      }
    });
  }

  private writeNdefMessage(message: android.nfc.NdefMessage, tag: android.nfc.Tag): string {
    let ndef = android.nfc.tech.Ndef.get(tag);
    if (ndef === null) {
      let formatable = android.nfc.tech.NdefFormatable.get(tag);
      if (formatable === null)
        return "Tag doesn't support NDEF";
      formatable.connect();
      formatable.format(message);
      formatable.close();
      return null;
    }

    try {
      ndef.connect();
    } catch (e) {
      console.log("ndef connection error: " + e);
      return "connection failed";
    }

    if (!ndef.isWritable()) {
      return "Tag not writable";
    }

    let size = message.toByteArray().length;
    let maxSize = ndef.getMaxSize();

    if (maxSize < size) {
      return "Message too long; tag capacity is " + maxSize + " bytes, message is " + size + " bytes";
    }

    ndef.writeNdefMessage(message);
    ndef.close();
    return null;
  }

  private jsonToNdefRecords(input: WriteTagOptions): Array<android.nfc.NdefRecord> {
    let nrOfRecords = 0;
    nrOfRecords += input.textRecords ? input.textRecords.length : 0;
    nrOfRecords += input.uriRecords ? input.uriRecords.length : 0;
    let records = new Array.create(android.nfc.NdefRecord, nrOfRecords);
    let recordCounter: number = 0;
    if (input.textRecords !== null) {
      for (let i in input.textRecords) {
        let textRecord = input.textRecords[i];
        let langCode = textRecord.languageCode || "en";
        let encoded = this.stringToBytes(langCode + textRecord.text);
        encoded.unshift(langCode.length);
        let tnf = android.nfc.NdefRecord.TNF_WELL_KNOWN;
        let type = Array.create("byte", 1);
        type[0] = 0x54;
        let id = Array.create("byte", textRecord.id ? textRecord.id.length : 0);
        if (textRecord.id) {
          for (let j = 0; j < textRecord.id.length; j++) {
            id[j] = textRecord.id[j];
          }
        }
        let payload = Array.create("byte", encoded.length);
        for (let n = 0; n < encoded.length; n++) {
          payload[n] = encoded[n];
        }
        let record = new android.nfc.NdefRecord(tnf, type, id, payload);
        records[recordCounter++] = record;
      }
    }
    if (input.uriRecords !== null) {
      for (let i in input.uriRecords) {
        let uriRecord = input.uriRecords[i];
        let uri = uriRecord.uri;
        let prefix;
        NfcUriProtocols.slice(1).forEach(protocol => {
          if ((!prefix || prefix === "urn:") && uri.indexOf(protocol) === 0)
            prefix = protocol;
        });
        if (!prefix)
          prefix = "";
        let encoded = this.stringToBytes(uri.slice(prefix.length));
        encoded.unshift(NfcUriProtocols.indexOf(prefix));
        let tnf = android.nfc.NdefRecord.TNF_WELL_KNOWN;
        let type = Array.create("byte", 1);
        type[0] = 0x55;
        let id = Array.create("byte", uriRecord.id ? uriRecord.id.length : 0);
        if (uriRecord.id) {
          for (let j = 0; j < uriRecord.id.length; j++) {
            id[j] = uriRecord.id[j];
          }
        }
        let payload = Array.create("byte", encoded.length);
        for (let n = 0; n < encoded.length; n++) {
          payload[n] = encoded[n];
        }
        let record = new android.nfc.NdefRecord(tnf, type, id, payload);
        records[recordCounter++] = record;
      }
    }
    return records;
  }

  private stringToBytes(input: string) {
    let bytes = [];
    for (let n = 0; n < input.length; n++) {
      let c = input.charCodeAt(n);
      if (c < 128) {
        bytes[bytes.length] = c;
      } else if ((c > 127) && (c < 2048)) {
        bytes[bytes.length] = (c >> 6) | 192;
        bytes[bytes.length] = (c & 63) | 128;
      } else {
        bytes[bytes.length] = (c >> 12) | 224;
        bytes[bytes.length] = ((c >> 6) & 63) | 128;
        bytes[bytes.length] = (c & 63) | 128;
      }
    }
    return bytes;
  }
}
