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

var newInterface = document.querySelector(pSelectorsPolymer.containerToPlace);
var pSelectors;
if (newInterface)
  pSelectors = pSelectorsPolymer
else
  pSelectors = pSelectorsOld;


var containerToPlace = document.querySelector(pSelectors.containerToPlace); 
if (! containerToPlace) 
  console.log('No container to place PlaylistDuration')
else { 
  var alreadyCreated = document.querySelector(playlistDurText);
  if (! alreadyCreated) {
    containerToPlace.appendChild(createPlaylistDurElement())
    addObserver();
  }
  else {
    console.log('PlaylistDuration updated instead of creating');
    document.querySelector(playlistDurText).innerHTML = getPlaylistDuration();
  }  
}



function createPlaylistDurElement(){
  console.log('Create PlaylistDuration element');   
  var div = document.createElement('div');
  div.classList.add(playlistDur);
  if (newInterface)  
   div.classList.add('polymer');

  var img = document.createElement('img');
  img.src = imgURL;

  var span = document.createElement('span');

  console.log('PlaylistDuration calc on create');
  span.innerHTML = getPlaylistDuration();

  span.onclick = function (event){
    span.innerHTML = getPlaylistDuration();
  }

  var divShowIndeces = document.createElement('div');
  divShowIndeces.style.marginTop = '10px';

  var checkboxShowIndeces = document.createElement('input');
  checkboxShowIndeces.type = 'checkbox';  
  checkboxShowIndeces.id = 'checkboxShowIndeces';
  checkboxShowIndeces.onclick = showIndeces;

  var span2 = document.createElement('span');
  span2.innerText = 'Show indeces';

  divShowIndeces.appendChild(checkboxShowIndeces);
  divShowIndeces.appendChild(span2);

  div.appendChild(img);
  div.appendChild(span);
  div.appendChild(divShowIndeces);
  return div;
}
   


function addObserver(){
  let playlistConteiner = document.querySelector(pSelectors.playlistConteiner)
  let timerUpdate;

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
        {
          console.log(Date.now() + ' PlaylistDuration updated on mutation');
          document.querySelector(playlistDurText).innerHTML = getPlaylistDuration();

          
          clearTimeout(timerUpdate);
          timerUpdate = setTimeout(updatePlaylistDuration, 1000);
        }
    }
  });


  observer.observe(playlistConteiner, {
    childList: true, 
    subtree: true,
    characterData: true
  });  


  function updatePlaylistDuration() {
    console.log(Date.now() + ' PlaylistDuration updated on mutation with delay');
    document.querySelector(playlistDurText).innerHTML = getPlaylistDuration();
  }
  
  // let observer2 = new MutationObserver(mutationRecords => {
  //   console.log(mutationRecords);
  //   // if (! document.querySelector(playlistDurText)) 
  //   //   containerToPlace.appendChild(createPlaylistDurElement());
  // });

  // observer2.observe(containerToPlace, {
  //   childList: true, 
  //   subtree: true, 
  // });  
}


function getPlaylistDuration(){
  videosCollection = document.querySelectorAll(pSelectors.playlistConteiner + ' ' + pSelectors.videoTimeSpan);
  timeSeconds = calcTotalDuration(videosCollection);
  return convertSeconds(timeSeconds, videosCollection.length);
}

function showIndeces(event) {
  let checked = event.target.checked

  let indeces = document.querySelectorAll('#index.ytd-playlist-video-renderer');
  indeces.forEach(function(el){
    el.style.display = checked ? 'unset' : 'none';
  });
}

function calcTotalDuration(timeList){
  // var allstr = [].slice.call(timeList).reduce(function(a, el){
  //   return a + el.innerHTML.trim() + ', ';
  // }, '')
  // console.log(videosCollection.length + ': ' + allstr)

  var time = [].slice.call(timeList).reduce(function(a, el){
    return a + convertToSeconds(el.innerHTML);
  }, 0)

  return time;

  function convertToSeconds(str) {
    return str.split(':').reverse().map(function(a,i){
      return [1,60,3600][i]*a;
    }).reduce(function(a,b){
      return a+b;
    })
  }
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
