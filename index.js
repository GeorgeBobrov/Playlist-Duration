var imgURL = chrome.extension.getURL("icon.svg");

var videosCollection,
    timeSeconds;

// Selectors for old interface
var pSelectorsOld = {
  containerToPlace: '#pl-header',
  videoTime : 'tbody#pl-load-more-destination',
  videoTimeSpan: '.timestamp > span',  
  playlistConteiner: '#browse-items-primary',
  videoConteiner: 'TR'
}

// Selectors for new (Polymer) interface
var pSelectorsPolymer = {
  containerToPlace: '#items > ytd-playlist-sidebar-primary-info-renderer',
  videoTime : 'ytd-thumbnail-overlay-time-status-renderer',
  videoTimeSpan: 'ytd-thumbnail-overlay-time-status-renderer > span',
  playlistConteiner: 'ytd-playlist-video-list-renderer',
  videoConteiner: 'ytd-playlist-video-renderer'
}

var playlistDur = 'playlistDur';
var playlistDurText  = '.playlistDur span';

var parser = new DOMParser();
var newInterface = document.querySelector(pSelectorsPolymer.containerToPlace);

var pSelectors;
if (newInterface)
  pSelectors = pSelectorsPolymer
else
  pSelectors = pSelectorsOld;

var containerToPlace = document.querySelector(pSelectors.containerToPlace);  
containerToPlace.appendChild(createPlaylistDurElement());


var playlistConteiner = document.querySelector(pSelectors.playlistConteiner)

let observer = new MutationObserver(mutationRecords => {
  // console.log(mutationRecords);

  for (const mutationRecord of mutationRecords) {
    // console.log(mutationRecord.target);
    // if (mutationRecord.removedNodes.length > 0)
    //   console.log(mutationRecord.removedNodes[0].nodeName);

    if (mutationRecord.type == "childList")
    if (mutationRecord.target.matches(pSelectors.videoTime) 
    ||
      (
        (mutationRecord.removedNodes.length > 0) && 
        (mutationRecord.removedNodes[0].nodeName == pSelectors.videoConteiner.toUpperCase()))
      )
        document.querySelector(playlistDurText).innerHTML = getPlaylistDuration();
  }
});

observer.observe(playlistConteiner, {
  childList: true, 
  subtree: true,
  characterData: true
});  

// let observer2 = new MutationObserver(mutationRecords => {
//   console.log(mutationRecords);
//   // if (! document.querySelector(playlistDurText)) 
//   //   containerToPlace.appendChild(createPlaylistDurElement());
// });

// observer2.observe(containerToPlace, {
//   childList: true, 
//   subtree: true, 
// });  

function createPlaylistDurElement(){
  var div = document.createElement('div');
  console.log(pSelectors);
  div.classList.add(playlistDur);
  if (newInterface)  
   div.classList.add('polymer');

  var img = document.createElement('img');
  img.src = imgURL;

  var span = document.createElement('span');
  span.innerHTML = getPlaylistDuration();
  span.onclick = function (event){
    span.innerHTML = getPlaylistDuration();
  }

  div.appendChild(img);
  div.appendChild(span);
  return div;
}



function getPlaylistDuration(){
  videosCollection = document.querySelectorAll(pSelectors.videoTimeSpan);
  timeSeconds = calcTotalDuration(videosCollection);
  return convertSeconds(timeSeconds, videosCollection.length);
}


function calcTotalDuration(timeList){
  var time = [].slice.call(timeList).reduce(function(a, el){
    return a + el.innerHTML.split(':').reverse().map(function(a,i){
      return [1,60,3600][i]*a;
    }).reduce(function(a,b){
      return a+b;
    });
  }, 0)

  return time;
}

function convertSeconds(num, countOfVideos){
  let sec = num % 60;
  num = Math.trunc(num / 60);
  let min = num % 60;
  num = Math.trunc(num / 60);
  let hour = num % 24;
  let day = Math.trunc(num / 24); 

  let result = 'Duration of ' + countOfVideos + ': &nbsp;&nbsp;';
  if (day > 0) 
    result = result + day + 'd ';
  if ((day > 0) || (hour > 0))
    result = result + hour + 'h ';
  result = result + String(min).padStart(2, '0') + 'm ' +
    String(sec).padStart(2, '0') + 's';

  return result
}
