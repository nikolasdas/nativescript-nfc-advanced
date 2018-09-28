export const NfcUriProtocols = ["", "http://www.", "https://www.", "http://", "https://", "tel:", "mailto:", "ftp://anonymous:anonymous@", "ftp://ftp.", "ftps://", "sftp://", "smb://", "nfs://", "ftp://", "dav://", "news:", "telnet://", "imap:", "rtsp://", "urn:", "pop:", "sip:", "sips:", "tftp:", "btspp://", "btl2cap://", "btgoep://", "tcpobex://", "irdaobex://", "file://", "urn:epc:id:", "urn:epc:tag:", "urn:epc:pat:", "urn:epc:raw:", "urn:epc:", "urn:nfc:"];

export interface NdefListenerOptions {
  stopAfterFirstRead?: boolean;
  scanHint?: string;
}

export interface TextRecord {
  text: string;
  languageCode?: string;
  id?: Array<number>;
}

export interface UriRecord {
  uri: string;
  id?: Array<number>;
}

export interface WriteTagOptions {
  textRecords?: Array<TextRecord>;
  uriRecords?: Array<UriRecord>;
}

export interface NfcTagData {
  id: string;
  techList: Array<string>;
  tagType: string;
}

export interface NfcNdefRecord {
  id: Array<number>;
  tnf: number;
  type: number;
  payload: string;
  payloadAsHexString: string;
  payloadAsStringWithPrefix: string;
  payloadAsString: string;
}

export interface NfcNdefData extends NfcTagData {
  message: Array<NfcNdefRecord>;
  type?: string;
  maxSize?: number;
  writable?: boolean;
  canMakeReadOnly?: boolean;
}

export interface OnTagDiscoveredOptions {
  message?: string;
}

export interface NfcApi {
  available(): Promise<boolean>;
  enabled(): Promise<boolean>;
  writeTag(arg: WriteTagOptions): Promise<any>;
  eraseTag(): Promise<any>;
  setOnTagDiscoveredListener(callback: (data: NfcTagData) => void): Promise<any>;
  setOnNdefDiscoveredListener(callback: (data: NfcNdefData) => void, options?: NdefListenerOptions): Promise<any>;
}
