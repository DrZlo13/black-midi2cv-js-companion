<script lang="ts">
    import { onMount } from "svelte";
    import { createEventDispatcher } from "svelte";

    export let value = 8.0;
    export let min = -100.0;
    export let max = 100.0;
    export let positions = 3;

    const dispatch = createEventDispatcher();
    export let on_change = (value) => {
        dispatch("change", value);
    };

    let numbers = {
        whole: [],
        fractional: [],
        sign: 1,
    };

    let update_value_numbers = (value) => {
        let ret = {
            whole: [],
            fractional: [],
            sign: 1,
        };

        let whole = Math.abs(Math.floor(value));
        let fractional = Math.abs(
            Math.floor((value - whole) * 10 ** positions)
        );

        ret.whole = [];
        ret.fractional = [];

        for (let i = 0; i < positions; i++) {
            ret.fractional.push(fractional % 10);
            fractional = Math.floor(fractional / 10);
        }
        ret.fractional.reverse();

        while (whole > 0) {
            ret.whole.push(whole % 10);
            whole = Math.floor(whole / 10);
        }
        if (ret.whole.length == 0) {
            ret.whole.push(0);
        }
        ret.whole.reverse();

        ret.sign = Math.sign(value);

        return ret;
    };

    let change_value = (delta, sign) => {
        value += delta * sign;
        if (value < min) {
            value = min;
        } else if (value > max) {
            value = max;
        }
        numbers = update_value_numbers(value);
        on_change(value);
    };

    let get_whole_delta = (i) => {
        return 10 ** (numbers.whole.length - i - 1);
    };

    let get_fractional_delta = (i) => {
        let delta = 10 ** (numbers.fractional.length - i - 1);
        return delta / 10 ** positions;
    };

    onMount(() => {
        numbers = update_value_numbers(value);
    });

    $: numbers = update_value_numbers(value);
</script>

<div class="float-input">
    {#if numbers.sign == -1}
        <div class="number">-</div>
    {/if}
    {#each numbers.whole as number, i}
        <div class="number">
            <span
                class="control clickable"
                on:click={() => change_value(get_whole_delta(i), +1)}
            >
                ▲
            </span>
            <span>{number}</span>
            <span
                class="control clickable"
                on:click={() => change_value(get_whole_delta(i), -1)}
            >
                ▼
            </span>
        </div>
    {/each}
    <div class="number">.</div>
    {#each numbers.fractional as number, i}
        <div class="number">
            <span
                class="control clickable"
                on:click={() => change_value(get_fractional_delta(i), +1)}
            >
                ▲
            </span>
            <span>{number}</span>
            <span
                class="control clickable"
                on:click={() => change_value(get_fractional_delta(i), -1)}
            >
                ▼
            </span>
        </div>
    {/each}
</div>

<style>
    .float-input {
        display: inline-flex;
        flex-direction: row;
        justify-content: center;
        align-items: center;
        font-family: monospace;
        font-size: 1.5em;
        line-height: 1em;
    }

    .number {
        display: flex;
        flex-direction: column;
        justify-content: center;
        align-items: center;
        padding: 0.1em;
    }

    .control {
        font-size: 0.7em;
        -webkit-touch-callout: none;
        -webkit-user-select: none;
        -khtml-user-select: none;
        -moz-user-select: none;
        -ms-user-select: none;
        user-select: none;
    }

    .clickable {
        cursor: pointer;
        color: rgb(255, 102, 0);
    }

    .clickable:hover {
        color: rgb(255, 153, 0);
    }
</style>
