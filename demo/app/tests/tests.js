var NfcAdvanced = require("nativescript-nfc-advanced").NfcAdvanced;
var nfcAdvanced = new NfcAdvanced();

describe("greet function", function() {
    it("exists", function() {
        expect(nfcAdvanced.greet).toBeDefined();
    });

    it("returns a string", function() {
        expect(nfcAdvanced.greet()).toEqual("Hello, NS");
    });
});