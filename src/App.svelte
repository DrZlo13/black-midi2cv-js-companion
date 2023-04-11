<script lang="ts">
    import { WebMidi, Input, Output } from "webmidi";
    import { onMount } from "svelte";
    import {
        DEVICE_NAME,
        SysExProtocol,
        SysExCommand,
        SysExParameter,
    } from "./lib/sysex_proto.js";

    // clear the console on each reload
    console.clear();

    let input: Input | null = null;
    let output: Output | null = null;
    let sysex_protocol = new SysExProtocol();
    let version_string = "unknown";
    let ch1_max_voltage = 0.0;
    let ch2_max_voltage = 0.0;

    let add_explicit_listener = (obj, event, callback) => {
        obj.removeListener(event);
        obj.addListener(event, callback);
    };

    let on_sysex = (e) => {
        // console.log(e);
        // console.log(
        //     "Raw sysex data: " + e.data.map((n) => n.toString(16)).join(" ")
        // );
        // console.log("Raw sysex data size: " + e.data.length);

        let reply = sysex_protocol.process(e.data);

        if (reply.is(SysExCommand.Get, SysExParameter.VersionString)) {
            version_string = reply.value_to_string();
        } else if (reply.is(SysExCommand.Get, SysExParameter.Ch1MaxVoltage)) {
            ch1_max_voltage = reply.value_to_float();
        } else if (reply.is(SysExCommand.Get, SysExParameter.Ch2MaxVoltage)) {
            ch2_max_voltage = reply.value_to_float();
        }
    };

    let on_enabled = () => {
        console.log("WebMidi enabled:", WebMidi.enabled);
        console.log("Inputs:", WebMidi.inputs);
        console.log("Outputs:", WebMidi.outputs);

        let check_device = () => {
            let output_device = WebMidi.getOutputByName(DEVICE_NAME);
            if (output_device) {
                output = output_device;
                console.log("Сonnected output:", output.name);
                sysex_protocol.send(
                    output,
                    SysExCommand.Get,
                    SysExParameter.VersionString
                );
                sysex_protocol.send(
                    output,
                    SysExCommand.Get,
                    SysExParameter.Ch1MaxVoltage
                );
                sysex_protocol.send(
                    output,
                    SysExCommand.Get,
                    SysExParameter.Ch2MaxVoltage
                );
            } else if (output != null) {
                console.log("Disonnected output:", output.name);
                output = null;
            }

            let input_device = WebMidi.getInputByName(DEVICE_NAME);
            if (input_device) {
                input = input_device;
                console.log("Connected input:", input.name);
                add_explicit_listener(input, "sysex", on_sysex);
            } else if (input != null) {
                console.log("Disonnected input:", input.name);
                input = null;
            }
        };

        add_explicit_listener(WebMidi, "connected", check_device);
        add_explicit_listener(WebMidi, "disconnected", check_device);

        check_device();
    };

    onMount(() => {
        WebMidi.enable({ sysex: true })
            .then(() => on_enabled())
            .catch((err) => console.error(err));
    });

    let notes_array = ["C1", "C2", "C3", "C4", "C5", "C6", "C7", "C8"];

    let start_note = (note) => {
        if (output) {
            output.playNote(note, { channels: 1 });
        }
    };

    let stop_note = (note) => {
        if (output) {
            output.stopNote(note, { channels: 1 });
        }
    };

    let ch1_max_voltage_change = (e) => {
        if (output) {
            sysex_protocol.send_float(
                output,
                SysExCommand.Set,
                SysExParameter.Ch1MaxVoltage,
                e.target.value
            );
        }
    };
</script>

<main>
    <h1>WebMidi</h1>
    <div>Ver: {version_string.replaceAll("|", " ")}</div>
    <div>
        Ch1 max voltage: <input
            type="number"
            value={ch1_max_voltage}
            on:change={ch1_max_voltage_change}
        />
    </div>
    <div>Ch2 max voltage: <input type="number" value={ch2_max_voltage} /></div>
    <div>
        {#each notes_array as note}
            <button
                on:mousedown={() => start_note(note)}
                on:mouseup={() => stop_note(note)}
            >
                {note}
            </button>
        {/each}
    </div>
</main>

<style>
</style>
