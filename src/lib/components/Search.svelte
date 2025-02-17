<script>
	import { fuse, blur } from '$lib/app';
	import { wrap } from '$lib/util';
	import { goto } from '$app/navigation';
	import Flair from '$lib/components/Flair.svelte';

	let searchBar;
	let query = '';
	let focused = false;
	let focusedEntry = -1;
	let entries = [];
	$: placeholder = focused ? '' : 'Search';
	$: results = fuse.search(query).slice(0, 8);

	function clickResult(link) {
		query = '';
		goto(link);
	}

	function blurSearch() {
		focused = false;
		$blur = false;
		searchBar.blur();
	}

	function focusSearch(e) {
		searchBar.focus();
		focused = true;
		$blur = true;
	}

	function updateFocus() {
		focusedEntry = wrap(focusedEntry, 0, entries.length);
		entries[focusedEntry].focus();
	}

	function formpress(e) {
		if (e.key === 'Enter') {
			e.preventDefault();
		}
	}

	function keyDown(e) {
		if (e.key === '/' && e.metaKey) {
			focusSearch();
		}
		if (e.key === 'Escape') {
			blurSearch();
		}
		if (focused) {
			if (e.key === 'ArrowUp') {
				e.preventDefault();
				focusedEntry -= 1;
				updateFocus();
			}

			if (e.key === 'ArrowDown') {
				e.preventDefault();
				focusedEntry += 1;
				updateFocus();
			}

			if (e.key === 'Enter') {
				if (focusedEntry !== -1) {
					clickResult(results[focusedEntry].item.url);
					e.preventDefault();
				}
			}
		}
	}
</script>

<svelte:window on:keydown={keyDown} />
<div class="search">
	<form id="search-input" role="search" on:keypress={formpress} on:keydown={formpress}>
		<label class="visually-hidden" for="search-term">Search The Learn Platform</label>
		<input
			class="query"
			{placeholder}
			bind:value={query}
			bind:this={searchBar}
			on:focus={focusSearch}
			on:blur={blurSearch}
			id="search-term"
		/>
	</form>

	{#if results.length >= 1 && focused}
		<div class="results" tabindex="0">
			{#each results as r, i}
				<div
					class="result"
					on:mousedown={() => clickResult(r.item.url)}
					on:mouseleave={() => {
						focusedEntry = -1;
					}}
					on:mouseenter={() => {
						focusedEntry = i;
					}}
					class:entryhover={i === focusedEntry}
					on:click={() => clickResult(r.item.url)}
					on:focus={focusSearch}
					on:blur={blurSearch}
					bind:this={entries[i]}
					role="button"
					tabindex="-1"
				>
					<div class="top">
						<div class="title">{r.item.title}</div>
						{#if r.item.flair}
							<Flair flair={r.item.flair} />
						{/if}
					</div>

					<div class="bottom">
						{r.item.blurb.slice(0, 150) + '...'}
					</div>
				</div>
			{/each}
		</div>
	{/if}
</div>

<style lang="postcss">
	:root {
		--radius: 10px;
		--w: min(90%, 250px);
		--border: 1px solid var(--dark-blue);
		--search-pad: 10px;
	}
	.search {
		width: var(--w);
		position: relative;
		z-index: 999;
	}
	.query {
		font-family: var(--font);
		font-size: 1rem;
		border-radius: var(--radius);
		width: 90%;
		border: 0;
		box-sizing: none;
		border-radius: 10px;
		padding: 0.25em 1em 0.25em 1em;
		border: 2px solid transparent;
		transition: border cubic-bezier(0.075, 0.82, 0.165, 1) 300ms;
	}
	.query:hover {
		border: 2px solid var(--light-blue);
	}
	.results {
		display: flex;
		flex-direction: column;
		position: absolute;
		right: -1em;
		width: min(90vw, 400px);
		padding: 0.25em;
		background: rgb(255, 255, 255, 1);
		border: 1px solid hsl(240, 5%, 50%);
		border-radius: 8px;
		z-index: 0;
		gap: 0.25em;
	}
	.result {
		max-width: 100%;
		padding: 0.5em;
		display: grid;
		grid-template-rows: repeat(2, auto);
		gap: 0.5em;
		text-align: justify;
		display: block;
		outline: 0;
		border-radius: 4px;
	}
	.entryhover {
		background-color: hsl(240, 5%, 80%);
		cursor: pointer;
	}
	.top {
		display: flex;
		flex-direction: row;
		justify-content: space-between;
		gap: 0.5em;
	}
	.title {
		font-weight: bold;
		text-align: left;
	}
	.bottom {
		color: hsl(240, 5%, 30%);
		text-overflow: ellipsis;
		font-size: 0.8rem;
	}
</style>
