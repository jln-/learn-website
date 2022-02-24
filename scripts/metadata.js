import glob from 'glob';
import path from 'path';
import fs from 'fs';
import GithubSlugger from 'github-slugger';
import frontmatter from 'front-matter';
import { extractGit } from './git.js';
import { urlFromRoute } from './util.js';
import { markdown } from 'markdown';

const slugger = new GithubSlugger();

let info = {};
let structure = {};
let tags = {};
let crumbs = {};
let edits = {};
let featured = {
	'reference' : {},
	'learn' : {},
	'explore' : {}
};

glob('src/**/*.svx', (err, routes) => {
	routes = routes.filter((p) => path.basename(p) !== 'index.svx');
	edits = extractGit(routes);

	routes.forEach((route) => {
		let section = route.split('/')[2];

		let url = urlFromRoute(route);

		// Read the page in as a string
		let data = fs.readFileSync(route, 'utf8');

		// Parse the markdown tree for the headings
		let tree = markdown.parse(data);
		if (!Object.keys(structure).includes(url)) {
			structure[url] = [];
		}

		tree.forEach((el) => {
			
			if (el[0] === 'header' && el[1].level === 2) {
				const rawText = el.slice(2);

				const text = rawText
					.flat()
					.filter(x => !x.includes('em'))
					.join('')

				slugger.reset();
				let hashPart = slugger.slug(text);
				
				structure[url].push({
					url: `${url}#${hashPart}`,
					text: el[2]
				});
			}
		});

		// Get frontmatter
		let fm = frontmatter(data).attributes;

		if (!Object.keys(info).includes(section)) {
			info[section] = [];
		}
		// Structure
		info[section].push({
			url: url,
			data: fm
		});

		// Tags
		if (Object.keys(fm).includes('tags')) {
			fm.tags.forEach((tag) => {
				if (!Object.keys(tags).includes(tag)) {
					tags[tag] = [];
				}
				tags[tag].push(url);
			});
		}

		// Crumbs
		if (fm.crumb) {
			crumbs[url] = fm.crumb;
		} else {
			switch (section) {
				case 'reference':
					crumbs[url] = fm.title;
					break;
				case 'explore':
					crumbs[url] = fm.artist;
					break;
				case 'guides':
					crumbs[url] = fm.short;
					break;
				case 'learn':
					crumbs[url] = fm.title;
					break;
				case 'installation':
					crumbs[url] = fm.title;
					break;
			}
		}

		// Featured
		if(Object.keys(featured).includes(section)){
			// Set default stuff here:
			var entry = {
				'title' : 'Untitled',
				'Blurb' : '',
				'flair' : 'article',
				'featuredimage' : '', // Expected to be a file path from static, 
										// if none provided, random chosen (if there are images on the page).
										// perhaps inset a default image here?
				'all_images' : [],
				'all_video' : [],
				'all_youtube' : [],
				'all_vimeo' : []
			};
			
			if (Object.keys(fm).includes('title')){entry['title'] = fm.title;}
			if (Object.keys(fm).includes('blurb')){entry['blurb'] = fm.blurb;};
			if (Object.keys(fm).includes('flair')){entry['flair'] = fm.flair;};
			
			var component_dict = get_components(frontmatter(data).body, ['Image', 'Video', 'YouTube', 'Vimeo']);
			
			// These wouldn't necessarily have to be spilled to arrays
			entry['all_images'] = spill_to_array(component_dict.Image, 'src');
			entry['all_video'] = spill_to_array(component_dict.Video, 'url');
			entry['all_youtube'] = spill_to_array(component_dict.YouTube, 'url');
			entry['all_vimeo'] = spill_to_array(component_dict.Vimeo, 'src');
			
			if (Object.keys(fm).includes('featuredimage')){
				entry['featuredimage'] = fm.featuredimage;
			}else{
				if(component_dict.Image.length != 0){
					entry['featuredimage'] = component_dict.Image[Math.floor(Math.random() * component_dict.Image.length)].src;
				};
			};
			// This could be done for videos too if needed.

			featured[section][url] = entry;
		};
		
	});

	// Write out results
	fs.writeFile('static/tag.json', JSON.stringify(tags, null, 2), 'utf8', () => {});
	fs.writeFile('static/info.json', JSON.stringify(info, null, 2), 'utf8', () => {});
	fs.writeFile('static/structure.json', JSON.stringify(structure, null, 2), 'utf8', () => {});
	fs.writeFile('static/crumbs.json', JSON.stringify(crumbs, null, 2), 'utf8', () => {});
	fs.writeFile('static/edits.json', JSON.stringify(edits, null, 2), 'utf8', () => {});
	fs.writeFile('static/featured.json', JSON.stringify(featured, null, 2), 'utf8', () => {});
});

function spill_to_array(list_of_dicts, desired_key){
	var return_array = [];

	for(var i = 0; i < list_of_dicts.length; i++){
		return_array.push(list_of_dicts[i][desired_key]);
	};

	return return_array;
};

function get_components(markdown_string, to_include){

	// The best way of doing this would be to parse the markdown string as html, but that would
	// mean integrating a DOMParser through node or npm and whatnot...
	// so in the meantime....
	// I believe that this is also why youtube is returning null values - cause of '=' in values perhaps...

	let return_dict = {};
	for(var i = 0; i < to_include.length; i++){
		return_dict[to_include[i]] = [];
	};

	var initial_break = markdown_string.split('<');
	
	for(i = 0; i < initial_break.length; i++){
		// Going through each line component
		for(var j = 0; j < to_include.length; j++){
			// And each type of component we want to match:
			var length_to_match = to_include[j].length;

			if(initial_break[i].substring(0, length_to_match) == to_include[j]){
				// If this component is what we want to match:
				// Prepare an entry that will be added to the array:
				var entry_to_add = {};
				
				var second_break = initial_break[i].split('/>')[0].split('\n');
				second_break.shift();
				for(var k = 0; k < second_break.length; k++){
					if(second_break[k].includes('=')){
						var atr_name = second_break[k].split('=')[0].replace(' ', '');
						var atr_content = second_break[k].split('"')[1];
						
						entry_to_add[atr_name] = atr_content;
					};

				};
				// Add the entry to the array:
				return_dict[to_include[j]].push(entry_to_add);
			};
		};
	};

	return return_dict;
};