export abstract class Utils {
  static byte(input: number) : number;
  static byte(input: number[]): number[];
  static byte(input): any {
    return Array.isArray(input) ? input.map(Utils.byte) : input > 127 ? input - 256 : input;
  }

  static fromByte(input: number): number;
  static fromByte(input: number[] | native.Array<number>): number[];
  static fromByte(input): any {
    if (input.hasOwnProperty('length')) {
      let ret = [];
      for (let i = 0; i < input.length; i++) {
        ret.push(input[i] <= 0 ? input[i] + 256 : input[i]);
      }
      return ret;
    }
    return input <= 0 ? input + 256 : input;
  }

  static toHex(input: number, options?: { prefix?: boolean, digits?: number }): string;
  static toHex(input: number[] | native.Array<number>, options?: { prefix?: boolean, digits?: number, concat?: boolean | string, totalDigits?: number }): string & string[];
  static toHex(input: any,  options: any = {}): any {
    let { prefix = false, digits = null, concat = false, totalDigits = null } = options;

    // single number to hex
    if (!input.hasOwnProperty('length')) {
      let a = input.toString(16).toUpperCase();
      return (prefix ? '0x' : '') + (digits == null ? a : Utils.stringAddChars(a, '0', digits));
    }

    // Array to hex and concat
    if (concat) {
      let ret = '';
      for (let i = 0; i < input.length; i++) {
        ret += Utils.toHex(input[i], { prefix: false, digits: digits }) + (typeof(concat) == 'string' ? concat : '');
      }
      if (typeof(concat) == 'string' && concat.length > 0)
        ret = ret.slice(0, -concat.length);
      return (prefix ? '0x' : '') + (totalDigits == null ? ret : Utils.stringAddChars(ret, '0', totalDigits))
    }

    // Array items to hex
    let ret = [];
    for (let i = 0; i < input.length; i++) {
      ret.push(Utils.toHex(input[i], options));
    }
    return ret;
  }

  static stringAddChars(string: string, char: string, length: number): string {
    let s = char.repeat(length) + string;
    return s.substr(s.length - length);
  }

  static nativeArrayToArray(array: native.Array<any>): any[] {
    if (array == null)
      return null;
    let ret = [];
    for (let i = 0; i < array.length; i++) {
      ret.push(array[i]);
    }
    return ret;
  }

  static arrayToString(array: any[] | native.Array<any>): string {
    if (array == null)
      return null;
    let s = '';
    for (let i = 0; i < array.length; i++) {
      s += array[i];
    }
    return s;
  }

  static byteArrayToInt(byteArray): number {
    let value = 0;
    for (let i = 0; i < byteArray.length; i++) {
      let shift = (byteArray.length - 1 - i) * 8;
      value += (byteArray[i] & 0x000000FF) << shift;
    }
    return value;
  }

  static printArray(array: any[] | native.Array<any>): string {
    if (array == null)
      return null;
    let s = '[ ';
    for (let i = 0; i < array.length; i++) {
      s += array[i] + ', ';
    }
    if (array.length > 0)
      s = s.slice(0, -2);
    return s + ' ] (' + array.length + ')';
  }

  static reverseArray(array: any[]): any[];
  static reverseArray(array: native.Array<any>): native.Array<any>;
  static reverseArray(array): any {
    let copy = Object.assign({}, array);
    for (let i = 0; i < array.length; i++) {
      copy[i] = array[array.length - 1 - i];
    }
    return copy;
  }

  static copyArray(...args) { // src, srcPos, dest, destPos, length) {
    let src, srcPos = 0, dest, destPos = 0, length;
    if (args.length === 2) {
      src = args[0];
      dest = args[1];
      length = src.length;
    } else if (args.length === 3) {
      src = args[0];
      dest = args[1];
      length = args[2];
    } else if (args.length === 5) {
      src = args[0];
      srcPos = args[1];
      dest = args[2];
      destPos = args[3];
      length = args[4];
    }
    for (let i = srcPos, j = destPos; i < length + srcPos; i++, j++) {
      if (dest[j] !== undefined) {
        dest[j] = src[i];
      } else {
        throw 'array index out of bounds exception';
      }
    }
  }
}
