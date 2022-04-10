/*global chrome*/
var imgURL = chrome.extension.getURL("icon.svg");

// Selectors for Polymer interface
var pSelectors = {
	containerToPlace: '#items > ytd-playlist-sidebar-primary-info-renderer',
	videoTime: 'ytd-thumbnail-overlay-time-status-renderer',
	videoTimeSpan: 'ytd-thumbnail-overlay-time-status-renderer > span',
	playlistConteiner: 'ytd-playlist-video-list-renderer',
	videoConteiner: 'ytd-playlist-video-renderer',
	videoIndex: '#index.ytd-playlist-video-renderer'
}

var playlistDur = 'playlistDur';
var playlistDurText = '.playlistDur span';
var idcbShowIndices = 'cbShowIndices';


checkCreatePlaylistDur()

document.addEventListener("yt-navigate-finish", function(event) {
	// console.log("yt-navigate-finish from PlaylistDuration")
	checkCreatePlaylistDur()
})

function checkCreatePlaylistDur() {
	if (location.pathname == "/playlist") {
		var containerToPlace = document.querySelector(pSelectors.containerToPlace);
		if (!containerToPlace)
			console.log('No container to place PlaylistDuration')
		else {
			let alreadyCreated = document.querySelector(playlistDurText);
			if (!alreadyCreated) {
				createPlaylistDurElement(containerToPlace)
				addObserver();
				console.log('PlaylistDuration calc on create');
			}
			else {
				console.log('PlaylistDuration updated instead of creating');
			}

			updatePlaylistDuration();
		}
	}
}


function createPlaylistDurElement(parent) {
	let html = /*html*/`<div class=${playlistDur}>
		<img src=${imgURL}>
		<span></span>
		<div style="margin-top: 10px;">
			<input type="checkbox" id=${idcbShowIndices} checked">
			<label for=${idcbShowIndices}>Show indices</label>
		</div>
		<button style="margin-top: 10px;">Export playlist</button> 
	</div>`
	parent.insertAdjacentHTML('beforeend', html);
	let createdElement = parent.lastChild;

	createdElement.querySelector('span').onclick = updatePlaylistDuration;

	let cbShowIndices = createdElement.querySelector('input');
	cbShowIndices.onclick = showIndices;
	cbShowIndices.checked = true;

	createdElement.querySelector('button').onclick = exportPlaylist;
}



function addObserver() {
	let playlistConteiner = document.querySelector(pSelectors.playlistConteiner)
	let timerUpdate;

	let observer = new MutationObserver(mutationRecords => {
		// console.log(mutationRecords);

		for (const mutationRecord of mutationRecords) {
			// console.log(mutationRecord.target);
			// if (mutationRecord.removedNodes.length > 0)
			//   console.log(mutationRecord.removedNodes[0].nodeName);

			if (mutationRecord.type == "childList")
			//if time labels were loaded (they are loaded gradually and asynchronously)
				if (mutationRecord.target.matches(pSelectors.videoTime)
				//or removed videos in the playlist
				|| ((mutationRecord.removedNodes.length > 0) &&
					(mutationRecord.removedNodes[0].nodeName == pSelectors.videoConteiner.toUpperCase())))
				{
				// console.log(new Date().toISOString() + ' PlaylistDuration updated on mutation');
					updatePlaylistDuration();

					clearTimeout(timerUpdate);
					timerUpdate = setTimeout(updatePlaylistDurationDelayed, 1000);
				}
		}
	});


	observer.observe(playlistConteiner, {
		childList: true,
		subtree: true,
		characterData: true
	});


	function updatePlaylistDurationDelayed() {
		console.log(new Date().toISOString() + ' PlaylistDuration updated on mutation with delay');
		updatePlaylistDuration();
	}

}

function updatePlaylistDuration(){
	let videosCollection = document.querySelectorAll(pSelectors.playlistConteiner + ' ' + pSelectors.videoTimeSpan);
	let timeSeconds = calcTotalDuration(videosCollection);
	let formattedDurationStr = secondsToTimeStr(timeSeconds);

	document.querySelector(playlistDurText).innerHTML =
		`Duration of ${videosCollection.length}: &nbsp;&nbsp; ${formattedDurationStr}`;

	showIndices();
}


function showIndices(event) {
	let checked = document.getElementById(idcbShowIndices).checked

	let indices = document.querySelectorAll(pSelectors.videoIndex);
	indices.forEach(function(el){
		el.style.display = checked ? 'block' : 'none';
	});
}

function calcTotalDuration(timeList) {
	// let allstr = [].slice.call(timeList).reduce(function(a, el){
	//   return a + el.innerHTML.trim() + ', ';
	// }, '')
	// console.log(videosCollection.length + ': ' + allstr)

	let time = [].slice.call(timeList).reduce(function(sum, el){
		return sum + timeStrToSeconds(el.innerHTML);
	}, 0)

	return time;

	function timeStrToSeconds(str) {
		return str.split(':').reverse().map(function(part, i){
			return [1, 60, 3600][i] * part;
		}).reduce(function(sum, v){
			return sum + v;
		})
	}
}

function secondsToTimeStr(num) {
	let sec = num % 60;
	num = Math.trunc(num / 60);
	let min = num % 60;
	num = Math.trunc(num / 60);
	let hour = num % 24;
	let day = Math.trunc(num / 24);

	let result = '';
	if (day > 0)
		result = result + day + 'd ';
	if ((day > 0) || (hour > 0))
		result = result + hour + 'h ';
	result = result + String(min).padStart(2, '0') + 'm ' +
		String(sec).padStart(2, '0') + 's';

	return result
}

async function exportPlaylist() {
	let videosCollection = document.querySelectorAll(pSelectors.playlistConteiner + ' ' + pSelectors.videoConteiner);

	let tableArr = [];

	[...videosCollection].forEach((el, i) => {
		let videoTitle = el.querySelector("#video-title")
		let videoChannelName = el.querySelector("#channel-name a")

		let videoInfo = {}
		videoInfo.title = videoTitle?.title
		videoInfo.link = videoTitle?.href
		videoInfo.channel = videoChannelName?.textContent
		videoInfo.channel_link = videoChannelName?.href

		tableArr.push(videoInfo)

	})
	// console.table(tableArr);

	let playlistTitleEl = document.querySelector("#title > yt-formatted-string > a") ??
		document.querySelector("#text-displayed")
	let playlistTitle = playlistTitleEl?.textContent;

	let blob = new Blob([JSON.stringify(tableArr, null, '	')], {type: "text/plain"});
	let fileHandle = await window.showSaveFilePicker({suggestedName:`Playlist ${playlistTitle}.json`, types: [{accept: {'text/plain': ['.json']}}]})
	let fileStream = await fileHandle.createWritable();
	await fileStream.write(blob);
	await fileStream.close();
}
