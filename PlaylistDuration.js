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
var idcheckboxShowIndices = 'checkboxShowIndices';

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
				containerToPlace.appendChild(createPlaylistDurElement());
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


function createPlaylistDurElement() {
	console.log('Create PlaylistDuration element');
	let div = document.createElement('div');
	div.classList.add(playlistDur);

	let img = document.createElement('img');
	img.src = imgURL;

	let span = document.createElement('span');
	span.onclick = updatePlaylistDuration;

	let divShowIndices = document.createElement('div');
	divShowIndices.style.marginTop = '10px';

	let checkboxShowIndices = document.createElement('input');
	checkboxShowIndices.type = 'checkbox';
	checkboxShowIndices.id = idcheckboxShowIndices;
	checkboxShowIndices.checked = true;
	checkboxShowIndices.onclick = showIndices;

	let span2 = document.createElement('span');
	span2.innerText = 'Show indices';

	divShowIndices.appendChild(checkboxShowIndices);
	divShowIndices.appendChild(span2);

	div.appendChild(img);
	div.appendChild(span);
	div.appendChild(divShowIndices);
	return div;
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
	let checked = document.getElementById(idcheckboxShowIndices).checked

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
