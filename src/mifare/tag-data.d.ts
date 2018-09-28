import { NfcTagData } from './../nfc-advanced.common';
export interface MifareClassicTagData extends NfcTagData {
    blockCount: number;
    sectorCount: number;
    size: number;
}
export interface MifareUltralightTagData extends NfcTagData {
}
