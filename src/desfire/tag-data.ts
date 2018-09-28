import { NfcTagData } from './../nfc-advanced.common';
import { DesfireProtocol } from './protocol'

export interface DesfireTagData extends NfcTagData {
  protocol: DesfireProtocol;
}
