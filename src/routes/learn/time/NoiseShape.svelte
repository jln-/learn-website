<!--
@component
A component that plays back filtered noise, while showing how a curve can be drawn to represent its volume
-->
<script>
	import { onMount } from 'svelte';
	import * as Tone from 'tone';
	import Two from 'two.js';
	import PlayTog from './PlayTog.svelte';

	let container;
	let probe; // a probe to extract LFO values
	let probeReading = new Array(90).fill(0.5); // the value the probe reads
	let two, curve;
	let src, lfo;

	let playing = false;
	let everPlayed = false;

	onMount(async () => {
		two = new Two({
			type: Two.Types.svg,
			autostart: true,
			fitted: true
		}).appendTo(container);

		let points = probeReading.map((v, i) => {
			const x = (i / (probeReading.length - 1)) * two.width; // add equidistant points
			const y = two.height * v;
			return new Two.Anchor(x, y);
		});
		curve = two.makePath(points, false, true);
		curve.linewidth = 5;
		curve.noFill();
		curve.stroke = 'rgb(34, 140, 34)';
		two.add(curve);
		two.fit();

		probe = new Tone.DCMeter(); // extract the value of the lfo
		const gain = new Tone.Multiply(0.25).toDestination();
		const mult = new Tone.Multiply().connect(gain); // a gain node to modify the volume
		lfo = new Tone.LFO(0.3, 0, 1).fan(mult.factor, probe); // an LFO to modulate the sound source
		src = new Tone.Noise('pink').connect(mult); // a sound source
	});

	const play = async () => {
		if (!everPlayed) {
			two.bind('update', () => {
				const val = probe.getValue();
				probeReading.push(val);
				probeReading.shift();
				probeReading.forEach((x, i) => {
					curve.vertices[i].y = (1 - x) * two.height - two.height * 0.5;
				});
			});
			await Tone.start();
		}
		await lfo.start(0.1);
		await src.start(0.1);
		everPlayed = true;
	};

	const stop = async () => {
		await lfo.stop(0.1);
		await src.stop(0.1);
	};
</script>

<PlayTog bind:playing on:play={play} on:stop={stop} />
<div class="container" bind:this={container} />

<style>
	.container {
		height: 200px;
		width: 100%;
	}
</style>
