var imgURL = chrome.extension.getURL("icon.svg");

var videosCollection,
    timeSeconds;

// Selectors for old interface
var pSelectorsOld = {
  containerOuter: '#pl-header',
  videoTime : '.timestamp span',
  loadMore  : '.load-more-button',
  load      : 'playlistTime_load'
}

// Selectors for new (Polymer) interface
var pSelectorsPolymer = {
  containerOuter: '#items > ytd-playlist-sidebar-primary-info-renderer',
  videoTime : 'ytd-thumbnail-overlay-time-status-renderer > span',
  loadMore  : '.load-more-button',
  load      : 'playlistTime_load'
}

var playlistTime = 'playlistTime_inner';
var playlistTimeText  = '.playlistTime_inner span';

var parser = new DOMParser();
var newInterface = document.querySelector(pSelectorsPolymer.containerOuter);

var pSelectors;
if (newInterface)
  pSelectors = pSelectorsPolymer
else
  pSelectors = pSelectorsOld;

var container = document.querySelector(pSelectors.containerOuter);  

container.appendChild(createElement());

function createElement(){
  var div = document.createElement('div');
  console.log(pSelectors);
  div.classList.add(playlistTime);
  if (newInterface)  
   div.classList.add('new');

  var img = document.createElement('img');
  img.src = imgURL;

  var span = document.createElement('span');
  span.innerHTML = gelAllPlaylist();
  span.onclick = function (event){
    span.innerHTML = gelAllPlaylist();
  }

  div.appendChild(img);
  div.appendChild(span);
  return div;
}

function gelAllPlaylist(){
  videosCollection = document.querySelectorAll(pSelectors.videoTime);
  timeSeconds = calcTime(videosCollection);
  var moreButton = document.querySelector(pSelectors.loadMore);
  if(moreButton){
    getJSON(moreButton.dataset.uixLoadMoreHref);
    var doc = parser.parseFromString(videosCollection, "text/html")
    timeSeconds += calcTime(doc.querySelectorAll(pSelectors.videoTime));
  } else{
    return convertSeconds(timeSeconds, videosCollection.length);
  }
  return '--:--:--';
}

function getJSON(url) {
  var url = 'https://www.youtube.com'+url;
  var xhr = new XMLHttpRequest();
  xhr.open("get", url, true);
  xhr.responseType = "json";
  xhr.onload = function() {
    var status = xhr.status;
    if (status == 200) {
      var data = xhr.response;
      var doc = parser.parseFromString(data.content_html, "text/html")
      timeSeconds += calcTime(doc.querySelectorAll(pSelectors.videoTime));
      if(data.load_more_widget_html){
        var more = parser.parseFromString(data.load_more_widget_html, "text/html");
        getJSON(more.querySelector(pSelectors.loadMore).dataset.uixLoadMoreHref);
      } else {
        document.querySelector(playlistTimeText).innerHTML = convertSeconds(timeSeconds, videosCollection.length);
      }
    } else {
      document.querySelector(playlistTimeText).innerHTML = '--:--:--';
    }
  };
  xhr.send(timeSeconds);
};

function calcTime(timeList){
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

  let result = 'Length of ' + countOfVideos + ': &nbsp;&nbsp;';
  if (day > 0) 
    result = result + day + 'd ';
  if ((day > 0) || (hour > 0))
    result = result + hour + 'h ';
  result = result + String(min).padStart(2, '0') + 'm ' +
    String(sec).padStart(2, '0') + 's';

  return result
}
