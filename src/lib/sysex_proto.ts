import type { Output } from "webmidi";

export const DEVICE_NAME = "STM32 USB Midi Port 1";
const manufacturer_id = [0x00, 0x21, 0x73];

export enum SysExCommand {
    Get = 0x0000,
    Set = 0x0001,
    Ack = 0x0002,
    Nack = 0x0003,
    Save = 0x0004,
    Reset = 0x0005,
};

export enum SysExParameter {
    None = 0x0000,
    VersionString = 0x0001,
    Ch1MaxVoltage = 0x0002,
    Ch2MaxVoltage = 0x0003,
};

let log = (dir: string, command: SysExCommand, parameter: SysExParameter, value: Uint8Array) => {
    let hexes = [];
    for (let i = 0; i < value.length; i++) {
        hexes.push((value[i]).toString(16).toUpperCase());
    }

    if (value.length === 0) {
        console.log(`${dir} ${SysExCommand[command]}: ${SysExParameter[parameter]}`);
    } else {
        console.log(`${dir} ${SysExCommand[command]}: ${SysExParameter[parameter]}, [${hexes}]`);
    }
};

export class Reply {
    command: SysExCommand
    parameter: SysExParameter
    value: Uint8Array

    constructor(command: SysExCommand, parameter: SysExParameter, value: Uint8Array) {
        this.command = command;
        this.parameter = parameter;
        this.value = value;

        log('<-', command, parameter, value);
    }

    value_to_string = (): string => {
        return String.fromCharCode(...this.value);
    }

    value_to_float = (): number => {
        let value_buffer = new ArrayBuffer(4);
        let value_view = new DataView(value_buffer);
        for (let i = 0; i < this.value.length; i++) {
            value_view.setUint8(i, this.value[i]);
        }
        return value_view.getFloat32(0, true);
    }

    is(command: SysExCommand, parameter: SysExParameter): boolean {
        return this.command === command && this.parameter === parameter;
    }
}

export class SysExProtocol {
    send_raw = (out: Output, data: number[]) => {
        out.sendSysex(manufacturer_id, data);
    };

    send = (out: Output, command: SysExCommand, parameter: SysExParameter, value: number[] = []) => {
        let uint8_value = new Uint8Array(value);
        log('->', command, parameter, uint8_value);

        let data = new Uint8Array(4 + value.length * 2);
        data[0] = command >> 8;
        data[1] = command & 0xff;
        data[2] = parameter >> 8;
        data[3] = parameter & 0xff;

        for (let i = 0; i < value.length; i++) {
            data[4 + i * 2 + 1] = value[i] >> 4;
            data[4 + i * 2 + 0] = value[i] & 0x0f;
        }

        // convert to number array
        let out_data = new Array<number>();
        for (let i = 0; i < data.length; i++) {
            out_data.push(data[i]);
        }

        this.send_raw(out, out_data);
    };

    send_float = (out: Output, command: SysExCommand, parameter: SysExParameter, value: number) => {
        let value_buffer = new ArrayBuffer(4);
        let value_view = new DataView(value_buffer);
        value_view.setFloat32(0, value, true);

        let data = new Array(4);
        for (let i = 0; i < data.length; i++) {
            data[i] = value_view.getUint8(i);
        }

        this.send(out, command, parameter, data);
    };

    process = (data: number[]): Reply => {
        // if data is start with 0xF0 and end with 0xF7, remove them
        if (data[0] === 0xf0 && data[data.length - 1] === 0xf7) {
            data = data.slice(1, -1);
        }

        // if data is start with manufacturer_id, remove them
        if (data[0] === manufacturer_id[0] && data[1] === manufacturer_id[1] && data[2] === manufacturer_id[2]) {
            data = data.slice(3);
        }

        // get command and parameter
        let command: SysExCommand = data[0] << 8 | data[1];
        let parameter: SysExParameter = data[2] << 8 | data[3];
        data = data.slice(4);

        // get value
        let value = new Uint8Array(data.length / 2);
        for (let i = 0; i < data.length; i = i + 2) {
            value[i / 2] = data[i] << 4 | data[i + 1] & 0x0f;
        }
        return new Reply(command, parameter, value);
    };
}