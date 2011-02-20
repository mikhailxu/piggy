var golf = {
  inHole: false,
  holes: null,
// array of par scores for all holes -- entry zero is a dummy so
//  we can be 1-based
  pars: [ 0, 2, 2, 2, 3, 2, 2, 2, 3, 3, 2, 2, 3, 2, 3, 2, 2, 3, 2 ],
  engine: {   // Define engine interface
    setHole: null,
    endHole: null,
    startTurn: null,
    endTurn: null,
    swingClub: null
  },
  parms: {
    hitSpeedC: 5.0,
    fric1C: 0.997,
    fric2C: 0.989,
    fric3C: 0.949,
    arrowDivide: 40
  }
    
};

var hybridEngine = {
    callNative: null,
    setHole:  function(holeNum)
    {
      golf.engine.callNative('golf://localhost/sethole?holenum=' + holeNum);
    },
    endHole:  function(holeNum)
    {
      golf.engine.callNative('golf://localhost/endhole');
    },
    startTurn:  function()
    {
      golf.engine.callNative('golf://localhost/startturn');
    },
    endTurn:  function()
    {
      golf.engine.callNative('golf://localhost/endturn');
    },
    swingClub: 	function(ball, clubspeed, clubdir)
    {
      ball.hide();
      golf.engine.callNative('golf://localhost/swingclub?bc=' + ballColorMap[ball.colorCode] +
										'&bx=' + ball.getCenterXFloat() + 
                                        '&by=' +  ball.getCenterYFloat() +
                                        '&speed=' + clubspeed +
                                        '&dir=' + clubdir);
    },
    setEngineParms: function(fric1, fric2, fric3)
    {
      golf.engine.callNative('golf://localhost/setEngineParms?fric1=' + fric1 +
                              '&fric2=' + fric2 +
                              '&fric3=' + fric3);
    }
}

function Ball(domElem)
{
  this.elem = domElem;
  this.club = document.getElementById('club');
  this.arrow = document.getElementById('arrow');
  this.arrowshaft = document.getElementById('arrowshaft');
  this.ballTouchRing = document.getElementById('ball-touch-ring');
  this.waterdrop = document.getElementById('drop');
  this.dropOffsetLeft = (this.elem.width - this.waterdrop.width)/2;
  this.dropOffsetTop = (this.elem.height - this.waterdrop.height)/2;
  this.colorCode = 'w';
  this.center = { x:100, y:100 };
}
Ball.CenterOffsetX = 9;
Ball.CenterOffsetY = 6;
Ball.touchRingCenterOffset = 25;

Ball.prototype.getCenterX = function() { return Math.round(this.center.x) };
Ball.prototype.getCenterY = function() { return Math.round(this.center.y) };
Ball.prototype.getCenterXFloat = function() { return this.center.x };
Ball.prototype.getCenterYFloat = function() { return this.center.y };
Ball.prototype.show = function() { this.elem.className = ''; }
Ball.prototype.hide = function() { this.elem.className = 'hide-ball'; }
Ball.prototype.inPipe = function()  { this.elem.className = 'in-pipe'; }
Ball.prototype.showWithRing = function() { this.show(); this.ballTouchRing.style.visibility  = 'visible'; }
Ball.prototype.hideTouchRing = function() {   this.ballTouchRing.style.visibility = 'hidden'; }
Ball.prototype.position = function(x,y) {
  this.center.x = x;
  this.center.y = y;
  var posXInt = Math.round(x);
  var posYInt = Math.round(y);
  this.elem.style.left =  (posXInt - Ball.CenterOffsetX) + "px";
  this.elem.style.top  = (posYInt - Ball.CenterOffsetY) + "px";
}
Ball.prototype.positionAccessories = function() {
  var top = this.elem.offsetTop;
  var left = this.elem.offsetLeft;
  this.ballTouchRing.style.left = (left  + Ball.CenterOffsetX - Ball.touchRingCenterOffset) + "px";
  this.ballTouchRing.style.top = (top  + Ball.CenterOffsetY - Ball.touchRingCenterOffset) + "px";
  this.club.style.top  =  (top - 7) + "px";
  this.club.style.left =  (left + 7) + "px";
  this.arrow.style.top  =  (top + 1) + "px";
  this.arrow.style.left =  (left + 7) + "px";
  this.arrowshaft.style.top  =  (top + 1) + "px";
  this.arrowshaft.style.left =  (left + 7) + "px";
};
Ball.prototype.showClub = function() {
  addClass(this.club,'showclub');
  addClass(this.arrow, 'showarrow');
  addClass(this.arrowshaft, 'showarrowshaft');
};
Ball.prototype.hideClub = function() {
  removeClass(this.club,'showclub');
  removeClass(this.arrow, 'showarrow');
  removeClass(this.arrowshaft, 'showarrowshaft');
};
Ball.prototype.setColor = function(colorCode) {
	this.colorCode = colorCode;
  this.elem.src = 'images/ball-' + ballColorMap[colorCode] + '.png';
  document.getElementById('mag-ball').src = this.elem.src;
};
Ball.prototype.splash = function()
{
 this.waterdrop.style.left =  (this.elem.offsetLeft  + this.dropOffsetLeft) + "px";
 this.waterdrop.style.top  = (this.elem.offsetTop + this.dropOffsetTop) + "px";
 this.waterdrop.src = 'images/waterdrop.gif';
 this.waterdrop.style.visibility = 'visible';
// drop.style.display = 'block';
};
Ball.prototype.splashEnd = function()
{
 this.waterdrop.src = 'images/drop7.gif';
};
Ball.prototype.splashHide = function()
{
 this.waterdrop.style.visibility = 'hidden';
};


