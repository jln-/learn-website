<script>
	import YouTube from 'svelte-youtube';
	export let url = '';
	let instance;

	export let chapters = [];

	function chapterClick(chapter) {
		instance.seekTo(convertTime(chapter));
	}

	function convertTime(entry) {
		if (entry.start.length == 2) {
			return entry.start[0] * 60 + entry.start[1];
		} else {
			return entry.start[0] * 60 * 60 + entry.start[1] * 60 + entry.start[2];
		}
	}
</script>

<div class="container">
	<YouTube videoId={url} on:ready={e => (instance = e.detail.target)} />
</div>

<div class="chapter-container">
	{#each chapters as chapter, i}
		<div class="chapter" on:click={() => chapterClick(chapter)}>
			{#if chapter.start.length == 2}
				<p>{chapter.label} ({chapter.start[0]}:{chapter.start[1]})</p>
			{:else}
				<p>{chapter.label} ({chapter.start[0]}:{chapter.start[1]}:{chapter.start[2]})</p>
			{/if}
		</div>
	{/each}
</div>

<style>
	.container {
		padding-top: 1em;
		padding-bottom: 1em;
		max-width: 100%;
		margin: 0 auto;
		display: block;
	}

	.chapter {
		padding: 0.25em;
		text-decoration: none;
		border-radius: 0.25rem;
		cursor: pointer;
		border: 2px solid;
		border-color: grey;
	}

	.chapter > p {
		margin: 0px;
		-webkit-touch-callout: none;
		-webkit-user-select: none;
		-khtml-user-select: none;
		-moz-user-select: none;
		-ms-user-select: none;
		user-select: none;
	}
	.chapter:hover {
		background-color: grey;
		color: white;
	}

	.chapter:active {
		background-color: rgb(96, 96, 96);
		color: white;
	}

	.chapter-container {
		font-size: 0.8rem;
		display: flex;
		flex-direction: row;
		flex-wrap: wrap;
		gap: 1em;
		margin-bottom: 1.5em;
	}
</style>
