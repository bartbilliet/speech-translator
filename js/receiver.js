let viewer = document.getElementById('spchtrs-viewer');
let threadContainer = viewer.querySelector('.threads');

function getRandomHash(){
  return Math.random().toString(36).substring(2, 12);
}

function createText(text){
  let t = document.createElement('span');
  t.classList.add('text-bg');
  t.innerHTML = text;
  return t;
}

function setText(id, text){
  let t = document.getElementById(id);
  let wrapper = t.querySelector('.text > span');
  wrapper.innerText = text;
}

function addTextItem(text, subtext){
  let item = document.createElement('div');
  item.classList.add('item');
  item.id = getRandomHash();

  let text_cont = document.createElement('div');
  text_cont.classList.add('text');
  if (text) text_cont.appendChild(createText(text));
  item.appendChild(text_cont);

  let text_cont2 = document.createElement('div');
  text_cont2.classList.add('sub-text');
  if (subtext) text_cont2.appendChild(createText(subtext));
  item.appendChild(text_cont2);

  threadContainer.appendChild(item);

  let $threads = $(threadContainer);
  let counts = $threads.find(".item").length;
  if (counts >= 5){
    threadContainer.removeChild(threadContainer.firstChild);
  }

  return new Promise(function(resolve, reject) {
    resolve({itemId: item.id, text: subtext});
  });
}

async function appendResult(results, sendResponse){
  if (!results || !results.length) return;
  let transcripts = [];
  for (const result of results) {
    let alternatives = result.alternatives || [];
    // console.log('[alternatives]', alternatives);
    for (const alter of alternatives) {
      let text = alter.transcript || '';
      let confidence = alter.confidence || 0.0;
      let confidenceHumanized = Math.round(confidence * 100 * 100) / 100;
      await addTextItem('&#8230;', text)
        .then((item) => {
          transcripts.push(item);
        });
    }
  }
  sendResponse(transcripts);
}

// visualiser setup - create web audio api context and canvas
function visualize(percentage){
  let footerContainer = viewer.querySelector('.footer');
  let bar = footerContainer.querySelector('.volumebar');
  bar.style.width = (percentage * 50) + '%';
}

function hideViewer(){
  $(viewer).fadeOut();
}

function showViewer(){
  $(viewer).fadeIn();
}

(function ping() {
  // Listen for messages
  chrome.runtime.onMessage.addListener(function (msg, sender, sendResponse) {
    if (chrome.runtime.lastError) {
      setTimeout(ping, 100);
      return;
    }

    if (msg.method === 'showViewer') {
      showViewer();
    } else if (msg.method === 'hideViewer') {
      hideViewer();
    } else if (msg.method === 'visualize') {
      visualize(msg.avgDecibel);
    } else if (msg.method === 'recognize') {
      appendResult(msg.results, sendResponse);
    } else if (msg.method === 'translate') {
      setText(msg.itemId, msg.translatedText);
    }
  });
})();

viewer.querySelector('.helper').addEventListener('click', (evt) => {
  evt.preventDefault();

  let cls = 'recording';
  let css = 'gradient-animation-background';
  if (viewer.classList.contains(cls)) {
    chrome.runtime.sendMessage({msg: 'stop'});
    viewer.classList.remove(cls);
    evt.target.classList.remove(css);
  } else {
    chrome.runtime.sendMessage({msg: 'start'});
    viewer.classList.add(cls);
    evt.target.classList.add(css);
  }
  
  return false;
}, false);