(function() {
var holes = [];
holes[0] = {};
function Hole(num, par)
{
  this.num = num;
  this.domID = 'hole' + ((num < 10) ? '0' + num.toString() : num.toString());
  this.domElem = null;
  this.par = par;
  this.center = null;
  this.start = null;
}
for (var i=1; i<19 ; i++)
{
  holes[i]= new Hole(i, golf.pars[i]);
}
golf.holes = holes;

var players = [];

var debug = false;
var placeCount = 0;
var stopScroll = false;
var canSwing = false;
var inMouseSwing = false;
var inBallPos = false;
var maxoff = 60;
var clubspeed = 0;  // px per sec
var clubdir;
var ball;
var firstHoleNum; // 1-based 
var curHoleNum; // 1-based 
var curStrokeNum = 0;
var maxStrokes = 7;
var curPlayer;  // ref to current player obj
var hybrid = false;
var version= '0.0';
var hasTouch = (typeof Touch == "object");
var doSlide = browserSupportsSlideAnimation();
var hitSpeedC = 2.0;
 
function updateScorePanel()
{
//  log("updateScorePanelWork(): player = " + curPlayer.name + " hole = " + curHoleNum + " par = " + holes[curHoleNum].par + " stroke = " + curStrokeNum);
  var el = document.getElementById('dd-name');
  if (el && curPlayer)
  {
    el.innerText = curPlayer.name;
  }
  el = document.getElementById('dd-hole');
  if (el)
  {
    el.innerText = curHoleNum;
  }
  el = document.getElementById('dd-par');
  if (el)
  {
    el.innerText = holes[curHoleNum].par;
  }
  el = document.getElementById('dd-stroke');
  if (el)
  {
    el.innerText = curStrokeNum;
  }
}
 

function starterTouchStart(event) {
  event.preventDefault();
  var touch = event.touches[0];
  positionStart(touch.pageX, touch.pageY);
  setTimeout(showBall,  120);
  showMagnifier();
  inBallPos = true;
}

function starterTouchMove(event) {
  event.preventDefault();
  if (inBallPos)
  {
    var touch = event.touches[0];
    positionStart(touch.pageX, touch.pageY);
  }
}

function starterTouchEnd(event) {
  event.preventDefault();
  hideMagnifier();
 if (inBallPos)
 {
	endBallPlace();
	inBallPos = false;
 }
}

function starterMouseDown(event) {
  event.stopPropagation();
  event.preventDefault();
  positionStart(event.clientX, event.clientY);
  inBallPos = true;
  ball.show();
  showMagnifier();
}

function ballTouchStart(event) {
  event.preventDefault();
  if (canSwing == true)
  {
    inMouseSwing = true;
    ball.showClub();
    var touch = event.touches[0];
    positionClub(touch.pageX, touch.pageY);
  }
}
function docMouseDown(event) {
//  event.stopPropagation();
//  event.preventDefault();
}

function docClick(event) {
}

function ballMouseDown(event) {
  event.stopPropagation();
  event.preventDefault();
  if (canSwing == true)
  {
    inMouseSwing = true;
    positionClub(event.clientX, event.clientY);
    ball.showClub();
  }
}
function ballTouchMove(event) {
  if (inMouseSwing)
  {
    var touch = event.touches[0];
    positionClub(touch.pageX, touch.pageY);
  }
}
function mouseMove(event) {
  event.stopPropagation();
  if (stopScroll) event.preventDefault();
  if (inMouseSwing)
  {
    positionClub(event.clientX, event.clientY);
  }
  if (inBallPos)
  {
    positionStart(event.clientX, event.clientY);
  }
}

function ballTouchEnd(event) {
  if (stopScroll) event.preventDefault();
  if (inMouseSwing == true)
  {
    inMouseSwing = false;
    hitBall();
    ball.hideClub();
  }
}
 
function mouseUp(event) {
  event.stopPropagation();
  if (stopScroll)   event.preventDefault();
  if (inMouseSwing)
  {
    inMouseSwing = false;
    hitBall();
    ball.hideClub();
  }
  if (inBallPos)
  {
    inBallPos = false;
    hideMagnifier();
    endBallPlace();
  }
}
function ballTouchCancel(event) {
  inMouseSwing = false;
}


function hitSpeedFunc(offset)
{
//  return offset * 7;
  return golf.parms.hitSpeedC * offset * Math.log(offset);
}

function positionClub(posX, posY)
{
  var yoff = -1 * (posY - (ball.getCenterY()));
  var xoff = (posX - (ball.getCenterX()));
  var offset = Math.sqrt(Math.pow(xoff,2) + Math.pow(yoff,2));
//  log("xoff = " + xoff + " yoff = " + yoff + " offset = " + offset);
  offset = Math.min(offset, maxoff);
  clubspeed = hitSpeedFunc(offset);
  var rotationRad = -1 * (Math.atan2(yoff, xoff) + Math.PI); 
  var rotation = rotationRad * 180/Math.PI;
  clubdir = rotationRad;

  var cluboffset = Math.max(offset/2, 10);
//  var arrowoffset = offset/2;
  var adjust = hasTouch ? 30 : 10;
//  var arrowoffset = adjust + offset/2 * Math.log(offset/2);
  var arrowoffset = adjust + clubspeed/golf.parms.arrowDivide;
//  log("arrowoffset = " + arrowoffset);
 
 transformClub(rotation,cluboffset,arrowoffset);
 
}

function transformClub(rotation, cluboffset, arrowoffset)
{
 var safari = true;
 var mozilla = false;
 var club = document.getElementById('club');
 var arrow = document.getElementById('arrow');
 var arrowshaft = document.getElementById('arrowshaft');

 var clubTransform = "rotate(" + (rotation) + "deg)" + "translate(" + (-cluboffset) + "px, 0) " ;
 var arrowTransform = "rotate(" + (rotation) + "deg)" + "translate(" + (arrowoffset+1) + "px, 0) " ;
 var arrowshaftTransform = "rotate(" + (rotation) + "deg)" + " translate(" + (arrowoffset-1) + "px, 0)" +
					 " scaleX("  + (arrowoffset) + ")" ;
 if (safari)
 {
	club.style.webkitTransform = clubTransform;
	arrow.style.webkitTransform = arrowTransform;
	arrowshaft.style.webkitTransform = arrowshaftTransform;
 }
 if (mozilla)
 {
	 club.style.MozTransform = clubTransform;
	 arrow.style.MozTransform = arrowTransform;
	 arrowshaft.style.MozTransform = arrowshaftTransform;
 }

}

var placeOff = [ 28, 49 ];
var holeOffVertLeft = 26;
var holeOffHorizTop = 30; //56-26
var holeOffArray = [ 18, 38, 60 ];
var magVertTopLeft = { x: 258, y: 141};
var magHorizTopLeft = { x: 241, y: 158};
var startChoice = 1;

function getStarterForHole(holeNum)
{
  return document.querySelector('#' + holes[holeNum].domID + ' img[src^="images/starter"]' );
}

function positionStart(posX, posY)
{
  var vert = holes[curHoleNum].start.vert;
  var offset;
  var starterElem = getStarterForHole(curHoleNum);

  if (vert)
  {
    offset = posY - parseInt(starterElem.style.top);
  }
  else
  {
    offset = posX - parseInt(starterElem.style.left);
  }
//  console.log("offset = " + offset);
  if (offset < placeOff[0])
  {
    startChoice = 0;  // top or left
  }
  else if (offset > placeOff[1])
  {
    startChoice = 2;  // bottom or right
  }
  else
  {
    startChoice = 1;  // middle
  }
  var pos = getStartingPos(curHoleNum);
  positionBall(pos.x,pos.y);		// position web ball

  var magBallOff = getStartOffset(curHoleNum);
  var topLeft;
  if ((holes[curHoleNum].start.vert))
  {
    topLeft = magVertTopLeft;
  }
  else
  {
    topLeft = magHorizTopLeft;
  }
  document.getElementById('mag-ball').style.top = (topLeft.y + 1.5 * (magBallOff.y - Ball.CenterOffsetY)) + "px";
  document.getElementById('mag-ball').style.left = (topLeft.x + 1.5 * (magBallOff.x - Ball.CenterOffsetX)) + "px";
}

function endHole() {
  endTurn();
  golf.engine.endHole();
  Squirrel.stopAll();
}

function startHole() {
  setHole(curHoleNum);  // set hole will start squirrels if there are any
  Squirrel.enabled = false; // Disable squirrels until we can detect hybrid without waiting
                            // for viewDidLoad + setHybrid(true)
  Squirrel.startAll(document.getElementById(holes[curHoleNum].domID));
  if (holes[curHoleNum].walls == null)
  {
    xhr('data/' + holes[curHoleNum].domID + '.svg', loadHoleData);
  }
  else
  {
    startTurn();
  }
}

function xhr(url, callback)
{
   var req = new XMLHttpRequest();
   req.open('get', url, true);
   req.onload = callback;
   req.send();
}

function loadHoleData() {
  var xml = this.responseXML;
  var walls = [];
  var lines = xml.getElementsByTagNameNS(svgns, "line");
  for (var i = 0; i < lines.length; i++)
  {
     var line = lines[i];
     if (line.id == "outofbounds-line")
     {
       holes[curHoleNum].outLine = new OutLine(line);
     }
     else
     {
        var w = new Wall(line);
        walls.push(w);
     }
  }
  var polylines = xml.getElementsByTagNameNS(svgns, "polyline");
  for (var i = 0; i < polylines.length; i++)
  {
     var p = new PolyWall(polylines[i]);
     for (var j = 0 ; j < p.walls.length; j++)
     {
        walls.push(p.walls[j])
     }
  }
  holes[curHoleNum].walls = walls;
  var rect = xml.getElementsByTagNameNS(svgns, "rect")[0];
  var start = new StartRect(rect);
  holes[curHoleNum].start = start;
  var circle = xml.getElementsByTagNameNS(svgns, "circle")[0];
  var center = new HoleCenter(circle);
  holes[curHoleNum].center = center;
//  debugger;
  var polygonEls = xml.getElementsByTagNameNS(svgns, "polygon");
  var polygons = [];
  for (var i = 0; i < polygonEls.length; i++)
  {
     var p = Polygon.create(polygonEls[i]);
     polygons.push(p);
  }
  holes[curHoleNum].polygons = polygons;
  startTurn();
}

function endTurn() {
  golf.inHole = false;
  ball.hide();
  ball.hideTouchRing();
  emptyHole(curHoleNum);
  golf.engine.endTurn();
}


function startTurn() {
  curStrokeNum = 0;
  updateScorePanel();
  golf.engine.startTurn();
  startBallPlace();
}

var helpOn = true;
window.startBallPlace = function() {
  helpOn = isHelpOn();
  console.log("helpOn = " + helpOn);
  if (helpOn && (placeCount == 0))
  {
    document.getElementById('placehelp1').style.visibility = 'visible';
    showHelpPointer();
    addClass(holes[curHoleNum].domElem,'placehelp');
  }
  else
  {
    showBallPlaceMessage();
  }
}

window.goToHelp = function(oldId, newId) {
  document.getElementById(oldId).style.visibility = 'hidden';
  document.getElementById(newId).style.visibility = 'visible';
}

window.endBallPlaceHelp = function() {
    document.getElementById('placehelp3').style.visibility = 'hidden';
    document.getElementById('help-pointer').style.visibility = 'hidden';
    removeClass(holes[curHoleNum].domElem, 'placehelp');
    showBallPlaceMessage();
}

function showBallPlaceMessage()
{
  window.caddy.hideCurrentMessage();
  addClass(holes[curHoleNum].domElem,'place');
  if (placeCount > 0 || helpOn)
  {
    document.querySelector('#place-msg h1').style.paddingTop = '30px';
    document.querySelector('#place-msg h2').style.display = 'none';
  }
    
  document.getElementById('place-msg').style.display = 'block';
  var starterElem = getStarterForHole(curHoleNum);
  if (starterElem)
  {
  starterElem.addEventListener("mousedown", starterMouseDown, false);
  starterElem.addEventListener("touchstart", starterTouchStart, false);
  starterElem.addEventListener("touchmove", starterTouchMove, false);
  starterElem.addEventListener("touchend", starterTouchEnd, false);
  }
//  starterElem.addEventListener("touchcancel", ballTouchCancel, false);
}

function endBallPlace() {
  document.getElementById('place-msg').style.display = 'none';
  removeClass(holes[curHoleNum].domElem, 'place');
  var starterElem = getStarterForHole(curHoleNum);
  starterElem.removeEventListener  ("mousedown", starterMouseDown, false);
  starterElem.removeEventListener("touchstart", starterTouchStart, false);
  starterElem.removeEventListener("touchmove", starterTouchMove, false);
  starterElem.removeEventListener("touchend", starterTouchEnd, false);
  var pos = getStartingPos(curHoleNum);
  setStartPosition(pos);
  setTimeout(showBallAndRing,  120);
  placeCount++;
  if (helpOn && (placeCount == 1))
  {
    startSwingHelp();
  }
  else
  {
    canSwing = true;
  }
}

function showHelpPointer()
{
    var starterElem = getStarterForHole(curHoleNum);
    var helpPointer = document.getElementById('help-pointer');
    helpPointer.style.top = (starterElem.offsetTop) + 23 + "px";
    helpPointer.style.left = (starterElem.offsetLeft) + (curHoleNum == 10 ? 43: 56) + "px";
    helpPointer.style.visibility = 'visible';
}

function startSwingHelp()
{
    canSwing = false;
    ball.hideTouchRing();
    document.getElementById('swinghelp1').style.visibility = 'visible';
    showHelpPointer();
    addClass(holes[curHoleNum].domElem,'placehelp');    
}

window.endSwingHelp = function(disable) {
    canSwing = true;
    ball.showWithRing();
    document.getElementById('swinghelp2').style.visibility = 'hidden';
    document.getElementById('help-pointer').style.visibility = 'hidden';
    removeClass(holes[curHoleNum].domElem,'placehelp');
    if (disable)
    {
        setHelpMode(false);
    }
    golf.engine.startTurn();
}

function showMagnifier()
{
  document.getElementById('mag-back').style.visibility = 'visible';
  if (holes[curHoleNum].start.vert)
  {
   document.getElementById('mag-starter').style.visibility = 'visible';
  }
  else
  {
   document.getElementById('mag-starterHoriz').style.visibility = 'visible';
  }
  document.getElementById('mag-ball').style.visibility = 'visible';
  document.getElementById('mag-lens').style.visibility = 'visible';
}

function hideMagnifier()
{
  document.getElementById('mag-back').style.visibility = 'hidden';
  if (holes[curHoleNum].start.vert)
  {
   document.getElementById('mag-starter').style.visibility = 'hidden';
  }
  else
  {
   document.getElementById('mag-starterHoriz').style.visibility = 'hidden';
  }
  document.getElementById('mag-ball').style.visibility = 'hidden';
  document.getElementById('mag-lens').style.visibility = 'hidden';
}

window.nextPlayer = function(player) {
  endTurn();
  curPlayer = player;
  ball.setColor(curPlayer.color);
  startTurn();
}

window.switchHoles = function() {
  endHole();
  curPlayer = players[0];
  ball.setColor(curPlayer.color);
  var curElem  = holes[curHoleNum].domElem;
  curHoleNum++;
  emptyHole(curHoleNum);
  var nextElem = holes[curHoleNum].domElem;
  if (doSlide)
  {
    slideOut(curElem);
    slideIn(nextElem);
  }
  else
  {
    curElem.className='hole';
    nextElem.className='hole visible-hole';      
    startHole();
  }
}

function slideOut(theDiv)
{
  var remove1 = function() {
    // reset classname so that
    // it can be applied again animations are only
    // triggered when classnames are first applied
    theDiv.className = 'hole';
    // remove this listener because webkitAnimationEnd
    // is triggered every time ANY animation ends on theDiv
    theDiv.removeEventListener('webkitAnimationEnd', remove1);
  };
  // listen for animation end
  theDiv.addEventListener('webkitAnimationEnd', remove1, false);
  /// FINALLY, start the animation animation
  theDiv.className = 'hole visible-hole hole-slide-out';
}

function slideIn(theDiv)
{
  var remove2 = function() {
    // reset  classname so that
    // it can be applied again animations are only
    // triggered when classnames are first applied
     theDiv.className = 'hole visible-hole';
    // remove this listener because webkitAnimationEnd
    // is triggered every time ANY animation ends on theDiv
    theDiv.removeEventListener('webkitAnimationEnd', remove2);
    startHole();
  };
  // listen for animation end
  theDiv.addEventListener('webkitAnimationEnd', remove2, false);
  /// FINALLY, start the animation animation
   theDiv.className = 'hole visible-hole hole-slide-in';
}


function hitBall()
{
  ball.hideTouchRing();
  curStrokeNum++;
  updateScorePanel();
  golf.engine.swingClub(ball, clubspeed, clubdir);
}


function doHoleDrop()
{
  ball.hide();
  var holeDropImg = "images/hole-drop-" + ballColorMap[ball.colorCode] + ".png";
  holes[curHoleNum].holeImg.setAttribute("src", holeDropImg);
}

function emptyHole(theHoleNum)
{
  holes[theHoleNum].holeImg.setAttribute("src", "images/hole.png");
}

// Display the first hole (usually #1 or #9)
function displayFirstHole(holenum)
{
  var logo=document.getElementById('logo');
  logo.style.visibility='visible';

  addClass(holes[holenum].domElem,'visible-hole');
  showScorePanel();
  startHole();  
}

function getStartOffset(holeNum)
{
   var offset = {};
   if (holes[holeNum].start.vert)
   {
      offset.x = holeOffVertLeft;
      offset.y = holeOffArray[startChoice];
   }
   else
   {
      offset.x = holeOffArray[startChoice];
      offset.y = holeOffHorizTop;
   }
   return offset;
}

function getStartingPos(holeNum)
{
   var offset = getStartOffset(holeNum);
   var pos = {};
   pos.x = holes[holeNum].start.x + offset.x;
   pos.y = holes[holeNum].start.y + offset.y;
   return pos;
}

function loadGolf() {
//  log("loadGolf...");
//  document.ontouchstart = function(e){ if (stopScroll) e.preventDefault(); }  // prevent bouncing
//  document.ontouchend = function(e){ if (stopScroll) e.preventDefault(); }  // prevent bouncing
  document.ontouchmove = function(e){ if (stopScroll) e.preventDefault(); }  // prevent dragging/bouncing of background
  
  var ballElem = document.getElementById('ball');
  ball = new Ball(ballElem);
  ballElem.addEventListener("touchstart", ballTouchStart, false);
  ballElem.addEventListener("touchmove", ballTouchMove, false);
  ballElem.addEventListener("touchend", ballTouchEnd, false);
  ballElem.addEventListener("touchcancel", ballTouchCancel, false);
  ballElem.addEventListener("mousedown", ballMouseDown, false);
  var ballTouchRingE = document.getElementById('ball-touch-ring');
  ballTouchRingE.addEventListener("touchstart", ballTouchStart, false);
  ballTouchRingE.addEventListener("touchmove", ballTouchMove, false);
  ballTouchRingE.addEventListener("touchend", ballTouchEnd, false);
  ballTouchRingE.addEventListener("touchcancel", ballTouchCancel, false);
  ballTouchRingE.addEventListener("mousedown", ballMouseDown, false);
 
  for (var i = 1 ; i < holes.length ; i++)
  {
    holes[i].domElem = document.getElementById(holes[i].domID);
    holes[i].holeImg = document.querySelector('#' + holes[i].domID + ' .hole-img' );
  }

  document.onclick = docClick;
  document.onmousedown = docMouseDown;
  document.onmouseup = mouseUp;
  document.onmousemove = mouseMove;

  if (debug)
  {
    var logo=document.getElementById('logo');
    logo.addEventListener("click", logoClick, false);
    var bug=document.getElementById('bug');
    bug.style.visibility = 'visible';
    bug.addEventListener("click", bugClick, false);
  }
  setTimeout(scrollTo, 100, 0, 1);
  var queryArgs = getArgs();
  firstHoleNum = getFirstHole(queryArgs);
  var lastHole  = getLastHole(queryArgs);
  curHoleNum = firstHoleNum;
  displayFirstHole(firstHoleNum);  // Put this here while testing setup in separate file
  parsePlayers(queryArgs);
  curPlayer  = players[0];
  ball.setColor(curPlayer.color);
  curStrokeNum = 0;
  window.caddy.players = players;
  window.caddy.curHole = firstHoleNum;
  window.caddy.lastHole = lastHole;
//  updateScorePanel();   // Don't need to call this here since it's called frrom displayFirstHole()
  canSwing = true;
  if (window.navigator.standalone) stopScroll = true;
  log("loadGolf finished.");  
 }
 
function parsePlayers(queryArgs)
{
  var playerName  = queryArgs.p1 || 'Player 1';
  var playerColor = queryArgs.c1 || 'w';
  players[0]  = new Player(playerName, playerColor);
  playerName  = queryArgs.p2 || undefined;
  playerColor = queryArgs.c2 || 'w';
  if (playerName) players[1] = new Player(playerName, playerColor);
  playerName  = queryArgs.p3 || undefined;
  playerColor = queryArgs.c3 || 'w';
  if (playerName) players[2] = new Player(playerName, playerColor);
  playerName  = queryArgs.p4 || undefined;
  playerColor = queryArgs.c4 || 'w';
  if (playerName) players[3] = new Player(playerName, playerColor);
}

function getFirstHole(queryArgs)
{
  var firstHole = 1;
  var cdy = queryArgs.cdy || '-';
  if (cdy == 'back9')
  {
    firstHole = 10;
  }
  if (queryArgs.h)
  {
    firstHole = queryArgs.h;
  }
  return firstHole;
}

function getLastHole(queryArgs)
{
  var lastHole = 18;
  var cdy = queryArgs.cdy || '-';
  if (cdy == 'front9')
  {
    lastHole = 9;
  }
  if (queryArgs.h)
  {
    var firstHole = queryArgs.h;
    if (firstHole > lastHole)
    {
      lastHole = 18;
    }
  }
  return lastHole;
}

window.addEventListener("load", loadGolf, false);

function logoClick(event) {
  window.caddy.nextHole();
}


var ballToggle = 0;
function bugClick(event) {
  showParmForm();
  if (false)
  {
  ball.splashEnd();
  ball.splashHide();
  ball.splash();
  ballToggle = ++ballToggle % 2;
  switch (ballToggle)
  {
    case 0:
      hideNativeBall();
      break;
    case 1:
      showNativeBall();
      break;
  }
  }
}

function showParmForm()
{
  var div = document.getElementById('swingParms');
  document.parmForm.hitSpeedC.value = golf.parms.hitSpeedC;
  document.parmForm.arrowDivide.value = golf.parms.arrowDivide;
  document.parmForm.fric1C.value = golf.parms.fric1C;
  document.parmForm.fric2C.value = golf.parms.fric2C;
  document.parmForm.fric3C.value = golf.parms.fric3C;
  
  document.getElementById('swingParms').style.display = 'block';
}

window.submitParmForm = function()
{
  document.getElementById('swingParms').style.display = 'none';
  scrollTo(0,0);
  golf.parms.hitSpeedC = document.parmForm.hitSpeedC.value;
  golf.parms.arrowDivide = document.parmForm.arrowDivide.value;
  golf.parms.fric1C = document.parmForm.fric1C.value;
  golf.parms.fric2C = document.parmForm.fric2C.value;
  golf.parms.fric3C = document.parmForm.fric3C.value;
  if (hybrid)
  {
    golf.engine.setEngineParms(golf.parms.fric1C, golf.parms.fric2C, golf.parms.fric3C);
  }
  return false;
}

window.cancelParmForm = function()
{
  document.getElementById('swingParms').style.display = 'none';
  setTimeout(scrollTo, 100, 0, 0);
}

window.setVersion = function(appVersion)
{
  version = appVersion;
  document.getElementById('vers').innerText = version;
}

window.setHybrid = function(isHybrid)
{
 hybrid = isHybrid;
 golf.engine = hybridEngine;
// log("Hybrid engine setup, start logging to host app...");
 setHole(curHoleNum); // because the first setHole inside startHole was called before we knew we're hybrid
 helpOn = isHelpOn();
 if (!helpOn)
 {
    golf.engine.startTurn();  // are we missing startTurn too because of delayed setHybrid???
 }
 stopScroll = true;
 Squirrel.enabled = false;
 return 'ok';
}
 
// x, y are co-ordinates of ball center
 window.positionBall = function(x,y)
{
// log("window.positionBall(" + x + "," + y + ")");
    ball.position(x,y);
//  ball.style.left =  (x - Ball.CenterOffsetX) + "px";
//  ball.style.top  = (y - Ball.CenterOffsetY) + "px";
}

window.score = function()
{
 log("window.score");
 doHoleDrop();
 vibrate();
 curPlayer.score[curHoleNum] = curStrokeNum;
 setTimeout(doShowInHoleMessage, 400);
 checkAchievement();
}

function checkAchievement()
{
  if (curStrokeNum == 1)
  {
  	var achievementCode = "hi1.hole" + curHoleNum;
	callNative('golf://localhost/gamecenter-report-achievement?achievement=' + achievementCode);  	
  }
  else if (curHoleNum == window.caddy.lastHole)
  {
  	var cat = "minigolf.18";
  	if (window.caddy.lastHole == 9)
  	{
  		cat = "minigolf.front9";
  	}
  	else if ((window.caddy.lastHole == 18) && (firstHoleNum == 10))
  	{
  		cat = "minigolf.back9";
  	}
  	var total = 0;
  	for (var h = firstHoleNum; h <= window.caddy.lastHole; h++)
  	{
  		total += curPlayer.score[h];
  	}
	callNative('golf://localhost/gamecenter-report-score?category=' + cat + '&score=' + total);  	
  }
}

function doShowInHoleMessage()
{
 window.caddy.showInHoleMessage(curStrokeNum, holes[curHoleNum].par);
}

function doShowPondMessage()
{
 ball.splashEnd();
 window.caddy.showMessage('replace-msg', 'Splash!',  'One stroke penalty');
 ball.splashHide();
}

function doShowOutMessage()
{
 ball.splashEnd();
 window.caddy.showMessage('replace-msg', 'Off course!',  'One stroke penalty');
 ball.splashHide();
}

function doShowMaxStrokesMessage()
{
 window.caddy.showMessage('max-strokes-msg', 'Turn Over',  '7 strokes max');
 curPlayer.score[curHoleNum] = curStrokeNum;
}

function showBall()
{
  ball.show();
}

function showBallAndRing()
{
  ball.showWithRing();
}

// To test:  javascript:alert(getSquirrelRuns())
window.getSquirrelRuns = function()
{
  var parent = document.getElementById(holes[curHoleNum].domID);
  return Squirrel.getSquirrelRuns(parent);
}

window.miss = function()
{
 log("window.miss");
 ball.positionAccessories();
 updateScorePanel();
 if (curStrokeNum >= maxStrokes)
 {
 	ball.hide();
	setTimeout(doShowMaxStrokesMessage, 400);
 }
 else
 {
 	setTimeout(showBallAndRing,  120);
	canSwing = true;
 }
}

window.splash = function()
{
 log("window.splash");
 ball.hide();
 ball.splash();
 updateScorePanel();
 if (curStrokeNum >= maxStrokes)
 {
 	ball.hide();
	setTimeout(doShowMaxStrokesMessage, 700);
 }
 else
 {
	 setTimeout(doShowPondMessage, 700);
  }
}

window.outOfBounds = function()
{
 log("window.outOfBounds");
 ball.hide();
 updateScorePanel();
 if (curStrokeNum >= maxStrokes)
 {
 	ball.hide();
	setTimeout(doShowMaxStrokesMessage, 400);
 }
 else
 {
   setTimeout(doShowOutMessage, 400);
 }
}

function showScorePanel()
{
 var scoreDiv = document.getElementById('score');
 scoreDiv.style.visibility = 'visible';
}

function log(message)
{
 if (debug == true)
 {
	 if (hybrid == true)
	 {
	    // message needs to be URL encoded!
		callNative('golf://localhost/log?message=' + encodeURIComponent(message));
	 }
	 else
	 {
	   if (window.console != undefined)
	   {
		  console.log(message);
		 }
	 }
 }
}
golf.log = log;
 
function showNativeBall(hole)
{
  callNative('golf://localhost/showball?visible=true');
}

function hideNativeBall(hole)
{
  callNative('golf://localhost/showball?visible=false');
}
 
function setHole(hole)
{
  golf.engine.setHole(hole);
}

function setStartPosition(pos)
{
 ball.position(pos.x,pos.y);		// position web ball
 ball.positionAccessories();
 callNative('golf://localhost/setstart?bx=' + pos.x + '&by=' + pos.y);  // position native ball
}

function vibrate()
{
	callNative('golf://localhost/vibrate');
}

var nativeCalls = new Array();
var nativeActive = false;
 
function callNative(psuedoUrl)
{
  if (hybrid == true)
  {
    try
	{
		if (nativeActive)
		{
			nativeCalls.push(psuedoUrl);
		}
		else
		{	
			nativeActive = true;
			window.location = psuedoUrl;
		}
  }
	catch(e)
	{
        console.log("Native call to '" + psuedoUrl + "' generated exception: " + e);
        alert("Error calling native '" + psuedoUrl + "'.")
    }
  }
}
hybridEngine.callNative = callNative;
 
window.nativeCallAck = function() {
	var nextURL = null;
	if (nativeCalls.length)
	{
		nextURL = nativeCalls.shift();
		window.location = nextURL;
	}
	else
	{
		nativeActive = false;
	}
 }

})();

